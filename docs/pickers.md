# Pickers, menus and dialogs

Every menu, palette and chooser the editor shows is built on one class, `Popup`. Node types and
add-ons build theirs the same way, so they look and behave like the editor's own with no
placement or dismissal code of their own.

All of these are exported by the base package:

```js
import {Popup, PopupMenu, ChoicePopup, ColorPalette, TableSizePicker} from "scriviamo"
```

## What every popup does

- **Placement.** It opens below its anchor, or above it when there's no room below, and stays
  8px inside the window. In right-to-left text it lines up with the anchor's right edge.
- **Never clipped.** It opens in the browser's top layer, so the editor's size, overflow,
  transforms and stacking can't cut it off or cover it. It stays inside the element you open it
  in, so it keeps that element's theme and CSS variables. Browsers without the Popover API place
  it with fixed positioning instead.
- **One at a time.** Opening a popup closes the one already open. So does opening a dialog.
- **Dismissal.** Pressing outside it or pressing Escape closes it. Scrolling the page closes it,
  unless it has an `anchorProvider`, in which case it follows its anchor.
- **Selection kept.** Pressing in it doesn't take focus from the text, so the text selection
  survives choosing a command. Set `keepsFocus = false` for popups with fields to type in.
- **Events.** The editor reports it with `pickerOpened` and `pickerClosed`
  (see [The editor](editor.md#events)).

## Popup

| Member | Meaning |
|---|---|
| `new Popup(classes)` | An empty popup; fill `element` with your own content. `classes` are added to the element, such as `"dropdown-menu show"` for Bootstrap's menu look |
| `element` | The popup's element |
| `show(anchor, container)` | Opens it at `anchor`, an element or a `DOMRect`, inside `container`, usually `editor.element` |
| `position()` | Places it again, after its content changes size |
| `close()` | Closes it |
| `isOpen` | Whether it's open |
| `onClose` | Called when it closes, however it closes |
| `chosenValue` | What it delivered, when it closed by a choice; null when it was dismissed. `pickerClosed` reports it |
| `keepsFocus` | Whether pressing it keeps focus in the text. True by default |
| `dismissible` | Whether pressing outside it, or opening another popup, closes it. True by default. Set it to false for a panel that holds work, such as an answer being written: it stays open until it's closed, and Escape closes it while focus is inside |
| `anchorProvider` | `() => DOMRect \| null`: the anchor's current rectangle. With one, the popup follows its anchor as the page scrolls |
| `handleKey(event)` | Protected. Override it to handle keys while the popup is open; call `super.handleKey(event)` for Escape |
| `Popup.current` | The open dismissible popup, if any |
| `Popup.closeAll()` | Closes it |

A small popup of your own:

```js
let popup = new Popup("dropdown-menu show p-2")
popup.keepsFocus = false
let input = document.createElement("input")
input.className = "form-control form-control-sm"
input.addEventListener("keydown", event => {
  if (event.key == "Enter") {
    popup.chosenValue = input.value
    popup.close()
    apply(input.value)
  }
})
popup.element.append(input)
popup.show(button, editor.element)
input.focus()
```

## Ready-made pickers

| Class | What it is |
|---|---|
| `PopupMenu` | A menu of `ToolbarMenuItem`s, with submenus, checkmarks and arrow-key navigation: `new PopupMenu(items, item => …)` |
| `ChoicePopup` | A list of choices, optionally with a search field, grouped under headings, with pointing and arrow keys: `new ChoicePopup(classes, item => …, search)` |
| `ColorPalette` | Swatches, recent colors, Default and a custom color: `new ColorPalette(editor.strings, color => …)`, where `color` is a `DocumentColor`, or null for Default |
| `TableSizePicker` | A grid for choosing rows and columns: `new TableSizePicker(editor.strings, (rows, columns) => …)` |

Each opens with `show(anchor, container)` like any popup.

### ChoicePopup

Each row is a `ChoiceItem`:

| Member | Meaning |
|---|---|
| `caption` | The row's text |
| `value` | Anything; your callback receives the whole item |
| `icon` | A Bootstrap Icons class, or an image URL |
| `detail` | Secondary text after the caption, such as a shortcut |
| `group` | Rows with the same group are listed under one heading |
| `render(element, selected)` | Fills the row itself and returns true, or returns false for the standard row |

The third argument adds a search field. `filter` is called with what's typed, and returns the
rows to show:

```js
let popup = new ChoicePopup("my-picker", item => insert(item.value), {
  placeholder: "Search",
  emptyCaption: "Nothing matches",
  filter: query => all.filter(item => item.caption.toLowerCase().includes(query.trim().toLowerCase()))
})
popup.show(button, editor.element)
```

`hasSearchField` shows or hides the search field of a list made with a search filter, so one
picker can be searchable when its list is long and plain when it's short. Without the field the
list shows every row, the text keeps focus, and the arrow keys and Enter still choose. Set it in
a subclass's constructor, or before or after showing the popup.

```js
popup.hasSearchField = all.length >= 5
```

Without a search filter, call `setItems(items)` to fill the list. `tabChooses = true` lets Tab
choose the selected row, as suggestions do.

The "/" chooser and the toolbar's Insert menu are both `InsertionChooser`s, a `ChoicePopup` of
the block types the editor can insert. The Insert menu has its search field once it offers at
least `editor.insertMenuSearchThreshold` block types. The templates picker is a `ChoicePopup`
too.

## From a toolbar item

A menu item on the toolbar can open any popup instead of its menu, with `makePopup`. The popup
calls `choose` with a `ToolbarMenuItem` carrying the value; the toolbar then activates the item
as if that menu item had been chosen. See [The toolbar](toolbar.md#toolbaritem).

```js
item.makePopup = choose => new TableSizePicker(editor.strings, (rows, columns) => {
  let menuItem = new ToolbarMenuItem("size", `${rows} × ${columns}`)
  menuItem.value = {rows, columns}
  choose(menuItem)
})
```

## Dialogs

For a few fields with OK and Cancel, use `editor.prompt(title, fields)` rather than a popup. It
resolves with the values by field name, or null when cancelled. Dialogs also open in the top
layer, fit the window, and scroll their fields when there are more than fit.

```js
let values = await editor.prompt("Link", [
  {name: "url", label: "Address", type: "url", placeholder: "https://"},
  {name: "newWindow", label: "Open in a new window", type: "checkbox", value: false}
])
if (values) applyLink(values.url, values.newWindow)
```

A field's `type` is `text` (the default), `url`, `number`, `checkbox`, `select` (with `options`
of `{value, caption}`) or `textarea`.
