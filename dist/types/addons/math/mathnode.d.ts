import { BlockShortcut, CodeBlockNode, Editor, HTMLImporter, InspectorSection, Node, Stylesheet, TextHost } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const MathStrings: {
    TextMathCaption: string;
    TextMathSourceCaption: string;
    TextMathPlaceholder: string;
    TextMathLoadingCaption: string;
    TextMathUnavailableMessage: string;
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
    /** The formula as HTML; MathML for exports, which browsers draw without KaTeX's stylesheet. */
    static render(latex: string, output?: "html" | "mathml" | "htmlAndMathml"): string;
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
export {};
