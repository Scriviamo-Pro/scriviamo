import { Alignments, DocumentColor, Node, TextStyle } from "./internal";
export declare enum BackgroundFills {
    actualSize = 0,
    stretch = 1,
    fit = 2,
    fill = 3
}
export declare enum BackgroundRepeats {
    noRepeat = 0,
    repeatX = 1,
    repeatY = 2,
    repeat = 3
}
/** A background picture for the document, a node, or a table cell. */
export declare class BackgroundImage {
    /** A data: URI or an http(s) URL. Empty when there is no image. */
    source: string;
    fill: BackgroundFills;
    repeat: BackgroundRepeats;
    static fromJSON(data: any): BackgroundImage;
    toJSON(): object;
    clone(): BackgroundImage;
    get isEmpty(): boolean;
    clear(): void;
    toCSS(): string;
    /** Reads background-image, background-size and background-repeat from a style into an image. */
    static applyCSS(image: BackgroundImage, style: CSSStyleDeclaration): void;
}
/** One side of a table cell's border. */
export interface CellBorder {
    visible: boolean;
    size: number;
    color: DocumentColor;
}
export interface TextRun {
    start: number;
    length: number;
    text: string;
    style: TextStyle;
}
/**
 * Styled text with the state of the container that holds it. Text nodes,
 * list items, table cells and column cells all keep their content in one.
 *
 * Indexes are JavaScript string (UTF-16) indexes. JSON uses character
 * (code point) counts, and conversion happens in fromJSON and toJSON.
 */
export declare class RichText {
    text: string;
    styles: Array<TextStyle>;
    alertType: number;
    headingLevel: number;
    textAlignment: Alignments;
    listType: number;
    verticalAlignment: number;
    hasCellBackgroundColor: boolean;
    cellBackgroundColor: DocumentColor;
    cellBorderTop: CellBorder;
    cellBorderRight: CellBorder;
    cellBorderBottom: CellBorder;
    cellBorderLeft: CellBorder;
    columnSpan: number;
    rowSpan: number;
    backgroundImage: BackgroundImage;
    listLevels: Array<number>;
    listChecked: Array<boolean>;
    /** Nodes embedded in this text's container, such as the blocks inside a table cell or a column. */
    nodes: Array<Node>;
    constructor(text?: string, style?: TextStyle);
    static defaultBorder(): CellBorder;
    get length(): number;
    /** Restores a snapshot. nodeFactory builds embedded nodes from their JSON. */
    static fromJSON(data: any, nodeFactory?: (data: any) => Node | null): RichText;
    toJSON(): object;
    /** Copies the text, styles and container state. Embedded nodes are not copied. */
    clone(): RichText;
    /** Copies container state (alignment, cell appearance, spans) but not the text. */
    copyStateFrom(other: RichText): void;
    styleAt(index: number): TextStyle;
    /** The style typing at the offset would receive: the previous character's, without link or tag. */
    insertionStyleAt(offset: number): TextStyle;
    /** Returns the text and styles from start through end (exclusive). */
    slice(start: number, end?: number): RichText;
    insert(offset: number, value: string | RichText, style?: TextStyle): void;
    remove(start: number, end: number): void;
    append(other: RichText): void;
    /** Calls change for the style of each character from start through end (exclusive). */
    applyStyle(start: number, end: number, change: (style: TextStyle) => void): void;
    /** True when test returns true for every non-break character in the range. */
    everyStyle(start: number, end: number, test: (style: TextStyle) => boolean): boolean;
    /** Groups consecutive characters with equal styles. */
    runs(start?: number, end?: number, matches?: (a: TextStyle, b: TextStyle) => boolean): Array<TextRun>;
    /** Character offsets where each paragraph (list item, code line) starts and ends. */
    paragraphs(): Array<{
        start: number;
        end: number;
    }>;
    paragraphIndexAt(offset: number): number;
    /** Exported HTML for the range. Paragraph and line breaks become br elements. */
    htmlText(start?: number, end?: number): string;
    static htmlRun(value: string, style: TextStyle): string;
    /** Markdown for the range. */
    markdownText(start?: number, end?: number, ignoreBold?: boolean): string;
    static markdownEscape(value: string): string;
    static markdownCodeSpan(value: string): string;
}
