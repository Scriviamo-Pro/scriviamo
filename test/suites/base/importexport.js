// Styles, registries, statistics, formatting, sections, link cards, embeds,
// annotations, inline formats, shortcuts and suggestions.
"use strict"

/** Types text into a node as the keyboard would, one character at a time. */
async function typeKeys(t, editor, node, offset, text) {
  editor.focusNode(node, offset)
  await t.tick()
  for (let character of text) {
    if (!editor.activeHost) throw new Error("No text is being edited.")
    // execCommand goes through the browser's own beforeinput and input events.
    document.execCommand("insertText", false, character)
    await t.tick()
  }
}

{
  const section = "Import and export"

  const page = `<html><head><title>Fallback</title><script>var x = '<meta property="og:title" content="Wrong">';</script><meta property="og:title" content="Example &amp; Co"><meta name="description" content="A page."><meta property="og:site_name" content="Example"><meta property="og:image" content="/images/card.png"><link rel="shortcut icon" href="favicon.png"></head><body><meta property="og:title" content="Body"></body></html>`

  /** Runs `work` with fetch answering every request with `body`. */
  async function withFetch(body, work) {
    let original = window.fetch
    window.fetch = async () => new Response(body, {status: 200})
    try {
      return await work()
    } finally {
      window.fetch = original
    }
  }

  const oembed = JSON.stringify({title: "A Video", author_name: "Someone", provider_name: "YouTube", thumbnail_url: "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg", html: `<iframe width="200" height="113" src="https://www.youtube.com/embed/abcdefghijk?feature=oembed"></iframe>`})

  test(section, "legacy per-character styles and compact style runs", t => {
    let legacy = {type: "text", nodeId: "n", content: {text: "aBc", styles: [{bold: true}, {bold: true}, {italic: true, linkURL: "https://Example.com/Path"}]}}
    let node = new PE.TextNode("")
    node.fromJSON(legacy)
    t.assert(node.text == "aBc" && node.content.styleAt(0).bold && node.content.styleAt(1).bold && node.content.styleAt(2).italic && !node.content.styleAt(2).bold, "A legacy per-character style array was not restored.")
    let content = node.toJSON().content
    t.assert("styleTable" in content && "styleRuns" in content && !("styles" in content), "Text content was not saved with a style table and runs: " + JSON.stringify(content))
    t.assert(content.styleRuns && content.styleRuns.length == 4 && content.styleTable.length == 2, "Adjacent identical character styles were not combined into one run: " + JSON.stringify(content))
    let compact = new PE.TextNode("")
    compact.fromJSON(node.toJSON())
    t.assert(compact.text == "aBc" && compact.content.styleAt(0).bold && compact.content.styleAt(2).italic && compact.content.styleAt(2).linkURL === "https://Example.com/Path", "Styles saved as a style table and runs did not round-trip.")
    let caseNode = new PE.TextNode("ab")
    caseNode.content.styleAt(0).linkURL = "https://example.com/a"
    caseNode.content.styleAt(1).linkURL = "https://example.com/A"
    let caseRestored = new PE.TextNode("")
    caseRestored.fromJSON(caseNode.toJSON())
    t.assert(caseRestored.content.styleAt(1).linkURL === "https://example.com/A", "Styles differing only by letter case were merged when saved.")
  })

  test(section, "a new editor has the emoji provider", t => {
    let editor = t.editor()
    t.assert(editor.suggestionProviders.item("emoji") instanceof PE.Suggestions.EmojiProvider, "A new editor did not have the emoji provider.")
  })

  test(section, "registry lists share one shape", t => {
    let editor = t.editor()
    let html = editor.exporters.item("HTML")
    let builtIn = ["html", "json", "markdown", "text"]
    // Add-ons, such as PDF export, add exporters after the built-in ones.
    t.assert(html && editor.exporters.indexOf(html) == 0 && builtIn.every((name, index) => editor.exporters.itemAt(index) && editor.exporters.itemAt(index).identifier == name), `Exporters did not hold the four built-in exporters first, with HTML first (${editor.exporters.items().map(item => item.identifier)}).`)
    if (html) {
      let count = editor.exporters.lastIndex
      editor.exporters.remove(html)
      t.assert(editor.exporters.item("html") == null && editor.exporters.lastIndex == count - 1, "Exporters.Remove did not remove an exporter instance.")
      editor.exporters.addAt(0, html)
      t.assert(editor.exporters.itemAt(0) === html, "Exporters.AddAt did not insert at the position.")
    }
    editor.suggestionProviders.removeAll()
    let first = new PE.Suggestions.Provider("first", "@")
    let second = new PE.Suggestions.Provider("second", "#")
    editor.suggestionProviders.add(first)
    editor.suggestionProviders.addAt(0, second)
    t.assert(editor.suggestionProviders.itemAt(0) === second && editor.suggestionProviders.indexOf(first) == 1, "SuggestionProviders.AddAt did not give the provider priority.")
    editor.suggestionProviders.remove(second)
    editor.suggestionProviders.remove("first")
    t.equal(editor.suggestionProviders.lastIndex, -1, "SuggestionProviders.Remove did not remove by instance and identifier")
    let heading = editor.nodeTypes.item("heading")
    t.assert(heading === PE.HeadingNode && editor.nodeTypes.item("node:heading") === heading, "NodeTypes did not look up a built-in type by name and by toolbar identifier.")
    // Every registered type: the base package's, and those of the add-ons loaded.
    t.equal(editor.nodeTypes.items().map(type => type.identifier), PE.Editor.registeredNodeTypes().map(type => type.identifier), "A new editor didn't have every registered type")
    let count = editor.nodeTypes.lastIndex
    editor.nodeTypes.remove(heading)
    t.assert(editor.nodeTypes.item("heading") == null && editor.nodeTypes.lastIndex == count - 1, "NodeTypes.Remove did not unregister a type.")
    let item = new PE.ToolbarItem("app:list", "List")
    editor.toolbarItems.add(item)
    t.assert(editor.toolbarItems.item("app:list") === item, "ToolbarItems.Add did not keep the item.")
    editor.toolbarItems.removeAll()
    t.equal(editor.toolbarItems.lastIndex, -1, "ToolbarItems.RemoveAll did not empty the list")
  })

  test(section, "statistics count blocks, words and characters", t => {
    let editor = t.editor()
    editor.addNode(new PE.TextNode("The quick  brown fox."))
    editor.addNode(new PE.TextNode("Jumps over\nthe dog"))
    let statistics = editor.statistics
    t.assert(statistics.words == 8 && statistics.paragraphs == 3 && statistics.characters == 38 && statistics.charactersExcludingSpaces == 32, `Statistics did not count words, paragraphs, and characters (${statistics.words}, ${statistics.paragraphs}, ${statistics.characters}, ${statistics.charactersExcludingSpaces}).`)
    t.assert(statistics.readingMinutes == 1 && statistics.owner === editor, "Statistics did not estimate reading time.")
    editor.selection.selectNode(editor.nodeAt(0))
    t.assert(statistics.selectedWords == 4 && statistics.selectedCharacters == 21, `Statistics did not count the selected nodes (${statistics.selectedWords}, ${statistics.selectedCharacters}).`)
    editor.removeAllNodes()
    t.assert(statistics.words == 0 && statistics.readingMinutes == 0, "Statistics did not report an empty document.")
  })

  test(section, "formatting applies styles and alignment", t => {
    let editor = t.editor()
    let node = new PE.TextNode("Bold me")
    editor.addNode(node)
    editor.selection.selectNode(node)
    let formatting = editor.formatting
    t.assert(formatting.canApply(PE.FormattingStyles.bold) && !formatting.isApplied(PE.FormattingStyles.bold) && formatting.canClearFormatting && formatting.canEditLink, "Formatting did not report a selected text node as formattable.")
    formatting.toggle(PE.FormattingStyles.bold)
    formatting.toggle(PE.FormattingStyles.superscript)
    t.assert(node.content.styleAt(0).bold && node.content.styleAt(6).superscript && formatting.isApplied(PE.FormattingStyles.bold), "Formatting.Toggle did not apply styles to the selected node.")
    editor.history.undo()
    editor.history.undo()
    let current = editor.nodeAt(0)
    t.assert(!current.content.styleAt(0).bold && !current.content.styleAt(0).superscript, "Undo did not remove styles applied through Formatting.")
    editor.selection.selectNode(current)
    formatting.align(PE.Alignments.middle)
    t.assert(formatting.canAlign && formatting.alignment == PE.Alignments.middle && current.textAlignment == PE.Alignments.middle, "Formatting.Align did not align the selected node's text.")
    editor.readOnly = true
    t.assert(!formatting.canApply(PE.FormattingStyles.code) && !formatting.canClearFormatting && !formatting.canAlign, "Formatting reported commands as available in a read-only editor.")
  })

  test(section, "annotations follow their text and are saved beside the nodes", t => {
    let editor = t.editor()
    let text = new PE.TextNode("The quick brown fox")
    editor.addNode(text)
    let annotations = editor.annotations
    annotations.authorID = "u1"
    annotations.authorName = "Ana"
    editor.isChanged = false
    let quick = annotations.add(text, 4, 5, "Too quick?")
    let brown = annotations.add(text, 10, 5, "Which brown?")
    t.assert(quick && quick.quote == "quick" && quick.commentAt(0).authorName == "Ana" && editor.isChanged && annotations.lastIndex == 1, "An annotation was not added to a range of text.")
    t.assert(annotations.add(text, 15, 10, "Out of range") == null && annotations.add(text, 0, 3, " ") == null && annotations.add(new PE.TextNode("Elsewhere"), "Not here") == null, "An annotation was added outside the text, without text, or to a node outside the document.")
    let edit = (change) => {
      change()
      editor.nodeChanged(text)
    }
    edit(() => text.content.insert(0, "Oh, "))
    t.assert(quick.start == 8 && quick.length == 5, "An annotation did not move with text inserted before it: " + quick.start)
    edit(() => text.content.insert(16, "ish"))
    t.assert(brown.start == 14 && brown.length == 8 && text.text.substr(brown.start, brown.length) == "brishown", "An annotation did not grow with text typed inside it: " + brown.length)
    edit(() => text.content.remove(8, 13))
    t.assert(quick.length == 0 && quick.orphaned && brown.start == 9, "Deleting annotated text did not orphan its annotation in place.")
    edit(() => text.content.insert(8, "quick"))
    t.assert(quick.start == 8 && quick.length == 5 && !quick.orphaned, "An annotation did not cover its text again when the text came back.")
    let nodeThread = annotations.add(text, "General note")
    let reply = annotations.reply(nodeThread, "Agreed")
    annotations.resolve(nodeThread)
    t.assert(nodeThread.coversNode && nodeThread.lastCommentIndex == 1 && reply.text == "Agreed" && nodeThread.resolved && annotations.annotationsAt(text).length == 3, "Replying to or resolving a node annotation failed.")

    let copy = t.editor()
    copy.fromJSON(editor.toJSON())
    let restoredQuick = copy.annotations.item(quick.id)
    t.assert(copy.annotations.lastIndex == 2 && restoredQuick && restoredQuick.start == 8 && restoredQuick.quote == "quick" && copy.annotations.item(nodeThread.id).resolved && copy.annotations.item(nodeThread.id).commentAt(1).text == "Agreed" && !copy.isChanged, "JSON did not restore annotations.")
    let copied = copy.nodeAt(0)
    copied.content.insert(0, "So, ")
    copy.nodeChanged(copied)
    t.assert(restoredQuick && restoredQuick.start == 12, "A restored annotation did not follow its text.")

    annotations.removeComment(nodeThread, nodeThread.commentAt(1))
    annotations.removeComment(nodeThread, nodeThread.commentAt(0))
    t.assert(annotations.item(nodeThread.id) == null && annotations.lastIndex == 1, "Removing a thread's last comment did not remove the thread.")
    let sameAnchor = new PE.Annotation()
    sameAnchor.copyAnchor(brown)
    let second = annotations.addPrepared(sameAnchor, "Another view")
    edit(() => text.content.insert(0, "A"))
    t.assert(second && second !== brown && second.start == brown.start && second.length == brown.length, "A second thread on the same text did not follow it.")
    annotations.remove(second)

    editor.selection.selectNode(text)
    let prepared = annotations.prepareSelection()
    t.assert(annotations.canAdd && prepared && prepared.coversNode && annotations.indexOf(prepared) < 0, "The selected node did not give an anchor for a new comment.")
    let preparedThread = annotations.addPrepared(prepared, "From the popover")
    t.assert(preparedThread === prepared && annotations.addPrepared(prepared, "Again") == null && preparedThread.commentAt(0).text == "From the popover", "A prepared anchor was not added once.")
    annotations.selected = preparedThread
    t.assert(annotations.selected === preparedThread && !annotations.visible, "The selected annotation was not kept.")
    annotations.remove(preparedThread)
    annotations.selected = null

    let undoThread = annotations.add(text, "Undo me")
    annotations.reply(undoThread, "Second")
    annotations.resolve(undoThread)
    editor.history.undo()
    t.assert(!undoThread.resolved && undoThread.lastCommentIndex == 1, "Undo did not reopen a resolved annotation.")
    editor.history.undo()
    t.assert(undoThread.lastCommentIndex == 0 && annotations.indexOf(undoThread) >= 0, "Undo did not remove a reply.")
    editor.history.undo()
    t.assert(annotations.item(undoThread.id) == null, "Undo did not remove an added annotation.")
    editor.history.redo()
    editor.history.redo()
    t.assert(annotations.item(undoThread.id) && annotations.item(undoThread.id).lastCommentIndex == 1, "Redo did not restore an annotation and its reply.")
    annotations.remove(annotations.item(undoThread.id))
    editor.history.undo()
    t.assert(annotations.item(undoThread.id) && annotations.item(undoThread.id).commentAt(1).text == "Second", "Undo did not restore a removed annotation.")
    annotations.remove(annotations.item(undoThread.id))

    t.assert(editor.toHTML().indexOf("data-scriviamo-annotations") < 0 && editor.toHTML(true).indexOf("data-scriviamo-annotations") < 0, "Annotations were exported to HTML by default.")
    let annotatedHTML = editor.toHTML(true, true)
    t.assert(annotatedHTML.indexOf("data-scriviamo-annotations") >= 0 && annotatedHTML.indexOf("Which brown?") >= 0 && annotatedHTML.indexOf("<blockquote>brown</blockquote>") >= 0, "Annotations were not exported to HTML when asked for.")
    let imported = t.editor()
    imported.fromHTML(annotatedHTML)
    t.equal(imported.lastNodeIndex, editor.lastNodeIndex, "HTML import brought exported annotations back as content")
    annotations.authorID = ""
    annotations.authorName = ""
    let defaultAuthor = annotations.add(text, "Who wrote this?")
    t.assert(defaultAuthor && defaultAuthor.commentAt(0).authorName == "Author" && defaultAuthor.commentAt(0).authorID == "", "A comment outside a collaboration session was not credited to the default author.")
    annotations.remove(defaultAuthor)

    let moved = editor.collaborationAnnotationAnchors()
    t.assert(moved && moved[brown.id] && moved[brown.id].start == brown.start && editor.collaborationAnnotationAnchors() == null, "Moved anchors were not reported once: " + JSON.stringify(moved))

    let remoteThread = {id: "remote-1", nodeId: text.nodeId, coversNode: true, comments: [{id: "c1", authorId: "u9", authorName: "Remote", created: 1700000000, text: "From afar"}]}
    editor.applyCollaborationAnnotation({annotationId: "remote-1", annotation: remoteThread})
    let remote = annotations.item("remote-1")
    editor.applyCollaborationAnnotation({annotationId: "remote-1", annotation: Object.assign({}, remoteThread, {resolved: true})})
    t.assert(remote && remote.resolved && annotations.item("remote-1") === remote && remote.commentAt(0).authorName == "Remote", "A remote annotation was not added and updated in place.")
    editor.applyCollaborationAnnotation({annotationId: "remote-1", deleted: true})
    t.assert(annotations.item("remote-1") == null, "A remote deletion did not remove the annotation.")

    let before = annotations.lastIndex
    editor.allowAnnotations = false
    editor.selection.selectNode(text)
    t.assert(!annotations.canAdd && annotations.add(text, "Blocked") == null && annotations.reply(brown, "Blocked") == null && annotations.lastIndex == before, "Annotations were added while AllowAnnotations was False.")
    editor.allowAnnotations = true
    t.assert(annotations.canAdd, "Annotations stayed off after AllowAnnotations was set back to True.")
    editor.removeNode(text)
    t.assert(brown.orphaned && annotations.lastIndex == 1, "Removing a node did not orphan its annotations.")
    editor.fromMarkdown("# Fresh")
    t.assert(annotations.lastIndex == -1 && editor.toJSON().indexOf("annotations") < 0, "Loading Markdown kept the previous document's annotations.")
  })


  test(section, "the emoji provider matches shortcodes and inserts plain text", async t => {
    let emoji = new PE.Suggestions.EmojiProvider()
    let request = emoji.match("ok :thu", 7, null)
    let choices = request ? emoji.suggestions(request) : []
    t.assert(request && request.startPosition == 3 && choices.length > 0 && choices[0].insertText == "👍", "The emoji provider did not offer an emoji for :thu.")
    t.assert(emoji.match("at 10:30", 8, null) == null && emoji.match("Note:ab", 7, null) == null && emoji.match(":a", 2, null) == null, "The emoji provider matched a colon that does not start a shortcode.")
    let editor = t.editor()
    let node = new PE.TextNode("ok :thu")
    editor.addNode(node)
    await t.tick()
    if (request && choices.length > 0) {
      let caret = emoji.commitSuggestion(node.primaryHost, request, choices[0], node.content.styleAt(0))
      t.assert(node.toPlainText() == "ok 👍" && caret == 4 + ("👍".length - 1) && node.content.styleAt(3).suggestionProviderIdentifier == "", `The emoji provider did not insert the emoji as plain text (${JSON.stringify(node.toPlainText())}, caret ${caret}).`)
    }
    let laugh = emoji.suggestions(emoji.match(":lol", 4, null))
    t.assert(laugh.length > 0 && laugh[0].insertText == "😂", "The emoji provider did not find an emoji by keyword.")
  })

  test(section, "inline formats survive JSON, HTML and Markdown", t => {
    let editor = t.editor()
    let node = new PE.TextNode("code mark key sup sub")
    editor.addNode(node)
    let rich = node.content
    rich.applyStyle(0, 4, style => style.code = true)
    rich.applyStyle(5, 9, style => style.highlight = true)
    rich.applyStyle(10, 13, style => style.keyboard = true)
    rich.applyStyle(14, 17, style => style.superscript = true)
    rich.applyStyle(18, 21, style => style.subscript = true)
    let html = editor.toHTML()
    t.assert(html.indexOf("<code>code</code>") >= 0 && html.indexOf("<mark>mark</mark>") >= 0 && html.indexOf("<kbd>key</kbd>") >= 0 && html.indexOf("<sup>sup</sup>") >= 0 && html.indexOf("<sub>sub</sub>") >= 0, "HTML export did not write the inline formats: " + html)
    let markdown = editor.toMarkdown()
    t.assert(markdown.indexOf("`code`") >= 0 && markdown.indexOf("<mark>mark</mark>") >= 0 && markdown.indexOf("<sup>sup</sup>") >= 0, "Markdown export did not write the inline formats: " + markdown)
    let copy = t.editor()
    copy.fromHTML(html)
    let restored = copy.nodeAt(0)
    t.assert(restored && restored.content.styleAt(0).code && restored.content.styleAt(5).highlight && restored.content.styleAt(10).keyboard && restored.content.styleAt(14).superscript && restored.content.styleAt(18).subscript, "HTML import did not restore the inline formats.")
    copy.fromJSON(editor.toJSON())
    restored = copy.nodeAt(0)
    t.assert(restored && restored.content.styleAt(0).code && restored.content.styleAt(18).subscript && !restored.content.styleAt(4).code, "JSON did not restore the inline formats.")
  })

  test(section, "Markdown shortcuts turn typed markers into blocks and formatting", async t => {
    let editor = t.editor()
    let headingSource = new PE.TextNode("Title")
    editor.addNode(headingSource)
    await typeKeys(t, editor, headingSource, 0, "## ")
    let heading = editor.nodeAt(0)
    t.assert(heading instanceof PE.HeadingNode && heading.toPlainText() == "Title" && heading.level == PE.HeadingLevels.heading2, "Typing ## did not turn a paragraph into a heading.")
    editor.history.undo()
    t.assert(editor.nodeAt(0).typeName == "Text" && editor.nodeAt(0).toPlainText() == "##Title", `Undo did not put back the paragraph a shortcut converted (${editor.nodeAt(0).typeName}, ${JSON.stringify(editor.nodeAt(0).toPlainText())}).`)
    let listSource = new PE.TextNode("")
    editor.addNode(listSource)
    await typeKeys(t, editor, listSource, 0, "- item")
    let list = editor.nodeAt(editor.lastNodeIndex)
    t.assert(list instanceof PE.ListNode && list.toPlainText() == "item", "Typing - did not start a bulleted list.")
    let inline = new PE.TextNode("")
    editor.addNode(inline)
    await typeKeys(t, editor, inline, 0, "a **b** `c` d")
    let rich = editor.nodeAt(editor.lastNodeIndex).content
    t.assert(rich.text == "a b c d" && rich.styleAt(2).bold && !rich.styleAt(3).bold && rich.styleAt(4).code && !rich.styleAt(6).code, "Typing **bold** and `code` did not format the text between the markers: " + JSON.stringify(rich.text))
    editor.markdownShortcuts = false
    let plain = new PE.TextNode("")
    editor.addNode(plain)
    await typeKeys(t, editor, plain, 0, "# **x**")
    t.assert(editor.nodeAt(editor.lastNodeIndex) === plain && plain.content.text == "# **x**", "Markdown shortcuts applied with MarkdownShortcuts False.")
  })
}
