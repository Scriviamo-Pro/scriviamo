import { Editor, HTMLImporter, InspectorSection, Node, RichText, Strings, Stylesheet, TextNode, ToolbarItem, ToolbarMenuItem } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const CalloutsStrings: {
    TextAlertInspectorCaption: string;
    TextInfoCaption: string;
    TextSuccessCaption: string;
    TextWarningCaption: string;
    TextDangerCaption: string;
};
type CalloutsStringsTable = typeof CalloutsStrings;
declare module "scriviamo" {
    interface Strings extends CalloutsStringsTable {
    }
}
export declare enum AlertTypes {
    info = 0,
    success = 1,
    warning = 2,
    danger = 3
}
export declare class AlertNode extends TextNode {
    static exportStyles(sheet: Stylesheet, editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    static readonly typeNames: Array<string>;
    static readonly typeIcons: Array<string>;
    static blockKinds(strings: Strings, _compact: boolean): Array<[string, string, string]>;
    static fromBlockContent(content: RichText, value: number, source: TextNode): Array<Node>;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    get blockKind(): string;
    convertBlock(kind: string, value: number): Array<Node> | null;
    inspectorSections(): Array<InspectorSection>;
    get alertType(): AlertTypes;
    set alertType(value: AlertTypes);
    protected get placeholderText(): string;
    typeCaption(value: AlertTypes): string;
    protected build(body: HTMLElement): void;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean;
    createFollowingNode(): TextNode;
    toHTML(): string;
    toMarkdown(): string;
}
export {};
