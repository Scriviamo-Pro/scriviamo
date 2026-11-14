import { BlockShortcut, DocumentColor, Editor, HTMLImporter, InspectorSection, Node, Stylesheet, ToolbarItem, ToolbarMenuItem } from "../internal";
/** A horizontal rule. */
export declare class DividerNode extends Node {
    static exportStyles(sheet: Stylesheet, _editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    static markdownShortcuts: Array<BlockShortcut>;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    readImportedStyle(style: CSSStyleDeclaration): void;
    inspectorSections(): Array<InspectorSection>;
    lineThickness: number;
    /** The line color. The empty color uses the theme's border color. */
    lineColor: DocumentColor;
    protected build(body: HTMLElement): void;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean;
    toJSON(): object;
    fromJSON(data: any): boolean;
    /** The line color exported for a divider without its own color. */
    static defaultLineCSS: string;
    toHTML(): string;
    toMarkdown(): string;
    toPlainText(): string;
}
