import {Colors, DocumentColor, Node, NodeClass, Strings, ToolbarMenuItem, Utilities} from "./internal"

/**
 * A floating menu or panel. Pressing in it doesn't take focus from the text
 * being edited, so the text selection survives choosing a command.
 */
export class Popup {
  static #current: Popup | null = null

  element: HTMLElement
  onClose: (() => void) | null = null
  /** What the popup delivered when it closed by a choice, or null when it was dismissed. */
  chosenValue: any = null
  /** Keeps focus where it is when pressing the popup. Off for popups with fields. */
  keepsFocus: boolean = true
  /**
   * Whether pressing outside closes it, and opening another popup does. Off for panels that hold
   * work, such as an answer being written: they stay open until closed, and Escape closes them
   * while focus is inside.
   */
  dismissible: boolean = true

  #outsideHandler = (event: Event) => {
    if (!this.element.contains(event.target as globalThis.Node) && !(this.#anchor instanceof HTMLElement && this.#anchor.contains(event.target as globalThis.Node))) this.close()
  }
  #keyHandler = (event: KeyboardEvent) => this.handleKey(event)
  #open = false
  #scrollHandler = (event: Event) => {
    if (this.element.contains(event.target as globalThis.Node)) return
    if (this.anchorProvider) {
      this.position()
    } else {
      this.close()
    }
  }
  /** Supplies the anchor's current rectangle; the popup then follows it when the page scrolls instead of closing. */
  anchorProvider: (() => DOMRect | null) | null = null
  #anchor: HTMLElement | DOMRect | null = null

  constructor(classes: string = "") {
    this.element = Utilities.element("div", `scv-popup ${classes}`)
    this.element.addEventListener("mousedown", event => {
      let target = event.target as HTMLElement
      if (this.keepsFocus && !/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) event.preventDefault()
    })
  }

  static get current(): Popup | null {
    return Popup.#current
  }

