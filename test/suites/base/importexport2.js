// Suggestions, CSS output, backgrounds, media, sizes, corners, pasted HTML,
// colors, tables, toolbars and borders.
"use strict"
{
  const section = "Import and export"
  const gif = "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
  const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

  function people() {
    let provider = new PE.Suggestions.Provider("people", "@")
    provider.add("Ada")
    provider.add("ada")
    provider.add("Alan")
    provider.textColor = PE.Colors.make(185, 28, 28)
    provider.backgroundColor = PE.Colors.make(254, 226, 226)
    provider.borderColor = PE.Colors.make(252, 165, 165)
    return provider
  }

  function diagnostics() {
    let provider = new PE.Suggestions.Provider("diagnostics", ".")
    provider.add("Error", "Error diagnostic")
    provider.textColor = PE.Colors.make(185, 28, 28)
    provider.backgroundColor = PE.Colors.make(254, 226, 226)
    provider.borderColor = PE.Colors.make(252, 165, 165)
    return provider
  }

  function inspectorItem(node, identifier) {
    for (let section of node.inspectorSections()) {
      for (let item of section.items()) {
        if (item && item.identifier == identifier) return item
      }
    }
    return null
  }

  test(section, "suggestion providers match, filter and tag text", async t => {
    let editor = t.editor()
    let mentions = people()
    let dots = diagnostics()
    let commands = new PE.Suggestions.Provider("commands", "/")
    commands.add("help")
    editor.suggestionProviders.remove("emoji")
    editor.suggestionProviders.add(mentions)
    editor.suggestionProviders.add(dots)
    editor.suggestionProviders.add(commands)
    t.assert(editor.suggestionProviders.lastIndex == 2 && editor.suggestionProviders.itemAt(0) === mentions && editor.suggestionProviders.item("commands") === commands, "Editor did not retain multiple suggestion providers.")

    let embedded = new PE.TextNode("Hello @Ada and .Error")
    editor.addNode(embedded)
    t.assert(embedded.content.styleAt(6).suggestionProviderIdentifier == "people" && embedded.content.styleAt(15).suggestionProviderIdentifier == "diagnostics", "Adding a node did not convert exact embedded suggestion values into tags.")

    let request = mentions.match("@Ad", 3, null)
    t.assert(request && request.trigger == "@" && request.query == "Ad" && request.startPosition == 0 && request.length == 3, "The provider did not describe a matched trigger.")
    let filtered = request ? await mentions.suggestions(request) : []
    t.equal(filtered.length, 1, "The provider did not filter or de-duplicate its choices")
    if (filtered.length == 1) t.assert(filtered[0].caption == "Ada" && filtered[0].insertText == "@Ada", "The provider returned the wrong choice.")
    t.assert(mentions.lastIndex == 1 && mentions.indexOf("Ada") == 0 && mentions.indexOf(mentions.lookup("Ada")) == 0 && mentions.lookup("missing") == null, `The provider's lookup methods returned incorrect results (${mentions.lastIndex}).`)
    mentions.add("Grace")
    mentions.removeAt(mentions.indexOf("Grace"))
    mentions.removeAt(100)
    t.assert(mentions.lastIndex == 1 && mentions.lookup("Grace") == null, "The provider did not remove a suggestion safely.")

    let remote = new PE.Suggestions.Provider("remote", "$")
    remote.add("Fallback")
    let fallback = await remote.suggestions(remote.match("$Fall", 5, null))
    t.assert(fallback.length == 1 && fallback[0].caption == "Fallback", "The provider did not return an explicitly added suggestion.")

    let dotRequest = dots.match(".Err", 4, null)
    let dotChoices = dotRequest ? await dots.suggestions(dotRequest) : []
    t.assert(dotRequest && dotRequest.trigger == "." && dotChoices.length == 1 && dotChoices[0].caption == "Error diagnostic", "The provider did not support a custom dot trigger.")
    if (dotRequest && dotChoices.length == 1) {
      let target = new PE.TextNode(".Err")
      editor.addNode(target)
      await t.tick()
      let caret = dots.commitSuggestion(target.primaryHost, dotRequest, dotChoices[0], new PE.TextStyle())
      let tag = target.content.styleAt(0)
      t.assert(target.toPlainText() == ".Error" && caret == 6 && tag.suggestionProviderIdentifier == "diagnostics" && tag.suggestionIdentifier == "Error" && PE.Colors.equals(tag.suggestionTextColor, PE.Colors.make(185, 28, 28)) && PE.Colors.equals(tag.suggestionBackgroundColor, PE.Colors.make(254, 226, 226)) && PE.Colors.equals(tag.suggestionBorderColor, PE.Colors.make(252, 165, 165)), "The provider did not apply tag metadata and colors.")
      let restored = PE.RichText.fromJSON(target.content.toJSON())
      t.assert(restored.length == 6 && restored.styleAt(0).suggestionProviderIdentifier == "diagnostics" && restored.styleAt(0).suggestionIdentifier == "Error", "Suggestion tag metadata did not survive JSON.")
      let html = target.content.htmlText()
      t.assert(html.indexOf(`data-scriviamo-suggestion-provider="diagnostics"`) >= 0 && html.indexOf(`data-scriviamo-suggestion-id="Error"`) >= 0, "Suggestion tag metadata was omitted from HTML: " + html)
      let fromHTML = t.editor()
      fromHTML.fromHTML(`<p>${html}</p>`)
      let imported = fromHTML.nodeAt(0)
      t.assert(imported && imported.content.styleAt(0).suggestionProviderIdentifier == "diagnostics" && imported.content.styleAt(0).suggestionIdentifier == "Error", "Suggestion tag metadata did not survive HTML import.")
      let markdown = target.content.markdownText()
      t.assert(markdown.indexOf(`data-scriviamo-suggestion-provider="diagnostics"`) >= 0 && markdown.indexOf(`data-scriviamo-suggestion-id="Error"`) >= 0, "Suggestion tag metadata was omitted from Markdown: " + markdown)
      let fromMarkdown = t.editor()
      fromMarkdown.fromMarkdown(markdown)
      let markdownText = fromMarkdown.nodeAt(0)
      t.assert(markdownText && markdownText.content.styleAt(0).suggestionProviderIdentifier == "diagnostics" && markdownText.content.styleAt(0).suggestionIdentifier == "Error", "Suggestion tag metadata did not survive Markdown import.")
    }

    let own = new PE.Suggestions.Provider()
    embedded.suggestionProvider = own
    t.assert(embedded.suggestionProvider === own, "A node-specific suggestion provider was not kept.")
    if (request && filtered.length == 1) {
      let mention = new PE.TextNode("@Ad")
      editor.addNode(mention)
      await t.tick()
      let italic = new PE.TextStyle()
      italic.italic = true
      let caret = mentions.commitSuggestion(mention.primaryHost, request, filtered[0], italic)
      t.assert(mention.toPlainText() == "@Ada" && caret == 4 && mention.content.styleAt(0).italic, "The provider did not apply its insertion and the typing style.")
    }
  })

  test(section, "fonts and line heights in HTML", t => {
    let source = new PE.TextNode("Round trip")
    t.assert(source.content.styleAt(0).htmlCSS().indexOf("font-family") < 0, "Automatic text exported its own font family.")
    let system = new PE.TextStyle()
    system.fontName = "System"
    t.assert(system.htmlCSS().indexOf("font-family:sans-serif") >= 0, "The System font did not export as the generic CSS sans-serif family: " + system.htmlCSS())
    t.assert(new PE.TextNode("Default lines").toHTML().indexOf("line-height") < 0 && new PE.HeadingNode("Default heading").toHTML().indexOf("line-height") < 0, "HTML wrote the default line height.")
    source.lineHeight = 1.5
    source.lineSpacing = 4
    t.assert(source.toHTML().indexOf("line-height:calc(") >= 0 && source.toHTML().indexOf("em + 4px);") >= 0, "HTML omitted a changed line height: " + source.toHTML())
  })

  test(section, "a changed line height round-trips through HTML", t => {
    let spaced = new PE.TextNode("Spaced lines")
    spaced.lineHeight = 1.5
    let html = spaced.toHTML()
    let editor = t.editor()
    editor.fromHTML(html)
    let imported = editor.nodeAt(0)
    t.assert(html.indexOf("line-height:1.5;") < 0 && imported && Math.abs(imported.lineHeight - 1.5) < 0.01 && imported.lineSpacing == 0, `A changed line height did not round-trip through HTML relative to the normal line height (${html}, ${imported && imported.lineHeight}).`)
  })

  test(section, "node and text alignment and background images are independent", t => {
    let source = new PE.TextNode("Round trip")
    source.lineHeight = 1.5
    source.alignment = PE.Alignments.middle
    source.textAlignment = PE.Alignments.leading
    let background = new PE.BackgroundImage()
    background.source = "data:image/gif;base64," + gif
    background.fill = PE.BackgroundFills.fit
    background.repeat = PE.BackgroundRepeats.repeatX
    source.backgroundImage = background
    let restored = new PE.TextNode("")
    t.assert(restored.fromJSON(source.toJSON()), "Text JSON could not be loaded.")
    t.equal(restored.toPlainText(), source.toPlainText(), "Text JSON changed its content")
    t.equal(restored.lineHeight, source.lineHeight, "Text JSON changed line height")
    t.equal(restored.alignment, PE.Alignments.middle, "Text JSON changed node alignment")
    t.equal(restored.textAlignment, PE.Alignments.leading, "Text JSON changed internal text alignment")
    t.equal(restored.resolvedTextAlignment(), PE.Alignments.leading, "Node placement affected internal text alignment")
    t.assert(restored.toHTML().indexOf("margin-left:auto;margin-right:auto;") >= 0 && restored.toHTML().indexOf("text-align:start;") >= 0, "Text HTML did not keep node and text alignment independent: " + restored.toHTML())
    t.assert(!restored.backgroundImage.isEmpty, "Text JSON did not restore its background image.")
    t.assert(restored.backgroundImage.fill == background.fill && restored.backgroundImage.repeat == background.repeat, "Text JSON changed background image settings.")
    t.assert(source.toMarkdown().indexOf("background-image:url") >= 0 && source.toMarkdown().indexOf("data:image/gif;base64,") >= 0 && source.toMarkdown().indexOf("Round trip") >= 0 && source.toMarkdown().indexOf("<p") < 0, "Node Markdown did not mix its Markdown content with the background-image wrapper: " + source.toMarkdown())
  })

  test(section, "in-memory pictures export as data URIs", t => {
    let image = new PE.ImageNode()
    image.imageData = png
    t.assert(image.toHTML().indexOf(`src="data:image/png;base64,`) >= 0, "Image HTML did not embed its picture: " + image.toHTML().slice(0, 200))
    t.assert(image.toMarkdown().indexOf("](data:image/png;base64,") >= 0, "Image Markdown did not embed its picture.")
    let background = new PE.BackgroundImage()
    background.source = "data:image/png;base64," + png
    t.assert(background.toCSS().indexOf("url('data:image/png;base64,") >= 0, "Background-image CSS did not produce an attribute-safe URL: " + background.toCSS())
    image.imageData = ""
    image.sourceURL = "https://example.com/image.png"
    t.assert(image.toHTML().indexOf("https://example.com/image.png") >= 0, "Image HTML did not preserve its URL source.")
  })

  test(section, "document backgrounds export and import", t => {
    let editor = t.editor()
    editor.backgroundColor = PE.Colors.make(241, 245, 249)
    let background = new PE.BackgroundImage()
    background.source = "data:image/png;base64," + png
    editor.backgroundImage = background
    editor.addNode(new PE.TextNode("Background document"))
    t.assert(editor.toHTML(true).indexOf("background-color:rgba(241,245,249,1)") >= 0, "Document HTML omitted its background color.")
    t.assert(editor.toMarkdown().indexOf("background-color:rgba(241,245,249,1)") >= 0, "Document Markdown omitted its background color.")
    t.assert(editor.toMarkdown().indexOf("background-image:url") >= 0 && editor.toMarkdown().indexOf("data:image/png;base64,") >= 0, "Document Markdown discarded its background image.")
    let json = t.editor()
    json.fromJSON(editor.toJSON())
    t.assert(PE.Colors.equals(json.backgroundColor, PE.Colors.make(241, 245, 249)), "Document JSON changed its background color.")
    let html = t.editor()
    html.fromHTML(editor.toHTML(true))
    t.assert(PE.Colors.equals(html.backgroundColor, PE.Colors.make(241, 245, 249)), "Document HTML import changed its background color.")
    editor.addNode(new PE.HeadingNode("Styled heading", PE.HeadingLevels.heading2))
    let sheet = editor.exportStylesheet()
    t.assert(sheet.propertyValue("h1, h2, h3, h4, h5, h6", "width") == "100%" && sheet.propertyValue("h1, h2, h3, h4, h5, h6", "padding") == "16px" && sheet.propertyValue("h1, h2, h3, h4, h5, h6", "overflow-wrap") == "anywhere", "The exported heading geometry did not match the editor's padded bounds.")
    let sections = PE.InspectorDefaults.document(editor)
    let documentSection = sections.find(item => item.identifier == "document")
    t.assert(documentSection && documentSection.item("backgroundcolor"), "The document inspector omitted its background-color control.")
    let documentBackground = sections.find(item => item.identifier == "backgroundimage")
    t.assert(documentBackground && documentBackground.lastIndex == 4, "The document inspector omitted background-image controls.")
    let nodeBackground = new PE.TextNode("x").inspectorSections().find(item => item.identifier == "backgroundimage")
    t.assert(nodeBackground && nodeBackground.lastIndex == 4, "The node inspector omitted background-image controls.")
  })

  test(section, "natural and explicit sizes in JSON", async t => {
    let editor = t.editor()
    let natural = new PE.TextNode("Natural size")
    editor.addNode(natural)
    await t.tick()
    let json = natural.toJSON()
    t.assert(!("width" in json) && !("height" in json), "Text JSON wrote a natural size as width and height.")
    let fixed = new PE.TextNode("Fixed width")
    fixed.width = 300
    let fixedJSON = fixed.toJSON()
    t.assert("width" in fixedJSON && !("height" in fixedJSON), "Text JSON did not write only its explicit width.")
    let restored = new PE.TextNode("")
    t.assert(restored.fromJSON(fixedJSON) && restored.width == 300 && restored.height == 0, "Fixed-width text did not restore a fixed width with a natural height.")
    let legacy = Object.assign({}, json, {width: 320, height: 140})
    let legacyNode = new PE.TextNode("")
    t.assert(legacyNode.fromJSON(legacy) && legacyNode.width == 320 && legacyNode.height == 140, "Text JSON width and height were not restored.")
    let empty = new PE.ImageNode()
    let restoredEmpty = new PE.ImageNode()
    t.assert(restoredEmpty.fromJSON(empty.toJSON()) && restoredEmpty.width == 0 && restoredEmpty.height == 0, "A natural-size image gained an explicit size through JSON.")
  })

  test(section, "corner radii round-trip and export", t => {
    let editor = t.editor()
    let rounded = new PE.TextNode("Rounded")
    rounded.borderTopLeftRadius = 4
    rounded.borderTopRightRadius = 8
    rounded.borderBottomRightRadius = 12
    rounded.borderBottomLeftRadius = 16
    let square = new PE.TextNode("Square")
    t.assert(!square.hasCornerRadius && rounded.hasCornerRadius, "Corner radius reporting was wrong.")
    let restored = new PE.TextNode("")
    t.assert(restored.fromJSON(rounded.toJSON()) && restored.borderTopLeftRadius == 4 && restored.borderTopRightRadius == 8 && restored.borderBottomRightRadius == 12 && restored.borderBottomLeftRadius == 16, "Corner radii did not round-trip through JSON.")
    let copy = editor.cloneNode(rounded)
    t.assert(copy && copy.borderTopLeftRadius == 4 && copy.borderBottomLeftRadius == 16, "Duplicate did not copy corner radii.")
    t.assert(rounded.toHTML().indexOf("border-radius:4px 8px 12px 16px;") >= 0, "HTML export did not write per-corner radii: " + rounded.toHTML())
    let uniform = new PE.TextNode("Uniform")
    uniform.borderTopLeftRadius = uniform.borderTopRightRadius = uniform.borderBottomRightRadius = uniform.borderBottomLeftRadius = 6
    t.assert(uniform.toHTML().indexOf("border-radius:6px;") >= 0, "HTML export did not collapse equal radii.")
    t.assert(square.toHTML().indexOf("border-radius") < 0, "HTML export wrote a radius for a square node.")
    let imported = t.editor()
    imported.fromHTML(`<p style="border-radius:3px 9px;border-bottom-left-radius:5px 2px">Radius</p>`)
    let node = imported.nodeAt(0)
    t.assert(node && node.borderTopLeftRadius == 3 && node.borderTopRightRadius == 9 && node.borderBottomRightRadius == 3 && node.borderBottomLeftRadius == 5, "HTML import did not apply border-radius values.")
    imported.fromHTML(rounded.toHTML())
    node = imported.nodeAt(0)
    t.assert(node && node.borderTopRightRadius == 8 && node.borderBottomLeftRadius == 16, "Corner radii did not round-trip through HTML.")
  })

  test(section, "HTML text and entities import", t => {
    let editor = t.editor()
    editor.fromHTML("<p><strong>HTML</strong> round trip</p>")
    t.assert(editor.lastNodeIndex == 0 && editor.nodeAt(0).toPlainText() == "HTML round trip", "Text HTML changed its content.")
    editor.fromHTML(`<p title="single: &#39;; double: &quot;; emoji: &#x1F600;">&lt;tag&gt; &amp; &#39;quoted&#39; &quot;text&quot; &#128512; &amp;lt;</p>`)
    t.equal(editor.nodeAt(0).toPlainText(), `<tag> & 'quoted' "text" 😀 &lt;`, "HTML text entities were not decoded correctly")
  })

  test(section, "pasted invoice HTML keeps its tables, image and links", t => {
    let editor = t.editor()
    editor.insertHTML(InvoiceHTML)
    let tables = editor.nodes().filter(node => node instanceof PE.TableNode)
    t.equal(tables.length, 4, "HTML insertion did not restore all four tables")
    let image = null
    for (let table of tables) for (let child of table.descendants()) if (child instanceof PE.ImageNode) image = child
    t.assert(image && image.hasImage, "HTML insertion did not restore its nested data-URI image.")
    if (image) t.assert(image.caption == "" && Math.abs(image.displayWidth - 50) < 0.001 && Math.abs(image.displayHeight - 50) < 0.001, `Image metadata did not restore empty alternate text and original dimensions (${image.displayWidth}×${image.displayHeight}).`)
    if (tables.length >= 2) {
      t.assert(tables[1].rows == 6 && tables[1].columns == 2 && tables[1].cell(2, 1).text.trim() == "DATE", `Row spans did not keep content in the right column (${tables[1].rows}×${tables[1].columns}, ${JSON.stringify(tables[1].cell(2, 1).text)}).`)
      t.assert(tables[1].descendants().length == 0, "Text wrappers were imported as child nodes instead of direct cell text.")
    }
    if (tables.length > 0) {
      t.assert(tables[0].cell(0, 1).text.indexOf("\n\n") < 0, "Formatting whitespace created blank lines inside a table cell.")
      t.equal(tables[0].cell(0, 1).textAlignment, PE.Alignments.trailing, "Nested cell content did not keep its horizontal alignment")
    }
    let html = editor.toHTML()
    t.assert(html.indexOf("INVOICE") >= 0 && html.indexOf("ITM-003") >= 0 && html.indexOf("$711.49") >= 0, "HTML insertion discarded invoice text.")
    t.assert(html.indexOf("data:image/png;base64,") >= 0, "HTML export discarded its embedded image.")
    t.assert(html.indexOf(`href="https://graffitisuite.com/"`) >= 0 && html.indexOf(`target="_blank"`) >= 0, "HTML insertion discarded hyperlink attributes.")
    t.assert(editor.toMarkdown().indexOf(`target="_blank"`) >= 0, "Markdown export discarded hyperlink target metadata.")
  })

  test(section, "CSS colors keep every channel", t => {
    let source = PE.Colors.make(12, 34, 56, 128)
    let css = PE.Colors.toCSS(source)
    t.assert(css.startsWith("rgba(12,34,56,"), "CSS color export did not use rgba(): " + css)
    let restored = PE.Colors.fromCSS(css)
    t.assert(restored && restored.red == 12 && restored.green == 34 && restored.blue == 56 && Math.abs(restored.alpha - 128) <= 1, "CSS color conversion changed RGBA data: " + JSON.stringify(restored))
    let shorthand = PE.Colors.fromCSS("6px solid " + css)
    t.assert(shorthand && shorthand.red == 12 && Math.abs(shorthand.alpha - 128) <= 1, "An rgba() color in a CSS shorthand could not be parsed.")
    let percentage = PE.Colors.fromCSS("rgba(100%,50%,0%,25%)")
    t.assert(percentage && percentage.red == 255 && Math.abs(percentage.green - 128) <= 1 && percentage.blue == 0 && Math.abs(percentage.alpha - 191) <= 1, "Percentage-based rgba() produced incorrect channels: " + JSON.stringify(percentage))
  })

  test(section, "Markdown import and export", t => {
    t.assert(PE.MarkdownConverter.toHTML("## Heading").indexOf("<h2>") >= 0, "Markdown heading conversion failed.")
    let editor = t.editor()
    editor.fromMarkdown("## Imported heading\n\nImported paragraph")
    t.assert(editor.toPlainText().indexOf("Imported heading") >= 0 && editor.toPlainText().indexOf("Imported paragraph") >= 0, "FromMarkdown did not replace the document.")
    t.assert(editor.toMarkdown().indexOf("## Imported heading") >= 0, "ToMarkdown did not export the imported heading.")
  })

  test(section, "HTML import replaces or inserts as one change", t => {
    let editor = t.editor()
    editor.addNode(new PE.TextNode("Preserve this document"))
    let state = editor.toJSON()
    editor.fromHTML("<script>unsupported()</script>")
    t.equal(editor.toJSON(), state, "FromHTML discarded the document when the replacement had no supported nodes")
    let start = editor.lastNodeIndex
    editor.insertHTML("<p>First imported node</p><p>Second imported node</p>")
    t.equal(editor.lastNodeIndex, start + 2, "InsertHTML did not insert a multi-node fragment")
  })

  test(section, "dropped addresses go to the matching media type", t => {
    t.assert(typeof PE.ImageNode.droppedTextImportPriority == "function" || typeof PE.Node.importDroppedText == "function", "There is no way for node types to claim dropped or pasted addresses (image, audio, video URLs).")
  })

  test(section, "the heading toolbar item inserts each level", t => {
    let editor = t.editor()
    let item = editor.toolbarItems.item("node:heading") || editor.toolbarItems.items().find(entry => entry.identifier == "node:heading")
    t.assert(item && item.kind == PE.ToolbarItemKinds.menu && item.menuItems.length == 6, "The Heading toolbar item did not provide all six levels.")
    if (item && item.menuItems.length == 6) {
      editor.activateToolbarItem("node:heading", item.menuItems[0])
      t.assert(editor.toMarkdown().indexOf("# Heading") >= 0, "The Heading toolbar menu did not insert its level: " + editor.toMarkdown())
    }
  })

  test(section, "the heading inspector edits level and text", t => {
    let heading = new PE.HeadingNode("Inspectable", PE.HeadingLevels.heading2)
    let level = inspectorItem(heading, "level")
    let text = inspectorItem(heading, "text")
    t.assert(level && level.lastChoiceIndex == 5, "The heading inspector did not offer all heading levels.")
    if (level) t.assert(level.setValue(heading, PE.HeadingLevels.heading4) && heading.level == PE.HeadingLevels.heading4, "The inspector did not set the heading level.")
    t.assert(text && text.setValue(heading, "Changed through inspector") && heading.text == "Changed through inspector", "The inspector did not update heading text.")
    heading.content.applyStyle(0, heading.content.length, style => style.fontSize = 21)
    t.assert(Math.abs(heading.content.styleAt(0).fontSize - 21) < 0.001, "Text changed through the inspector could not be styled.")
    t.assert(inspectorHasItem(new PE.ListNode(), "listtype") && inspectorHasItem(new PE.CodeBlockNode(), "tabwidth"), "The inspector omitted list type or code-block settings.")
  })

  test(section, "every node type has a Corners section", t => {
    // Every type whose package is loaded.
    let nodes = ["TextNode", "HeadingNode", "QuoteNode", "AlertNode", "ListNode", "CodeBlockNode", "ImageNode", "AudioNode", "VideoNode", "TableNode", "ColumnsNode", "FormNode", "TextFieldNode"].filter(name => PE[name]).map(name => new PE[name]())
    for (let node of nodes) {
      let all = ["bordertopleftradius", "bordertoprightradius", "borderbottomrightradius", "borderbottomleftradius"].every(identifier => inspectorHasItem(node, identifier))
      t.assert(all && inspectorHasSection(node, "corners"), `The ${node.typeName} inspector omitted the Corners section or its radius controls.`)
      let borders = node.inspectorSections().find(section => section.identifier == "borders")
      if (borders) t.assert(!borders.items().some(item => item.identifier.endsWith("radius")), `The ${node.typeName} inspector listed corner radii under Borders.`)
    }
  })

  test(section, "removing nodes and history", t => {
    let editor = t.editor()
    editor.addNode(new PE.TextNode("First"))
    editor.addNode(new PE.TextNode("Second"))
    editor.addNode(new PE.TextNode("Third"))
    editor.removeNodeAt(1)
    t.assert(editor.lastNodeIndex == 1 && editor.nodeAt(1).toPlainText() == "Third", "RemoveNodeAt did not delete the requested index.")
    editor.removeNode(editor.nodeAt(0))
    t.assert(editor.lastNodeIndex == 0 && editor.nodeAt(0).toPlainText() == "Third", "RemoveNode did not delete the node.")
    editor.removeAllNodes()
    t.assert(editor.lastNodeIndex == -1 && editor.selection.node == null, "RemoveAllNodes did not clear the document and selection.")
    editor.addNode(new PE.TextNode("History reset"))
    editor.selection.selectNode(editor.nodeAt(0))
    editor.history.reset()
    t.assert(editor.lastNodeIndex == 0 && editor.selection.node != null, "History.Reset changed the document or selection.")
    t.assert(!editor.history.canUndo && !editor.history.canRedo && editor.history.undoCount == 0, "History.Reset left undo or redo steps.")
    editor.removeNodeAt(0)
    t.assert(editor.history.canUndo && editor.history.undoCount == 1, `Deleting a node did not record one undo step (${editor.history.undoCount}).`)
    editor.history.undo()
    t.assert(editor.lastNodeIndex == 0 && editor.history.canRedo && !editor.history.canUndo, "Undo did not restore the deleted node.")
    editor.history.redo()
    t.assert(editor.lastNodeIndex == -1 && editor.history.canUndo && editor.history.redoCount == 0, "Redo did not delete the node again.")
    editor.readOnly = true
    editor.history.undo()
    t.assert(!editor.history.canUndo && editor.lastNodeIndex == -1, "Undo changed a read-only editor.")
  })

  skip(section, "arrow navigation and cell selection in tables", "Cells are edited in the page and moved between with the browser's focus; there is no active-cell or cell-selection API.")

  test(section, "merging and splitting table cells", t => {
    let table = new PE.TableNode(3, 3)
    table.hasHeader = false
    setText(table.cell(0, 0), "A")
    setText(table.cell(0, 1), "B")
    setText(table.cell(1, 0), "C")
    t.assert(typeof table.mergeCells == "function", "There is no rectangle merge; cells merge one neighbour at a time (mergeCell).")
    // Merge each row's first two cells, then the two merged cells.
    table.mergeCell(0, false)
    table.mergeCell(3, false)
    table.mergeCell(0, true)
    t.assert(table.cell(0, 0).rowSpan == 2 && table.cell(0, 0).columnSpan == 2, `Merging did not span two rows and two columns (${table.cell(0, 0).rowSpan}×${table.cell(0, 0).columnSpan}).`)
    t.equal(table.cell(0, 0).text, "A B C", "Merged cells did not combine their content")
    let html = table.toHTML()
    t.assert(html.indexOf(`colspan="2"`) >= 0 && html.indexOf(`rowspan="2"`) >= 0, "Table HTML omitted merged-cell spans.")
    let restored = new PE.TableNode(1, 1)
    t.assert(restored.fromJSON(table.toJSON()) && restored.cell(0, 0).rowSpan == 2 && restored.cell(0, 0).columnSpan == 2, "Merged table cells did not survive JSON.")
    let editor = t.editor()
    editor.fromHTML(html)
    let imported = editor.nodeAt(0)
    t.assert(imported instanceof PE.TableNode && imported.columns == 3 && imported.cell(0, 0).rowSpan == 2 && imported.cell(0, 0).columnSpan == 2, "Merged table cells did not survive HTML.")
    table.splitCell(0)
    t.assert(table.cell(0, 0).rowSpan == 1 && table.cell(0, 0).columnSpan == 1, "Splitting did not split the merged cell.")
  })

  test(section, "removing a merged cell's first row keeps its content", t => {
    let table = new PE.TableNode(3, 2)
    table.hasHeader = false
    setText(table.cell(0, 0), "Top")
    setText(table.cell(1, 0), "Bottom")
    table.mergeCell(0, true)
    table.removeRow(0)
    t.assert(table.rows == 2 && table.cell(0, 0).rowSpan == 1 && table.cell(0, 0).text == "Top Bottom", `Removing a merged cell's first row lost its content or span (${JSON.stringify(table.cell(0, 0).text)}).`)
  })

  test(section, "new columns and rows match their neighbours", t => {
    // The constructor makes empty cells; give the table the bold header row a new table starts with.
    let widened = new PE.TableNode(3, 2)
    widened.hasHeader = true
    for (let column = 0; column < 2; column++) {
      setText(widened.cell(0, column), `Heading ${column + 1}`)
      widened.cell(0, column).applyStyle(0, widened.cell(0, column).length, style => style.bold = true)
    }
    widened.hasFooter = true
    setText(widened.cell(2, 1), "x")
    widened.cell(2, 1).applyStyle(0, 1, style => style.italic = true)
    widened.cell(2, 1).textAlignment = PE.Alignments.middle
    widened.insertColumn(2)
    t.assert(widened.cell(0, 2).text == "Heading 3" && widened.cell(0, 2).styleAt(0).bold, "A new header cell was not styled like its row.")
    t.assert(widened.cell(2, 2).insertionStyleAt(0).italic && widened.cell(2, 2).textAlignment == PE.Alignments.middle, "A new footer cell was not styled like its row.")
    let lengthened = new PE.TableNode(3, 2)
    lengthened.hasFooter = true
    setText(lengthened.cell(2, 0), "Total")
    setText(lengthened.cell(1, 0), "x")
    lengthened.cell(1, 0).applyStyle(0, 1, style => style.italic = true)
    lengthened.insertRow(2)
    t.assert(lengthened.rows == 4 && lengthened.cell(3, 0).text == "Total", "Adding a row did not keep the footer last.")
    t.assert(lengthened.cell(2, 0).insertionStyleAt(0).italic && !lengthened.cell(2, 0).insertionStyleAt(0).bold, "A new row was not styled like the body row above it.")
  })

  test(section, "table insertion sizes", t => {
    let editor = t.editor()
    let item = editor.toolbarItems.items().find(entry => entry.identifier == "node:table")
    t.assert(item, "There is no table toolbar item.")
    let table = editor.insertNodeOfType("table")
    t.assert(table instanceof PE.TableNode && table.rows == 3 && table.columns == 3, `A table inserted without a size was not 3 × 3 (${table && table.rows}×${table && table.columns}).`)
  })

  skip(section, "table size picker, grid and list pickers", "Choosers are page popups driven by the browser's keyboard and pointer events, not picker objects with their own key and pointer handlers.")

  test(section, "toolbar state saves, loads and resets", t => {
    let editor = t.editor()
    let saved = editor.saveToolbarState()
    editor.toolbarDisplayMode = PE.ToolbarDisplayModes.iconAndText
    let changed = editor.saveToolbarState()
    t.assert(editor.loadToolbarState(saved) && editor.toolbarDisplayMode == PE.ToolbarDisplayModes.iconOnly, "Loading a saved toolbar state did not restore it.")
    t.assert(editor.loadToolbarState(changed) && editor.toolbarDisplayMode == PE.ToolbarDisplayModes.iconAndText, "Loading a changed toolbar state did not apply it.")
    editor.resetToolbar()
    t.equal(editor.toolbarDisplayMode, PE.ToolbarDisplayModes.iconOnly, "ResetToolbar did not restore the default display mode")
    t.assert(editor.loadToolbarState(`{"version":1,"contextual":[{"type":3,"items":["insert","no-such-item","separator","separator","search"]}]}`), "A desktop toolbar state with unknown items did not load.")
  })

  skip(section, "contextual toolbar layout, overflow and classic style", "The toolbar is laid out by the page's CSS; there is no toolbar style setting or computed layout list.")
  skip(section, "toolbar panels preview hovered choices", "Panels are page popups; hover previews are not part of this implementation.")

  test(section, "command search inserts node types", async t => {
    let editor = t.editor()
    editor.showCommandSearch()
    await t.tick()
    let popup = PE.Popup.current
    t.assert(popup && popup.isOpen, "ShowCommandSearch did not open command search.")
    if (popup) popup.close()
  })

  test(section, "the insertion chooser inserts the chosen type", async t => {
    let editor = t.editor()
    editor.showInsertionChooser(new DOMRect(10, 10, 20, 20))
    await t.tick()
    let popup = PE.Popup.current
    t.assert(popup instanceof PE.InsertionChooser && popup.isOpen, "ShowInsertionChooser did not open the chooser.")
    if (popup) popup.close()
    t.equal(editor.lastNodeIndex, -1, "Closing the insertion chooser inserted a node")
  })

  test(section, "cell and node borders round-trip", t => {
    let table = new PE.TableNode(2, 2)
    setText(table.cell(1, 1), "Stored")
    table.cell(0, 0).cellBorderLeft = {visible: true, size: 2.5, color: PE.Colors.make(17, 34, 51)}
    let restored = new PE.TableNode(1, 1)
    t.assert(restored.fromJSON(table.toJSON()), "Table JSON could not be loaded.")
    t.equal(restored.cell(1, 1).text, "Stored", "Table JSON changed cell content")
    let border = restored.cell(0, 0).cellBorderLeft
    t.assert(border.visible && border.size == 2.5 && border.color.red == 17, "Table JSON changed cell border properties.")
    t.assert(table.toHTML().indexOf("border-left:2.5px solid rgba(17,34,51,1)") >= 0, "Table HTML omitted an explicit cell border.")
    let editor = t.editor()
    editor.fromHTML(`<table><tbody><tr><td style="border-right:6px solid #778899">Imported cell</td></tr></tbody></table>`)
    let imported = editor.nodeAt(0)
    let right = imported && imported.cell ? imported.cell(0, 0).cellBorderRight : null
    t.assert(right && right.visible && right.size == 6 && right.color.green == 136, "Table HTML changed imported cell border properties.")

    let text = new PE.TextNode("Bordered")
    text.borderTop = {visible: true, size: 3.5, color: PE.Colors.make(12, 34, 56)}
    text.borderRight = {visible: true, size: 2, color: PE.Colors.make(78, 90, 123)}
    let restoredText = new PE.TextNode()
    t.assert(restoredText.fromJSON(text.toJSON()) && restoredText.borderTop.visible && restoredText.borderTop.size == 3.5 && restoredText.borderTop.color.red == 12 && restoredText.borderRight.visible && restoredText.borderRight.color.blue == 123, "Node JSON changed border properties.")
    t.assert(text.toHTML().indexOf("border-top:3.5px solid rgba(12,34,56,1)") >= 0, "Node HTML omitted an explicit border: " + text.toHTML())
    t.assert(text.toMarkdown().indexOf("border-top:3.5px solid rgba(12,34,56,1)") >= 0, "Node Markdown omitted an explicit border.")
    editor.fromHTML(`<p style="border-bottom:4px solid #445566;border-left:none">Imported border</p>`)
    let node = editor.nodeAt(0)
    t.assert(node && node.borderBottom.visible && node.borderBottom.size == 4 && node.borderBottom.color.red == 68 && !node.borderLeft.visible, "Node HTML changed imported border properties.")
  })
}

{
  // Without the math add-on, $$ blocks stay as code in the "math" language.
  test("Import and export", "Markdown $$ blocks are kept as math code without the math add-on", t => {
    if (PE.MathNode) return
    let editor = t.editor()
    editor.fromMarkdown("$$\nx^2\n$$")
    let node = editor.nodeAt(0)
    t.assert(node instanceof PE.CodeBlockNode && node.language == "math" && node.content.text == "x^2", "The $$ block wasn't kept as math code")
  })
}
