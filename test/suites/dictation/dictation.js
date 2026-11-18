// Dictation, with a stand-in for the browser's speech recognition.
"use strict"
{
  const section = "Dictation"

  class FakeRecognition extends EventTarget {
    static last = null
    constructor() {
      super()
      FakeRecognition.last = this
      this.started = 0
    }
    start() { this.started++ }
    stop() { this.dispatchEvent(new Event("end")) }
    abort() { this.stop() }
    say(text, isFinal) {
      let event = new Event("result")
      let result = [{transcript: text}]
      result.isFinal = isFinal
      event.resultIndex = 0
      event.results = [result]
      this.dispatchEvent(event)
    }
  }

  async function withFake(fn) {
    let saved = window.SpeechRecognition
    window.SpeechRecognition = FakeRecognition
    try {
      await fn()
    } finally {
      if (saved) window.SpeechRecognition = saved
      else delete window.SpeechRecognition
    }
  }

  test(section, "words said go in at the caret", t => withFake(async () => {
    let editor = t.editor()
    editor.fromMarkdown("Hello")
    editor.focusNode(editor.nodeAt(0), 5)
    t.assert(PE.Dictation.start(editor) !== null && PE.Dictation.isDictating(editor), "Dictation didn't start.")
    let recognition = FakeRecognition.last
    recognition.say("there", false)
    t.equal(editor.nodeAt(0).text, "Hello", "Words not yet settled went into the text")
    t.assert(editor.element.querySelector(".scv-dictation-bubble").textContent.includes("there"), "The words not yet settled didn't show.")
    recognition.say("there. how are you", true)
    t.equal(editor.nodeAt(0).text, "Hello there. how are you", "The text after dictating")
    PE.Dictation.toggle(editor)
    t.assert(!PE.Dictation.isDictating(editor) && !editor.element.querySelector(".scv-dictation-bubble"), "Dictation didn't stop.")
  }))

  test(section, "a new sentence starts with a capital", t => withFake(async () => {
    let editor = t.editor()
    editor.fromMarkdown("Done.")
    editor.focusNode(editor.nodeAt(0), 5)
    PE.Dictation.start(editor)
    FakeRecognition.last.say("next we test", true)
    t.equal(editor.nodeAt(0).text, "Done. Next we test", "The dictated sentence")
    PE.Dictation.toggle(editor)
  }))
}
