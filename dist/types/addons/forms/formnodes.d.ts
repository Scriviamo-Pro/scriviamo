import { DialogField, Editor, HTMLImporter, InspectorEditors, InspectorItem, InspectorSection, Node, RichText, Stylesheet, TableNode, TextHost, TextHostModes, TextNode, ToolbarItem, ToolbarMenuItem } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const FormsStrings: {
    TextFormCaption: string;
    TextAreaCaption: string;
    TextCheckboxCaption: string;
    TextRadioGroupCaption: string;
    TextDropdownCaption: string;
    TextDatalistCaption: string;
    TextButtonCaption: string;
    TextLabelCaption: string;
    TextDefaultRadioGroupLegend: string;
    TextFirstOptionCaption: string;
    TextSecondOptionCaption: string;
    TextOptionNumberFormat: string;
    TextAddOptionCaption: string;
    TextRemoveOptionCaption: string;
    TextOptionsCaption: string;
    TextOptionsDialogPrompt: string;
    TextInputTypeCaption: string;
    TextButtonTypeCaption: string;
    TextSubmitCaption: string;
    TextLayoutCaption: string;
    TextHorizontalCaption: string;
    TextVerticalCaption: string;
    TextNameCaption: string;
    TextIDCaption: string;
    TextPlaceholderCaption: string;
    TextRequiredCaption: string;
    TextReadOnlyCaption: string;
    TextDisabledCaption: string;
    TextAutofocusCaption: string;
    TextValueCaption: string;
    TextForControlIDCaption: string;
    TextFormIDCaption: string;
    TextFormActionCaption: string;
    TextFormMethodCaption: string;
    TextFormTargetCaption: string;
    TextEncodingCaption: string;
    TextNoValidateCaption: string;
    TextAutocompleteCaption: string;
    TextMultipleCaption: string;
    TextVisibleRowsCaption: string;
    TextRowsCaption: string;
    TextColumnsWidthCaption: string;
    TextWrapCaption: string;
    TextMaxLengthCaption: string;
    TextMinLengthCaption: string;
    TextPatternCaption: string;
    TextDatalistIDCaption: string;
    TextDatalistLabelFormat: string;
    TextCheckedCaption: string;
    TextIndeterminateCaption: string;
    TextFieldInspectorCaption: string;
    TextInputCaption: string;
    TextInputModeCaption: string;
    TextDirectionNameCaption: string;
    TextSpellCheckCaption: string;
    TextNoneCaption: string;
    TextCommandCaption: string;
    TextCommandForCaption: string;
    TextPopoverTargetCaption: string;
    TextPopoverActionCaption: string;
    TextRelationshipCaption: string;
    TextAcceptCharsetCaption: string;
    TextLegendCaption: string;
    TextOptionLabelCaption: string;
    TextOptionValueCaption: string;
    TextDefaultSelectionCaption: string;
    TextOptionDisabledCaption: string;
    TextOptionCaption: string;
    TextAddBeforeCaption: string;
    TextAddAfterCaption: string;
    TextOnCaption: string;
    TextOffCaption: string;
    TextSoftCaption: string;
    TextHardCaption: string;
};
type FormsStringsTable = typeof FormsStrings;
declare module "scriviamo" {
    interface Strings extends FormsStringsTable {
    }
}
/** A choice in a dropdown, radio group or datalist. */
export declare class FormOption {
    captionContent: RichText;
    disabled: boolean;
    selected: boolean;
    value: string;
    constructor(caption?: string, value?: string, selected?: boolean);
    get caption(): string;
    set caption(value: string);
    static fromJSON(data: any): FormOption | null;
    toJSON(): object;
    clone(): FormOption;
    /** Options as editable text: one per line, "*" marks a selected option, "value | caption" sets a value. */
    static toLines(options: Array<FormOption>): string;
    static fromLines(text: string, previous: Array<FormOption>): Array<FormOption>;
}
/**
 * The base class of form controls. Each control keeps the attributes HTML
 * gives it, and offers them in a Properties dialog.
 */
