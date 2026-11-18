# Writing node types

A node type is a class that extends `Node`, or a node type that already exists, such as
`TextNode` or `TableNode`. Registering it adds it to the Insert menu, command search and JSON
loading of every editor created afterwards.

The examples in `src/examples/`, and the data table add-on, are complete node types to learn from:

| Example | Extends | Shows |
|---|---|---|
| `youtube/youtubenode.ts` | `Node` | Drawing a node with no text, resizing, HTML import with a priority, and exporting an iframe |
| `examplenode/examplenode.ts` | `TextNode` | Toolbar and context-menu commands, a key command, inspector items, and migrating an older JSON format |

## A first node type

This node shows a progress bar with an editable label.

```ts
import {Editor, Node, RichText, TextHost, TextHostModes, InspectorDefaults, InspectorItem, InspectorSection, Utilities} from "scriviamo"

export class ProgressNode extends Node {
  static identifier = "progress"          // the JSON type; never change it once documents use it
  static caption = "Progress"             // the name in menus
  static icon = "bi bi-bar-chart-steps"   // a Bootstrap Icons class
  static keywords = "percent status bar"  // extra words command search matches

  /** Makes the node the Insert menu adds. */
  static create(_editor: Editor): Node {
    return new ProgressNode()
  }

  label: RichText = new RichText("Progress")
  value: number = 50

  get typeName(): string {
    return "Progress"
  }

  /** Draws the node. The editor calls it, and again after refresh(). */
  protected build(body: HTMLElement) {
    let label = Utilities.element("div", "small mb-1")
    body.append(label)
    // A text host makes the label editable, with the editor's formatting and undo.
    let host = this.addHost(new TextHost(this, this.label, label, TextHostModes.inline))
    host.placeholder = "Label"
    host.render()

    let bar = Utilities.element("progress", "w-100", {max: "100", value: String(this.value)})
    body.append(bar)
  }

  inspectorSections(): Array<InspectorSection> {
    let value = InspectorItem.number("value", "Value", node => node.value, (node, value) => node.value = value, 0, 100)
    return [InspectorDefaults.section("progress", "Progress", [value])].concat(super.inspectorSections())
  }

  toJSON(): object {
    let result = super.toJSON()
    result["label"] = this.label.toJSON()
    result["value"] = this.value
    return result
  }

  fromJSON(data: any): boolean {
    if (!super.fromJSON(data)) return false
    this.label = RichText.fromJSON(data.label)
    this.value = Utilities.clamp(Utilities.number(data.value, 50), 0, 100)
    return true
  }

  toHTML(): string {
    return `<div style="${this.htmlBackgroundCSS()}"><div>${this.label.htmlText()}</div><progress max="100" value="${this.value}"></progress></div>`
  }

  toMarkdown(): string {
    return `${this.label.markdownText()}: ${this.value}%`
  }

  toPlainText(): string {
    return `${this.label.text}: ${this.value}%`
  }
}

Editor.registerNodeType(ProgressNode, 1000)
```

Import the module before creating editors. The second argument of `registerNodeType` places
the type in the menus: the built-in types use multiples of 10 below 300, so values from 1000
put application types last. Registering a type with an identifier that's
already registered replaces it.

To add a type to one editor only, use `editor.nodeTypes.add(ProgressNode)` instead.

## Static members

