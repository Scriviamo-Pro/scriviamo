# Node types

Every block in a document is a node. Each node type is a class that extends `Node`, and is
known in the JSON format by its *identifier*, such as `"text"` or `"table"`.

## Properties every node has

| Property | Meaning |
|---|---|
| `nodeId` | A unique ID. Kept when the document is saved, and used by comments, links and collaboration. |
| `type`, `typeName` | The JSON identifier, and the name shown to users |
| `editor`, `parent` | The editor the node is in, and the container node that holds it (null at the top level) |
| `alignment` | Where the node sits when it is narrower than its container (`Alignments.automatic`, `leading`, `middle`, `trailing`) |
| `direction` | `Directions.automatic`, `leftToRight` or `rightToLeft` |
| `lineHeight`, `lineSpacing` | A multiple of the font's line height, and extra pixels between lines |
| `borderTop`, `borderRight`, `borderBottom`, `borderLeft` | Each `{visible, size, color}` |
| `borderTopLeftRadius` and the other three corners | Corner radii, in pixels |
| `backgroundImage` | A picture drawn behind the node |
| `width`, `height` | An explicit size, for nodes that can be resized; 0 follows the content |
| `locked` | Locked nodes can't be edited, moved or deleted. Not saved. After changing it, call `editor.refreshLocks()` to show it. |
| `fixed` | Part of the document's fixed structure, saved with the node. An add-on can lock fixed nodes; on its own it changes nothing. |
| `suggestionProvider` | Text suggestions for this node, ahead of the editor's. Not saved. |
| `fontOptions` | Font choices and formats for this node, in place of the editor's. Not saved. |

Every node also has:
- `toJSON()` and `fromJSON(data)`;
- `toHTML()`, `toMarkdown()` and `toPlainText()`;
- `inspectorSections()`, the node's settings in the inspector;
- `actions()`, the items on the node's own toolbar.

## Base package

### Text — `TextNode`, `"text"`

A paragraph of styled text. The other text blocks extend it.

| Member | Meaning |
|---|---|
| `new TextNode(text)` | |
| `text` | The plain text. Setting it replaces the content and its styles. |
| `content` | The text and its character styles, as `RichText` |
| `fontName`, `fontSize`, `bold`, `italic`, `underline` | The paragraph's default formatting; a size of 0 follows the document |
| `textAlignment` | The alignment of the text inside the node. Buttons and checkboxes, only as wide as their captions, move with `alignment` instead. |

### Heading — `HeadingNode`, `"heading"`

| Member | Meaning |
|---|---|
| `new HeadingNode(text, level)` | `level` is `HeadingLevels.heading1` to `heading6`; the default is 2 |
| `level` | |
| `anchor` | The fragment identifier used for links to the heading and in exported HTML |

### List — `ListNode`, `"list"`

A bulleted, numbered or checklist list. Each item is a paragraph of the node's text, with its
own nesting level.

| Member | Meaning |
|---|---|
| `new ListNode(text, type)` | Items are separated by `"\n"`; `type` is `ListTypes.unordered`, `ordered` or `checklist` |
| `listType` | |
| `itemCount`, `levelAt(item)` | The number of items, and one item's nesting level |
| `changeLevel(delta)` | Indents (1) or outdents (-1) the items being worked on |

The list commands are on the toolbar, and Ctrl/Command+Shift+7, 8 and 9 make numbered,
bulleted and checklist lists. Ctrl/Command+] and [ indent and outdent.

### Quote — `QuoteNode`, `"quote"`

A block quote with an optional `citation`.

### Code — `CodeBlockNode`, `"codeblock"`

Preformatted code. `language` names the language for exports and highlighting, and `tabWidth`
is the width of a tab in spaces.

### Table — `TableNode`, `"table"`

| Member | Meaning |
|---|---|
| `new TableNode(rows, columns)` | |
| `rows`, `columns` | |
| `cell(row, column)` | A cell's text, as `RichText`; a cell can also hold nodes, in its `nodes` list |
| `hasHeader`, `hasFooter` | Makes the first or last row a header or footer row |
| `insertRow(at)`, `removeRow(row)`, `insertColumn(at)`, `removeColumn(column)` | |
| `mergeCells(row, column, rowCount, columnCount)`, `splitCell(index)` | |
| `textAlignment` | The alignment of text in cells whose own alignment is Automatic |

### Image — `ImageNode`, `"image"`

A picture with an optional caption. Pictures chosen from files or dropped on the editor are
embedded in the document.

| Member | Meaning |
|---|---|
| `sourceURL`, `setURL(url)` | A picture loaded from an address |
| `imageData` | An embedded picture, as Base64 without a `data:` prefix |
| `caption` | The caption text |
| `displayWidth`, `displayHeight` | The size it is drawn at; 0 is its natural size |
| `fillMode` | How it fills that size: `ImageFillModes.fit`, `fill` or `stretch` |

### Divider — `DividerNode`, `"divider"`

A horizontal rule. `lineThickness` is its thickness in pixels, 1 by default, and `lineColor`
its color; `Colors.empty` uses the theme's border color. Typing `---` on an empty line inserts
one.

### Unknown content — `UnknownNode`

A node whose type isn't registered, such as one from an add-on this page doesn't load. It
shows a placeholder and saves its JSON back unchanged.

## Add-on node types

| Add-on | Classes and JSON types |
|---|---|
| `callouts` | `AlertNode` `"alert"`, with `alertType` (`AlertTypes.info`, `success`, `warning`, `danger`) |
| `rawcontent` | `RawContentNode` `"rawcontent"`, HTML written into exports unchanged |
| `media` | `AudioNode` `"audio"`, `VideoNode` `"video"` |
| `forms` | `FormNode` `"form"`, `LabelNode` `"label"`, `TextFieldNode` `"textfield"`, `TextAreaNode` `"textarea"`, `CheckboxNode` `"checkbox"`, `RadioGroupNode` `"radiogroup"`, `DropdownNode` `"select"`, `DatalistNode` `"datalist"`, `ButtonNode` `"button"` |
| `steps` | `StepsNode` `"steps"`, numbered steps or a timeline, each step holding text and nodes; see [Steps, timelines and tabs](steps-and-tabs.md) |
| `attachments` | `AttachmentNode` `"attachment"`, a file with a download button; see [Files, galleries, maps and embeds](media-and-embeds.md) |
| `gallery` | `GalleryNode` `"gallery"`, pictures as a grid or a carousel; see [Files, galleries, maps and embeds](media-and-embeds.md) |
| `map` | `MapNode` `"map"`, a map of a place with a pin; see [Files, galleries, maps and embeds](media-and-embeds.md) |

Each add-on's classes are exported by its module:

```ts
import {AlertNode, AlertTypes} from "./dist/addons/scriviamo.callouts.js"

let alert = new AlertNode("Back up first.")
alert.alertType = AlertTypes.warning
editor.addNode(alert)
```

## Which types an editor offers

An editor starts with the node types registered when it is created, in their registered order.
`editor.nodeTypes` is that list for one editor, and the Insert menu, the block type menu and
command search offer the types in it. A type whose static `insertable` is false isn't offered
for insertion, but still loads from JSON.
