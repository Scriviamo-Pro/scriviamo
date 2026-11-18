import {Editor, EditorPanel, HeadingNode, Node, Strings, Utilities} from "scriviamo"

/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
const OutlineStrings = {
  TextOutlineCaption: "Outline",
  TextOutlineEmptyCaption: "Headings you add appear here.",
  TextOutlineMoveHint: "Drag a heading, or press Alt+Up or Alt+Down, to move its section.",
  TextOutlineUntitledCaption: "Untitled heading",
  TextOutlineCollapseCaption: "Collapse",
  TextOutlineExpandCaption: "Expand"
}

type OutlineStringsTable = typeof OutlineStrings

declare module "scriviamo" {
  interface Strings extends OutlineStringsTable {}
}

Strings.register(OutlineStrings)

/** A heading in the outline, with the headings under it. */
export interface OutlineEntry {
  heading: HeadingNode
  level: number
  text: string
  /** Whether it's in the document's own list, so its section can move. */
  movable: boolean
  children: Array<OutlineEntry>
}

/**
 * The document's headings as a tree, beside the editor: click a heading to go to it, and drag one,
 * or press Alt+Up or Alt+Down on it, to move its whole section: the heading and everything
 * under it, up to the next heading of the same or a higher level.
 *
 *   new Outline(element, editor)
 *
 * With the inspector add-on loaded, the outline is also one of the inspector's tabs.
 */
export class Outline {
  #element: HTMLElement
  #editor: Editor | null = null
  #collapsed = new Set<string>()
  #scheduled = false
  #signature = ""
  #onChange = () => this.#schedule()
  #onSelection = () => this.#markCurrent()

  constructor(element: HTMLElement, editor: Editor | null = null) {
    this.#element = element
    this.editor = editor
  }

  get element(): HTMLElement {
    return this.#element
  }

  get editor(): Editor | null {
    return this.#editor
  }

