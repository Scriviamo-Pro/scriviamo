import { Editor, EditorExtension, Node } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const FocusStrings: {
    TextFocusModeCaption: string;
    TextFocusModeOnCaption: string;
    TextTypewriterScrollingCaption: string;
};
type FocusStringsTable = typeof FocusStrings;
declare module "scriviamo" {
    interface Strings extends FocusStringsTable {
    }
}
/** An editor's focus mode settings. */
export interface FocusModeSettings {
    /** Dims every block but the one being written in. */
    enabled: boolean;
    /** Keeps the line being written in at the same height in the editor, as on a typewriter. */
    typewriter: boolean;
}
/**
 * Focus mode: every block but the one being written in fades, so the current paragraph stands
 * out. Typewriter scrolling also keeps the line being written at the same height, about a third of
 * the way down, so the eyes stay in one place.
 *
 *   FocusMode.set(editor, {enabled: true, typewriter: true})
 *
 * It's a view setting: it isn't saved with the document.
 */
export declare class FocusMode {
    #private;
    /** How far down the editor the current line stays while typewriter scrolling, from 0 to 1. */
    static typewriterPosition: number;
    static settings(editor: Editor): FocusModeSettings;
    static isOn(editor: Editor): boolean;
    /** Changes the settings given; the rest stay as they are. */
    static set(editor: Editor, settings: Partial<FocusModeSettings>): void;
    static toggle(editor: Editor): void;
    /** The top-level block holding the caret or the selection. */
    static currentBlock(editor: Editor): Node | null;
    /** Marks the current block, and scrolls it into place while typewriter scrolling. */
    static update(editor: Editor): void;
}
/** The Focus Mode tool, and following the caret. */
export declare const FocusModeExtension: EditorExtension;
export {};
