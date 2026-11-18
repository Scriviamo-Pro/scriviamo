// Statuses in text: choices, colors, changing them, and import and export.
"use strict"
{
  const section = "Status"

  test(section, "statuses have colors, by name, for every editor or one", t => {
    let editor = t.editor()
    t.equal(PE.StatusPills.colorOf("approved", editor), "#1fa774", "The default Approved color")
    t.equal(PE.StatusPills.colorOf("Unknown", editor), "#868e96", "An unknown status's color")
    PE.StatusPills.setStatuses(editor, [{name: "Shipped", color: "#123456"}])
    t.equal(PE.StatusPills.statusesFor(editor).map(status => status.name).join("|"), "Shipped", "An editor's own statuses")
    t.equal(PE.StatusPills.colorOf("Shipped", editor), "#123456", "An editor's own status color")
    t.assert(PE.StatusPills.statusesFor(t.editor()).length == 6, "Another editor didn't keep the default statuses.")
  })

  test(section, "a status round-trips through HTML, Markdown and JSON", t => {
    let editor = t.editor()
    editor.fromHTML('<p>Spec: <span class="status-pill" data-status="In Review">In Review</span></p>')
    t.equal(editor.nodeAt(0).text, "Spec: In Review", "The imported text")
    t.assert(editor.toHTML().includes('data-status="In Review"'), "The status didn't export.")
    let markdown = t.editor()
    markdown.fromMarkdown(editor.toMarkdown())
    t.equal(PE.StatusPills.pills(markdown.nodeAt(0).hosts()[0]).map(pill => pill.name).join("|"), "In Review", "The status after Markdown")
    let copy = t.editor()
    copy.fromJSON(editor.toJSON())
    t.equal(PE.StatusPills.pills(copy.nodeAt(0).hosts()[0]).map(pill => pill.name).join("|"), "In Review", "The status after JSON")
  })

  test(section, "changing and removing a status", t => {
    let editor = t.editor()
    editor.fromHTML('<p>Spec: <span class="status-pill" data-status="Draft">Draft</span> now</p>')
    let host = editor.nodeAt(0).hosts()[0]
    let pill = PE.StatusPills.pills(host)[0]
    PE.StatusPills.replace(editor, host, pill.start, pill.end, "Done", pill.id)
    t.equal(editor.nodeAt(0).text, "Spec: Done now", "The text after changing the status")
    pill = PE.StatusPills.pills(host)[0]
    PE.StatusPills.replace(editor, host, pill.start, pill.end, "")
    t.equal(editor.nodeAt(0).text, "Spec:  now", "The text after removing the status")
    t.equal(PE.StatusPills.pills(host).length, 0, "Statuses after removing the status")
  })
}