  set editor(value: Editor | null) {
    if (this.#editor) {
      this.#editor.removeEventListener("contentChanged", this.#onChange)
      this.#editor.removeEventListener("selectionChanged", this.#onSelection)
      this.#editor.removeEventListener("readOnlyChanged", this.#onChange)
    }
    this.#editor = value
    if (value) {
      value.addEventListener("contentChanged", this.#onChange)
      value.addEventListener("selectionChanged", this.#onSelection)
      value.addEventListener("readOnlyChanged", this.#onChange)
    }
    this.#signature = ""
    this.render()
  }

  /** Stops following the editor. */
  dispose() {
    this.editor = null
    this.#element.replaceChildren()
  }

  /** The document's headings, nested by level. */
  static entries(editor: Editor): Array<OutlineEntry> {
    let roots: Array<OutlineEntry> = []
    let stack: Array<OutlineEntry> = []
    let top = new Set(editor.nodes())
    editor.allNodes().forEach(node => {
      if (!(node instanceof HeadingNode)) return
      let entry: OutlineEntry = {heading: node, level: node.level, text: node.text.replace(/[\u2028\u2029\n]+/g, " ").trim(), movable: top.has(node), children: []}
      while (stack.length > 0 && stack[stack.length - 1].level >= entry.level) stack.pop()
      if (stack.length > 0) stack[stack.length - 1].children.push(entry)
      else roots.push(entry)
      stack.push(entry)
    })
    return roots
  }

  /** A heading's section in the document's list: the heading and the nodes under it. */
  static section(editor: Editor, heading: HeadingNode): Array<Node> {
    let list = editor.nodes()
    let start = list.indexOf(heading)
    if (start < 0) return [heading]
    let end = start + 1
    while (end < list.length && !(list[end] instanceof HeadingNode && (list[end] as HeadingNode).level <= heading.level)) end++
    return list.slice(start, end)
  }

  /**
   * Moves a heading's section to just before another top-level node, or to the end when before
   * is null. One undo step.
   */
  static moveSection(editor: Editor, heading: HeadingNode, before: Node | null): boolean {
    if (editor.readOnly) return false
    let section = Outline.section(editor, heading)
    if (before && section.indexOf(before) >= 0) return false
    let list = editor.listContaining(heading)
    if (!list) return false
    let index = before ? list.indexOf(before) : list.length
    if (index < 0) return false
    editor.moveNodesTo(section, list, index)
    return true
  }

  /** Moves a section past the section before or after it at the same level. */
  static moveSectionBy(editor: Editor, heading: HeadingNode, direction: -1 | 1): boolean {
    let list = editor.nodes()
    let start = list.indexOf(heading)
    if (start < 0) return false
    let section = Outline.section(editor, heading)
    if (direction < 0) {
      // The previous heading at this level or higher starts the section to jump over.
      for (let index = start - 1; index >= 0; index--) {
        let node = list[index]
        if (node instanceof HeadingNode && node.level <= heading.level) return Outline.moveSection(editor, heading, node)
      }
      return false
    }
    let after = start + section.length
    if (after >= list.length) return false
    let next = list[after]
    if (!(next instanceof HeadingNode)) return false
    let nextSection = Outline.section(editor, next)
    let target = list[after + nextSection.length] || null
    return Outline.moveSection(editor, heading, target)
  }

  #schedule() {
    if (this.#scheduled) return
    this.#scheduled = true
    // A timer rather than an animation frame, which a hidden page doesn't run.
    setTimeout(() => {
      this.#scheduled = false
      this.render()
    }, 30)
  }

  /** Redraws the outline when its headings changed. */
  render() {
    let editor = this.#editor
    let strings = editor ? editor.strings : Strings.shared
    let entries = editor ? Outline.entries(editor) : []
    let signature = JSON.stringify([editor ? editor.readOnly : true, Array.from(this.#collapsed), entries.map(function flat(entry): any {
      return [entry.heading.nodeId, entry.level, entry.text, entry.children.map(flat)]
    })])
    if (signature == this.#signature && this.#element.firstChild) {
      this.#markCurrent()
      return
    }
    this.#signature = signature
    this.#element.replaceChildren()
    let root = Utilities.element("nav", "scv-outline", {"aria-label": strings.TextOutlineCaption})
    if (entries.length == 0) {
      let empty = Utilities.element("div", "scv-outline-empty")
      empty.textContent = strings.TextOutlineEmptyCaption
      root.append(empty)
      this.#element.append(root)
      return
    }
    root.append(this.#list(entries, strings, 0))
    if (editor && !editor.readOnly) {
      let hint = Utilities.element("div", "scv-outline-hint")
      hint.textContent = strings.TextOutlineMoveHint
      root.append(hint)
    }
    this.#element.append(root)
    this.#markCurrent()
  }

  #list(entries: Array<OutlineEntry>, strings: Strings, depth: number): HTMLElement {
    let list = Utilities.element("ul", "scv-outline-list", {role: depth == 0 ? "tree" : "group"})
    entries.forEach(entry => list.append(this.#item(entry, strings, depth)))
    return list
  }

  #item(entry: OutlineEntry, strings: Strings, depth: number): HTMLElement {
    let editor = this.#editor!
    let id = entry.heading.nodeId
    let item = Utilities.element("li", "scv-outline-item", {role: "treeitem"})
    item.dataset.nodeId = id
    let row = Utilities.element("div", "scv-outline-row")
    row.style.paddingInlineStart = `${depth * 14 + 4}px`
    let collapsed = this.#collapsed.has(id)
    if (entry.children.length > 0) {
      let toggle = Utilities.element("button", "scv-outline-toggle", {type: "button", "aria-label": collapsed ? strings.TextOutlineExpandCaption : strings.TextOutlineCollapseCaption, "aria-expanded": String(!collapsed)})
      toggle.innerHTML = `<i class="bi ${collapsed ? "bi-chevron-right" : "bi-chevron-down"}" aria-hidden="true"></i>`
      toggle.addEventListener("click", event => {
        event.stopPropagation()
        if (collapsed) this.#collapsed.delete(id)
        else this.#collapsed.add(id)
        this.render()
      })
      row.append(toggle)
    } else {
      row.append(Utilities.element("span", "scv-outline-toggle-space"))
    }
    let link = Utilities.element("button", `scv-outline-link scv-outline-level-${entry.level}`, {type: "button"})
    link.textContent = entry.text.length > 0 ? entry.text : strings.TextOutlineUntitledCaption
    link.addEventListener("click", () => {
      editor.focusNode(entry.heading, 0)
      entry.heading.element?.scrollIntoView({block: "start", behavior: "smooth"})
    })
    let movable = entry.movable && !editor.readOnly
    if (movable) {
      link.addEventListener("keydown", event => {
        if (!event.altKey || (event.key != "ArrowUp" && event.key != "ArrowDown")) return
        event.preventDefault()
        if (Outline.moveSectionBy(editor, entry.heading, event.key == "ArrowUp" ? -1 : 1)) {
          this.render()
          let moved = this.#element.querySelector(`[data-node-id="${CSS.escape(id)}"] .scv-outline-link`) as HTMLElement | null
          if (moved) moved.focus()
        }
      })
      row.draggable = true
      row.addEventListener("dragstart", event => {
        event.dataTransfer!.effectAllowed = "move"
        event.dataTransfer!.setData("application/x-scriviamo-outline", id)
        item.classList.add("scv-outline-dragging")
      })
      row.addEventListener("dragend", () => {
        item.classList.remove("scv-outline-dragging")
        this.#element.querySelectorAll(".scv-outline-drop-before, .scv-outline-drop-after").forEach(element => element.classList.remove("scv-outline-drop-before", "scv-outline-drop-after"))
      })
      row.addEventListener("dragover", event => {
        if (!event.dataTransfer!.types.includes("application/x-scriviamo-outline")) return
        event.preventDefault()
        let box = row.getBoundingClientRect()
        let after = event.clientY > box.top + box.height / 2
        row.classList.toggle("scv-outline-drop-before", !after)
        row.classList.toggle("scv-outline-drop-after", after)
      })
      row.addEventListener("dragleave", () => row.classList.remove("scv-outline-drop-before", "scv-outline-drop-after"))
      row.addEventListener("drop", event => {
        let source = event.dataTransfer!.getData("application/x-scriviamo-outline")
        row.classList.remove("scv-outline-drop-before", "scv-outline-drop-after")
        if (!source || source == id) return
        event.preventDefault()
        let moving = editor.nodeWithID(source)
        if (!(moving instanceof HeadingNode)) return
        let box = row.getBoundingClientRect()
        let after = event.clientY > box.top + box.height / 2
        // Dropped after a heading: after its whole section.
        let before: Node | null = entry.heading
        if (after) {
          let section = Outline.section(editor, entry.heading)
          let list = editor.nodes()
          before = list[list.indexOf(section[section.length - 1]) + 1] || null
        }
        Outline.moveSection(editor, moving, before)
      })
    }
    row.append(link)
    item.append(row)
    if (entry.children.length > 0 && !collapsed) item.append(this.#list(entry.children, strings, depth + 1))
    return item
  }

  /** Marks the heading whose section has the selection. */
  #markCurrent() {
    let editor = this.#editor
    if (!editor) return
    let selected = editor.selectedNodes ? editor.selectedNodes()[0] : null
    let active = editor.activeHost ? editor.activeHost.node : selected
    let current: HeadingNode | null = null
    if (active) {
      let all = editor.allNodes()
      let index = all.indexOf(active)
      for (let at = index; at >= 0; at--) {
        if (all[at] instanceof HeadingNode) {
          current = all[at] as HeadingNode
          break
        }
      }
    }
    this.#element.querySelectorAll(".scv-outline-current").forEach(element => element.classList.remove("scv-outline-current"))
    if (current) this.#element.querySelector(`[data-node-id="${CSS.escape(current.nodeId)}"] > .scv-outline-row`)?.classList.add("scv-outline-current")
  }
}

/** The outline as a panel, which the inspector add-on shows as a tab. */
export const OutlinePanel: EditorPanel = {
  identifier: "outline",
  caption: (editor: Editor) => editor.strings.TextOutlineCaption,
  build(container: HTMLElement, editor: Editor) {
    let outline = new Outline(container, editor)
    return () => outline.dispose()
  }
}

Editor.registerPanel(OutlinePanel)
