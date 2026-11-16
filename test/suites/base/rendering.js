// HTML output, stylesheets, document JSON, and the picture and PDF outputs.
"use strict"
{
  const section = "Rendering"
  const gif = "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="

  function documentEditor(t) {
    let editor = t.editor()
    let background = new PE.BackgroundImage()
    background.source = "data:image/gif;base64," + gif
    background.repeat = PE.BackgroundRepeats.repeat
    editor.backgroundImage = background
    editor.addNode(new PE.TextNode("Searchable content"))
    return editor
  }

  test(section, "HTML fragments and documents", t => {
    let editor = documentEditor(t)
    t.equal(editor.search.findAll("searchable").length, 1, "Editor search did not find case-insensitive text")
    t.assert(editor.toHTML().indexOf("<body") < 0 && editor.toHTML().indexOf("Searchable content") >= 0, "The default HTML output was not a content-only fragment.")
    t.assert(editor.toHTML(true).indexOf("<!doctype html>") >= 0 && editor.toHTML(true).indexOf("<style>") >= 0, "Document HTML output omitted its wrapper or default stylesheet.")
  })

  test(section, "theme colors", t => {
    let editor = t.editor()
    t.assert(typeof editor.themeColor == "function", "There are no theme colors (text selection, success, link, chrome) to set or read; colors come from the page's CSS.")
  })

  test(section, "export uses the theme's link color", t => {
    let editor = t.editor()
    editor.addNode(new PE.TextNode("Themed"))
    t.assert(editor.exportStylesheet().propertyValue("a", "color") != "", "Link export has no color.")
  })

  test(section, "the stylesheet follows the node types in the document", t => {
    let editor = documentEditor(t)
    t.assert(editor.exportStylesheet().hasRule("p") && !editor.exportStylesheet().hasRule("table"), "The stylesheet did not follow the node types in the document.")
    let table = new PE.TableNode(1, 1)
    table.cell(0, 0).nodes.push(new PE.QuoteNode("Nested"))
    editor.addNode(table)
    t.assert(editor.exportStylesheet().hasRule("table") && editor.exportStylesheet().hasRule("blockquote.quote"), "A node type in the document did not contribute its export stylesheet.")
  })

  test(section, "stylesheet rules merge by selector", t => {
    let sheet = new PE.Stylesheet()
    sheet.addRule("th,td", "padding: 10px; color: red")
    sheet.addCSS("/* note */ th, td { color: blue; font-weight: 700 } @media print { p { margin: 0; } }")
    sheet.setProperty("figure img", "margin", "0 auto")
    t.assert(sheet.ruleCount == 2 && sheet.propertyValue("th, td", "color") == "blue" && sheet.propertyValue("TH, TD", "color") == "", `Stylesheet did not merge rules that share a selector (${sheet.ruleCount} rules).`)
    let css = sheet.toString()
    t.assert(css.indexOf("th, td {\n  padding: 10px;\n  color: blue;\n  font-weight: 700;\n}") >= 0, "Stylesheet did not write merged declarations in their original order: " + JSON.stringify(css))
    t.assert(css.indexOf("@media print { p { margin: 0; } }") > css.indexOf("figure img"), "Stylesheet did not keep at-rules after ordinary rules.")
    t.assert(css.indexOf("note") < 0, "Stylesheet kept a CSS comment.")
  })

  test(section, "the built-in HTML exporter writes a document", t => {
    let editor = documentEditor(t)
    t.assert(editor.export("html").indexOf("Searchable content") >= 0, "Built-in HTML exporter omitted document content.")
    t.assert(editor.export("html").indexOf("<!doctype html>") >= 0, "The built-in HTML exporter did not request document elements.")
  })

  test(section, "document JSON is versioned and restores the background", t => {
    let editor = documentEditor(t)
    let serialized = editor.toJSON()
    t.equal(JSON.parse(serialized).version, PE.CurrentDocumentVersion, "Editor JSON did not include the current document version")
    let restored = t.editor()
    restored.fromJSON(serialized)
    t.assert(!hasValidationError(restored), "Versioned editor JSON could not be loaded.")
    t.equal(restored.toPlainText(), editor.toPlainText(), "Editor JSON changed document text")
    t.assert(!restored.backgroundImage.isEmpty && restored.backgroundImage.repeat == PE.BackgroundRepeats.repeat, "Editor JSON did not restore the document background image.")
  })

  test(section, "HTML and Markdown round trips keep the document", t => {
    let source = t.editor()
    let heading = new PE.HeadingNode("Visual output", PE.HeadingLevels.heading2)
    t.equal(heading.level, PE.HeadingLevels.heading2, "Heading construction did not apply its requested level")
    source.addNode(heading)
    source.addNode(new PE.TextNode("The same content should occupy the same pixels."))
    let html = t.editor()
    html.fromHTML(source.toHTML())
    t.equal(html.toHTML(), source.toHTML(), "The HTML round trip changed the document")
    let markdown = t.editor()
    markdown.fromMarkdown(source.toMarkdown())
    t.equal(markdown.toHTML(), source.toHTML(), "The Markdown round trip changed the document")
  })


  test(section, "dialogs fit the window, not the editor", async t => {
    let editor = t.editor()
    let host = editor.element.parentElement || editor.element
    host.style.cssText = "height: 60px; overflow: hidden; transform: translateZ(0)"
    let fields = Array.from({length: 30}, (_, index) => ({name: `f${index}`, label: `Field ${index}`}))
    let answer = editor.prompt("Many fields", fields)
    await t.tick(50)
    let backdrop = document.querySelector("dialog.scv-dialog-backdrop")
    t.assert(backdrop && backdrop.matches(":modal"), "The dialog didn't open as a modal in the top layer")
    let form = backdrop && backdrop.querySelector(".scv-dialog")
    if (form) {
      let box = form.getBoundingClientRect()
      t.assert(box.top >= 0 && box.bottom <= window.innerHeight && box.height > 100, `The dialog didn't fit the window (${Math.round(box.top)} to ${Math.round(box.bottom)} of ${window.innerHeight})`)
      let body = form.querySelector(".modal-body")
      t.assert(body.scrollHeight > body.clientHeight, "A dialog taller than the window didn't scroll its fields")
      backdrop.dispatchEvent(new Event("cancel", {cancelable: true}))
    }
    t.equal(await answer, null, "Cancelling the dialog didn't answer null")
    t.assert(!document.querySelector("dialog.scv-dialog-backdrop"), "The dialog stayed open after cancelling")
  })

  test(section, "pickers aren't clipped by the editor", async t => {
    let editor = t.editor()
    let host = editor.element.parentElement || editor.element
    host.style.cssText = "height: 60px; overflow: hidden; transform: translateZ(0)"
    let picker = new PE.TableSizePicker(editor.strings, () => {})
    picker.show(editor.element, editor.element)
    await t.tick(20)
    let box = picker.element.getBoundingClientRect()
    let hostBox = host.getBoundingClientRect()
    t.assert(typeof picker.element.showPopover != "function" || picker.element.matches(":popover-open"), "The picker didn't open in the top layer")
    t.assert(box.bottom > hostBox.bottom, "The picker didn't extend past the editor")
    let hit = document.elementFromPoint(box.left + box.width / 2, box.bottom - 6)
    t.assert(picker.element.contains(hit), "The part of the picker past the editor was clipped or covered")
    picker.close()
    t.assert(!picker.element.isConnected, "The picker stayed open after closing")
  })
}
