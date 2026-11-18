// addons/dictation/dictation.ts
import { Editor, Strings, ToolbarItem, ToolbarItemKinds, Utilities } from "scriviamo";
var DictationStrings = {
  TextDictationCaption: "Dictate",
  TextDictationListeningCaption: "Listening\u2026",
  TextDictationUnavailableCaption: "This browser can't take dictation.",
  TextDictationNoTextMessage: "Click in the text where the words should go, then dictate.",
  TextDictationDeniedMessage: "The microphone isn't available. Allow this page to use it, then try again.",
  TextDictationErrorMessage: "Dictation stopped: %error%"
};
Strings.register(DictationStrings);
var Dictation = class _Dictation {
  static #sessions = /* @__PURE__ */ new WeakMap();
  /** The browser's speech recognition, or null. */
  static get recognitionClass() {
    if (typeof window == "undefined")
      return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }
  static get isAvailable() {
    return _Dictation.recognitionClass !== null;
  }
  static isDictating(editor) {
    return _Dictation.#sessions.has(editor);
  }
  /** Starts dictating into an editor, or stops when it already is. */
  static toggle(editor) {
    let session = _Dictation.#sessions.get(editor);
    if (session)
      session.stop();
    else
      _Dictation.start(editor);
  }
  static start(editor) {
    if (_Dictation.#sessions.has(editor) || editor.readOnly)
      return _Dictation.#sessions.get(editor) || null;
    let Recognizer = _Dictation.recognitionClass;
    if (!Recognizer) {
      editor.showMessage(editor.strings.TextDictationUnavailableCaption, "warning");
      return null;
    }
    if (!editor.activeHost) {
      editor.showMessage(editor.strings.TextDictationNoTextMessage, "info");
      return null;
    }
    let session = new _Dictation(editor, new Recognizer());
    _Dictation.#sessions.set(editor, session);
    session.#begin();
    editor.updateToolbarState();
    return session;
  }
  #editor;
  #recognition;
  #bubble = null;
  #stopping = false;
  constructor(editor, recognition) {
    this.#editor = editor;
    this.#recognition = recognition;
  }
  #begin() {
    let editor = this.#editor;
    let recognition = this.#recognition;
    let page = editor.element ? editor.element.closest("[lang]") : null;
    recognition.lang = page && page.lang || document.documentElement.lang || navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.addEventListener("result", (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index++) {
        let result = event.results[index];
        let text = String(result[0] && result[0].transcript || "");
        if (result.isFinal)
          this.#insert(text);
        else
          interim += text;
      }
      this.#showBubble(interim);
    });
    recognition.addEventListener("error", (event) => {
      let error = String(event.error || "");
      if (error == "no-speech" || error == "aborted")
        return;
      editor.showMessage(error == "not-allowed" || error == "service-not-allowed" ? editor.strings.TextDictationDeniedMessage : Utilities.format(editor.strings.TextDictationErrorMessage, { error }), "warning");
      this.stop();
    });
    recognition.addEventListener("end", () => {
      if (this.#stopping || !editor.activeHost) {
        this.#finish();
        return;
      }
      try {
        recognition.start();
      } catch {
        this.#finish();
      }
    });
    try {
      recognition.start();
      this.#showBubble("");
    } catch {
      this.#finish();
    }
  }
  /** Puts recognized words at the caret, with a space before them when the text needs one. */
  #insert(text) {
    let editor = this.#editor;
    let host = editor.activeHost;
    let words = text.trim();
    if (!host || words.length == 0)
      return;
    let selection = host.selection();
    let before = selection && selection.start > 0 ? host.rich.text.charAt(selection.start - 1) : "";
    if (before.length > 0 && !/\s/.test(before))
      words = " " + words;
    let sentenceStart = !before || /[.!?]\s*$/.test(host.rich.text.substring(0, selection ? selection.start : 0).trimEnd()) || host.rich.text.substring(0, selection ? selection.start : 0).trim().length == 0;
    if (sentenceStart)
      words = words.replace(/^(\s*)(\p{Ll})/u, (_match, space, letter) => space + letter.toLocaleUpperCase());
    editor.insertText(words);
  }
  #showBubble(text) {
    let editor = this.#editor;
    if (!editor.element)
      return;
    if (!this.#bubble) {
      this.#bubble = Utilities.element("div", "scv-dictation-bubble", { role: "status", "aria-live": "polite" });
      editor.element.append(this.#bubble);
    }
    this.#bubble.replaceChildren();
    let dot = Utilities.element("span", "scv-dictation-dot", { "aria-hidden": "true" });
    let words = Utilities.element("span", "scv-dictation-words");
    words.textContent = text.length > 0 ? text : editor.strings.TextDictationListeningCaption;
    this.#bubble.append(dot, words);
  }
  /** Stops dictating; words already heard still go in. */
  stop() {
    this.#stopping = true;
    try {
      this.#recognition.stop();
    } catch {
      this.#finish();
    }
  }
  #finish() {
    if (this.#bubble)
      this.#bubble.remove();
    this.#bubble = null;
    _Dictation.#sessions.delete(this.#editor);
    this.#editor.updateToolbarState();
  }
};
var DictationExtension = {
  toolbarIdentifiers: ["dictate"],
  defaultToolbarIdentifiers: ["dictate"],
  install(editor) {
    editor.addEventListener("readOnlyChanged", () => {
      if (editor.readOnly && Dictation.isDictating(editor))
        Dictation.toggle(editor);
    });
  },
  makeToolbarItem(editor, identifier) {
    if (identifier != "dictate")
      return null;
    let strings = editor.strings;
    return new ToolbarItem(identifier, strings.TextDictationCaption, "bi bi-mic", ToolbarItemKinds.toggle, Dictation.isAvailable ? strings.TextDictationCaption : strings.TextDictationUnavailableCaption);
  },
  activateToolbarItem(editor, identifier) {
    if (identifier != "dictate")
      return false;
    Dictation.toggle(editor);
    return true;
  },
  updateToolbarState(editor, set) {
    set("dictate", Dictation.isAvailable && !editor.readOnly, Dictation.isDictating(editor));
  }
};
Editor.registerExtension(DictationExtension);
export {
  Dictation,
  DictationExtension
};
