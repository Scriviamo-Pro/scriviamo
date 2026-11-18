import { Editor, EditorExtension } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const DictationStrings: {
    TextDictationCaption: string;
    TextDictationListeningCaption: string;
    TextDictationUnavailableCaption: string;
    TextDictationNoTextMessage: string;
    TextDictationDeniedMessage: string;
    TextDictationErrorMessage: string;
};
type DictationStringsTable = typeof DictationStrings;
declare module "scriviamo" {
    interface Strings extends DictationStringsTable {
    }
}
/** The parts of the browser's SpeechRecognition this uses. */
interface Recognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start(): void;
    stop(): void;
    abort(): void;
}
/**
 * Voice typing: what's said goes into the text at the caret, through the browser's speech
 * recognition, in the page's language. While dictating, the words not yet settled show in a bubble.
 * Chrome, Edge and Safari can take dictation; where a browser can't, the tool is off.
 *
 * Browsers may send the audio to a speech service of their own to recognize it.
 */
export declare class Dictation {
    #private;
    /** The browser's speech recognition, or null. */
    static get recognitionClass(): (new () => Recognition) | null;
    static get isAvailable(): boolean;
    static isDictating(editor: Editor): boolean;
    /** Starts dictating into an editor, or stops when it already is. */
    static toggle(editor: Editor): void;
    static start(editor: Editor): Dictation | null;
    private constructor();
    /** Stops dictating; words already heard still go in. */
    stop(): void;
}
/** The Dictate tool. */
export declare const DictationExtension: EditorExtension;
export {};
