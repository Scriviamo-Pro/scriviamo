import {ColorPalette, Colors, Popup, PopupMenu, Strings, ToolbarDisplayModes, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem, Utilities} from "./internal"

/** Builds the DOM for toolbar items. Shared by the main toolbar and node toolbars. */
export class ToolbarView {
  /**
   * Creates the element for an item. activate is called with the item, and with the
   * chosen menu item for menus and color items (a color item's choice carries the
   * color, or null for Default, in its value).
   */
  static buildItem(item: ToolbarItem, displayMode: ToolbarDisplayModes, strings: Strings, popupContainer: HTMLElement, prepareMenu: (item: ToolbarItem) => void, activate: (item: ToolbarItem, menuItem: ToolbarMenuItem | null) => void): HTMLElement {
    if (item.kind == ToolbarItemKinds.separator) {
      let separator = Utilities.element("div", "scv-toolbar-separator", {role: "separator"})
      item.element = separator
      return separator
    }
    if (item.kind == ToolbarItemKinds.flexibleSpace) {
      let space = Utilities.element("div", "scv-toolbar-space")
      item.element = space
      return space
    }

    let button = Utilities.element("button", "btn btn-sm scv-toolbar-button", {type: "button", title: item.tooltip, "aria-label": item.tooltip || item.caption})
    button.dataset.identifier = item.identifier
    let showIcon = item.icon.length > 0 && displayMode != ToolbarDisplayModes.textOnly
    let showCaption = item.alwaysShowCaption || displayMode != ToolbarDisplayModes.iconOnly || item.icon.length == 0
    if (showIcon) button.append(Utilities.element("i", `${item.icon} scv-toolbar-icon`))
    if (showCaption) {
      let caption = Utilities.element("span", "scv-toolbar-caption")
      caption.textContent = item.caption
      button.append(caption)
    }
    if (item.kind == ToolbarItemKinds.menu || item.kind == ToolbarItemKinds.color) {
      button.classList.add("scv-toolbar-menu")
      button.setAttribute("aria-haspopup", "true")
      button.append(Utilities.element("i", "bi bi-chevron-down scv-toolbar-chevron"))
    }
    if (item.kind == ToolbarItemKinds.color) {
      let swatch = Utilities.element("span", "scv-toolbar-swatch")
      button.append(swatch)
    }

    // Pressing a toolbar button must not take focus from the text being edited.
    button.addEventListener("mousedown", event => event.preventDefault())
    button.addEventListener("click", event => {
      event.preventDefault()
      if (button.disabled) return
      if (item.kind == ToolbarItemKinds.menu) {
        if (Popup.current && Popup.current.element.dataset.owner == item.identifier) {
          Popup.closeAll()
          return
        }
        prepareMenu(item)
        let menu = new PopupMenu(item.menuItems, menuItem => activate(item, menuItem))
        menu.element.dataset.owner = item.identifier
        menu.show(button, popupContainer)
      } else if (item.kind == ToolbarItemKinds.color) {
        let palette = new ColorPalette(strings, color => {
          let menuItem = new ToolbarMenuItem(color ? Colors.toHex(color) : "default", "")
          menuItem.value = color
          activate(item, menuItem)
        })
        palette.element.dataset.owner = item.identifier
        palette.show(button, popupContainer)
      } else {
        activate(item, null)
      }
    })
    item.element = button
    return button
  }
}
