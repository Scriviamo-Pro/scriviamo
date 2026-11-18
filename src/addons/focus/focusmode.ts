import {Editor, EditorExtension, Node, Strings, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem} from "scriviamo"

/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
const FocusStrings = {
  TextFocusModeCaption: "Focus Mode",
  TextFocusModeOnCaption: "Focus on the Current Block",
  TextTypewriterScrollingCaption: "Typewriter Scrolling"
}

type FocusStringsTable = typeof FocusStrings

declare module "scriviamo" {
  interface Strings extends FocusStringsTable {}
}

Strings.register(FocusStrings)

/** An editor's focus mode settings. */
export interface FocusModeSettings {
  /** Dims every block but the one being written in. */
  enabled: boolean
  /** Keeps the line being written in at the same height in the editor, as on a typewriter. */
  typewriter: boolean
}

/**
 * Focus mode: every block but the one being written in fades, so the current paragraph stands
 * out. Typewriter scrolling also keeps the line being written at the same height, about a third of
 * the way down, so the eyes stay in one place.
 *
 *   FocusMode.set(editor, {enabled: true, typewriter: true})
 *
 * It's a view setting: it isn't saved with the document.
 */
export class FocusMode {
  static #settings = new WeakMap<Editor, FocusModeSettings>()
  /** How far down the editor the current line stays while typewriter scrolling, from 0 to 1. */
  static typewriterPosition: number = 0.38

  static settings(editor: Editor): FocusModeSettings {
    return FocusMode.#settings.get(editor) || {enabled: false, typewriter: false}
  }

  static isOn(editor: Editor): boolean {
    return FocusMode.settings(editor).enabled
  }

  /** Changes the settings given; the rest stay as they are. */
  static set(editor: Editor, settings: Partial<FocusModeSettings>) {
    let next = {...FocusMode.settings(editor), ...settings}
    if (!next.enabled) next.typewriter = settings.typewriter ?? false
    if (next.typewriter) next.enabled = true
    FocusMode.#settings.set(editor, next)
    let element = editor.element
    if (element) {
      element.classList.toggle("scv-focus-mode", next.enabled)
      element.classList.toggle("scv-typewriter", next.typewriter)
    }
    FocusMode.update(editor)
    editor.updateToolbarState()
    editor.dispatchEvent(new CustomEvent("focusModeChanged", {detail: next}))
  }

  static toggle(editor: Editor) {
    FocusMode.set(editor, {enabled: !FocusMode.isOn(editor)})
  }

  /** The top-level block holding the caret or the selection. */
  static currentBlock(editor: Editor): Node | null {
    let node: Node | null = editor.activeHost ? editor.activeHost.node : editor.selectedNodes()[0] || null
    while (node && node.parent) node = node.parent
    return node
  }

  /** Marks the current block, and scrolls it into place while typewriter scrolling. */
  static update(editor: Editor) {
    let root = editor.element
    if (!root) return
    let settings = FocusMode.settings(editor)
    root.querySelectorAll(".scv-focus-current").forEach(element => element.classList.remove("scv-focus-current"))
    if (!settings.enabled) return
    let block = FocusMode.currentBlock(editor)
    if (block && block.element) block.element.classList.add("scv-focus-current")
    if (settings.typewriter) FocusMode.#scrollToCaret(editor)
  }

  static #scrollToCaret(editor: Editor) {
    let host = editor.activeHost
    let root = editor.element
    if (!host || !root) return
    let caret = host.caretRect()
    let scroller = root.querySelector(".scv-scroller") as HTMLElement | null
    if (!caret || caret.height == 0) return
    // The editor scrolls itself, unless it grows with its content and the page scrolls.
    if (scroller && scroller.scrollHeight > scroller.clientHeight + 1) {
      let box = scroller.getBoundingClientRect()
      let target = box.top + box.height * FocusMode.typewriterPosition
      let shift = caret.top - target
      if (Math.abs(shift) > 2) scroller.scrollTop += shift
    } else {
      let target = window.innerHeight * FocusMode.typewriterPosition
      let shift = caret.top - target
      if (Math.abs(shift) > 2) window.scrollBy({top: shift})
    }
  }
}

/** The Focus Mode tool, and following the caret. */
export const FocusModeExtension: EditorExtension = {
  toolbarIdentifiers: ["focusmode"],
  defaultToolbarIdentifiers: ["focusmode"],

  install(editor: Editor) {
    // A headless editor, such as on a server, has nothing to focus.
    if (!editor.element) return
    let update = () => { if (FocusMode.isOn(editor)) FocusMode.update(editor) }
    for (let name of ["selectionChanged", "editingChanged", "contentChanged"]) editor.addEventListener(name, update)
    // Moving the caret inside a block raises no editor event.
    let frame = 0
    document.addEventListener("selectionchange", () => {
      if (!FocusMode.isOn(editor) || frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        if (editor.element && editor.element.isConnected) FocusMode.update(editor)
      })
    })
  },

  makeToolbarItem(editor: Editor, identifier: string): ToolbarItem | null {
    if (identifier != "focusmode") return null
    let strings = editor.strings
    let item = new ToolbarItem(identifier, strings.TextFocusModeCaption, "bi bi-bullseye", ToolbarItemKinds.menu, strings.TextFocusModeCaption)
    let settings = FocusMode.settings(editor)
    let on = new ToolbarMenuItem("on", strings.TextFocusModeOnCaption, "bi bi-bullseye")
    on.checked = settings.enabled
    let typewriter = new ToolbarMenuItem("typewriter", strings.TextTypewriterScrollingCaption, "bi bi-arrows-collapse")
    typewriter.checked = settings.typewriter
    item.menuItems.push(on, typewriter)
    return item
  },

  activateToolbarItem(editor: Editor, identifier: string, menuItem: ToolbarMenuItem | null): boolean {
    if (identifier != "focusmode") return false
    let settings = FocusMode.settings(editor)
    if (menuItem && menuItem.identifier == "typewriter") FocusMode.set(editor, {typewriter: !settings.typewriter})
    else FocusMode.set(editor, {enabled: !settings.enabled, typewriter: false})
    return true
  },

  updateToolbarState(editor: Editor, set: (identifier: string, enabled: boolean, active?: boolean) => void) {
    set("focusmode", true, FocusMode.isOn(editor))
  }
}

Editor.registerExtension(FocusModeExtension)
