# Node settings

Every node type describes its settings, such as alignment, borders and its own options, as
sections of items. The base package holds these descriptions, so they are part of every
node type, built-in or your own. An inspector panel reads them to show and change a node's settings.

A node's settings are an array of `InspectorSection`s, from its `inspectorSections()` method.
A section has an `identifier`, a `caption` and a list of `InspectorItem`s.

An item edits one value. It reads and writes either a property of the node, named by
`propertyName`, or a getter and setter function. Its `editor` is the control that edits it:

| `InspectorEditors` | Control |
|---|---|
| `text`, `multilineText` | A text field |
| `number` | A number field, within `minimumValue` and `maximumValue` |
| `toggle` | A switch |
| `menu` | A menu of choices, added with `addChoice(caption, value)` |
| `color` | A color well; the value is a `DocumentColor` |
| `image`, `file` | A file chooser |
| `action` | A button that runs a command |

Helpers make the common kinds:

```ts
import {InspectorEditors, InspectorItem} from "scriviamo"

// Reads and writes node.citation.
new InspectorItem("citation", "Citation", "citation", InspectorEditors.text)

// A number with limits, read and written by functions.
InspectorItem.number("rowlimit", "Rows", node => node.rowLimit, (node, value) => node.rowLimit = value, 1, 100)

// A menu.
InspectorItem.menu("level", "Level", [["Heading 1", 1], ["Heading 2", 2]], node => node.level, (node, value) => node.level = value)

// A button.
InspectorItem.actionItem("reload", "", "Reload", node => node.load())
```

`setDefaultValue(value)` gives an item a default, which an inspector offers to reset to.
`description` adds a line of help under it.

## Adding to a node type's settings

Override `inspectorSections()` and call `super` to keep the built-in sections:

```ts
import {InspectorDefaults, InspectorEditors, InspectorItem} from "scriviamo"

inspectorSections() {
  let mine = InspectorDefaults.section("example", "Example", [
    new InspectorItem("accent", "Accent Color", "accentColor", InspectorEditors.color)
  ])
  return [mine].concat(super.inspectorSections())
}
```

`InspectorDefaults` builds the built-in sections:

| Method | Sections |
|---|---|
| `InspectorDefaults.text(node)` | A text node's: content, typography, appearance and the common sections |
| `InspectorDefaults.node(node)` | The sections every node has: content (alignment and direction), appearance, dimensions for resizable nodes, borders, corners and background image |
| `InspectorDefaults.cellSections(table, caption)` | A table's active cell and cell borders |
| `InspectorDefaults.document(editor)` | The document's |

Section identifiers let you leave sections out, such as a table's `"table"`, `"activecell"`
and `"cellborders"` sections. [Writing node types](custom-node-types.md)
has more on this.
