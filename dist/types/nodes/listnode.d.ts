import { BlockShortcut, Editor, EditorExtension, HTMLImporter, InspectorSection, Node, RichText, Strings, Stylesheet, TextHost, TextHostModes, TextNode, ToolbarItem, ToolbarMenuItem } from "../internal";
export declare enum ListTypes {
    unordered = 0,
    ordered = 1,
    checklist = 2
}
/** A bulleted, numbered or checklist list. Items are paragraphs of one RichText, each with a nesting level. */
export declare class ListNode extends TextNode {
    #private;
    static exportStyles(sheet: Stylesheet, editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    static maximumLevel: number;
    static markdownShortcuts: Array<BlockShortcut>;
    static blockKinds(strings: Strings, _compact: boolean): Array<[string, string, string]>;
    static fromBlockContent(content: RichText, value: number, source: TextNode): Array<Node>;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    static create(editor: Editor): Node;
    constructor(text?: string, type?: ListTypes);
    get blockKind(): string;
    get joinsForward(): boolean;
    get becomesTextOnBackspace(): boolean;
    get keepsParagraphs(): boolean;
    prepareReplacementContent(replacement: RichText, paragraphs: number): void;
    /** Changes the list's type, or splits it into one block per item for any other kind; a list's own type turns it into paragraphs. */
    convertBlock(kind: string, value: number): Array<Node> | null;
    inspectorSections(): Array<InspectorSection>;
    get listType(): ListTypes;
    set listType(value: ListTypes);
    get itemCount(): number;
    levelAt(item: number): number;
    protected get tagName(): string;
    protected get hostMode(): TextHostModes;
    protected get placeholderText(): string;
    protected build(body: HTMLElement): void;
    handleKeyDown(event: KeyboardEvent, host: TextHost | null): boolean;
    /** Indents (1) or outdents (-1) the items in the current selection. */
    changeLevel(delta: number): void;
    /** Whether a checklist item is checked. */
    isChecked(item: number): boolean;
    /** Checks or unchecks a checklist item, as one undo step. Returns whether it changed. */
    setChecked(item: number, checked: boolean): boolean;
    handleClick(event: MouseEvent): boolean;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean;
    toHTML(): string;
    toMarkdown(): string;
    /** The items' text, one per line, without markers. */
    toPlainText(): string;
}
/** The list buttons, indent and outdent, and their keyboard shortcuts. */
export declare const ListExtension: EditorExtension;
