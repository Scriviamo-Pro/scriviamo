import { BlockShortcut, Editor, HTMLImporter, InspectorSection, Node, Strings, Stylesheet, TextHost, TextNode } from "../internal";
export declare class QuoteNode extends TextNode {
    #private;
    static exportStyles(sheet: Stylesheet, editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static captionString: string;
    static icon: string;
    static keywords: string;
    static markdownShortcuts: Array<BlockShortcut>;
    static blockKinds(strings: Strings, _compact: boolean): Array<[string, string, string]>;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    inspectorSections(): Array<InspectorSection>;
    citation: string;
    protected get placeholderText(): string;
    protected build(body: HTMLElement): void;
    textChanged(host: TextHost): void;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
    toMarkdown(): string;
    toPlainText(): string;
}
