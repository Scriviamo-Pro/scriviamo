import { DocumentColor, Node, NodeClass, Strings, ToolbarMenuItem } from "./internal";
/**
 * A floating menu or panel. Pressing in it doesn't take focus from the text
 * being edited, so the text selection survives choosing a command.
 */
export declare class Popup {
    #private;
    element: HTMLElement;
    onClose: (() => void) | null;
    /** What the popup delivered when it closed by a choice, or null when it was dismissed. */
    chosenValue: any;
    /** Keeps focus where it is when pressing the popup. Off for popups with fields. */
    keepsFocus: boolean;
    /**
     * Whether pressing outside closes it, and opening another popup does. Off for panels that hold
     * work, such as an answer being written: they stay open until closed, and Escape closes them
     * while focus is inside.
     */
    dismissible: boolean;
    /** Supplies the anchor's current rectangle; the popup then follows it when the page scrolls instead of closing. */
    anchorProvider: (() => DOMRect | null) | null;
    constructor(classes?: string);
    static get current(): Popup | null;
    static closeAll(): void;
    get isOpen(): boolean;
    /**
     * Shows the popup below the anchor, inside container so it shares the editor's theme. It opens
     * in the browser's top layer where it can, so the editor's bounds, overflow and stacking don't
     * clip or cover it.
     */
    show(anchor: HTMLElement | DOMRect, container: HTMLElement): void;
    position(): void;
    close(): void;
    protected handleKey(event: KeyboardEvent): void;
}
interface MenuEntry {
    item: ToolbarMenuItem;
    button: HTMLButtonElement;
}
/** One level of a popup menu: the root list or a submenu. */
declare class MenuList {
    #private;
    element: HTMLElement;
    parent: MenuList | null;
    entries: Array<MenuEntry>;
    active: number;
    submenu: MenuList | null;
    submenuEntry: MenuEntry | null;
    constructor(menu: PopupMenu, element: HTMLElement, items: Array<ToolbarMenuItem>, parent: MenuList | null);
    get enabledIndexes(): Array<number>;
    setActive(index: number, scroll?: boolean): void;
    move(delta: number): void;
    openSubmenu(entry: MenuEntry, focusFirst: boolean): void;
    closeSubmenu(): void;
    /** True when this list is list or one of its submenus. */
    isInside(list: MenuList): boolean;
    /** Places a submenu beside the item that opened it, on the side with room. */
    static position(element: HTMLElement, anchor: DOMRect): void;
}
/** A popup list of menu items. Items with children open submenus. */
export declare class PopupMenu extends Popup {
    #private;
    /** The list the arrow keys move in: the root or the deepest submenu being navigated. */
    focusList: MenuList | null;
    constructor(items: Array<ToolbarMenuItem>, onSelect: (item: ToolbarMenuItem) => void);
    /** Chooses an item that has no submenu. */
    choose(item: ToolbarMenuItem): void;
    close(): void;
    protected handleKey(event: KeyboardEvent): void;
}
/** A popup palette of colors. Choosing Default reports null. */
export declare class ColorPalette extends Popup {
    #private;
    static colors: Array<string>;
    /** The colors chosen most recently, newest first, shared by every palette on the page. */
    static recentColors: Array<string>;
    static maximumRecentColors: number;
    constructor(strings: Strings, onSelect: (color: DocumentColor | null) => void);
}
/**
 * A grid for choosing a table's size: pointing at a cell, or moving with the arrow keys, picks
 * that many rows and columns, and clicking or Enter chooses it.
 */
export declare class TableSizePicker extends Popup {
    #private;
    static maximumRows: number;
    static maximumColumns: number;
    rows: number;
    columns: number;
    constructor(strings: Strings, onSelect: (rows: number, columns: number) => void);
    /** Picks a size, highlighting it in the grid. */
    select(rows: number, columns: number): void;
    /** Chooses the size picked, and closes. */
    choose(): void;
    protected handleKey(event: KeyboardEvent): void;
}
export interface DialogField {
    name: string;
    label: string;
    value?: string | boolean;
    type?: "text" | "url" | "number" | "checkbox" | "select" | "textarea";
    options?: Array<{
        value: string;
        caption: string;
    }>;
    placeholder?: string;
}
/**
 * A small modal form. It opens in the browser's top layer, so the editor's bounds and overflow
 * don't clip it: it fits the window, and its fields scroll when they don't.
 */
export declare class Dialog {
    static prompt(container: HTMLElement, strings: Strings, title: string, fields: Array<DialogField>): Promise<{
        [name: string]: any;
    } | null>;
}
/**
 * Something the insertion chooser offers besides node types, such as a template. An editor
 * extension adds these with insertionChoices.
 */
export interface InsertionChoice {
    caption: string;
    /** A Bootstrap Icons class. */
    icon: string;
    /** Extra words the search matches. */
    keywords?: string;
    /** Inserts it. replace is an empty paragraph the chooser was opened from, which the choice may replace, or null. */
    choose(replace: Node | null): void;
}
/** One row of a ChoicePopup. */
export interface ChoiceItem {
    caption: string;
    value: any;
    /** An icon class, such as "bi bi-type-bold", or an image URL. */
    icon?: string;
    /** Secondary text after the caption, such as a shortcut. */
    detail?: string;
    /** Rows with the same group are listed under one heading. */
    group?: string;
    /** Fills the row and returns true, or returns false for the standard row. */
    render?: (element: HTMLElement, selected: boolean) => boolean;
}
/**
 * A list of choices, optionally with a search field that refilters it. Pointing
 * at a row or the arrow keys select it; a click, Return, or Tab (when tabChooses
 * is set) chooses it.
 */
export declare class ChoicePopup extends Popup {
    #private;
    onChoose: (item: ChoiceItem) => void;
    tabChooses: boolean;
    /** The item chosen, once one is; set before the popup closes. */
    chosen: ChoiceItem | null;
    constructor(classes: string, onChoose: (item: ChoiceItem) => void, search?: {
        placeholder: string;
        emptyCaption: string;
        filter: (query: string) => Array<ChoiceItem>;
    } | null);
    get items(): Array<ChoiceItem>;
    /** What screen readers call the list, such as "Insert". */
    set label(value: string);
    get activeIndex(): number;
    /**
     * Whether the search field shows, for a list made with a search filter. Without it, the list
     * shows every item and the text keeps focus; the arrow keys and Enter still choose.
     */
    get hasSearchField(): boolean;
    set hasSearchField(value: boolean);
    show(anchor: HTMLElement | DOMRect, container: HTMLElement): void;
    setItems(items: Array<ChoiceItem>, active?: number): void;
    protected handleKey(event: KeyboardEvent): void;
}
/**
 * A searchable list of the node types the editor can insert, and any other insertion choices.
 * It's a ChoicePopup, so it searches, points and answers keys like every other list of choices.
 */
export declare class InsertionChooser extends ChoicePopup {
    constructor(strings: Strings, types: Array<NodeClass>, onSelect: (type: NodeClass) => void, choices?: Array<InsertionChoice>, onChoice?: (choice: InsertionChoice) => void);
}
export {};
