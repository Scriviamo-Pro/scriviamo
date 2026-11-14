export declare enum ToolbarItemKinds {
    button = 0,
    toggle = 1,
    menu = 2,
    separator = 3,
    flexibleSpace = 4,
    /** A menu that shows a color palette. Its value is a DocumentColor, or null for Default. */
    color = 5
}
export declare class ToolbarMenuItem {
    identifier: string;
    caption: string;
    icon: string;
    checked: boolean;
    enabled: boolean;
    isSeparator: boolean;
    /** Optional CSS applied to the caption, such as a font family for a font menu. */
    captionStyle: string;
    /** Value delivered with the menu item; defaults to the identifier. */
    value: any;
    /** Items shown in a submenu. A menu item with children opens them instead of being chosen. */
    children: Array<ToolbarMenuItem>;
    constructor(identifier: string, caption?: string, icon?: string);
    get hasChildren(): boolean;
    /** A menu item that opens a submenu of children. */
    static submenu(identifier: string, caption: string, icon: string, children: Array<ToolbarMenuItem>): ToolbarMenuItem;
    static separator(): ToolbarMenuItem;
}
/**
 * A button, toggle, menu or separator in the editor's toolbar or in a node's
 * contextual toolbar. Items the editor doesn't handle raise the editor's
 * toolbarItemPressed event.
 */
export declare class ToolbarItem extends EventTarget {
    #private;
    identifier: string;
    caption: string;
    tooltip: string;
    /** A Bootstrap Icons or Font Awesome class list, such as "bi bi-type-bold". */
    icon: string;
    kind: ToolbarItemKinds;
    menuItems: Array<ToolbarMenuItem>;
    /** Shows the caption in the button even in icon-only mode. Used by menus such as Font. */
    alwaysShowCaption: boolean;
    /** Arbitrary application data. */
    tag: any;
    constructor(identifier: string, caption: string, icon?: string, kind?: ToolbarItemKinds, tooltip?: string);
    static separator(): ToolbarItem;
    static flexibleSpace(): ToolbarItem;
    get element(): HTMLElement | null;
    set element(value: HTMLElement | null);
    get enabled(): boolean;
    set enabled(value: boolean);
    get active(): boolean;
    set active(value: boolean);
    get visible(): boolean;
    set visible(value: boolean);
    /** Updates the tooltip of the item's button. */
    setTooltip(value: string): void;
    /** Updates the caption shown on a menu button, such as the current font name. */
    setDisplayCaption(value: string): void;
}
/** An ordered, identifier-addressable list of toolbar items. */
export declare class ToolbarItems extends EventTarget {
    #private;
    add(item: ToolbarItem): void;
    /** Replaces every item at once, with one changed event. */
    setItems(items: Array<ToolbarItem>): void;
    addAt(index: number, item: ToolbarItem): void;
    indexOf(item: ToolbarItem | string): number;
    item(identifier: string): ToolbarItem | null;
    itemAt(index: number): ToolbarItem | null;
    items(): Array<ToolbarItem>;
    get lastIndex(): number;
    remove(item: ToolbarItem | string): void;
    removeAt(index: number): void;
    removeAll(): void;
}
