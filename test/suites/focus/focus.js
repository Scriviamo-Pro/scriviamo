// Focus mode: turning it on and off, and the current block.
"use strict"
{
  const section = "Focus mode"

  test(section, "focus mode marks the block being written in", t => {
    let editor = t.editor()
    editor.fromMarkdown("First.\n\nSecond.\n\nThird.")
    editor.focusNode(editor.nodeAt(1), 0)
    PE.FocusMode.set(editor, {enabled: true})
    t.assert(editor.element.classList.contains("scv-focus-mode"), "The editor isn't in focus mode.")
    t.assert(editor.nodeAt(1).element.classList.contains("scv-focus-current"), "The current block isn't marked.")
    t.assert(!editor.nodeAt(0).element.classList.contains("scv-focus-current"), "Another block is marked.")
    PE.FocusMode.set(editor, {enabled: false})
    t.assert(!editor.element.classList.contains("scv-focus-mode") && editor.element.querySelectorAll(".scv-focus-current").length == 0, "Focus mode didn't turn off.")
  })

  test(section, "typewriter scrolling turns focus mode on, and off with it", t => {
    let editor = t.editor()
    PE.FocusMode.set(editor, {typewriter: true})
    t.assert(PE.FocusMode.isOn(editor) && editor.element.classList.contains("scv-typewriter"), "Typewriter scrolling didn't turn focus mode on.")
    PE.FocusMode.toggle(editor)
    t.assert(!PE.FocusMode.isOn(editor) && !PE.FocusMode.settings(editor).typewriter, "Turning focus mode off left typewriter scrolling on.")
  })
}
