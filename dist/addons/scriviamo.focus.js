// addons/focus/focusmode.ts
import { Editor, Strings, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem } from "scriviamo";
var FocusStrings = {
  TextFocusModeCaption: "Focus Mode",
  TextFocusModeOnCaption: "Focus on the Current Block",
  TextTypewriterScrollingCaption: "Typewriter Scrolling"
};
Strings.register(FocusStrings);
var FocusMode = class _FocusMode {
  static #settings = /* @__PURE__ */ new WeakMap();
  /** How far down the editor the current line stays while typewriter scrolling, from 0 to 1. */
  static typewriterPosition = 0.38;
  static settings(editor) {
    return _FocusMode.#settings.get(editor) || { enabled: false, typewriter: false };
  }
  static isOn(editor) {
    return _FocusMode.settings(editor).enabled;
  }
  /** Changes the settings given; the rest stay as they are. */
  static set(editor, settings) {
    let next = { ..._FocusMode.settings(editor), ...settings };
    if (!next.enabled)
      next.typewriter = settings.typewriter ?? false;
    if (next.typewriter)
      next.enabled = true;
    _FocusMode.#settings.set(editor, next);
    let element = editor.element;
    if (element) {
      element.classList.toggle("scv-focus-mode", next.enabled);
      element.classList.toggle("scv-typewriter", next.typewriter);
    }
    _FocusMode.update(editor);
    editor.updateToolbarState();
    editor.dispatchEvent(new CustomEvent("focusModeChanged", { detail: next }));
  }
  static toggle(editor) {
    _FocusMode.set(editor, { enabled: !_FocusMode.isOn(editor) });
  }
  /** The top-level block holding the caret or the selection. */
  static currentBlock(editor) {
    let node = editor.activeHost ? editor.activeHost.node : editor.selectedNodes()[0] || null;
    while (node && node.parent)
      node = node.parent;
    return node;
  }
  /** Marks the current block, and scrolls it into place while typewriter scrolling. */
  static update(editor) {
    let root = editor.element;
    if (!root)
      return;
    let settings = _FocusMode.settings(editor);
    root.querySelectorAll(".scv-focus-current").forEach((element) => element.classList.remove("scv-focus-current"));
    if (!settings.enabled)
      return;
    let block = _FocusMode.currentBlock(editor);
    if (block && block.element)
      block.element.classList.add("scv-focus-current");
    if (settings.typewriter)
      _FocusMode.#scrollToCaret(editor);
  }
  static #scrollToCaret(editor) {
    let host = editor.activeHost;
    let root = editor.element;
    if (!host || !root)
      return;
    let caret = host.caretRect();
    let scroller = root.querySelector(".scv-scroller");
    if (!caret || caret.height == 0)
      return;
    if (scroller && scroller.scrollHeight > scroller.clientHeight + 1) {
      let box = scroller.getBoundingClientRect();
      let target = box.top + box.height * _FocusMode.typewriterPosition;
      let shift = caret.top - target;
      if (Math.abs(shift) > 2)
        scroller.scrollTop += shift;
    } else {
      let target = window.innerHeight * _FocusMode.typewriterPosition;
      let shift = caret.top - target;
      if (Math.abs(shift) > 2)
        window.scrollBy({ top: shift });
    }
  }
};
var FocusModeExtension = {
  toolbarIdentifiers: ["focusmode"],
  defaultToolbarIdentifiers: ["focusmode"],
  install(editor) {
    if (!editor.element)
      return;
    let update = () => {
      if (FocusMode.isOn(editor))
        FocusMode.update(editor);
    };
    for (let name of ["selectionChanged", "editingChanged", "contentChanged"])
      editor.addEventListener(name, update);
    let frame = 0;
    document.addEventListener("selectionchange", () => {
      if (!FocusMode.isOn(editor) || frame)
        return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (editor.element && editor.element.isConnected)
          FocusMode.update(editor);
      });
    });
  },
  makeToolbarItem(editor, identifier) {
    if (identifier != "focusmode")
      return null;
    let strings = editor.strings;
    let item = new ToolbarItem(identifier, strings.TextFocusModeCaption, "bi bi-bullseye", ToolbarItemKinds.menu, strings.TextFocusModeCaption);
    let settings = FocusMode.settings(editor);
    let on = new ToolbarMenuItem("on", strings.TextFocusModeOnCaption, "bi bi-bullseye");
    on.checked = settings.enabled;
    let typewriter = new ToolbarMenuItem("typewriter", strings.TextTypewriterScrollingCaption, "bi bi-arrows-collapse");
    typewriter.checked = settings.typewriter;
    item.menuItems.push(on, typewriter);
    return item;
  },
  activateToolbarItem(editor, identifier, menuItem) {
    if (identifier != "focusmode")
      return false;
    let settings = FocusMode.settings(editor);
    if (menuItem && menuItem.identifier == "typewriter")
      FocusMode.set(editor, { typewriter: !settings.typewriter });
    else
      FocusMode.set(editor, { enabled: !settings.enabled, typewriter: false });
    return true;
  },
  updateToolbarState(editor, set) {
    set("focusmode", true, FocusMode.isOn(editor));
  }
};
Editor.registerExtension(FocusModeExtension);
export {
  FocusMode,
  FocusModeExtension
};
