import { Alignments, BlockShortcut, Editor, HTMLImporter, InspectorSection, Node, RichText, Strings, Stylesheet, TextHost, TextHostModes, TextStyle, ToolbarItem, ToolbarMenuItem } from "../internal";
/** A paragraph of styled text. The base class of the other text blocks. */
export declare class TextNode extends Node {
    /** Adds this node type's rules to the HTML export stylesheet. Called once per type in the document. */
    static exportStyles(sheet: Stylesheet, _editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static captionString: string;
    static icon: string;
    static keywords: string;
    static create(editor: Editor): Node;
    content: RichText;
    fontName: string;
    fontSize: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    textAlignment: Alignments;
    constructor(text?: string);
    get isTextual(): boolean;
    static blockKinds(strings: Strings, _compact: boolean): Array<[string, string, string]>;
    /** Makes a block of this type from another text block's plain content, when converting blocks. */
    static fromBlockContent(content: RichText, _value: number, source: TextNode): Array<Node>;
    /**
     * True for ordinary text blocks, which can be converted to other block types, split
     * to insert content, and joined with neighboring text. False for blocks whose text
     * is a caption for other content, such as a collapsible section's summary.
     */
    get isTextBlock(): boolean;
    /** True when Delete at the end joins the following text into this block, and this block into the one before. */
    get joinsForward(): boolean;
    /** True when Backspace at the start turns the block into a paragraph before joining it to the one before. */
    get becomesTextOnBackspace(): boolean;
    /** True when the text keeps line feeds as paragraphs, such as list items or code, instead of turning them into line breaks. */
    get keepsParagraphs(): boolean;
    /** Whether the inspector offers the block's text and its typography. */
    get inspectorShowsText(): boolean;
    /**
     * Whether the text lines up within the block, so the inspector offers Text Alignment. False for
     * a block only as wide as its text, such as a button, which moves with Alignment instead.
     */
    get alignsText(): boolean;
    get inspectorShowsTypography(): boolean;
    /** Adjusts content that replaces this block's text from the inspector, which has paragraphs paragraphs. */
    prepareReplacementContent(_replacement: RichText, _paragraphs: number): void;
    /** Text from another block that is being joined onto the end of this one, adjusted to this block's kind. */
    joinedContent(addition: RichText): RichText;
    /** The content without this block type's own styling, for converting it into another type. */
    protected undrawnTexts(): Array<RichText>;
    plainContent(): RichText;
    /**
     * Converts this block for setBlockType when the block handles the conversion itself,
     * or returns null to make a block of the requested type from its plain content.
     * Choosing a block's own type turns it back into a paragraph.
     */
    convertBlock(kind: string, _value: number): Array<Node> | null;
    inspectorSections(): Array<InspectorSection>;
    get text(): string;
    set text(value: string);
    /** The element that holds the editable text. */
    protected get tagName(): string;
    protected get hostMode(): TextHostModes;
    /** Placeholder shown while the text is empty. */
    protected get placeholderText(): string;
    /** The style new text receives when the paragraph is empty. */
    baseStyle(): TextStyle;
    protected build(body: HTMLElement): void;
    protected applyTextAppearance(element: HTMLElement): void;
    resolvedTextAlignment(): Alignments;
    static cssAlignment(value: Alignments): string;
    /** Creates the node that Enter splits off the end of this one. Paragraphs follow most blocks. */
    createFollowingNode(): TextNode;
    toJSON(): object;
    fromJSON(data: any): boolean;
    protected htmlTextAlignmentCSS(): string;
    toHTML(): string;
    toMarkdown(): string;
}
export declare enum HeadingLevels {
    heading1 = 1,
    heading2 = 2,
    heading3 = 3,
    heading4 = 4,
    heading5 = 5,
    heading6 = 6
}
export declare class HeadingNode extends TextNode {
    static exportStyles(sheet: Stylesheet, editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static captionString: string;
    static icon: string;
    static keywords: string;
    static create(editor: Editor): Node;
    constructor(text?: string, level?: HeadingLevels);
    static markdownShortcuts: Array<BlockShortcut>;
    static blockKinds(strings: Strings, compact: boolean): Array<[string, string, string]>;
    static fromBlockContent(content: RichText, value: number, source: TextNode): Array<Node>;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    get blockKind(): string;
    convertBlock(kind: string, value: number): Array<Node> | null;
    plainContent(): RichText;
    joinedContent(addition: RichText): RichText;
    inspectorSections(): Array<InspectorSection>;
    static fontSizeForLevel(level: number): number;
    get level(): HeadingLevels;
    set level(value: HeadingLevels);
    /** The fragment identifier a table of contents links to. */
    get anchor(): string;
    baseStyle(): TextStyle;
    protected get tagName(): string;
    protected get placeholderText(): string;
    textChanged(_host: TextHost): void;
    fromJSON(data: any): boolean;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean;
    toHTML(): string;
    toMarkdown(): string;
}
