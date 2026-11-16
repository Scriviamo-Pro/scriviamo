// Text direction, fonts and sizes.
"use strict"
{
  const section = "Bidi"
  const mixedText = "abc שלום def"
  const hebrewText = "שלום 123"

  /** The on-screen box of one character of a node's text. */
  function charBox(node, index, hostIndex = 0) {
    let host = node.hosts()[hostIndex]
    let start = host.positionOf(index)
    let end = host.positionOf(index + 1)
    let range = document.createRange()
    range.setStart(start.node, start.offset)
    range.setEnd(end.node, end.offset)
    let rects = range.getClientRects()
    return rects.length ? rects[0] : range.getBoundingClientRect()
  }

  function originLeft(node) {
    return node.element.getBoundingClientRect().left
  }

  for (let name of ["FirstStrongLevel", "ResolvedLevels", "VisualOrder", "HasRightToLeft", "JoinsNeighbors", "EditingVisualNeighbor"]) {
    skip(section, `Bidi.${name}`, "Text layout and caret movement use the browser's bidirectional algorithm; there is no separate implementation to test.")
  }

  test(section, "right-to-left languages are recognized", t => {
    let editor = t.editor()
    t.assert(typeof PE.Utilities.isRightToLeftLanguage == "function" || typeof editor.isRightToLeftLanguage == "function", "There is no way to tell whether a language is written right to left (ar_SA, he-IL).")
  })

  test(section, "a Hebrew word in English text is drawn right to left", async t => {
    let editor = t.editor()
    let node = new PE.TextNode(mixedText)
    editor.addNode(node)
    await t.tick()
    t.assert(charBox(node, 4).left > charBox(node, 7).left && charBox(node, 8).left > charBox(node, 4).left, "A Hebrew word in English text was not drawn right to left.")
  })

  test(section, "a Hebrew paragraph starts at the right edge", async t => {
    let editor = t.editor()
    let node = new PE.TextNode(hebrewText)
    editor.addNode(node)
    await t.tick()
    let width = node.element.getBoundingClientRect().width
    t.assert(charBox(node, 0).right - originLeft(node) > width - 60 && charBox(node, 5).left < charBox(node, 0).left, "A Hebrew paragraph did not start at the right edge.")
  })

  test(section, "a right-to-left editor aligns English text right", async t => {
    let editor = t.editor()
    let node = new PE.TextNode("Hello")
    editor.addNode(node)
    editor.direction = PE.Directions.rightToLeft
    await t.tick()
    t.assert(charBox(node, 0).left - originLeft(node) > 400, "A right-to-left editor did not align English text to the right.")
  })

  test(section, "the editor's direction round-trips through JSON", t => {
    let source = t.editor()
    source.addNode(new PE.TextNode("Hello"))
    source.direction = PE.Directions.rightToLeft
    let loaded = t.editor()
    loaded.fromJSON(source.toJSON())
    t.assert(loaded.direction == PE.Directions.rightToLeft, "Loading a right-to-left document did not set the editor's direction.")
    source.direction = PE.Directions.automatic
    loaded.direction = PE.Directions.leftToRight
    loaded.fromJSON(source.toJSON())
    t.assert(loaded.direction == PE.Directions.leftToRight, "Loading an Automatic document changed the editor's direction.")
  })

  test(section, "a node's direction round-trips and exports", t => {
    let node = new PE.TextNode("Hello")
    node.direction = PE.Directions.rightToLeft
    let restored = new PE.TextNode("")
    t.assert(restored.fromJSON(node.toJSON()) && restored.direction == PE.Directions.rightToLeft, "A node's direction did not round-trip through JSON.")
    t.assert(node.toHTML().indexOf("direction:rtl") >= 0, "A node's direction was not exported to HTML: " + node.toHTML())
  })

  test(section, "a Hebrew list item is placed right to left", async t => {
    let editor = t.editor()
    let list = new PE.ListNode(hebrewText)
    editor.addNode(list)
    await t.tick()
    let width = list.element.getBoundingClientRect().width
    t.assert(charBox(list, 0).right - originLeft(list) > width - 140 && charBox(list, 3).left < charBox(list, 0).left, "A Hebrew list item was not placed right to left.")
  })

  test(section, "a right-to-left table puts its first column on the right", async t => {
    let editor = t.editor()
    let table = new PE.TableNode(1, 2)
    table.direction = PE.Directions.rightToLeft
    setText(table.cell(0, 0), hebrewText)
    editor.addNode(table)
    await t.tick()
    let cells = table.element.querySelectorAll("td, th")
    t.assert(cells.length >= 2 && cells[0].getBoundingClientRect().left > cells[1].getBoundingClientRect().left, "A right-to-left table did not put its first column on the right.")
    t.assert(charBox(table, 0).right > charBox(table, 3).right && charBox(table, 0).left - originLeft(table) > 300, "A Hebrew table cell was not placed right to left in its column.")
  })

  test(section, "a Hebrew caption is drawn right to left", async t => {
    let editor = t.editor()
    let image = new PE.ImageNode()
    image.caption = hebrewText
    // A caption is typed under the picture, so the image needs one.
    image.imageData = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    image.displayWidth = 400
    image.displayHeight = 40
    editor.addNode(image)
    await t.tick()
    let captionHost = image.hosts().findIndex(host => host.rich === image.captionText)
    t.assert(captionHost >= 0, "An image's caption has no text host.")
    if (captionHost >= 0) t.assert(charBox(image, 0, captionHost).left > charBox(image, 3, captionHost).left, "A Hebrew caption was not drawn right to left.")
  })

  test(section, "block alignment follows the direction", async t => {
    let editor = t.editor()
    editor.direction = PE.Directions.rightToLeft
    let image = new PE.ImageNode()
    image.displayWidth = 100
    image.displayHeight = 50
    image.imageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    editor.addNode(image)
    await t.tick()
    let figure = () => (image.element.querySelector("figure, img") || image.element).getBoundingClientRect()
    let container = image.element.getBoundingClientRect()
    t.assert(image.resolvedAlignment() == PE.Alignments.leading && container.right - figure().right < 10, "An Automatic block did not start at the right in a right-to-left editor.")
    image.alignment = PE.Alignments.trailing
    editor.refreshNode(image)
    await t.tick()
    t.assert(figure().left - image.element.getBoundingClientRect().left < 10, "A Trailing block was not placed at the left in a right-to-left editor.")
  })

  test(section, "text alignment follows the direction", async t => {
    let editor = t.editor()
    let node = new PE.TextNode(hebrewText)
    node.textAlignment = PE.Alignments.trailing
    editor.addNode(node)
    await t.tick()
    t.assert(charBox(node, 0).left - originLeft(node) < 200, "Trailing right-to-left text was not drawn at the left.")
    node.textAlignment = PE.Alignments.leading
    editor.refreshNode(node)
    await t.tick()
    t.assert(charBox(node, 0).left - originLeft(node) > 200, "Leading right-to-left text was not drawn at the right.")
  })

  test(section, "CSS left and right import as leading or trailing for the direction", t => {
    let editor = t.editor()
    editor.fromHTML(`<p dir="rtl" style="text-align:right">שלום</p><p style="text-align:right">Hello</p>`)
    let nodes = editor.nodes()
    t.assert(nodes.length == 2 && nodes[0].textAlignment == PE.Alignments.leading, "CSS right did not import as Leading in right-to-left text.")
    t.assert(nodes.length == 2 && nodes[1].textAlignment == PE.Alignments.trailing, "CSS right did not import as Trailing in left-to-right text.")
  })

  test(section, "HTML carries the document's direction", t => {
    let editor = t.editor()
    editor.addNode(new PE.TextNode("Hello"))
    editor.direction = PE.Directions.rightToLeft
    let html = editor.toHTML(true)
    t.assert(html.indexOf(`<html dir="rtl">`) >= 0, "A right-to-left document did not export dir=rtl.")
    let loaded = t.editor()
    loaded.fromHTML(html)
    t.assert(loaded.direction == PE.Directions.rightToLeft, "Loading right-to-left HTML did not set the editor's direction.")
    editor.direction = PE.Directions.automatic
    t.equal(editor.exportStylesheet().propertyValue("p, li, h1, h2, h3, h4, h5, h6, blockquote, figcaption, td, th, label, legend", "unicode-bidi"), "plaintext", "An Automatic document did not export per-paragraph direction")
  })

  test(section, "automatic fonts follow the document font", async t => {
    let editor = t.editor()
    let automatic = new PE.TextNode("Automatic font text")
    let explicit = new PE.TextNode("Explicit font text")
    explicit.fontName = "Courier"
    editor.addNode(automatic)
    editor.addNode(explicit)
    await t.tick()
    t.assert(automatic.content.styleAt(0).fontName == "" && editor.fontName == "System", "New text was not Automatic, resolving to the system font.")
    let systemWidth = charBox(automatic, 10).left
    editor.fontName = "Courier"
    await t.tick()
    t.assert(Math.abs(charBox(automatic, 10).left - systemWidth) > 0.5, "Automatic text did not redraw in the document font.")
    editor.fontName = "Georgia"
    await t.tick()
    t.assert(getComputedStyle(explicit.primaryHost.element).fontFamily.indexOf("Courier") >= 0, "Text with its own font followed the document font.")
    editor.fontName = ""
    t.equal(editor.fontName, "System", "An empty document font did not fall back to System")
  })

  test(section, "default sizes follow the document size", async t => {
    let editor = t.editor()
    let text = new PE.TextNode("Default size text")
    let heading = new PE.HeadingNode("Heading size", PE.HeadingLevels.heading1)
    editor.addNode(text)
    editor.addNode(heading)
    await t.tick()
    t.equal(editor.fontSize, 16, "A new document's size is not 16")
    t.assert(text.content.styleAt(0).fontSize == 0, "New text did not have the Default size.")
    let smallWidth = charBox(text, 10).left
    editor.fontSize = 24
    await t.tick()
    t.assert(charBox(text, 10).left > smallWidth + 5, "Default text did not follow the document size.")
    t.equal(parseFloat(getComputedStyle(heading.primaryHost.element).fontSize), 32, "A heading lost its own size")
  })

  test(section, "the font and size menus show the Default caption", t => {
    let editor = t.editor({strings: {TextDefault: "Standard"}})
    editor.addNode(new PE.TextNode("Plain"))
    editor.beginEditing(editor.nodeAt(0), 0)
    editor.updateToolbarState()
    t.equal(editor.toolbarItems.item("font").caption, "Standard", "The font menu didn't show the Default caption for the document font")
    t.equal(editor.toolbarItems.item("size").caption, "Standard", "The size menu didn't show the Default caption for the document size")
  })

  test(section, "small text keeps a proportionally small node", async t => {
    let editor = t.editor()
    let text = new PE.TextNode("Default size text")
    editor.addNode(text)
    editor.fontSize = 12
    await t.tick()
    let regular = text.element.getBoundingClientRect().height
    editor.fontSize = 4
    await t.tick()
    let small = text.element.getBoundingClientRect().height
    t.assert(small < 20 && small < regular / 2, `Small text kept a tall node: ${small} pixels (${regular} at 12).`)
  })

  test(section, "the document size round-trips", t => {
    let editor = t.editor()
    editor.addNode(new PE.TextNode("Text"))
    editor.fontSize = 24
    let loaded = t.editor()
    loaded.fromJSON(editor.toJSON())
    t.equal(loaded.fontSize, 24, "The document size did not round-trip through JSON")
    let html = t.editor()
    html.fromHTML(editor.toHTML(true))
    t.equal(html.fontSize, 24, "The document size did not round-trip through HTML")
  })

  test(section, "a version 3 document loads at 17 points", t => {
    let source = t.editor()
    let text = new PE.TextNode("Legacy")
    text.content.applyStyle(0, 6, style => style.bold = true)
    source.addNode(text)
    let documentData = JSON.parse(source.toJSON())
    documentData.version = 3
    delete documentData.fontSize
    documentData.nodes[0].fontSize = 17
    let legacy = t.editor()
    legacy.fromJSON(JSON.stringify(documentData))
    t.assert(legacy.fontSize == 17 && legacy.lastNodeIndex == 0, "A version 3 document did not load with a 17-point document size.")
    let loaded = legacy.nodeAt(0)
    t.assert(loaded instanceof PE.TextNode && loaded.fontSize == 0 && loaded.content.styleAt(0).fontSize == 0 && loaded.content.styleAt(0).bold, "A version 3 document's 17-point text did not become Default.")
  })

  test(section, "the document font round-trips", t => {
    let editor = t.editor()
    editor.addNode(new PE.TextNode("Text"))
    editor.fontName = "Georgia"
    let loaded = t.editor()
    loaded.fromJSON(editor.toJSON())
    t.equal(loaded.fontName, "Georgia", "The document font did not round-trip through JSON")
    let html = t.editor()
    html.fromHTML(editor.toHTML(true))
    t.assert(editor.exportStylesheet().propertyValue("body", "font-family").startsWith("'Georgia'") && html.fontName == "Georgia", "The document font did not round-trip through HTML: " + editor.exportStylesheet().propertyValue("body", "font-family"))
  })
}
