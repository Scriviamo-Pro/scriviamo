# The toolbar

The toolbar is a list of `ToolbarItem`s in `editor.toolbarItems`. Users can rearrange it with
the customizer, and applications can add their own items.

## Built-in tools

Each tool has an identifier, which `activateToolbarItem` runs and saved toolbar states list.

| Identifier | Tool |
|---|---|
| `insert` | Insert a block, from the same list as the "/" chooser. With at least `editor.insertMenuSearchThreshold` block types to offer (5 by default), it has a search field that filters it by name and keywords. The arrow keys and Enter choose either way |
| `table` | Insert a table, choosing its size in a grid: point at a size, or move with the arrow keys, then click or press Enter. Without a size, as from `activateToolbarItem("table")`, the table is 3 × 3. |
| `undo`, `redo` | |
| `blocktype` | Block type: paragraph, heading levels, quote, code and so on |
| `font`, `size` | Font and size menus |
| `bold`, `italic`, `underline`, `strike` | |
| `inline` | A menu of the other inline formats |
| `code`, `highlight`, `keyboard`, `superscript`, `subscript` | Those formats as separate buttons |
| `textcolor`, `background` | Text and background colors |
| `link` | Add, change or remove a link |
| `alignment` | Text or node alignment |
| `lineheight`, `linespacing` | Line height and extra line spacing |
| `list:0`, `list:1`, `list:2` | Bulleted, numbered and checklist lists |
| `outdent`, `indent` | List levels |
| `clearformatting` | |
| `comment` | Add a comment |
| `documentbackground` | The document's background color |
| `find`, `replace` | The search bar |
| `print` | |
| `search` | Command search |
| `separator`, `flexiblespace` | A divider, and space that pushes the following items to the far end |

The default toolbar shows most of these. `code`, `highlight`, `keyboard`, `superscript`,
`subscript`, `comment`, `documentbackground`, `find` and `replace` are offered in the customizer.
`Editor.catalogIdentifiers` lists every tool, including those registered by extensions.

```ts
editor.activateToolbarItem("bold")
```

## Adding your own items

Add a `ToolbarItem` to `editor.toolbarItems`. The editor shows it, and clicking it raises
`toolbarItemPressed`:

```ts
import {ToolbarItem, ToolbarItemKinds, ToolbarMenuItem} from "scriviamo"

editor.toolbarItems.add(new ToolbarItem("save", "Save", "bi bi-floppy"))

let exportItem = new ToolbarItem("export", "Export", "bi bi-box-arrow-up", ToolbarItemKinds.menu)
exportItem.menuItems.push(new ToolbarMenuItem("pdf", "PDF"), new ToolbarMenuItem("docx", "Word"))
editor.toolbarItems.add(exportItem)

editor.addEventListener("toolbarItemPressed", event => {
  let {item, menuItem} = event.detail
  if (item.identifier == "save") save()
  if (item.identifier == "export") exportAs(menuItem.identifier)
})
```

Items you add appear in the customizer too, so users can move or remove them. `resetToolbar()`
removes them; add them again after calling it.

`editor.toolbarItems` has `add`, `addAt`, `item(identifier)`, `remove`, `removeAll`, and
`setItems(items)` to replace every item at once. Adding a `ToolbarItem.separator()` or
`ToolbarItem.flexibleSpace()` adds a divider or space.

### ToolbarItem

| Member | Meaning |
|---|---|
| `new ToolbarItem(identifier, caption, icon, kind, tooltip)` | |
| `icon` | A Bootstrap Icons class list, such as `"bi bi-type-bold"` |
| `kind` | `ToolbarItemKinds.button`, `toggle`, `menu`, `color`, `separator` or `flexibleSpace` |
| `menuItems` | A menu's items |
| `enabled`, `active`, `visible` | `active` shows a toggle as on |
| `tooltip`, `setTooltip(value)` | |
| `alwaysShowCaption` | Shows the caption even when the toolbar shows icons only |
| `setDisplayCaption(value)` | Changes the caption a menu button shows, such as the current choice |
| `tag` | Data of your own |
| `makePopup` | For a menu that picks its value in a popup of its own, such as the table size grid: `choose => popup`, where the popup calls `choose` with a `ToolbarMenuItem` carrying the value |

A `color` item opens a color palette, and its value arrives as a `DocumentColor`, or null for
Default.

### ToolbarMenuItem

| Member | Meaning |
|---|---|
| `new ToolbarMenuItem(identifier, caption, icon)` | |
| `checked`, `enabled` | |
| `value` | Data delivered with the choice; the identifier by default |
| `captionStyle` | CSS for the caption, such as a font family in a font menu |
| `ToolbarMenuItem.submenu(identifier, caption, icon, children)` | An item that opens a submenu |
| `ToolbarMenuItem.separator()` | A divider |

The same classes make node toolbars and context menus; see
[Writing node types](custom-node-types.md#commands).

## Display mode

`editor.toolbarDisplayMode` is `ToolbarDisplayModes.iconOnly`, `iconAndText` or `textOnly`.
Users can change it by right-clicking the toolbar.

## Customizing and saving the arrangement

Users open the customizer by right-clicking the toolbar and choosing Customize Toolbar, or you
open it with `editor.showToolbarCustomizer()`. They drag items into, around and off the
toolbar, or drag the default set back.

Save each user's arrangement and restore it later:

```ts
editor.addEventListener("toolbarCustomized", event => localStorage.toolbar = event.detail.state)

if (localStorage.toolbar) editor.loadToolbarState(localStorage.toolbar)
```

The state is JSON with a version, the display mode, and the item identifiers in order:

```json
{"version": 1, "displayMode": 0, "items": ["insert", "separator", "undo", "redo", "flexiblespace", "search", "save"]}
```

`loadToolbarState` skips identifiers the editor doesn't know, and returns false for state it
can't read. To restore your own items, add them before loading the state.

`resetToolbar()` puts back the default tools, removing your own items and any customization.
It keeps the display mode, which is the user's choice.

## Editor extensions

An extension adds tools to every editor, with their default positions, state and keyboard
shortcuts. See [Editor extensions](custom-node-types.md#editor-extensions).
