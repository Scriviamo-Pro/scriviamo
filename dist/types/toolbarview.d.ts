import { Strings, ToolbarDisplayModes, ToolbarItem, ToolbarMenuItem } from "./internal";
/** Builds the DOM for toolbar items. Shared by the main toolbar and node toolbars. */
export declare class ToolbarView {
    /**
     * Creates the element for an item. activate is called with the item, and with the
     * chosen menu item for menus and color items (a color item's choice carries the
     * color, or null for Default, in its value).
     */
    static buildItem(item: ToolbarItem, displayMode: ToolbarDisplayModes, strings: Strings, popupContainer: HTMLElement, prepareMenu: (item: ToolbarItem) => void, activate: (item: ToolbarItem, menuItem: ToolbarMenuItem | null) => void): HTMLElement;
}
