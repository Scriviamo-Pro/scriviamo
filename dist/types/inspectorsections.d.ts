import { BackgroundImage, DocumentColor, Editor, Node, Strings, TableNode, TextNode } from "./internal";
export declare enum InspectorEditors {
    automatic = 0,
    text = 1,
    multilineText = 2,
    number = 3,
    toggle = 4,
    menu = 5,
    color = 6,
    image = 7,
    file = 8,
    action = 9
}
export interface InspectorChoice {
    caption: string;
    value: any;
}
/**
 * One row of the inspector: a caption and an editor for one value of the
 * inspected object. The value is read and written with getter and setter,
 * or, when they aren't set, with the property named by propertyName.
 */
export declare class InspectorItem {
    #private;
    identifier: string;
    caption: string;
    propertyName: string;
    editor: InspectorEditors;
    description: string;
    enabled: boolean;
    readOnly: boolean;
    minimumValue: number;
    maximumValue: number;
    stepValue: number;
    /** False applies text only when the edit is committed (Return, Tab or leaving the field). */
    updatesLive: boolean;
    /** The button caption of an action item. */
    actionCaption: string;
    /** The accept attribute of a file item's chooser, such as "image/*". */
    fileFilter: string;
    /** A number item whose value is zero shows this instead, such as "Automatic". */
    zeroCaption: string;
    getter: ((target: any) => any) | null;
    setter: ((target: any, value: any) => void) | null;
    /** Returns false for targets the item doesn't apply to. */
    availability: ((target: any) => boolean) | null;
    /** Runs an action item. Without it, the target's inspectorAction handles the item. */
    action: ((target: any) => void) | null;
    constructor(identifier: string, caption: string, propertyName?: string, editor?: InspectorEditors);
    /** Makes an item read and written by functions. */
    static bound(identifier: string, caption: string, editor: InspectorEditors, getter: (target: any) => any, setter: ((target: any, value: any) => void) | null): InspectorItem;
    static menu(identifier: string, caption: string, choices: Array<[string, any]>, getter: (target: any) => any, setter: (target: any, value: any) => void): InspectorItem;
    static number(identifier: string, caption: string, getter: (target: any) => any, setter: (target: any, value: any) => void, minimum?: number, maximum?: number, step?: number): InspectorItem;
    static actionItem(identifier: string, caption: string, actionCaption: string, run: (target: any) => void): InspectorItem;
    addChoice(caption: string, value: any): void;
    choices(): Array<InspectorChoice>;
    get lastChoiceIndex(): number;
    choiceCaptionAt(index: number): string;
    choiceValueAt(index: number): any;
    /** Sets the value Reset to Default assigns. A function receives the target. */
    setDefaultValue(value: any): void;
    get hasDefaultValue(): boolean;
    /** The value a reset assigns for target, or undefined when there is none. */
    defaultValueFor(target: any): any;
    static pristine(target: any): any;
    isAvailable(target: any): boolean;
    value(target: any): any;
    /** Assigns value to target. Returns false when the item can't be written. */
    setValue(target: any, value: any): boolean;
    /** Whether two values are the same, comparing colors and objects by content. */
    static same(a: any, b: any): boolean;
}
/** An ordered, collapsible group of related inspector items. */
export declare class InspectorSection {
    #private;
    identifier: string;
    caption: string;
    constructor(identifier: string, caption: string);
    add(item: InspectorItem): InspectorItem;
    addAt(index: number, item: InspectorItem): void;
    indexOf(item: InspectorItem | string): number;
    item(identifier: string): InspectorItem | null;
    itemAt(index: number): InspectorItem | null;
    items(): Array<InspectorItem>;
    get lastIndex(): number;
    removeAt(index: number): void;
    remove(item: InspectorItem | string): void;
    removeAll(): void;
}
/** The inspector sections of the built-in nodes and of the document. */
export declare class InspectorDefaults {
    #private;
    static alignmentChoices(strings: Strings, automatic: boolean): Array<[string, any]>;
    /** The Background Image section for an object with a backgroundImage property. */
    static backgroundImageSection(strings: Strings, read: (target: any) => BackgroundImage, write: (target: any, value: BackgroundImage) => void, identifier?: string): InspectorSection;
    static borderItems(section: InspectorSection, strings: Strings, prefix: string, read: (target: any, side: string) => {
        visible: boolean;
        size: number;
        color: DocumentColor;
    }, write: (target: any, side: string, change: (border: {
        visible: boolean;
        size: number;
        color: DocumentColor;
    }) => void) => void): void;
    /** Sections every node has: content, appearance, borders, corners, dimensions and background image. */
    static node(node: Node): Array<InspectorSection>;
    /** Replaces a text block's text, keeping the style of its first character. */
    static setPlainText(node: TextNode, value: string): void;
    static text(node: TextNode): Array<InspectorSection>;
    /** A section holding items. */
    static section(identifier: string, caption: string, items: Array<InspectorItem>): InspectorSection;
    /** The built-in sections for a node: a text block's text, typography and appearance, or another node's appearance. Node types add their own sections by overriding inspectorSections. */
    static sections(node: Node): Array<InspectorSection>;
    /** The selected cell's appearance and borders. */
    static cellSections(node: TableNode, caption: string): Array<InspectorSection>;
    /** The document's sections. */
    static document(editor: Editor): Array<InspectorSection>;
}
