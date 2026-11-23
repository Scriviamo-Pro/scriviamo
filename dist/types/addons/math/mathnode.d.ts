import { BlockShortcut, CodeBlockNode, Editor, EditorExtension, HTMLImporter, InspectorSection, Node, Stylesheet, TextHost, TextStyle } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const MathStrings: {
    TextMathCaption: string;
    TextMathSourceCaption: string;
    TextMathPlaceholder: string;
    TextMathLoadingCaption: string;
    TextMathUnavailableMessage: string;
    TextInlineMathCaption: string;
    TextInsertInlineMathCaption: string;
    TextInlineMathPlaceholder: string;
    TextInlineMathHint: string;
};
type MathStringsTable = typeof MathStrings;
declare module "scriviamo" {
    interface Strings extends MathStringsTable {
    }
}
/**
 * Loads KaTeX, which draws the formulas, the first time one is shown. By default it comes from
 * a CDN. An application that bundles KaTeX itself, or whose content security policy doesn't
 * allow the CDN, passes it to use() before formulas are shown, and loads KaTeX's stylesheet.
 *
 *     import katex from "katex"
 *     import "katex/dist/katex.min.css"
 *     MathRenderer.use(katex)
 */
export declare class MathRenderer {
    #private;
    /** Where KaTeX's ES module and stylesheet are loaded from. */
    static moduleURL: string;
    static stylesheetURL: string;
    /** Uses a KaTeX the application loaded itself, instead of loading it from moduleURL. */
    static use(katex: any): void;
    /** KaTeX, once it has loaded; null before then. */
    static get katex(): any;
    /** Resolves with KaTeX, loading it and its stylesheet the first time. */
    static load(): Promise<any>;
    /**
     * The formula as HTML; MathML for exports, which browsers draw without KaTeX's stylesheet. A
     * displayed formula stands on its own line; an inline one sits in the text.
     */
    static render(latex: string, output?: "html" | "mathml" | "htmlAndMathml", displayMode?: boolean): string;
}
/**
 * A displayed formula, written in LaTeX and drawn with KaTeX. The source is edited like a code
 * block; while the block isn't selected only the formula shows. HTML exports hold MathML, which
 * every current browser draws; Markdown exports use $$ blocks.
 */
export declare class MathNode extends CodeBlockNode {
    #private;
    static exportStyles(sheet: Stylesheet, editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static captionString: string;
    static icon: string;
    static keywords: string;
    static importPriority: number;
    static markdownShortcuts: Array<BlockShortcut>;
    static create(_editor: Editor): Node;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    /** The formula's LaTeX source. */
    get latex(): string;
    set latex(value: string);
    get typeName(): string;
    protected get placeholderText(): string;
    inspectorSections(): Array<InspectorSection>;
    protected build(body: HTMLElement): void;
    textChanged(host: TextHost): void;
    fromJSON(data: any): boolean;
    toJSON(): object;
    toHTML(): string;
    toMarkdown(): string;
    toPlainText(): string;
}
/** The suggestion provider identifier that marks inline formulas in text. */
export declare const InlineMathTag = "math";
/** An inline formula found in text: where it is, and its LaTeX source. */
export interface InlineFormula {
    host: TextHost;
    start: number;
    end: number;
    id: string;
    latex: string;
}
/**
 * Formulas inside text, such as $x^2$. A formula is a tag in the text, marked with the "math"
 * provider, whose text is its LaTeX source. The editor draws it with KaTeX and treats it as one
 * character: clicking it, or pressing Ctrl+Shift+E (Command-Shift-E on a Mac) beside it, edits its
 * source. Typing $x^2$ makes one, unless Markdown shortcuts are off.
 */
export declare class InlineMath {
    /** The style of a formula: the text's style, marked as a formula, with the tag's colors left out. */
    static style(base: TextStyle, id?: string): TextStyle;
    /** The text style without the formula's marking, for text typed after one. */
    static untagged(style: TextStyle): TextStyle;
    /** The formulas in one text, in order. */
    static formulas(host: TextHost): Array<InlineFormula>;
    /** The formula the caret is beside or the selection covers, or null. */
    static at(host: TextHost, start: number, end?: number): InlineFormula | null;
    /** Whether formulas can go in a text: rich text that isn't code. */
    static allowedIn(host: TextHost | null): boolean;
    /**
     * Puts a formula in place of start through end, or removes the range when latex is empty. One
     * undo step. The caret goes after it, and text typed there isn't part of it.
     */
    static replace(editor: Editor, host: TextHost, start: number, end: number, latex: string, id?: string): boolean;
    /**
     * Edits the formula beside the caret, or covering the selection; or else starts a new one at the
     * caret, from the selected text if there is any. Shows the formula's source in a popover.
     */
    static insert(editor: Editor): boolean;
    /** Shows the popover that edits a formula's source, with a preview. Enter finishes; Escape cancels. */
    static edit(editor: Editor, formula: InlineFormula): void;
    /** Draws a formula's elements: its source stays as hidden text, and KaTeX draws it beside. */
    static render(elements: Array<HTMLElement>, _host: TextHost): void;
}
/** The Inline Math tool, its key, clicking formulas, Backspace and Delete over them, and typing $…$. */
export declare const InlineMathExtension: EditorExtension;
export {};