  static closeAll() {
    if (Popup.#current) Popup.#current.close()
  }

  get isOpen(): boolean {
    return this.#open
  }

  /**
   * Shows the popup below the anchor, inside container so it shares the editor's theme. It opens
   * in the browser's top layer where it can, so the editor's bounds, overflow and stacking don't
   * clip or cover it.
   */
  show(anchor: HTMLElement | DOMRect, container: HTMLElement) {
    if (this.dismissible) {
      if (Popup.#current && Popup.#current !== this) Popup.#current.close()
      Popup.#current = this
    }
    this.#open = true
    this.#anchor = anchor
    container.append(this.element)
    if (typeof this.element.showPopover == "function") {
      this.element.setAttribute("popover", "manual")
      try {
        this.element.showPopover()
      } catch (error) {}
    }
    this.position()
    // Lets the editor that owns the container report pickerOpened.
    container.dispatchEvent(new CustomEvent("scv-popup-opened", {detail: {popup: this}, bubbles: true}))
    setTimeout(() => {
      if (!this.#open) return
      if (this.dismissible) document.addEventListener("mousedown", this.#outsideHandler, true)
      window.addEventListener("scroll", this.#scrollHandler, true)
    }, 0)
    if (this.dismissible) {
      window.addEventListener("keydown", this.#keyHandler, true)
    } else {
      this.element.addEventListener("keydown", this.#keyHandler)
    }
  }

  position() {
    let anchor: HTMLElement | DOMRect | null = this.anchorProvider ? (this.anchorProvider() || this.#anchor) : this.#anchor
    if (!anchor) return
    let rect = anchor instanceof HTMLElement ? anchor.getBoundingClientRect() : anchor
    let element = this.element
    element.style.position = "fixed"
    element.style.left = "0px"
    element.style.top = "0px"
    let width = element.offsetWidth
    let height = element.offsetHeight
    let rightToLeft = getComputedStyle(element).direction == "rtl"
    let left = rightToLeft ? rect.right - width : rect.left
    left = Utilities.clamp(left, 8, Math.max(8, window.innerWidth - width - 8))
    let top = rect.bottom + 4
    if (top + height > window.innerHeight - 8 && rect.top - height - 4 > 8) top = rect.top - height - 4
    top = Math.max(8, Math.min(top, window.innerHeight - height - 8))
    element.style.left = `${left}px`
    element.style.top = `${top}px`
  }

  close() {
    if (Popup.#current === this) Popup.#current = null
    this.#open = false
    document.removeEventListener("mousedown", this.#outsideHandler, true)
    window.removeEventListener("keydown", this.#keyHandler, true)
    this.element.removeEventListener("keydown", this.#keyHandler)
    window.removeEventListener("scroll", this.#scrollHandler, true)
    if (this.element.isConnected) {
      let container = this.element.parentElement
      if (this.element.hasAttribute("popover")) {
        try {
          this.element.hidePopover()
        } catch (error) {}
      }
      this.element.remove()
      if (this.onClose) this.onClose()
      if (container) container.dispatchEvent(new CustomEvent("scv-popup-closed", {detail: {popup: this}, bubbles: true}))
    }
  }

  protected handleKey(event: KeyboardEvent) {
    if (event.key == "Escape") {
      event.preventDefault()
      event.stopPropagation()
      this.close()
    }
  }
}

interface MenuEntry {
  item: ToolbarMenuItem
  button: HTMLButtonElement
}

/** One level of a popup menu: the root list or a submenu. */
class MenuList {
  element: HTMLElement
  parent: MenuList | null
  entries: Array<MenuEntry> = []
  active: number = -1
  submenu: MenuList | null = null
  submenuEntry: MenuEntry | null = null
  #menu: PopupMenu
  #hoverTimer: number = 0

  constructor(menu: PopupMenu, element: HTMLElement, items: Array<ToolbarMenuItem>, parent: MenuList | null) {
    this.#menu = menu
    this.element = element
    this.parent = parent
    element.setAttribute("role", "menu")
    items.forEach(item => {
      if (item.isSeparator) {
        element.append(Utilities.element("hr", "dropdown-divider"))
        return
      }
      let button = Utilities.element("button", "dropdown-item scv-menu-item", {type: "button", role: item.hasChildren ? "menuitem" : "menuitemcheckbox"})
      if (item.hasChildren) {
        button.setAttribute("aria-haspopup", "menu")
        button.setAttribute("aria-expanded", "false")
        button.classList.add("scv-menu-parent")
      } else {
        button.setAttribute("aria-checked", item.checked ? "true" : "false")
      }
      button.disabled = !item.enabled
      if (item.checked && !item.hasChildren) button.classList.add("active")
      let icon = Utilities.element("i", `scv-menu-icon ${item.icon.length > 0 ? item.icon : (item.checked ? "bi bi-check2" : "")}`)
      button.append(icon)
      let label = Utilities.element("span", "scv-menu-label")
      label.textContent = item.caption
      if (item.captionStyle.length > 0) label.setAttribute("style", item.captionStyle)
      button.append(label)
      if (item.hasChildren) {
        // The submenu's current choice, shown beside the caption.
        let chosen = item.children.find(child => child.checked && !child.isSeparator)
        if (chosen) {
          let value = Utilities.element("span", "scv-menu-value")
          value.textContent = chosen.caption
          button.append(value)
        }
        button.append(Utilities.element("i", "bi bi-chevron-right scv-menu-arrow"))
      }
      let entry: MenuEntry = {item: item, button: button}
      let index = this.entries.length
      this.entries.push(entry)
      button.addEventListener("click", event => {
        event.stopPropagation()
        if (item.hasChildren) {
          if (this.submenuEntry === entry) {
            this.closeSubmenu()
          } else {
            this.openSubmenu(entry, false)
          }
          return
        }
        this.#menu.choose(item)
      })
      button.addEventListener("mouseenter", () => {
        if (button.disabled) return
        this.setActive(index, false)
        clearTimeout(this.#hoverTimer)
        // A short pause, so passing over an item on the way to an open submenu doesn't close it.
        this.#hoverTimer = window.setTimeout(() => {
          if (item.hasChildren) {
            if (this.submenuEntry !== entry) this.openSubmenu(entry, false)
          } else {
            this.closeSubmenu()
          }
        }, 150)
      })
      element.append(button)
    })
  }

  get enabledIndexes(): Array<number> {
    return this.entries.map((entry, index) => entry.button.disabled ? -1 : index).filter(index => index >= 0)
  }

  setActive(index: number, scroll: boolean = true) {
    this.active = index
    this.entries.forEach((entry, entryIndex) => entry.button.classList.toggle("scv-menu-focus", entryIndex == index))
    if (scroll && this.entries[index]) this.entries[index].button.scrollIntoView({block: "nearest"})
    this.#menu.focusList = this
  }

  move(delta: number) {
    let enabled = this.enabledIndexes
    if (enabled.length == 0) return
    let position = enabled.indexOf(this.active)
    position = position < 0 ? (delta > 0 ? 0 : enabled.length - 1) : (position + delta + enabled.length) % enabled.length
    this.setActive(enabled[position])
  }

  openSubmenu(entry: MenuEntry, focusFirst: boolean) {
    this.closeSubmenu()
    clearTimeout(this.#hoverTimer)
    let element = Utilities.element("div", "dropdown-menu show scv-menu scv-submenu")
    // Inside the root popup, so pressing it isn't a press outside the menu.
    this.#menu.element.append(element)
    let submenu = new MenuList(this.#menu, element, entry.item.children, this)
    this.submenu = submenu
    this.submenuEntry = entry
    entry.button.setAttribute("aria-expanded", "true")
    entry.button.classList.add("scv-menu-open")
    MenuList.position(element, entry.button.getBoundingClientRect())
    if (focusFirst) {
      submenu.move(1)
    } else {
      this.#menu.focusList = this
    }
  }

  closeSubmenu() {
    if (!this.submenu) return
    this.submenu.closeSubmenu()
    this.submenu.element.remove()
    if (this.submenuEntry) {
      this.submenuEntry.button.setAttribute("aria-expanded", "false")
      this.submenuEntry.button.classList.remove("scv-menu-open")
    }
    if (this.#menu.focusList && this.#menu.focusList.isInside(this.submenu)) this.#menu.focusList = this
    this.submenu = null
    this.submenuEntry = null
  }

  /** True when this list is list or one of its submenus. */
  isInside(list: MenuList): boolean {
    let current: MenuList | null = this
    while (current) {
      if (current === list) return true
      current = current.parent
    }
    return false
  }

  /** Places a submenu beside the item that opened it, on the side with room. */
  static position(element: HTMLElement, anchor: DOMRect) {
    element.style.position = "fixed"
    element.style.left = "0px"
    element.style.top = "0px"
    let width = element.offsetWidth
    let height = element.offsetHeight
    let rightToLeft = getComputedStyle(element).direction == "rtl"
    let after = anchor.right - 4
    let before = anchor.left - width + 4
    let left = rightToLeft ? before : after
    if (!rightToLeft && left + width > window.innerWidth - 8) left = before
    if (rightToLeft && left < 8) left = after
    left = Utilities.clamp(left, 8, Math.max(8, window.innerWidth - width - 8))
    let top = Utilities.clamp(anchor.top - 6, 8, Math.max(8, window.innerHeight - height - 8))
    element.style.left = `${left}px`
    element.style.top = `${top}px`
  }
}

/** A popup list of menu items. Items with children open submenus. */
export class PopupMenu extends Popup {
  #root: MenuList
  #onSelect: (item: ToolbarMenuItem) => void
  /** The list the arrow keys move in: the root or the deepest submenu being navigated. */
  focusList: MenuList | null = null

  constructor(items: Array<ToolbarMenuItem>, onSelect: (item: ToolbarMenuItem) => void) {
    super("dropdown-menu show scv-menu")
    this.#onSelect = onSelect
    this.#root = new MenuList(this, this.element, items, null)
    this.focusList = this.#root
  }

  /** Chooses an item that has no submenu. */
  choose(item: ToolbarMenuItem) {
    if (!item.enabled || item.hasChildren) return
    this.chosenValue = item
    this.close()
    this.#onSelect(item)
  }

  close() {
    this.#root.closeSubmenu()
    super.close()
  }

  protected handleKey(event: KeyboardEvent) {
    let list = this.focusList || this.#root
    let rightToLeft = getComputedStyle(list.element).direction == "rtl"
    let forward = rightToLeft ? "ArrowLeft" : "ArrowRight"
    let back = rightToLeft ? "ArrowRight" : "ArrowLeft"
    let entry = list.entries[list.active]
    let handled = true
    switch (event.key) {
      case "ArrowDown": list.move(1); break
      case "ArrowUp": list.move(-1); break
      case "Home": list.setActive(list.enabledIndexes[0] ?? -1); break
      case "End": list.setActive(list.enabledIndexes[list.enabledIndexes.length - 1] ?? -1); break
      case forward:
        if (entry && entry.item.hasChildren && !entry.button.disabled) list.openSubmenu(entry, true)
        break
      case back:
        if (list.parent) {
          let parent = list.parent
          parent.closeSubmenu()
          parent.setActive(parent.active)
        }
        break
      case "Enter":
      case " ":
        if (!entry || entry.button.disabled) break
        if (entry.item.hasChildren) {
          list.openSubmenu(entry, true)
        } else {
          this.choose(entry.item)
        }
        break
      case "Escape":
        if (list.parent) {
          let parent = list.parent
          parent.closeSubmenu()
          parent.setActive(parent.active)
        } else {
          handled = false
        }
        break
      default:
        handled = false
    }
    if (handled) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    super.handleKey(event)
  }
}

/** A popup palette of colors. Choosing Default reports null. */
export class ColorPalette extends Popup {
  static colors: Array<string> = [
    "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#d9d9d9", "#efefef", "#ffffff",
    "#c00000", "#e03e2d", "#f39c12", "#f1c40f", "#2dc26b", "#16a085", "#3598db", "#8e44ad",
    "#f8d7da", "#fde2cf", "#fff3cd", "#fffbd1", "#d1e7dd", "#cff4fc", "#cfe2ff", "#e2d9f3",
    "#842029", "#a1431b", "#997404", "#7d6f00", "#0f5132", "#055160", "#084298", "#432874"
  ]
  /** The colors chosen most recently, newest first, shared by every palette on the page. */
  static recentColors: Array<string> = []
  static maximumRecentColors: number = 8

  static #remember(hex: string) {
    let value = hex.toLowerCase()
    ColorPalette.recentColors = [value].concat(ColorPalette.recentColors.filter(color => color != value)).slice(0, ColorPalette.maximumRecentColors)
  }

  constructor(strings: Strings, onSelect: (color: DocumentColor | null) => void) {
    super("scv-palette dropdown-menu show p-2")
    let choose = (hex: string) => {
      ColorPalette.#remember(hex)
      this.close()
      onSelect(Colors.fromCSS(hex))
    }
    let swatches = (colors: Array<string>) => {
      let grid = Utilities.element("div", "scv-palette-grid")
      colors.forEach(hex => {
        let swatch = Utilities.element("button", "scv-swatch", {type: "button", title: hex, "aria-label": hex})
        swatch.style.backgroundColor = hex
        swatch.addEventListener("click", () => choose(hex))
        grid.append(swatch)
      })
      return grid
    }
    this.element.append(swatches(ColorPalette.colors))
    if (ColorPalette.recentColors.length > 0) {
      let recent = swatches(ColorPalette.recentColors)
      recent.classList.add("scv-palette-recent")
      this.element.append(recent)
    }

    let footer = Utilities.element("div", "scv-palette-footer")
    let automatic = Utilities.element("button", "btn btn-sm btn-outline-secondary", {type: "button"})
    automatic.textContent = strings.TextDefault
    automatic.addEventListener("click", () => {
      this.close()
      onSelect(null)
    })
    footer.append(automatic)
    let custom = Utilities.element("label", "btn btn-sm btn-outline-secondary scv-palette-custom")
    custom.textContent = strings.TextCustomColorCaption
    let input = Utilities.element("input", "", {type: "color"})
    input.addEventListener("change", () => choose(input.value))
    custom.append(input)
    footer.append(custom)
    this.element.append(footer)
  }
}


/**
 * A grid for choosing a table's size: pointing at a cell, or moving with the arrow keys, picks
 * that many rows and columns, and clicking or Enter chooses it.
 */
export class TableSizePicker extends Popup {
  static maximumRows: number = 8
  static maximumColumns: number = 10

  rows: number = 1
  columns: number = 1
  #cells: Array<HTMLElement> = []
  #label: HTMLElement
  #strings: Strings
  #onSelect: (rows: number, columns: number) => void

  constructor(strings: Strings, onSelect: (rows: number, columns: number) => void) {
    super("dropdown-menu show scv-table-size")
    this.#strings = strings
    this.#onSelect = onSelect
    let grid = Utilities.element("div", "scv-table-size-grid", {role: "grid", "aria-label": strings.TextTableCaption})
    grid.style.gridTemplateColumns = `repeat(${TableSizePicker.maximumColumns}, 1fr)`
    for (let row = 1; row <= TableSizePicker.maximumRows; row++) {
      for (let column = 1; column <= TableSizePicker.maximumColumns; column++) {
        let cell = Utilities.element("button", "scv-table-size-cell", {type: "button", tabindex: "-1", "data-rows": String(row), "data-columns": String(column), "aria-label": this.#caption(row, column)})
        cell.addEventListener("mouseover", () => this.select(row, column))
        cell.addEventListener("click", () => this.choose())
        this.#cells.push(cell)
        grid.append(cell)
      }
    }
    this.#label = Utilities.element("div", "scv-table-size-label", {"aria-live": "polite"})
    this.element.append(grid, this.#label)
    this.select(1, 1)
  }

  #caption(rows: number, columns: number): string {
    return Utilities.format(this.#strings.TextTableSizeCaptionFormat, {rows, columns})
  }

  /** Picks a size, highlighting it in the grid. */
  select(rows: number, columns: number) {
    this.rows = Utilities.clamp(rows, 1, TableSizePicker.maximumRows)
    this.columns = Utilities.clamp(columns, 1, TableSizePicker.maximumColumns)
    this.#cells.forEach(cell => cell.classList.toggle("active", Number(cell.dataset.rows) <= this.rows && Number(cell.dataset.columns) <= this.columns))
    this.#label.textContent = this.#caption(this.rows, this.columns)
  }

  /** Chooses the size picked, and closes. */
  choose() {
    let rows = this.rows
    let columns = this.columns
    this.close()
    this.#onSelect(rows, columns)
  }

  protected handleKey(event: KeyboardEvent) {
    let rightToLeft = getComputedStyle(this.element).direction == "rtl"
    let moves: {[key: string]: [number, number]} = {ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, rightToLeft ? 1 : -1], ArrowRight: [0, rightToLeft ? -1 : 1]}
    let move = moves[event.key]
    if (move) {
      event.preventDefault()
      event.stopPropagation()
      this.select(this.rows + move[0], this.columns + move[1])
    } else if (event.key == "Enter") {
      event.preventDefault()
      event.stopPropagation()
      this.choose()
    } else {
      super.handleKey(event)
    }
  }
}

export interface DialogField {
  name: string
  label: string
  value?: string | boolean
  type?: "text" | "url" | "number" | "checkbox" | "select" | "textarea"
  options?: Array<{value: string, caption: string}>
  placeholder?: string
}

/**
 * A small modal form. It opens in the browser's top layer, so the editor's bounds and overflow
 * don't clip it: it fits the window, and its fields scroll when they don't.
 */
export class Dialog {
  static prompt(container: HTMLElement, strings: Strings, title: string, fields: Array<DialogField>): Promise<{[name: string]: any} | null> {
    return new Promise(resolve => {
      // The <dialog> stays inside the editor, so it inherits the editor's theme and variables.
      let backdrop = Utilities.element("dialog", "scv-dialog-backdrop") as HTMLDialogElement
      let dialog = Utilities.element("form", "scv-dialog modal-content shadow", {role: "dialog", "aria-modal": "true"})
      backdrop.append(dialog)
      let header = Utilities.element("div", "modal-header py-2")
      let heading = Utilities.element("h6", "modal-title")
      heading.textContent = title
      header.append(heading)
      dialog.append(header)
      let body = Utilities.element("div", "modal-body")
      dialog.append(body)
      let inputs: {[name: string]: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} = {}
      fields.forEach(field => {
        let identifier = `scv-${Utilities.uuid()}`
        let group = Utilities.element("div", field.type == "checkbox" ? "form-check mb-2" : "mb-2")
        let label = Utilities.element("label", field.type == "checkbox" ? "form-check-label" : "form-label small mb-1", {for: identifier})
        label.textContent = field.label
        let input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        if (field.type == "select") {
          input = Utilities.element("select", "form-select form-select-sm", {id: identifier})
          ;(field.options || []).forEach(option => (input as HTMLSelectElement).append(new Option(option.caption, option.value)))
          input.value = String(field.value || "")
        } else if (field.type == "textarea") {
          input = Utilities.element("textarea", "form-control form-control-sm", {id: identifier, rows: "4"})
          input.value = String(field.value || "")
        } else if (field.type == "checkbox") {
          input = Utilities.element("input", "form-check-input", {id: identifier, type: "checkbox"})
          ;(input as HTMLInputElement).checked = field.value === true
        } else {
          input = Utilities.element("input", "form-control form-control-sm", {id: identifier, type: field.type || "text"})
          input.value = String(field.value || "")
        }
        if (field.placeholder && "placeholder" in input) (input as HTMLInputElement).placeholder = field.placeholder
        inputs[field.name] = input
        if (field.type == "checkbox") {
          group.append(input, label)
        } else {
          group.append(label, input)
        }
        body.append(group)
      })
      let footer = Utilities.element("div", "modal-footer py-2")
      let cancel = Utilities.element("button", "btn btn-sm btn-secondary", {type: "button"})
      cancel.textContent = strings.TextCancelCaption
      let ok = Utilities.element("button", "btn btn-sm btn-primary", {type: "submit"})
      ok.textContent = strings.TextOKCaption
      footer.append(cancel, ok)
      dialog.append(footer)

      let finished = false
      let finish = (result: {[name: string]: any} | null) => {
        if (finished) return
        finished = true
        if (backdrop.open) backdrop.close()
        backdrop.remove()
        resolve(result)
      }
      // Escape on a modal <dialog> cancels it.
      backdrop.addEventListener("cancel", event => {
        event.preventDefault()
        finish(null)
      })
      cancel.addEventListener("click", () => finish(null))
      backdrop.addEventListener("mousedown", event => { if (event.target === backdrop) finish(null) })
      dialog.addEventListener("keydown", event => {
        if (event.key == "Escape") {
          event.preventDefault()
          event.stopPropagation()
          finish(null)
        }
      })
      dialog.addEventListener("submit", event => {
        event.preventDefault()
        let result = {}
        Object.keys(inputs).forEach(name => {
          let input = inputs[name]
          result[name] = input instanceof HTMLInputElement && input.type == "checkbox" ? input.checked : input.value
        })
        finish(result)
      })

      Popup.closeAll()
      container.append(backdrop)
      if (typeof backdrop.showModal == "function") {
        backdrop.showModal()
      } else {
        backdrop.setAttribute("open", "")
      }
      let first = dialog.querySelector("input, select, textarea") as HTMLElement
      if (first) {
        first.focus()
        if (first instanceof HTMLInputElement && first.type != "checkbox") first.select()
      }
    })
  }
}

/**
 * Something the insertion chooser offers besides node types, such as a template. An editor
 * extension adds these with insertionChoices.
 */
export interface InsertionChoice {
  caption: string
  /** A Bootstrap Icons class. */
  icon: string
  /** Extra words the search matches. */
  keywords?: string
  /** Inserts it. replace is an empty paragraph the chooser was opened from, which the choice may replace, or null. */
  choose(replace: Node | null): void
}

/** One row of a ChoicePopup. */
export interface ChoiceItem {
  caption: string
  value: any
  /** An icon class, such as "bi bi-type-bold", or an image URL. */
  icon?: string
  /** Secondary text after the caption, such as a shortcut. */
  detail?: string
  /** Rows with the same group are listed under one heading. */
  group?: string
  /** Fills the row and returns true, or returns false for the standard row. */
  render?: (element: HTMLElement, selected: boolean) => boolean
}

/**
 * A list of choices, optionally with a search field that refilters it. Pointing
 * at a row or the arrow keys select it; a click, Return, or Tab (when tabChooses
 * is set) chooses it.
 */
export class ChoicePopup extends Popup {
  #list: HTMLElement
  #search: HTMLInputElement | null = null
  #items: Array<ChoiceItem> = []
  #active: number = 0
  #emptyCaption: string
  onChoose: (item: ChoiceItem) => void
  tabChooses: boolean = false
  /** The item chosen, once one is; set before the popup closes. */
  chosen: ChoiceItem | null = null

  constructor(classes: string, onChoose: (item: ChoiceItem) => void, search: {placeholder: string, emptyCaption: string, filter: (query: string) => Array<ChoiceItem>} | null = null) {
    super(`dropdown-menu show scv-chooser ${classes}`)
    this.onChoose = onChoose
    this.#emptyCaption = search ? search.emptyCaption : ""
    if (search) {
      this.keepsFocus = false
      this.#search = Utilities.element("input", "form-control form-control-sm scv-chooser-search", {type: "search", placeholder: search.placeholder, "aria-label": search.placeholder}) as HTMLInputElement
      this.#search.addEventListener("input", () => this.setItems(search.filter(this.#search!.value)))
      this.element.append(this.#search)
    }
    this.#list = Utilities.element("div", "scv-chooser-list", {role: "listbox"})
    this.element.append(this.#list)
    if (search) this.setItems(search.filter(""))
  }

  get items(): Array<ChoiceItem> {
    return this.#items.slice()
  }

  get activeIndex(): number {
    return this.#active
  }

  /**
   * Whether the search field shows, for a list made with a search filter. Without it, the list
   * shows every item and the text keeps focus; the arrow keys and Enter still choose.
   */
  get hasSearchField(): boolean {
    return !!this.#search && !this.#search.hidden
  }

  set hasSearchField(value: boolean) {
    let search = this.#search
    if (!search || value == !search.hidden) return
    search.hidden = !value
    this.keepsFocus = !value
    if (!value && search.value.length > 0) {
      search.value = ""
      search.dispatchEvent(new Event("input"))
    }
    if (value && this.isOpen) search.focus()
    if (this.isOpen) this.position()
  }

  show(anchor: HTMLElement | DOMRect, container: HTMLElement) {
    super.show(anchor, container)
    if (this.hasSearchField) this.#search!.focus()
  }

  setItems(items: Array<ChoiceItem>, active: number = 0) {
    this.#items = items
    this.#active = Utilities.clamp(active, 0, Math.max(0, items.length - 1))
    this.#list.textContent = ""
    let group: string | undefined = undefined
    items.forEach((item, index) => {
      if (item.group && item.group !== group) {
        let heading = Utilities.element("h6", "dropdown-header scv-chooser-group")
        heading.textContent = item.group
        this.#list.append(heading)
      }
      group = item.group
      let button = Utilities.element("button", "dropdown-item scv-menu-item", {type: "button", role: "option"})
      if (!item.render || !item.render(button, index == this.#active)) {
        let icon = item.icon || ""
        if (/^(https?:|data:|\/|\.)/.test(icon)) {
          let image = Utilities.element("img", "scv-menu-icon scv-menu-image", {src: icon, alt: ""})
          button.append(image)
        } else {
          button.append(Utilities.element("i", `scv-menu-icon ${icon}`))
        }
        let label = Utilities.element("span", "scv-menu-label")
        label.textContent = item.caption
        button.append(label)
        if (item.detail) {
          let detail = Utilities.element("span", "scv-menu-value")
          detail.textContent = item.detail
          button.append(detail)
        }
      }
      button.addEventListener("mousedown", event => event.preventDefault())
      button.addEventListener("mousemove", () => { if (this.#active != index) this.#setActive(index, false) })
      button.addEventListener("click", () => this.#choose(index))
      button.classList.toggle("scv-menu-focus", index == this.#active)
      button.setAttribute("aria-selected", index == this.#active ? "true" : "false")
      this.#list.append(button)
    })
    if (items.length == 0 && this.#emptyCaption.length > 0) {
      let empty = Utilities.element("div", "scv-chooser-empty text-body-secondary")
      empty.textContent = this.#emptyCaption
      this.#list.append(empty)
    }
    if (this.isOpen) this.position()
  }

  #buttons(): Array<HTMLElement> {
    return Array.from(this.#list.querySelectorAll("button")) as Array<HTMLElement>
  }

  #setActive(index: number, scroll: boolean = true) {
    this.#active = index
    this.#buttons().forEach((button, buttonIndex) => {
      button.classList.toggle("scv-menu-focus", buttonIndex == index)
      button.setAttribute("aria-selected", buttonIndex == index ? "true" : "false")
    })
    let item = this.#items[index]
    let button = this.#buttons()[index]
    if (item && item.render && button) {
      button.textContent = ""
      item.render(button, true)
    }
    if (scroll && button) button.scrollIntoView({block: "nearest"})
  }

  #choose(index: number) {
    let item = this.#items[index]
    if (!item) return
    this.chosen = item
    this.chosenValue = item
    this.close()
    this.onChoose(item)
  }

  protected handleKey(event: KeyboardEvent) {
    let count = this.#items.length
    if ((event.key == "ArrowDown" || event.key == "ArrowUp") && count > 0) {
      event.preventDefault()
      event.stopPropagation()
      this.#setActive(event.key == "ArrowDown" ? (this.#active + 1) % count : (this.#active <= 0 ? count - 1 : this.#active - 1))
      return
    }
    if ((event.key == "Enter" || (event.key == "Tab" && this.tabChooses && !event.shiftKey)) && count > 0 && !event.isComposing) {
      event.preventDefault()
      event.stopPropagation()
      this.#choose(this.#active)
      return
    }
    super.handleKey(event)
  }
}

/**
 * A searchable list of the node types the editor can insert, and any other insertion choices.
 * It's a ChoicePopup, so it searches, points and answers keys like every other list of choices.
 */
export class InsertionChooser extends ChoicePopup {
  constructor(strings: Strings, types: Array<NodeClass>, onSelect: (type: NodeClass) => void, choices: Array<InsertionChoice> = [], onChoice: (choice: InsertionChoice) => void = choice => choice.choose(null)) {
    let entries: Array<{item: ChoiceItem, search: string}> = types.filter(type => type.insertable)
      .map(type => ({item: {caption: type.caption, icon: type.icon, value: () => onSelect(type)}, search: `${type.caption} ${type.keywords} ${type.identifier}`.toLowerCase()}))
      .concat(choices.map(choice => ({item: {caption: choice.caption, icon: choice.icon, value: () => onChoice(choice)}, search: `${choice.caption} ${choice.keywords || ""}`.toLowerCase()})))
    super("", item => item.value(), {
      placeholder: strings.TextInsertNodeSearchHint,
      emptyCaption: "",
      filter: query => {
        let words = query.trim().toLowerCase()
        return entries.filter(entry => words.length == 0 || entry.search.indexOf(words) >= 0).map(entry => entry.item)
      }
    })
  }
}

