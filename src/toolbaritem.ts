import {Utilities} from "./internal"

export enum ToolbarItemKinds {
  button = 0,
  toggle = 1,
  menu = 2,
  separator = 3,
  flexibleSpace = 4,
  /** A menu that shows a color palette. Its value is a DocumentColor, or null for Default. */
  color = 5
}

export class ToolbarMenuItem {
  identifier: string
  caption: string
  icon: string
  checked: boolean = false
  enabled: boolean = true
  isSeparator: boolean = false
  /** Optional CSS applied to the caption, such as a font family for a font menu. */
  captionStyle: string = ""
  /** Value delivered with the menu item; defaults to the identifier. */
  value: any = null
  /** Items shown in a submenu. A menu item with children opens them instead of being chosen. */
  children: Array<ToolbarMenuItem> = []

  constructor(identifier: string, caption: string = "", icon: string = "") {
    this.identifier = identifier
    this.caption = caption
    this.icon = icon
  }

  get hasChildren(): boolean {
    return this.children.length > 0
  }

  /** A menu item that opens a submenu of children. */
  static submenu(identifier: string, caption: string, icon: string, children: Array<ToolbarMenuItem>): ToolbarMenuItem {
    let result = new ToolbarMenuItem(identifier, caption, icon)
    result.children = children
    result.enabled = children.some(child => !child.isSeparator && child.enabled)
    return result
  }

  static separator(): ToolbarMenuItem {
    let result = new ToolbarMenuItem("-")
    result.isSeparator = true
    return result
  }
}

/**
 * A button, toggle, menu or separator in the editor's toolbar or in a node's
 * contextual toolbar. Items the editor doesn't handle raise the editor's
 * toolbarItemPressed event.
 */
export class ToolbarItem extends EventTarget {
  identifier: string
  caption: string
  tooltip: string
  /** A Bootstrap Icons or Font Awesome class list, such as "bi bi-type-bold". */
  icon: string
  kind: ToolbarItemKinds
  menuItems: Array<ToolbarMenuItem> = []
  /** Shows the caption in the button even in icon-only mode. Used by menus such as Font. */
  alwaysShowCaption: boolean = false
  /** Arbitrary application data. */
  tag: any = null

  #enabled: boolean = true
  #active: boolean = false
  #visible: boolean = true
  #element: HTMLElement | null = null

  constructor(identifier: string, caption: string, icon: string = "", kind: ToolbarItemKinds = ToolbarItemKinds.button, tooltip: string = "") {
    super()
    this.identifier = identifier
    this.caption = caption
    this.icon = icon
    this.kind = kind
    this.tooltip = tooltip.length > 0 ? tooltip : caption
  }

  static separator(): ToolbarItem {
    return new ToolbarItem(`separator-${Utilities.uuid()}`, "", "", ToolbarItemKinds.separator)
  }

  static flexibleSpace(): ToolbarItem {
    return new ToolbarItem("flexiblespace", "", "", ToolbarItemKinds.flexibleSpace)
  }

  get element(): HTMLElement | null {
    return this.#element
  }

  set element(value: HTMLElement | null) {
    this.#element = value
    this.#applyState()
  }

  get enabled(): boolean {
    return this.#enabled
  }

  set enabled(value: boolean) {
    if (this.#enabled == value) return
    this.#enabled = value
    this.#applyState()
  }

  get active(): boolean {
    return this.#active
  }

  set active(value: boolean) {
    if (this.#active == value) return
    this.#active = value
    this.#applyState()
  }

  get visible(): boolean {
    return this.#visible
  }

  set visible(value: boolean) {
    if (this.#visible == value) return
    this.#visible = value
    this.#applyState()
  }

  /** Updates the tooltip of the item's button. */
  setTooltip(value: string) {
    this.tooltip = value
    if (!this.#element) return
    let button = this.#element.matches("button") ? this.#element : this.#element.querySelector("button")
    if (button) {
      button.setAttribute("title", value)
      button.setAttribute("aria-label", value)
    }
  }

  /** Updates the caption shown on a menu button, such as the current font name. */
  setDisplayCaption(value: string) {
    if (!this.#element) return
    let label = this.#element.querySelector(".scv-toolbar-caption")
    if (label) label.textContent = value
  }

  #applyState() {
    let element = this.#element
    if (!element) return
    let button = element.matches("button") ? element : element.querySelector("button")
    if (button) {
      (button as HTMLButtonElement).disabled = !this.#enabled
      button.classList.toggle("active", this.#active)
      button.setAttribute("aria-pressed", this.#active ? "true" : "false")
    }
    element.classList.toggle("d-none", !this.#visible)
  }
}

/** An ordered, identifier-addressable list of toolbar items. */
export class ToolbarItems extends EventTarget {
  #items: Array<ToolbarItem> = []

  add(item: ToolbarItem) {
    this.#items.push(item)
    this.dispatchEvent(new Event("changed"))
  }

  /** Replaces every item at once, with one changed event. */
  setItems(items: Array<ToolbarItem>) {
    this.#items = items.slice()
    this.dispatchEvent(new Event("changed"))
  }

  addAt(index: number, item: ToolbarItem) {
    index = Utilities.clamp(index, 0, this.#items.length)
    this.#items.splice(index, 0, item)
    this.dispatchEvent(new Event("changed"))
  }

  indexOf(item: ToolbarItem | string): number {
    if (typeof item == "string") return this.#items.findIndex(candidate => candidate.identifier == item)
    return this.#items.indexOf(item)
  }

  item(identifier: string): ToolbarItem | null {
    return this.#items.find(candidate => candidate.identifier == identifier) || null
  }

  itemAt(index: number): ToolbarItem | null {
    return this.#items[index] || null
  }

  items(): Array<ToolbarItem> {
    return this.#items.slice()
  }

  get lastIndex(): number {
    return this.#items.length - 1
  }

  remove(item: ToolbarItem | string) {
    let index = this.indexOf(item)
    if (index >= 0) this.removeAt(index)
  }

  removeAt(index: number) {
    if (index < 0 || index >= this.#items.length) return
    this.#items.splice(index, 1)
    this.dispatchEvent(new Event("changed"))
  }

  removeAll() {
    this.#items = []
    this.dispatchEvent(new Event("changed"))
  }
}
