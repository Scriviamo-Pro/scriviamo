import { Editor, TextHost } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const ReadabilityStrings: {
    TextReadabilityGradeFormat: string;
    TextReadabilitySentenceFormat: string;
    TextReadabilityLongSentencesFormat: string;
    TextReadabilityOneLongSentenceCaption: string;
    TextReadabilityGradeTooltip: string;
    TextReadabilityLongSentenceTooltip: string;
};
type ReadabilityStringsTable = typeof ReadabilityStrings;
declare module "scriviamo" {
    interface Strings extends ReadabilityStringsTable {
    }
}
/** A sentence found in a text: where it is, and how many words it has. */
export interface ReadabilitySentence {
    start: number;
    end: number;
    words: number;
}
/** What Readability.analyze finds. */
export interface ReadabilityReport {
    words: number;
    sentences: number;
    syllables: number;
    /** The Flesch–Kincaid grade level, for English text; null for other languages or too little text. */
    grade: number | null;
    wordsPerSentence: number;
    longSentences: number;
}
/**
 * How easy the document is to read, shown in the status bar: a school grade level for English
 * text (Flesch–Kincaid), or the words per sentence for other languages, and how many sentences are
 * long. Clicking the long sentences goes to the next one.
 */
export declare class Readability {
    #private;
    /** Sentences with more words than this count as long. */
    static longSentenceWords: number;
    /** Whether the status bar shows the readability. */
    static enabled: boolean;
    /** The sentences in a text, with their offsets. */
    static sentences(text: string): Array<ReadabilitySentence>;
    /** An English word's syllables, by its vowel groups. */
    static syllables(word: string): number;
    /** Measures a text. English text, by language, gets a grade level. */
    static analyze(text: string, language?: string): ReadabilityReport;
    /** The page's language, which decides whether there's a grade level. */
    static language(editor: Editor): string;
    /** Every long sentence in the document, in order: its text, and where it is. */
    static longSentences(editor: Editor): Array<{
        host: TextHost;
        start: number;
        end: number;
    }>;
    /** Selects the next long sentence after the last one shown. */
    static showNextLongSentence(editor: Editor): boolean;
    /** The status bar's readability item. */
    static statusItem(editor: Editor, text: string): HTMLElement | null;
}
export {};
