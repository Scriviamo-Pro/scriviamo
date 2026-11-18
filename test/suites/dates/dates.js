// Dates in text: validity, display, inserting, and import and export.
"use strict"
{
  const section = "Dates"

  test(section, "dates are checked and shown in a language", t => {
    t.assert(PE.DateChips.isValid("2026-02-28") && !PE.DateChips.isValid("2026-02-30") && !PE.DateChips.isValid("Feb 3"), "Dates weren't checked.")
    t.equal(PE.DateChips.display("2026-12-24", "en-US"), "Dec 24, 2026", "An American date")
    t.equal(PE.DateChips.display("2026-12-24", "de-DE"), "24. Dez. 2026", "A German date")
  })

  test(section, "a date round-trips through HTML and JSON", t => {
    let editor = t.editor()
    editor.fromHTML('<p>Due <time class="date-chip" datetime="2026-12-24">Dec 24</time>.</p>')
    let paragraph = editor.nodeAt(0)
    t.equal(paragraph.text, "Due 2026-12-24.", "The imported text")
    let html = editor.toHTML()
    t.assert(html.includes('<time class="date-chip" datetime="2026-12-24"'), "The date didn't export as a <time> element.")
    let copy = t.editor()
    copy.fromJSON(editor.toJSON())
    t.equal(copy.nodeAt(0).text, "Due 2026-12-24.", "The date after JSON")
    let host = copy.nodeAt(0).hosts()[0]
    t.equal(PE.DateChips.dates(host).map(chip => chip.date).join("|"), "2026-12-24", "The dates found after JSON")
  })

  test(section, "inserting a date puts today's at the caret, as one undo step", t => {
    let editor = t.editor()
    editor.fromMarkdown("Meet on soon")
    let paragraph = editor.nodeAt(0)
    editor.focusNode(paragraph, 8)
    PE.DateChips.insert(editor)
    document.querySelectorAll(".scv-date-popup").forEach(popup => popup.remove())
    t.equal(paragraph.text, `Meet on ${PE.DateChips.today()}soon`, "The text after inserting a date")
    editor.history.undo()
    t.equal(editor.nodeAt(0).text, "Meet on soon", "The text after undo")
  })
}
