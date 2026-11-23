# The editor

`Editor` is the editor itself. It is an `EventTarget`, so you listen to it with
`addEventListener`. [Getting started](getting-started.md) shows how to create one and lists
its options.

## Document settings

| Property | Meaning |
|---|---|
| `fontName`, `fontSize` | The document font and size. Text whose size is Default uses `fontSize`. `"System"` is the platform's interface font. |
| `alignment` | Where nodes narrower than the page sit when their own alignment is Automatic (`Alignments.leading`, `middle`, `trailing`) |
| `textAlignment` | The alignment of text whose alignment is Automatic |
| `direction` | `Directions.automatic`, `leftToRight` or `rightToLeft` |
| `backgroundColor`, `backgroundImage` | What is drawn behind the document |
| `isChanged` | True after the document changes; set it to false after saving |
| `documentID` | An identifier the application can use; collaboration sets it to the shared document's ID |

## Interface settings

| Property | Meaning |
|---|---|
| `readOnly` | Shows the document without allowing changes. Text can still be selected and copied. |
| `enabled` | False disables the whole editor |
| `toolbarVisible`, `toolbarDisplayMode` | The main toolbar and how its items show |
| `showContextualToolbars` | The small toolbar over the selected node |
| `isHoverInsertionEnabled` | The add and drag buttons beside the block under the pointer |
| `markdownShortcuts` | Turns typed Markdown, such as `- ` or `**bold**`, into what it describes |
| `allowAnnotations` | Comments: the margin markers, Add Comment and the comment popover |
| `contextMenuEnabled` | The editor's own context menu. Holding Shift shows the browser's, with its spelling suggestions. |
| `adaptiveHeight` | Makes the editor as tall as its content, raising `heightChanged` |
| `statusBarVisible` | The bar under the document, with word and character counts, reading time and the autosave state; `editor.statusBar` sets what it shows |
| `fontNames`, `fontSizes` | The choices in the Font and Size menus |
| `insertMenuSearchThreshold` | The toolbar's Insert menu shows a search field once it offers at least this many block types. 5 by default; 0 always shows it, and `Infinity` never does |
| `strings` | The interface text; see [Localization](localization.md) |
| `fileUploader` | Uploads the files people add and returns their addresses; see [Files and uploads](import-export.md#files-and-uploads) |

## Nodes

A document is a list of nodes. Some nodes, such as tables, columns and collapsible sections,
hold lists of nodes of their own.

```ts
import {HeadingNode, HeadingLevels, ListNode, ListTypes, TableNode, TextNode} from "scriviamo"

editor.addNode(new HeadingNode("Shopping", HeadingLevels.heading1))
editor.addNode(new TextNode("Things to buy this week:"))
editor.addNode(new ListNode("Bread\nMilk\nEggs", ListTypes.checklist))

let table = new TableNode(2, 2)
table.hasHeader = true
table.cell(0, 0).insert(0, "Item")
table.cell(0, 1).insert(0, "Price")
editor.addNode(table)
```

### Reading the document

| Method | Returns |
|---|---|
| `nodes()` | The top-level nodes |
| `nodeAt(index)`, `lastNodeIndex` | One top-level node, and the index of the last |
| `allNodes()` | Every node, including those inside containers, in document order |
| `nodeWithID(id)` | The node with that `nodeId`, wherever it is |
| `listContaining(node)` | The list that holds a node: the top-level list or a container's |
| `inDocumentOrder(nodes)` | Nodes sorted into document order |

### Changing the document

| Method | Does |
|---|---|
| `addNode(node)`, `insertNode(index, node)` | Adds a top-level node |
| `insertNodesAfter(reference, nodes)`, `insertNodesBefore(reference, nodes)` | Inserts next to a node, in its list |
| `insertNodes(list, index, nodes, owner)` | Inserts into any list |
| `replaceNode(node, replacements)` | Replaces a node; passing the node itself among the replacements keeps it |
| `removeNode(node)`, `removeNodeAt(index)`, `removeNodes(nodes)`, `removeAllNodes()` | Removes nodes |
| `moveNode(node, delta)`, `moveNodes(nodes, delta)` | Moves nodes up (negative) or down (positive) within their lists |
| `moveNodeTo(node, list, index)`, `moveNodesTo(nodes, list, index)` | Moves nodes to a list position |
| `duplicateNodes(nodes)` | Copies nodes, each after its original, and selects the copies |
| `cloneNode(node)` | A copy of a node, with new IDs, not yet in the document |
| `insertNodeOfType(type, replace)` | Inserts a node of a registered type where the user is working, as the Insert menu does |
| `insertNewNode(node, replace)` | Inserts a node you made, such as `TableNode.withSize(editor, 2, 4)`, in the same place |
| `setBlockType(kind, value)` | Turns the text blocks being worked on into another kind: `"text"`, `"heading"`, `"quote"`, `"codeblock"`, `"list"`, and `"alert"` with the callouts add-on |

Each of these is one undo step and raises `contentChanged`.

To change a node's own properties, change them and then call `node.changed()`, so the editor
redraws it, records the change and raises `contentChanged`. Call `node.willChange()` first to
make the change an undo step:

```ts
node.willChange()
node.alignment = Alignments.middle
node.changed()
```

To make many changes at once, wrap them in `beginUpdate()` and `endUpdate()`. Events wait
until the matching `endUpdate`, and batches can be nested.

## Selection and editing

A node is either **selected** as a whole, or **being edited**, with a caret in its text. A
single click selects a node; a double-click, Return, or typing starts editing it. Clicking
empty space selects the document, which deselects every node.

| Member | Meaning |
|---|---|
| `selectedNode`, `selectedNodes()` | The primary selected node and all selected nodes |
| `selection` | The same, with helpers such as `selection.isSelected(node)` |
| `selectNode(node, addToSelection)`, `selectNodes(nodes)`, `selectRange(from, to)` | Selects nodes and ends editing |
| `editingNode`, `isEditingText`, `activeHost` | The node and text being edited, if any |
| `focusNode(node, offset)`, `beginEditing(node, offset)` | Starts editing a node's text at `offset`, or at the end |
| `endEditing()` | Stops editing, leaving the node selected |
| `selectedText()` | The selected text, or the plain text of the selected nodes |
| `insertText(value)`, `replaceText(start, length, value)` | Changes the text being edited |
| `captureSelection()`, `restoreSelection(state)` | Saves and restores the selection across a re-render |
| `revealNode(node)`, `scrollToNode(node)` | Opens collapsed sections around a node, and scrolls to it |

## Commands

| Method | Does |
|---|---|
| `activateToolbarItem(identifier, menuItem)` | Performs a toolbar command, as clicking it does, such as `"bold"` or `"undo"` |
| `copyToClipboard(cut)`, `pasteFromClipboard()` | Copy, Cut and Paste |
| `showInsertionChooser(anchor)` | The searchable list of blocks to insert |
| `showCommandSearch(anchor)` | A searchable list of every enabled command |
| `print()` | Prints the document through the browser's print dialog |

## The toolbar

The toolbar can be customized by the user: right-click it and choose Customize Toolbar.

| Method | Does |
|---|---|
| `showToolbarCustomizer()`, `closeToolbarCustomizer()` | Opens and closes the customizer |
| `saveToolbarState()` | The arrangement and display mode as JSON, for storing per user |
| `loadToolbarState(state)` | Restores it; unknown items are skipped |
| `resetToolbar()` | Rebuilds the default toolbar |
| `updateToolbarState()` | Refreshes the toolbar's enabled and active states |

Toolbar items the editor doesn't handle itself raise `toolbarItemPressed`, so an application
can add its own items and respond to them. See [The toolbar](toolbar.md).

## Messages and prompts

```ts
editor.showMessage("Saved", "success")                     // text, a Bootstrap color name, and an optional duration in ms
let values = await editor.prompt("Rename", [{name: "title", label: "Title", value: "Draft"}])
```

`showMessage` raises `messageShowing` first; call `preventDefault` on it to show the message
yourself. `prompt` resolves with the field values by name, or null when the user cancels. A field's
`type` can be `"text"` (the default), `"url"`, `"number"`, `"checkbox"`, `"select"` (with
`options`) or `"textarea"`.

## Events

Every event is a `CustomEvent` with its details in `detail`.

| Event | `detail` | When |
|---|---|---|
| `contentChanged` | `{node}` | After content or a saved property changes; `node` is null for document-wide changes |
| `selectionChanged` | `{node}` | After the primary selected node changes |
| `editingChanged` | `{node}` | After text editing starts, moves to another node, or stops |
| `keyPress` | `{key, event}` | Before the editor handles a key; `preventDefault` to handle it yourself |
| `nodeKeyPress` | `{node, key, event}` | Before a selected (not edited) node handles a key; `preventDefault` to handle it yourself |
| `linkPressed` | `{node, url, text, title}` | When a link is Ctrl- or Command-clicked, or clicked while read-only; `preventDefault` to stop the editor opening it |
| `toolbarItemPressed` | `{item, menuItem}` | For toolbar items the editor doesn't handle |
| `messageShowing` | `{notification, text, indicator}` | Before a message shows; `preventDefault` to show it yourself |
| `nodeDragging` | `{node, nodes, beforeNode, parentNode, x, y}` | While nodes are dragged; `preventDefault` to refuse the position |
| `nodeDropped` | `{node, nodes, beforeNode, parentNode}` | When nodes are dropped; `preventDefault` to cancel the move |
| `nodePointerEnter`, `nodePointerExit` | `{node}` | As the pointer moves onto and off a node |
| `nodePointerMove` | `{node, x, y}` | As the pointer moves over a node, relative to the node |
| `pointerEnter`, `pointerExit`, `pointerMoved` | `{x, y}` | As the pointer moves over the editor, relative to the editor |
| `pickerOpened` | `{picker}` | When one of the editor's menus or popovers opens |
| `pickerClosed` | `{picker, committed, value}` | When it closes |
| `suggestionCommitted` | `{node, provider, suggestion}` | After a text suggestion is chosen |
| `annotationAdded`, `annotationChanged`, `annotationRemoved` | `{annotation}` | When comments change, including through undo and redo |
| `annotationSelected` | `{annotation}` | When a comment marker is clicked; `preventDefault` to show it yourself |
| `toolbarCustomized` | `{state}` | When the customizer closes with changes |
| `toolbarReset` | | After `resetToolbar` |
| `scrollChanged` | `{x, y}` | When the document scrolls |
| `readOnlyChanged` | `{readOnly}` | When `readOnly` changes |
| `heightChanged` | the height | When the height changes, while `adaptiveHeight` is true |
| `autosaveStateChanged` | `{state, error}` | When autosave's state changes; `error` is set for `"failed"` |


## Registering node types and extensions

`Editor.registerNodeType(type, order)` and `Editor.registerExtension(extension)` add node types
and commands to every editor created afterwards. `editor.nodeTypes` lists one editor's types,
and can add or remove types for that editor alone. See
[Writing node types](custom-node-types.md).

An add-on can register its exports by name with `Editor.registerAddon(name, exports)` when its
module loads, and `Editor.addon(name)` gives them back, or `undefined` until it's loaded. Code that
can't import an add-on's module directly uses it, such as the framework components, which find the
inspector with `Editor.addon("inspector")?.Inspector` whichever package it was installed from.
