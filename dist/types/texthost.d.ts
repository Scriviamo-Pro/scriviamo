import { Node, RichText, TextStyle } from "./internal";
export declare enum TextHostModes {
    /** One paragraph. Shift+Enter adds line breaks. Paragraphs, headings, quotes, captions. */
    inline = 0,
    /** Several paragraphs separated by ParagraphBreak. Table cells and columns. */
    multiline = 1,
    /** One list item per paragraph, with listLevels and listChecked. */
    list = 2,
    /** Unstyled text such as code. */
    plain = 3
}
export interface TextSelectionRange {
    start: number;
    end: number;
}
/**
 * Binds a RichText to a contenteditable element. The element shows the text,
 * the browser edits it, and sync reads the edited DOM back into the RichText.
 */
/** Draws one tag in the editor: its elements, in order, and the text host they're in. */
export type TagRenderer = (elements: Array<HTMLElement>, host: TextHost) => void;
export declare class TextHost {
    #private;
    node: Node;
    rich: RichText;
    element: HTMLElement;
    mode: TextHostModes;
    placeholder: string;
    /** Position of this host among its node's hosts. Used to restore selections. */
    index: number;
    /**
     * Draws one provider's tags differently from text, such as a formula drawn from its source. The
     * renderer receives each tag's elements after the text is drawn: usually one span, or several
     * when formatting splits the tag. It may add elements with the class "scv-widget", which aren't
     * part of the text. A tag made contenteditable="false" is one unit for the caret.
     */
    static registerTagRenderer(provider: string, renderer: TagRenderer | null): void;
    constructor(node: Node, rich: RichText, element: HTMLElement, mode?: TextHostModes);
    static from(target: globalThis.Node | null, root?: HTMLElement): TextHost | null;
    set editable(value: boolean);
    get editable(): boolean;
    render(): void;
    /** Updates ordered and bulleted list markers after items were added, removed or re-leveled. */
    refreshMarkers(): void;
    static alphabetic(value: number): string;
    static roman(value: number): string;
    updateEmptyState(): void;
    /** Reads the edited DOM into the RichText. Returns true when the text or styles changed. */
    sync(): boolean;
    static mergeSemantic(target: TextStyle, source: TextStyle): void;
    /** Adds the formatting an HTML element implies to style. Returns true when it added any. */
    static applyElementStyle(element: HTMLElement, style: TextStyle): boolean;
    /** The selection inside this host as model offsets, or null when it is elsewhere. */
    selection(): TextSelectionRange | null;
    /** Converts a DOM position inside the element to a model offset. */
    offsetOf(container: globalThis.Node, offset: number): number;
    /** Converts a model offset to a DOM position inside the element. */
    positionOf(offset: number): {
        node: globalThis.Node;
        offset: number;
    };
    select(start: number, end?: number): void;
    focus(atEnd?: boolean): void;
    /** Bounds of the caret, used to decide whether arrow keys leave the host. */
    caretRect(): DOMRect | null;
    isCaretOnFirstLine(): boolean;
    isCaretOnLastLine(): boolean;
}