/** The inspector sections and HTML import shared by the form controls. */
export declare class FormSupport {
    static optionSections(node: DropdownNode | DatalistNode, prefix: string, withSelection: boolean): Array<InspectorSection>;
    static formControl(node: FormControlNode): Array<InspectorSection>;
    /** Reads the attributes every form control has. */
    static readControl(element: HTMLElement, node: FormControlNode): void;
    /** Reads a text field's or text area's attributes. */
    static readField(element: HTMLElement, field: TextFieldNode): void;
    static item(identifier: string, caption: string, propertyName: string, editor: InspectorEditors): InspectorItem;
}
export declare class FormControlNode extends TextNode {
    get inspectorShowsText(): boolean;
    inspectorSections(): Array<InspectorSection>;
    static exportStyles(sheet: Stylesheet, editor: Editor | null): void;
    static insertable: boolean;
    autoFocus: boolean;
    disabled: boolean;
    formID: string;
    id: string;
    name: string;
    /** Fields for the Properties dialog. */
    propertyFields(): Array<DialogField>;
    /** Applies values from the Properties dialog. */
    applyProperties(values: {
        [name: string]: any;
    }): void;
    editProperties(): Promise<void>;
    protected propertiesItem(): ToolbarItem;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, _menuItem: ToolbarMenuItem | null): boolean;
    protected applyAppearance(wrapper: HTMLElement, body: HTMLElement): void;
    protected htmlFormAttributes(includeID?: boolean, includeStyle?: boolean): string;
    toJSON(): object;
    fromJSON(data: any): boolean;
    createFollowingNode(): TextNode;
    toMarkdown(): string;
}
export declare enum TextFieldTypes {
    text = 0,
    search = 1,
    telephone = 2,
    url = 3,
    email = 4,
    password = 5,
    number = 6,
    range = 7,
    date = 8,
    dateTimeLocal = 9,
    month = 10,
    week = 11,
    time = 12,
    color = 13,
    file = 14,
    hidden = 15
}
/** A single-line input field. Its editable text is the field's default value. */
export declare class TextFieldNode extends FormControlNode {
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    get inspectorShowsTypography(): boolean;
    inspectorSections(): Array<InspectorSection>;
    static insertable: boolean;
    static typeNames: Array<string>;
    inputType: TextFieldTypes;
    autoComplete: string;
    dirName: string;
    inputMode: string;
    listID: string;
    maxLength: number;
    minLength: number;
    pattern: string;
    placeholder: string;
    readOnly: boolean;
    required: boolean;
    size: number;
    spellCheck: string;
    get value(): string;
    set value(text: string);
    protected get hostMode(): TextHostModes;
    protected get placeholderText(): string;
    get supportsDatalist(): boolean;
    protected build(body: HTMLElement): void;
    textChanged(_host: TextHost): void;
    handleKeyDown(event: KeyboardEvent, host: TextHost | null): boolean;
    propertyFields(): Array<DialogField>;
    applyProperties(values: {
        [name: string]: any;
    }): void;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
    toPlainText(): string;
}
/** A multi-line input field. */
export declare class TextAreaNode extends TextFieldNode {
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    get keepsParagraphs(): boolean;
    columns: number;
    rows: number;
    wrap: string;
    protected build(body: HTMLElement): void;
    propertyFields(): Array<DialogField>;
    applyProperties(values: {
        [name: string]: any;
    }): void;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
}
/** A caption for a form control. */
export declare class LabelNode extends TextNode {
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    inspectorSections(): Array<InspectorSection>;
    static create(editor: Editor): Node;
    forID: string;
    protected get tagName(): string;
    protected get placeholderText(): string;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, _menuItem: ToolbarMenuItem | null): boolean;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
    toMarkdown(): string;
}
/** A checkbox. Its editable text is its caption; clicking the box changes its default state. */
export declare class CheckboxNode extends FormControlNode {
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    /** A checkbox input, or a label holding one, whose other content becomes the caption. */
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    inspectorSections(): Array<InspectorSection>;
    static insertable: boolean;
    static create(editor: Editor): Node;
    checked: boolean;
    indeterminate: boolean;
    required: boolean;
    value: string;
    get captionText(): string;
    protected get placeholderText(): string;
    protected build(body: HTMLElement): void;
    handleClick(event: MouseEvent): boolean;
    propertyFields(): Array<DialogField>;
    applyProperties(values: {
        [name: string]: any;
    }): void;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
    toPlainText(): string;
}
export declare enum ButtonTypes {
    submit = 0,
    reset = 1,
    button = 2
}
/** A button. Its editable text is its caption. */
export declare class ButtonNode extends FormControlNode {
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    inspectorSections(): Array<InspectorSection>;
    static insertable: boolean;
    static typeNames: Array<string>;
    static create(editor: Editor): Node;
    buttonType: ButtonTypes;
    command: string;
    commandFor: string;
    formAction: string;
    formEnctype: string;
    formMethod: string;
    formNoValidate: boolean;
    formTarget: string;
    popoverTarget: string;
    popoverTargetAction: string;
    value: string;
    protected get placeholderText(): string;
    protected build(body: HTMLElement): void;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean;
    propertyFields(): Array<DialogField>;
    applyProperties(values: {
        [name: string]: any;
    }): void;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
}
/** A dropdown list. Options are edited with the Options dialog. */
export declare class DropdownNode extends FormControlNode {
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    inspectorSections(): Array<InspectorSection>;
    static insertable: boolean;
    static create(editor: Editor): Node;
    options: Array<FormOption>;
    autoComplete: string;
    multiple: boolean;
    required: boolean;
    size: number;
    protected normalizeSelection(): void;
    protected build(body: HTMLElement): void;
    editOptions(): Promise<void>;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean;
    propertyFields(): Array<DialogField>;
    applyProperties(values: {
        [name: string]: any;
    }): void;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
    toPlainText(): string;
}
export declare enum RadioGroupLayouts {
    vertical = 0,
    horizontal = 1
}
/** A set of radio buttons with a legend. The legend and each option's caption are edited in place. */
export declare class RadioGroupNode extends DropdownNode {
    static exportStyles(sheet: Stylesheet, editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    get inspectorFollowsCaret(): boolean;
    noteCaretHost(host: TextHost): void;
    inspectorSections(): Array<InspectorSection>;
    static create(editor: Editor): Node;
    legendContent: RichText;
    layout: RadioGroupLayouts;
    /** The option whose caption last had the caret. Not saved. */
    activeOptionIndex: number;
    get legend(): string;
    protected build(body: HTMLElement): void;
    /** The option whose caption a host edits, or -1 for the legend. */
    optionIndexOf(host: TextHost | null): number;
    handleKeyDown(event: KeyboardEvent, host: TextHost | null): boolean;
    addOption(at?: number): void;
    removeOption(index: number): void;
    handleClick(event: MouseEvent): boolean;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean;
    propertyFields(): Array<DialogField>;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
    toPlainText(): string;
}
/** Suggestions that text fields offer, referenced by the fields' list ID. */
export declare class DatalistNode extends Node {
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    inspectorSections(): Array<InspectorSection>;
    static create(editor: Editor): Node;
    id: string;
    options: Array<FormOption>;
    protected build(body: HTMLElement): void;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, _menuItem: ToolbarMenuItem | null): boolean;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
    toPlainText(): string;
}
/** A form: a container for controls, with the attributes of an HTML form. */
export declare class FormNode extends TableNode {
    /** Not the table rules: this node's HTML has no table elements. */
    static exportStyles(sheet: Stylesheet, editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    inspectorSections(): Array<InspectorSection>;
    static create(editor: Editor): Node;
    acceptCharset: string;
    action: string;
    autoComplete: string;
    enctype: string;
    id: string;
    method: string;
    name: string;
    noValidate: boolean;
    rel: string;
    target: string;
    constructor();
    protected build(body: HTMLElement): void;
    handleKeyDown(_event: KeyboardEvent, _host: TextHost | null): boolean;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, _menuItem: ToolbarMenuItem | null): boolean;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
    toMarkdown(): string;
    toPlainText(): string;
}
export {};
