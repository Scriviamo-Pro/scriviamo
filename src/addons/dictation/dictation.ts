import {Editor, EditorExtension, Strings, ToolbarItem, ToolbarItemKinds, Utilities} from "scriviamo"

/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
const DictationStrings = {
  TextDictationCaption: "Dictate",
  TextDictationListeningCaption: "Listening…",
  TextDictationUnavailableCaption: "This browser can't take dictation.",
  TextDictationNoTextMessage: "Click in the text where the words should go, then dictate.",
  TextDictationDeniedMessage: "The microphone isn't available. Allow this page to use it, then try again.",
  TextDictationErrorMessage: "Dictation stopped: %error%"
}

type DictationStringsTable = typeof DictationStrings

declare module "scriviamo" {
  interface Strings extends DictationStringsTable {}
}

Strings.register(DictationStrings)

/** The parts of the browser's SpeechRecognition this uses. */
interface Recognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
}

/**
 * Voice typing: what's said goes into the text at the caret, through the browser's speech
 * recognition, in the page's language. While dictating, the words not yet settled show in a bubble.
 * Chrome, Edge and Safari can take dictation; where a browser can't, the tool is off.
 *
 * Browsers may send the audio to a speech service of their own to recognize it.
 */
export class Dictation {
  static #sessions = new WeakMap<Editor, Dictation>()

  /** The browser's speech recognition, or null. */
  static get recognitionClass(): (new () => Recognition) | null {
    if (typeof window == "undefined") return null
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
  }

  static get isAvailable(): boolean {
    return Dictation.recognitionClass !== null
  }

  static isDictating(editor: Editor): boolean {
    return Dictation.#sessions.has(editor)
  }

  /** Starts dictating into an editor, or stops when it already is. */
  static toggle(editor: Editor) {
    let session = Dictation.#sessions.get(editor)
    if (session) session.stop()
    else Dictation.start(editor)
  }

  static start(editor: Editor): Dictation | null {
    if (Dictation.#sessions.has(editor) || editor.readOnly) return Dictation.#sessions.get(editor) || null
    let Recognizer = Dictation.recognitionClass
    if (!Recognizer) {
      editor.showMessage(editor.strings.TextDictationUnavailableCaption, "warning")
      return null
    }
    if (!editor.activeHost) {
      editor.showMessage(editor.strings.TextDictationNoTextMessage, "info")
      return null
    }
    let session = new Dictation(editor, new Recognizer())
    Dictation.#sessions.set(editor, session)
    session.#begin()
    editor.updateToolbarState()
    return session
  }

  #editor: Editor
  #recognition: Recognition
  #bubble: HTMLElement | null = null
  #stopping = false

  private constructor(editor: Editor, recognition: Recognition) {
    this.#editor = editor
    this.#recognition = recognition
  }

  #begin() {
    let editor = this.#editor
    let recognition = this.#recognition
    let page = editor.element ? editor.element.closest("[lang]") as HTMLElement | null : null
    recognition.lang = (page && page.lang) || document.documentElement.lang || navigator.language || "en-US"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.addEventListener("result", (event: any) => {
      let interim = ""
      for (let index = event.resultIndex; index < event.results.length; index++) {
        let result = event.results[index]
        let text = String(result[0] && result[0].transcript || "")
        if (result.isFinal) this.#insert(text)
        else interim += text
      }
      this.#showBubble(interim)
    })
    recognition.addEventListener("error", (event: any) => {
      let error = String(event.error || "")
      if (error == "no-speech" || error == "aborted") return
      editor.showMessage(error == "not-allowed" || error == "service-not-allowed" ? editor.strings.TextDictationDeniedMessage : Utilities.format(editor.strings.TextDictationErrorMessage, {error}), "warning")
      this.stop()
    })
    // Browsers end recognition after a pause; it carries on until stopped.
    recognition.addEventListener("end", () => {
      if (this.#stopping || !editor.activeHost) {
        this.#finish()
        return
      }
      try {
        recognition.start()
      } catch {
        this.#finish()
      }
    })
    try {
      recognition.start()
      this.#showBubble("")
    } catch {
      this.#finish()
    }
  }

  /** Puts recognized words at the caret, with a space before them when the text needs one. */
  #insert(text: string) {
    let editor = this.#editor
    let host = editor.activeHost
    let words = text.trim()
    if (!host || words.length == 0) return
    let selection = host.selection()
    let before = selection && selection.start > 0 ? host.rich.text.charAt(selection.start - 1) : ""
    if (before.length > 0 && !/\s/.test(before)) words = " " + words
    // A new sentence starts with a capital.
    let sentenceStart = !before || /[.!?]\s*$/.test(host.rich.text.substring(0, selection ? selection.start : 0).trimEnd()) || host.rich.text.substring(0, selection ? selection.start : 0).trim().length == 0
    if (sentenceStart) words = words.replace(/^(\s*)(\p{Ll})/u, (_match, space, letter) => space + letter.toLocaleUpperCase())
    editor.insertText(words)
  }

  #showBubble(text: string) {
    let editor = this.#editor
    if (!editor.element) return
    if (!this.#bubble) {
      this.#bubble = Utilities.element("div", "scv-dictation-bubble", {role: "status", "aria-live": "polite"})
      editor.element.append(this.#bubble)
    }
    this.#bubble.replaceChildren()
    let dot = Utilities.element("span", "scv-dictation-dot", {"aria-hidden": "true"})
    let words = Utilities.element("span", "scv-dictation-words")
    words.textContent = text.length > 0 ? text : editor.strings.TextDictationListeningCaption
    this.#bubble.append(dot, words)
  }

  /** Stops dictating; words already heard still go in. */
  stop() {
    this.#stopping = true
    try {
      this.#recognition.stop()
    } catch {
      this.#finish()
    }
  }

  #finish() {
    if (this.#bubble) this.#bubble.remove()
    this.#bubble = null
    Dictation.#sessions.delete(this.#editor)
    this.#editor.updateToolbarState()
  }
}

/** The Dictate tool. */
export const DictationExtension: EditorExtension = {
  toolbarIdentifiers: ["dictate"],
  defaultToolbarIdentifiers: ["dictate"],

  install(editor: Editor) {
    editor.addEventListener("readOnlyChanged", () => {
      if (editor.readOnly && Dictation.isDictating(editor)) Dictation.toggle(editor)
    })
  },

  makeToolbarItem(editor: Editor, identifier: string): ToolbarItem | null {
    if (identifier != "dictate") return null
    let strings = editor.strings
    return new ToolbarItem(identifier, strings.TextDictationCaption, "bi bi-mic", ToolbarItemKinds.toggle, Dictation.isAvailable ? strings.TextDictationCaption : strings.TextDictationUnavailableCaption)
  },

  activateToolbarItem(editor: Editor, identifier: string): boolean {
    if (identifier != "dictate") return false
    Dictation.toggle(editor)
    return true
  },

  updateToolbarState(editor: Editor, set: (identifier: string, enabled: boolean, active?: boolean) => void) {
    set("dictate", Dictation.isAvailable && !editor.readOnly, Dictation.isDictating(editor))
  }
}

Editor.registerExtension(DictationExtension)
