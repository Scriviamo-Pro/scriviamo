// Headless editors: loading and exporting documents without drawing anything.
"use strict"
{
  const section = "Headless"

  test(section, "an editor without an element loads and exports documents", t => {
    let source = t.editor()
    source.addNode(new PE.HeadingNode("Title", 1))
    source.addNode(new PE.TextNode("Body"))
    let json = source.toJSON()
    let editor = new PE.Editor(null, {content: json})
    t.equal(editor.element, null, "A headless editor drew itself")
    t.equal(editor.nodes().length, 2, "The document wasn't loaded")
    t.equal(editor.toPlainText(), "Title\nBody", "The plain text was wrong")
    t.equal(editor.toHTML(), source.toHTML(), "The HTML differed from a visible editor's")
    t.equal(editor.toMarkdown(), source.toMarkdown(), "The Markdown differed from a visible editor's")
    editor.addNode(new PE.TextNode("Added"))
    t.assert(editor.isChanged && editor.toPlainText().endsWith("Added"), "A headless editor couldn't be changed")
    t.assert(!document.querySelector(".scv-editor:not(.parity-host .scv-editor)"), "A headless editor added elements to the page")
  })

  test(section, "renderHTML, renderMarkdown and renderPlainText", t => {
    let source = t.editor()
    source.addNode(new PE.TextNode("Rendered"))
    let json = source.toJSON()
    t.equal(PE.Editor.renderHTML(json), source.toHTML(), "renderHTML was wrong")
    t.assert(PE.Editor.renderHTML(JSON.parse(json), true).startsWith("<!doctype html>"), "renderHTML didn't make a page")
    t.equal(PE.Editor.renderMarkdown(json), source.toMarkdown(), "renderMarkdown was wrong")
    t.equal(PE.Editor.renderPlainText(json), "Rendered", "renderPlainText was wrong")
  })
}
