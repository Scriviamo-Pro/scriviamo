import { Editor, HTMLImporter, InspectorSection, Node, Stylesheet, TableNode, ToolbarItem, ToolbarMenuItem } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const StepsStrings: {
    TextStepsCaption: string;
    TextTimelineCaption: string;
    TextStepsStyleCaption: string;
    TextAddStepCaption: string;
    TextRemoveStepCaption: string;
    TextMoveStepUpCaption: string;
    TextMoveStepDownCaption: string;
    TextStepLabelPlaceholder: string;
    TextStepCaption: string;
};
type StepsStringsTable = typeof StepsStrings;
declare module "scriviamo" {
    interface Strings extends StepsStringsTable {
    }
}
/** How a steps block draws: numbered steps, or a timeline with a date or label on each entry. */
export declare enum StepsStyles {
    numbered = 0,
    timeline = 1
}
/**
 * A numbered procedure or a timeline: a list of steps, each holding text and blocks. On a
 * timeline, each entry also has a label, such as a date. Each step is a cell of a one-column
 * table, so steps hold blocks the same way table cells and columns do.
 */
export declare class StepsNode extends TableNode {
    #private;
    static exportStyles(sheet: Stylesheet, editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static captionString: string;
    static icon: string;
    static keywords: string;
    /** Ahead of the list node, which would otherwise read these lists as plain ones. */
    static importPriority: number;
    static create(editor: Editor): Node;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    stepsStyle: StepsStyles;
    /** Each step's label, shown on a timeline, such as a date. */
    labels: Array<string>;
    constructor(steps?: number);
    /** The number of steps. */
    get count(): number;
    ensureLabels(): void;
    get typeName(): string;
    inspectorSections(): Array<InspectorSection>;
    protected build(body: HTMLElement): void;
    /** Adds an empty step before step at. */
    insertRow(at: number): void;
    /** Removes a step, with its label and blocks. The last step stays. */
    removeRow(row: number): void;
    /** Moves a step up or down, with its label. */
    moveStep(index: number, by: number): void;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
    /** A numbered list, with each step's blocks indented under it; a timeline's labels lead in bold. */
    toMarkdown(): string;
    toPlainText(): string;
}
export {};
