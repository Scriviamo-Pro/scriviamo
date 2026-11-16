// Dividers, quotes, page breaks, checklists, the inspector, alignment, and sizes.
"use strict"
{
  const section = "Node types"

  function inspectorItem(target, identifier) {
    let sections = target instanceof PE.Editor ? target.inspectorSections() : target.inspectorSections()
    for (let section of sections) {
      for (let item of section.items()) {
        if (item && item.identifier == identifier) return item
      }
    }
    return null
  }

  function isChecked(list, item) {
    return !!list.content.listChecked[item]
  }

  test(section, "quotes import from Markdown and round-trip", t => {
    let editor = t.editor()
    editor.fromMarkdown("> Simplicity is prerequisite for reliability.\n> — Edsger Dijkstra")
    let ok = editor.lastNodeIndex == 0 && editor.nodeAt(0) instanceof PE.QuoteNode
    t.assert(ok, `A Markdown quote did not import as a quote (${editor.nodes().map(node => node.type)}).`)
    if (!ok) return
    let quote = editor.nodeAt(0)
    t.assert(quote.citation == "Edsger Dijkstra" && quote.text == "Simplicity is prerequisite for reliability.", `A Markdown quote did not keep its text and citation (${JSON.stringify(quote.text)}, ${JSON.stringify(quote.citation)}).`)
    let html = t.editor()
    html.fromHTML(editor.toHTML())
    t.assert(html.lastNodeIndex == 0 && html.nodeAt(0) instanceof PE.QuoteNode && html.nodeAt(0).citation == "Edsger Dijkstra", "A quote and its citation did not round-trip through HTML.")
    let markdown = t.editor()
    markdown.fromMarkdown(editor.toMarkdown())
    t.assert(markdown.lastNodeIndex == 0 && markdown.nodeAt(0) instanceof PE.QuoteNode, "A quote did not round-trip through Markdown.")
    let restored = new PE.QuoteNode()
    t.assert(restored.fromJSON(quote.toJSON()) && restored.citation == "Edsger Dijkstra", "A quote citation did not round-trip through JSON.")
    t.equal(editor.cloneNode(quote).citation, "Edsger Dijkstra", "Duplicate did not copy a quote citation")
  })

  skip(section, "page breaks paginate picture output", "There is no paginated picture output; page breaks export as CSS page breaks for printing.")

  test(section, "checklist item states follow editing and round-trip", async t => {
    let editor = t.editor()
    let checklist = new PE.ListNode("Write tests\nShip it", PE.ListTypes.checklist)
    checklist.content.listChecked = [true, false]
    editor.addNode(checklist)
    await t.tick()
    // Breaking at the start of a checked item moves its state down with its text,
    // so the new first item is unchecked.
    editor.focusNode(checklist, 0)
    await t.tick()
    document.execCommand("insertParagraph")
    await t.tick()
    editor.focusNode(editor.nodeAt(0), 0)
    await t.tick()
    document.execCommand("insertText", false, "Plan")
    await t.tick()
    let edited = editor.nodeAt(0)
    t.assert(edited.content.text == "Plan\nWrite tests\nShip it" && !isChecked(edited, 0) && isChecked(edited, 1) && !isChecked(edited, 2), `Inserting a checklist item moved the checked states (${JSON.stringify(edited.content.text)}, ${JSON.stringify(edited.content.listChecked)}).`)
    checklist = new PE.ListNode("Write tests\nShip it", PE.ListTypes.checklist)
    checklist.content.listChecked = [true, false]
    t.assert(checklist.toMarkdown().indexOf("- [x] Write tests") >= 0 && checklist.toMarkdown().indexOf("- [ ] Ship it") >= 0, "A checklist did not export Markdown task items: " + checklist.toMarkdown())
    t.assert(checklist.toHTML().indexOf(`class="checklist"`) >= 0 && checklist.toHTML().indexOf("checked>") >= 0, "A checklist did not export HTML checkboxes: " + checklist.toHTML())
    let restored = new PE.ListNode()
    t.assert(restored.fromJSON(checklist.toJSON()) && restored.listType == PE.ListTypes.checklist && isChecked(restored, 0) && !isChecked(restored, 1), "A checklist did not round-trip through JSON.")
    let copy = editor.cloneNode(checklist)
    t.assert(copy.listType == PE.ListTypes.checklist && isChecked(copy, 0), "Duplicate did not copy checklist states.")

    let markdown = t.editor()
    markdown.fromMarkdown("- [x] Done\n- [ ] Not done")
    let imported = markdown.nodeAt(0)
    t.assert(markdown.lastNodeIndex == 0 && imported instanceof PE.ListNode, "Markdown task items did not import as a list.")
    if (!(imported instanceof PE.ListNode)) return
    t.assert(imported.listType == PE.ListTypes.checklist && isChecked(imported, 0) && !isChecked(imported, 1) && imported.content.text == "Done\nNot done", "Markdown task items did not keep their text and states: " + JSON.stringify(imported.content.text))
    t.equal(imported.toPlainText(), "Done\nNot done", "A checklist's plain text included its check marks")
    let html = t.editor()
    html.fromHTML(markdown.toHTML())
    let fromHTML = html.nodeAt(0)
    t.assert(html.lastNodeIndex == 0 && fromHTML instanceof PE.ListNode && fromHTML.listType == PE.ListTypes.checklist && isChecked(fromHTML, 0) && !isChecked(fromHTML, 1) && fromHTML.content.text == "Done\nNot done", "A checklist did not round-trip through HTML.")
  })

  test(section, "the document background color item writes and reads", t => {
    let editor = t.editor()
    let item = inspectorItem(editor, "backgroundcolor")
    t.assert(item, "The document inspector has no background color item.")
    if (!item) return
    t.assert(item.setValue(editor, PE.Colors.make(10, 20, 30)), "The document background color item could not write its property.")
    t.assert(PE.Colors.equals(item.value(editor), PE.Colors.make(10, 20, 30)), "The document background color item did not read back the color it wrote.")
  })

  skip(section, "inspector width and height for automatic sizes", "Sizes are set from the toolbar's width and height fields, checked by the dimension tests.")

  skip(section, "spelling marks outside edit mode", "Spelling is marked by the browser in editable text.")

  test(section, "links report their address and title", async t => {
    let editor = t.editor()
    editor.fromHTML(`<p>Visit <a href="https://graffitisuite.com" title="Home page">GraffitiSuite</a> now</p>`)
    let text = editor.nodeAt(0)
    t.assert(text.content.styleAt(9).linkURL == "https://graffitisuite.com" && text.content.styleAt(9).linkTitle == "Home page" && text.content.styleAt(1).linkURL == "", "A link did not keep its address and title.")
    await t.tick()
    let anchor = text.element.querySelector("a")
    t.assert(anchor && anchor.getAttribute("href") == "https://graffitisuite.com" && anchor.textContent == "GraffitiSuite", "A link was not drawn as a link at its text.")
    let table = t.editor()
    table.fromHTML(`<table><tbody><tr><td>First</td><td>See <a href="https://example.com/docs">the docs</a></td></tr></tbody></table>`)
    await t.tick()
    let tableNode = table.nodeAt(0)
    let tableAnchor = tableNode && tableNode.element ? tableNode.element.querySelector("a") : null
    t.assert(tableNode instanceof PE.TableNode && tableAnchor && tableAnchor.getAttribute("href") == "https://example.com/docs" && tableAnchor.textContent == "the docs", "A link in an inactive table cell was not drawn as a link.")
  })

  test(section, "image width modes and alignment", t => {
    let image = new PE.ImageNode()
    t.equal(image.alignment, PE.Alignments.automatic, "A new image did not use automatic alignment")
    image.displayWidth = 300
    image.displayHeight = 150
    image.imageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    t.assert(image.toHTML().indexOf("width:fit-content") >= 0, "Image HTML did not shrink its figure to the image: " + image.toHTML())
  })

  test(section, "dividers import from Markdown and round-trip", t => {
    let editor = t.editor()
    editor.fromMarkdown("Before\n\n---\n\n* * *\n\nAfter")
    t.assert(editor.lastNodeIndex == 3 && editor.nodeAt(1) instanceof PE.DividerNode && editor.nodeAt(2) instanceof PE.DividerNode, "Markdown thematic breaks did not import as dividers.")
    t.assert(editor.toMarkdown().indexOf("---") >= 0, "A default divider did not export as Markdown ---.")
    let styled = new PE.DividerNode()
    styled.lineThickness = 3
    styled.lineColor = PE.Colors.make(255, 0, 0)
    let restored = new PE.DividerNode()
    t.assert(restored.fromJSON(styled.toJSON()) && restored.lineThickness == 3 && PE.Colors.equals(restored.lineColor, PE.Colors.make(255, 0, 0)), "A divider did not round-trip through JSON.")
    t.assert(editor.cloneNode(styled).lineThickness == 3, "Duplicate did not copy a divider's line thickness.")
    let html = t.editor()
    html.fromHTML(styled.toHTML() + `<hr style="border-top:2px solid #00ff00">`)
    let first = html.nodeAt(0)
    let second = html.nodeAt(1)
    t.assert(first instanceof PE.DividerNode && first.lineThickness == 3 && first.lineColor.red == 255 && !first.borderTop.visible, "A divider did not round-trip through HTML.")
    t.assert(second instanceof PE.DividerNode && second.lineThickness == 2 && second.lineColor.green == 255 && !second.borderTop.visible, "A border-top rule did not import as the divider line.")
  })
}
