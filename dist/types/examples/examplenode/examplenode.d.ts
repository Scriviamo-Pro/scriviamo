import { DocumentColor, Editor, HTMLImporter, InspectorSection, Node, TextHost, TextNode, ToolbarItem, ToolbarMenuItem } from "scriviamo";
/**
 * An example of a node type an application adds: a titled block with an accent bar, built on
 * TextNode. It shows how a node type draws itself, adds node toolbar items and context-menu
 * commands, handles keys while selected, describes inspector properties, imports and exports
 * HTML and Markdown, and saves itself as JSON.
 *
 *     import {ExampleNode} from "./scriviamo.example.examplenode.js"
 *
 *     editor.addNode(new ExampleNode("Application-defined node", {red: 124, green: 58, blue: 237, alpha: 0}))
 *
 * accentColor colors the bar and isEmphasized switches to the emphasized appearance. Both are
 * offered in the node toolbar, the context menu and the inspector; E toggles emphasis while the
 * node is selected. The node's text is in Strings, so a locale pack can translate it.
 */
/** The example's interface text. A locale pack applied to an editor replaces any of it. */
declare const ExampleStrings: {
    TextExampleCaption: string;
    TextExampleDefaultTitle: string;
    TextExampleAccentCaption: string;
    TextExampleAccentColorCaption: string;
    TextExampleAccentTooltip: string;
    TextExampleBlueCaption: string;
    TextExampleGreenCaption: string;
    TextExampleOrangeCaption: string;
    TextExamplePurpleCaption: string;
    TextExampleEmphasizeCaption: string;
    TextExampleEmphasizeTooltip: string;
    TextExampleRemoveEmphasisCaption: string;
    TextExampleEmphasizedCaption: string;
    TextExampleUseNextAccentCaption: string;
    TextExampleTitleCaption: string;
};
type ExampleStringTable = typeof ExampleStrings;
declare module "scriviamo" {
    interface Strings extends ExampleStringTable {
    }
}
export declare class ExampleNode extends TextNode {
    #private;
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    /** Asides with an accent bar are this type's, so it reads them before other types. */
    static importPriority: number;
    /** The accent colors the toolbar and context menu offer: blue, green, orange and purple. */
    static readonly accents: Array<DocumentColor>;
    static create(editor: Editor): Node;
    /** An aside whose left border is the accent bar, as toHTML writes it. */
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    constructor(title?: string, accentColor?: DocumentColor | null);
    get typeName(): string;
    get canResize(): boolean;
    /** The text, or the default title for a new node. */
    get title(): string;
    set title(value: string);
    get accentColor(): DocumentColor;
    set accentColor(value: DocumentColor);
    /** Emphasized text is bold. */
    get isEmphasized(): boolean;
    set isEmphasized(value: boolean);
    protected get placeholderText(): string;
    protected build(body: HTMLElement): void;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean;
    contextMenuItems(): Array<ToolbarMenuItem>;
    performContextMenuItem(item: ToolbarMenuItem): boolean;
    /** E toggles emphasis while the node is selected but its text isn't being edited. */
    handleKeyDown(event: KeyboardEvent, host: TextHost | null): boolean;
    inspectorSections(): Array<InspectorSection>;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
    toMarkdown(): string;
    toPlainText(): string;
}
export {};
