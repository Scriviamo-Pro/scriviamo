// Readability: sentences, syllables, grade levels and long sentences.
"use strict"
{
  const section = "Readability"

  test(section, "sentences are found with their offsets", t => {
    let text = "One two three. Four five!\nSix seven"
    let sentences = PE.Readability.sentences(text)
    t.equal(sentences.map(sentence => text.substring(sentence.start, sentence.end)).join("|"), "One two three.|Four five!|Six seven", "The sentences")
    t.equal(sentences.map(sentence => sentence.words).join(","), "3,2,2", "Their words")
  })

  test(section, "English text gets a grade level; other languages, words per sentence", t => {
    let simple = "The cat sat on the mat. It was a good day. The sun was out. We had fun in the park. Then we went home to eat. "
    let report = PE.Readability.analyze(simple.repeat(2), "en-US")
    t.assert(report.grade !== null && report.grade < 4, `Simple text's grade: ${report.grade}`)
    let hard = "Notwithstanding considerable organizational complexity, interdisciplinary collaboration necessitates comprehensive communication infrastructure, institutional accountability, and continuous evaluation methodologies. "
    let difficult = PE.Readability.analyze(hard.repeat(3), "en")
    t.assert(difficult.grade !== null && difficult.grade > 14, `Difficult text's grade: ${difficult.grade}`)
    t.equal(PE.Readability.analyze(simple.repeat(2), "fr").grade, null, "French text's grade")
    t.equal(PE.Readability.syllables("readability"), 5, "Syllables in readability")
  })

  test(section, "long sentences are counted and shown in turn", t => {
    let editor = t.editor()
    let long = Array.from({length: 30}, (_word, index) => `word${index}`).join(" ") + "."
    editor.fromMarkdown(`Short one. ${long}\n\nAnother short one. ${long}`)
    t.equal(PE.Readability.analyze(editor.toPlainText()).longSentences, 2, "Long sentences")
    t.assert(PE.Readability.showNextLongSentence(editor), "There was no long sentence to show.")
    let host = editor.activeHost
    let selection = host && host.selection()
    t.equal(selection && host.rich.text.substring(selection.start, selection.end), long, "The first long sentence selected")
    PE.Readability.showNextLongSentence(editor)
    t.equal(editor.activeHost && editor.activeHost.node, editor.nodeAt(1), "The second long sentence's block")
  })
}