| Member | Meaning |
|---|---|
| `identifier` | The JSON type name. Required. Keep it stable and language-neutral. |
| `caption`, `icon`, `keywords` | How menus and command search show the type |
| `insertable` | False keeps the type out of the Insert menu while still loading it from JSON |
| `create(editor)` | Makes the node the Insert menu adds |
| `importElement(element, importer)` | Reads an HTML element; see [Reading HTML](#reading-html) |
| `importPriority` | Lets the type read HTML elements before other types; see below |
| `exportStyles(sheet, editor)` | Adds CSS rules to the HTML export stylesheet; see [Exporting](#exporting) |
| `markdownShortcuts` | Markdown typed at the start of a paragraph that turns it into this type; see below |
| `blockKinds(strings, compact)` | Entries this type adds to the block type menu, as `[identifier, caption, icon]` |
| `droppedFileTypes`, `importDroppedFile(file, editor)` | Files dropped or pasted onto the editor that this type makes nodes from: MIME types such as `"image/*"`, extensions such as `".csv"`, or `"*"` for any file. `droppedFileImportPriority` decides between types that take the same file |

## Drawing

`build(body)` creates the node's content inside `body`. The editor wraps it with the common
appearance: borders, corners, background image, alignment, direction and, for resizable nodes,
the size.

- **Editable text** goes in a `TextHost`. Create one with the node, a `RichText`, the element to
  edit in, and a mode (`TextHostModes.inline` for one paragraph, `multiline` for several,
  `list` for list items), then add it with `addHost` and call `render()`. The user's edits
  change the `RichText` directly. Override `textChanged(host)` to react to them.
- **No text**: draw anything. Clicks select the node. To handle clicks yourself, override
  `handleClick(event)` and return true, or stop the event on your own controls.
- **Redrawing**: call `refresh()` after a property changes. It rebuilds the node and keeps the
  caret in its text.

### Resizing

Override `get canResize()` to return true, and the node toolbar offers Width and Height, saved in
the node's `width` and `height`. Override `toolbarResizesHeight` to return false when the height
follows the width. `MediaUI.attachResize` adds a drag handle; the YouTube example uses it.

### Containers

A node that holds other nodes returns their lists from `childLists()`, and draws each with
`editor.mountChildren(list, element, this)` in `build`. Override `holdsBlocks` to return true so
its children get the insertion buttons and accept dropped nodes. `TableNode`, the columns
add-on and the collapsible section in the blocks add-on are containers.

## Changes and undo

When the user changes a node through your own controls, record it like this:

```ts
this.willChange()      // makes the change an undo step
this.value = 75
this.refresh()         // redraws the node
this.changed()         // tells the editor, which raises contentChanged and shares it while collaborating
```

Changes that only update what the node shows, such as data arriving from a server, can call
`refresh()` alone. They then don't mark the document changed or become undo steps. The data
table example does this with the rows it loads.

## Saving

`toJSON()` returns an object with the node's properties, and `fromJSON(data)` restores them.
Call `super` in both so the common properties are kept. In `fromJSON`, treat every value as
possibly missing or wrong: give each a default, and return false only when the data can't be
used at all.

Saved JSON is shared with other copies of the editor, such as while collaborating and between
versions of your application, so add new names rather than changing what existing ones mean.

## Reading HTML

`static importElement(element, importer)` is offered each element of imported or pasted HTML.
Return a node made from it, or `undefined` to leave the element to other types:

```ts
static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined {
  if (element.tagName != "PROGRESS") return undefined
  let node = new ProgressNode()
  node.value = Number(element.getAttribute("value")) || 0
  return importer.attach(node)
}
```

The importer has helpers for this:
- `importer.richText(childNodes)` reads formatted text;
- `importer.trimmed(rich)` trims it;
- `importer.readAlignment(element, node)` reads the element's text alignment into a text node;
- `importer.attach(node)` finishes the node.

Types are asked in registration order, so a type registered earlier gets the first chance at an
element. A type that must claim elements another type also reads sets `static importPriority`
higher than 0. The YouTube example uses 100, so YouTube iframes become YouTube nodes rather than
embeds.

## Exporting

`toHTML()`, `toMarkdown()` and `toPlainText()` export the node. Helpers from `Node` and
`TextNode` keep exports consistent:
- `htmlBackgroundCSS()` writes the common appearance as CSS;
- `markdownWithBackground(markdown)` wraps Markdown in HTML when the node has a background or
  border that Markdown can't express;
- `htmlTextAlignmentCSS()` writes a text node's alignment.

A type adds rules to the export stylesheet with a static method, which the editor calls once
for each type in the document:

```ts
static exportStyles(sheet: Stylesheet, editor: Editor | null) {
  sheet.addRule("progress", "width: 100%")
  sheet.addRule(".progress-label", `color: ${Editor.themeCSS(editor, ThemeColors.textMuted)}`)
}
```

## Commands

| Override | Adds |
|---|---|
| `actions()` and `performAction(item, menuItem)` | Items on the node's own toolbar, over the selected node. Build them each time, so they show the node's current state. |
| `contextMenuItems()` and `performContextMenuItem(item)` | Entries in the editor's context menu |
| `handleKeyDown(event, host)` | Keys. `host` is null while the node is selected rather than edited. Return true when handled. |
| `inserted()` | Runs after the user inserts the node, such as to ask for its content |

```ts
actions(): Array<ToolbarItem> {
  let reset = new ToolbarItem("progress-reset", "Reset", "bi bi-arrow-counterclockwise")
  return [reset]
}

performAction(item: ToolbarItem, _menuItem: ToolbarMenuItem | null): boolean {
  if (item.identifier != "progress-reset") return false
  this.willChange()
  this.value = 0
  this.refresh()
  this.changed()
  return true
}
```

For a command that needs a choice or a few values, such as a size or a color, open one of the
ready-made pickers, or `editor.prompt` for a small form, rather than building your own; see
[Pickers, menus and dialogs](pickers.md).

## Markdown shortcuts

`markdownShortcuts` lists patterns that, typed at the start of a paragraph, turn it into this
type. A text type converts the paragraph; a type without text sets `insertsBlock` and is inserted
before it:

```ts
static markdownShortcuts: Array<BlockShortcut> = [{pattern: /^\[progress\] $/, insertsBlock: true}]
```

## Settings in the inspector

Override `inspectorSections()`. See [Node settings](node-settings.md#adding-to-a-node-types-settings).

## Interface text

Text your node type shows can be translated like the editor's own. See
[Localization](localization.md#add-ons-and-your-own-node-types).

## Editor extensions

An extension adds commands that aren't tied to one node, such as toolbar items and keyboard
shortcuts. Register it with `Editor.registerExtension(extension)`. The lists in the base package
are an extension, which adds the list buttons and the list keyboard shortcuts.

| Member | Meaning |
|---|---|
| `install(editor)` | Runs for each new editor, after its own setup |
| `toolbarIdentifiers` | The tools it adds, in the order the toolbar customizer lists them |
| `defaultToolbarIdentifiers`, `defaultToolbarAfter` | The tools the default toolbar shows, and the tool they follow |
| `makeToolbarItem(editor, identifier)` | Makes a tool |
| `activateToolbarItem(editor, identifier, menuItem)` | Performs a tool; return true when handled |
| `updateToolbarState(editor, set)` | Sets each tool's enabled and active state for the current selection |
| `handleCommandKey(editor, event)` | Handles a key pressed with Ctrl or Command; return true when handled |

## Panels

A panel shows something about the document beside the editor, such as the outline add-on's
heading tree. Register one with `Editor.registerPanel(panel)`; the inspector add-on shows each as
a tab, and an application can place one anywhere by calling its `build`.

| Member | Meaning |
|---|---|
| `identifier` | The panel's name in code |
| `caption(editor)` | Its name as its tab shows it, in the editor's language |
| `build(container, editor)` | Fills an element, keeps it up to date, and returns a function that stops |

The status bar takes items the same way; see [The status bar](undo-search-statistics.md#the-status-bar).
