import { Alignments, DocumentColor, Editor, TextStyle } from "./internal";
export declare enum FormattingStyles {
    bold = 0,
    italic = 1,
    underline = 2,
    strikethrough = 3,
    code = 4,
    highlight = 5,
    keyboard = 6,
    superscript = 7,
    subscript = 8
}
/** Character formatting commands for the selected text, or for all the text of the selected nodes. */
export declare class Formatting {
    #private;
    static readonly propertyNames: Array<string>;
    constructor(editor: Editor);
    get owner(): Editor;
    /** The style at the caret, or of the first selected character. */
    currentStyle(): TextStyle;
    canApply(style?: FormattingStyles): boolean;
    isApplied(style: FormattingStyles): boolean;
    toggle(style: FormattingStyles): void;
    /**
     * Calls change for the style of every character in the targets, then shows
     * the result. With only a caret, the change applies to the next typed text.
     */
    apply(change: (style: TextStyle) => void): void;
    setTextColor(color: DocumentColor | null): void;
    setBackgroundColor(color: DocumentColor | null): void;
    /** Sets the font family. An empty name follows the document font. */
    setFontName(name: string): void;
    /** Sets the font size in points. Zero follows the document size. */
    setFontSize(size: number): void;
    get canClearFormatting(): boolean;
    /** Removes character formatting, keeping links. */
    clearFormatting(): void;
    get canAlign(): boolean;
    /** The alignment of the text being edited, or of the selected node. */
    get alignment(): Alignments;
    /** Aligns the text being edited, or the selected nodes. Text aligns within its block; other nodes align on the page. */
    align(value: Alignments): void;
    get canEditLink(): boolean;
    /** Shows the link dialog for the selection, adding, changing or removing its link. */
    editLink(): Promise<void>;
    removeLink(): void;
}
