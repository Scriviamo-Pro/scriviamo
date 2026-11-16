import { Alignments, BackgroundImage, Directions, DocumentColor, Editor, Node, RichText, TextNode, TextStyle } from "./internal";
/** Builds nodes from HTML. Used by fromHTML, insertHTML and pasting. */
/** The document-level appearance read from imported HTML or Markdown; null values are left as they are. */
export interface DocumentStyle {
    fontName: string;
    fontSize: number;
    backgroundColor: DocumentColor | null;
    backgroundImage: BackgroundImage | null;
    direction: Directions | null;
}
export declare class HTMLImporter {
    #private;
    /**
     * Reads inline elements an add-on exports, such as formulas, into text with a style, instead of
     * reading their contents. The reader returns null for elements it doesn't know.
     */
    static registerInlineElement(reader: InlineElementReader): void;
    constructor(editor: Editor);
    /** Parses HTML into nodes. The nodes belong to no list until they are inserted. */
    import(html: string): Array<Node>;
    /** The document-level styles of a full HTML page: the body's font and background, and the page's direction. */
    documentStyle(html: string): DocumentStyle;
    /** The document-level styles an element sets, such as a page's body. */
    elementDocumentStyle(element: HTMLElement | null): DocumentStyle;
    importChildren(parent: globalThis.Node): Array<Node>;
    /**
     * Applies an element's block styles to the node made from it: background image,
     * direction, borders, corner radii, block alignment from automatic margins, and
     * line height. Values the element doesn't set are left alone.
     */
    readBlockStyle(element: HTMLElement, node: Node): void;
    /** Reads a CSS line-height as a multiple of the font size and extra spacing in pixels, or null. */
    static lineMetrics(value: string): {
        lineHeight: number;
        lineSpacing: number;
    } | null;
    /** The editor the nodes are imported into. */
    get editor(): Editor;
    /** Connects an imported node to the editor, so it reads the editor's settings. Returns the node. */
    attach<T extends Node>(node: T): T;
    /** Whether the editor has a node type registered, so its content can be imported. */
    hasType(identifier: string): boolean;
    blockNode(element: HTMLElement): Node | Array<Node> | null | undefined;
    /** Whether an element starts a block of its own rather than continuing the text around it. */
    isBlockElement(element: HTMLElement): boolean;
    /** Reads a text block's alignment from an element's text-align or align. */
    readAlignment(element: HTMLElement, node: TextNode): void;
    /** Whether an element's content runs right to left: from its dir or direction, or from its text. */
    static isRightToLeft(element: HTMLElement, text: string): boolean;
    /** Maps a CSS text-align keyword to a logical alignment; physical left and right follow the direction. */
    static alignmentFromCSS(value: string, rightToLeft: boolean): Alignments | null;
    /** Converts inline DOM content into styled text. */
    richText(nodes: Array<globalThis.Node>, inherited?: TextStyle, preformatted?: boolean): RichText;
    /** Removes leading and trailing whitespace and collapses spaces around line breaks. */
    /** The text without leading and trailing white space. */
    trimmed(rich: RichText): RichText;
}
/**
 * Reads one inline element into text: the text and its style, given the style around the element.
 * Returns null for elements it doesn't read.
 */
export type InlineElementReader = (element: Element, style: TextStyle) => {
    text: string;
    style: TextStyle;
} | null;
/**
 * An inline Markdown syntax an add-on adds, such as $formulas$. It receives the text with code
 * spans and escapes already set aside, and returns it with its syntax replaced by HTML, each piece
 * of HTML passed through stash so later rules leave it alone.
 */
export type MarkdownInlineRule = (text: string, stash: (html: string) => string) => string;
/** Converts Markdown into HTML for the HTML importer. Covers CommonMark blocks, GitHub tables, task lists and alerts. */
export declare class MarkdownConverter {
    #private;
    /** Adds an inline syntax; see MarkdownInlineRule. */
    static registerInlineRule(rule: MarkdownInlineRule): void;
    static toHTML(markdown: string): string;
    /** Converts inline Markdown into HTML. */
    static inline(value: string): string;
}
