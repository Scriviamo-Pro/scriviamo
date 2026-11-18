import {Editor, Node, StatusBar, Statistics, Strings, TextHost, Utilities} from "scriviamo"

/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
const ReadabilityStrings = {
  TextReadabilityGradeFormat: "Grade %grade%",
  TextReadabilitySentenceFormat: "%count% words per sentence",
  TextReadabilityLongSentencesFormat: "%count% long sentences",
  TextReadabilityOneLongSentenceCaption: "1 long sentence",
  TextReadabilityGradeTooltip: "The school grade a reader needs to follow this text easily (Flesch–Kincaid).",
  TextReadabilityLongSentenceTooltip: "Sentences of more than %count% words. Click to go to the next one."
}

type ReadabilityStringsTable = typeof ReadabilityStrings

declare module "scriviamo" {
  interface Strings extends ReadabilityStringsTable {}
}

Strings.register(ReadabilityStrings)

/** A sentence found in a text: where it is, and how many words it has. */
export interface ReadabilitySentence {
  start: number
  end: number
  words: number
}

/** What Readability.analyze finds. */
export interface ReadabilityReport {
  words: number
  sentences: number
  syllables: number
  /** The Flesch–Kincaid grade level, for English text; null for other languages or too little text. */
  grade: number | null
  wordsPerSentence: number
  longSentences: number
}

/**
 * How easy the document is to read, shown in the status bar: a school grade level for English
 * text (Flesch–Kincaid), or the words per sentence for other languages, and how many sentences are
 * long. Clicking the long sentences goes to the next one.
 */
export class Readability {
  /** Sentences with more words than this count as long. */
  static longSentenceWords: number = 25
  /** Whether the status bar shows the readability. */
  static enabled: boolean = true
  static #nextLong = new WeakMap<Editor, number>()

  /** The sentences in a text, with their offsets. */
  static sentences(text: string): Array<ReadabilitySentence> {
    let result: Array<ReadabilitySentence> = []
    let pattern = /[^.!?。！？\u2029\u2028\n]+(?:[.!?。！？]+["'”’)\]]*|(?=[\u2029\u2028\n])|$)/g
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      if (match[0].length == 0) {
        pattern.lastIndex++
        continue
      }
      let raw = match[0]
      let leading = raw.length - raw.trimStart().length
      let trimmed = raw.trim()
      let words = Statistics.countWords(trimmed)
      if (words > 0) result.push({start: match.index + leading, end: match.index + leading + trimmed.length, words})
    }
    return result
  }

  /** An English word's syllables, by its vowel groups. */
  static syllables(word: string): number {
    let lower = word.toLowerCase().replace(/[^a-z]/g, "")
    if (lower.length == 0) return 0
    if (lower.length <= 3) return 1
    lower = lower.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "")
    let groups = lower.match(/[aeiouy]{1,2}/g)
    return Math.max(1, groups ? groups.length : 1)
  }

  /** Measures a text. English text, by language, gets a grade level. */
  static analyze(text: string, language: string = "en"): ReadabilityReport {
    let sentences = Readability.sentences(text)
    let words = sentences.reduce((sum, sentence) => sum + sentence.words, 0)
    let english = /^en\b/i.test(language || "en")
    let englishWords: Array<string> = english ? text.match(/[A-Za-z][A-Za-z'’-]*/g) || [] : []
    let syllables = englishWords.reduce((sum: number, word: string) => sum + Readability.syllables(word), 0)
    let wordsPerSentence = sentences.length > 0 ? words / sentences.length : 0
    let grade = english && words >= 30 && sentences.length > 0 ? Math.max(0, 0.39 * wordsPerSentence + 11.8 * (syllables / words) - 15.59) : null
    return {words, sentences: sentences.length, syllables, grade: grade === null ? null : Math.round(grade * 10) / 10, wordsPerSentence: Math.round(wordsPerSentence * 10) / 10, longSentences: sentences.filter(sentence => sentence.words > Readability.longSentenceWords).length}
  }

  /** The page's language, which decides whether there's a grade level. */
  static language(editor: Editor): string {
    let page = editor.element ? editor.element.closest("[lang]") as HTMLElement | null : null
    return (page && page.lang) || (typeof document != "undefined" && document.documentElement.lang) || "en"
  }

  /** Every long sentence in the document, in order: its text, and where it is. */
  static longSentences(editor: Editor): Array<{host: TextHost, start: number, end: number}> {
    let result: Array<{host: TextHost, start: number, end: number}> = []
    editor.allNodes().forEach((node: Node) => node.hosts().forEach(host => {
      Readability.sentences(host.rich.text).filter(sentence => sentence.words > Readability.longSentenceWords).forEach(sentence => result.push({host, start: sentence.start, end: sentence.end}))
    }))
    return result
  }

  /** Selects the next long sentence after the last one shown. */
  static showNextLongSentence(editor: Editor): boolean {
    let all = Readability.longSentences(editor)
    if (all.length == 0) return false
    let index = ((Readability.#nextLong.get(editor) ?? -1) + 1) % all.length
    Readability.#nextLong.set(editor, index)
    let target = all[index]
    editor.focusNode(target.host.node, target.start, target.host.index)
    target.host.select(target.start, target.end)
    target.host.element.scrollIntoView({block: "center", behavior: "smooth"})
    return true
  }

  /** The status bar's readability item. */
  static statusItem(editor: Editor, text: string): HTMLElement | null {
    if (!Readability.enabled) return null
    let strings = editor.strings
    let report = Readability.analyze(text, Readability.language(editor))
    if (report.sentences == 0) return null
    let element = Utilities.element("span", "scv-readability")
    let measure = Utilities.element("span", "scv-readability-measure")
    if (report.grade !== null) {
      measure.textContent = Utilities.format(strings.TextReadabilityGradeFormat, {grade: Math.round(report.grade)})
      measure.title = strings.TextReadabilityGradeTooltip
    } else {
      measure.textContent = Utilities.format(strings.TextReadabilitySentenceFormat, {count: report.wordsPerSentence.toLocaleString()})
    }
    element.append(measure)
    if (report.longSentences > 0) {
      let long = Utilities.element("button", "btn btn-link btn-sm scv-readability-long", {type: "button", title: Utilities.format(strings.TextReadabilityLongSentenceTooltip, {count: Readability.longSentenceWords})})
      long.innerHTML = '<i class="bi bi-exclamation-circle" aria-hidden="true"></i> '
      long.append(report.longSentences == 1 ? strings.TextReadabilityOneLongSentenceCaption : Utilities.format(strings.TextReadabilityLongSentencesFormat, {count: report.longSentences}))
      long.addEventListener("click", () => Readability.showNextLongSentence(editor))
      element.append(long)
    }
    return element
  }
}

StatusBar.registerItem("readability", (editor, text) => Readability.statusItem(editor, text))
