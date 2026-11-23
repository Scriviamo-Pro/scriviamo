import { BlockShortcut, Editor, HTMLImporter, InspectorSection, Node, RichText, Strings, Stylesheet, TextHost, TextHostModes, TextNode } from "../internal";
/** Unstyled monospaced text, such as source code. */
export declare class CodeBlockNode extends TextNode {
    static exportStyles(sheet: Stylesheet, editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static captionString: string;
    static icon: string;
    static keywords: string;
    static languages: Array<string>;
    static markdownShortcuts: Array<BlockShortcut>;
    static blockKinds(strings: Strings, _compact: boolean): Array<[string, string, string]>;
    static fromBlockContent(_content: RichText, _value: number, source: TextNode): Array<Node>;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    language: string;
    tabWidth: number;
    get keepsParagraphs(): boolean;
    get inspectorShowsTypography(): boolean;
    plainContent(): RichText;
    joinedContent(addition: RichText): RichText;
    inspectorSections(): Array<InspectorSection>;
    protected get hostMode(): TextHostModes;
    protected get placeholderText(): string;
    protected build(body: HTMLElement): void;
    handleKeyDown(event: KeyboardEvent, host: TextHost | null): boolean;
    fromJSON(data: any): boolean;
    toJSON(): object;
    toHTML(): string;
    toMarkdown(): string;
    toPlainText(): string;
}
