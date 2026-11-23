# Keyboard shortcuts

Every key the editor responds to, by where it works. macOS keys are on the left, Windows and Linux
keys on the right. Keys that are the same everywhere are shown once.

## Everywhere in the editor

| macOS | Windows and Linux | Does |
|---|---|---|
| ⌘Z | Ctrl+Z | Undo |
| ⇧⌘Z | Ctrl+Y or Ctrl+Shift+Z | Redo |
| ⌘F | Ctrl+F | Find |
| ⌥⌘F | Ctrl+H | Find and replace |
| ⇧⌘P | Ctrl+Shift+P | Search every command |
| ⌘P | Ctrl+P | Print |
| ⌥⌘M | Ctrl+Alt+M | Comment on the selection |
| ⌘A | Ctrl+A | Select all the text in a block; again, select every block |
| ⌥⇧↑ / ⌥⇧↓ | Alt+Shift+↑ / Alt+Shift+↓ | Move the selected blocks up or down |
| / | / | In an empty paragraph, choose a block to insert |
| @ | @ | Mention someone, when the application offers people |
| : | : | Choose an emoji by name |

## Text

In paragraphs, headings, list items, quotes and other text.

| macOS | Windows and Linux | Does |
|---|---|---|
| ⌘B | Ctrl+B | Bold |
| ⌘I | Ctrl+I | Italic |
| ⌘U | Ctrl+U | Underline |
| ⇧⌘X or ⇧⌘S | Ctrl+Shift+X or Ctrl+Shift+S | Strikethrough |
| ⌘E | Ctrl+E | Inline code |
| ⇧⌘H | Ctrl+Shift+H | Highlight |
| ⌘. | Ctrl+. | Superscript |
| ⌘, | Ctrl+, | Subscript |
| ⌘K | Ctrl+K | Add or edit a link |
| ⌘\ | Ctrl+\ | Clear formatting |
| ⌥⌘1 to ⌥⌘6 | Ctrl+Alt+1 to Ctrl+Alt+6 | Heading 1 to 6 |
| ⌥⌘0 | Ctrl+Alt+0 | Paragraph |
| ⇧⌘7 | Ctrl+Shift+7 | Numbered list |
| ⇧⌘8 | Ctrl+Shift+8 | Bulleted list |
| ⇧⌘9 | Ctrl+Shift+9 | Checklist |
| Return | Enter | New paragraph |
| ⇧Return | Shift+Enter | Line break |
| Tab | Tab | Stays in the text; press Escape, then Tab, to move to the next block |
| Escape | Escape | Select the block, to work with it whole |
| ↑ ↓ ← → | ↑ ↓ ← → | Past the start or end of a block, move into the one before or after |
| Delete at the start | Backspace at the start | Join with the block before |
| Fn-Delete at the end | Delete at the end | Join with the block after |
| ⌘⇧D | Ctrl+Shift+D | Duplicate the selected blocks |

Markdown typed at the start of a paragraph, such as `# `, `- `, `1. `, `[] ` or `> `, turns it into
that block when the editor's `markdownShortcuts` option is on. Chips in text, such as dates,
statuses, formulas, and in the Pro editions variables, fill-in fields and footnote references, are removed whole: Delete
(Backspace) after one, or Fn-Delete (Delete) before it.

## Selected blocks

After Escape, or clicking a block's edge, the block itself is selected.

| macOS | Windows and Linux | Does |
|---|---|---|
| ↑ / ↓ | ↑ / ↓ | Select the block before or after; with ⇧ (Shift), add it to the selection |
| Home / End | Home / End | Select the first or last block; with ⇧ (Shift), select up to it |
| Tab / ⇧Tab | Tab / Shift+Tab | Select the next or previous block |
| Return | Enter | Edit the block's text, or add a paragraph after a block without text |
| Delete | Backspace or Delete | Remove the selected blocks |
| ⌘⇧↑ / ⌘⇧↓ | Ctrl+Shift+↑ / Ctrl+Shift+↓ | Move the selected blocks up or down |
| Escape | Escape | Deselect |

## Lists

| macOS | Windows and Linux | Does |
|---|---|---|
| Return | Enter | New item; in an empty item, outdent it, or leave the list |
| Tab / ⇧Tab | Tab / Shift+Tab | Indent or outdent the items |
| ⌘] / ⌘[ | Ctrl+] / Ctrl+[ | Indent or outdent the items |
| Delete at an item's start | Backspace at an item's start | Outdent the item, or join it with the one before |

## Code

| macOS | Windows and Linux | Does |
|---|---|---|
| Return | Enter | New line, keeping the indent |
| Tab / ⇧Tab | Tab / Shift+Tab | Indent or outdent the line, or every selected line |
| ⌘Return | Ctrl+Enter | Leave the code block for a new paragraph after it |

Formulas and diagrams, whose source is code, work the same way.

## Tables, columns and tabs

| macOS | Windows and Linux | Does |
|---|---|---|
| Tab / ⇧Tab | Tab / Shift+Tab | Next or previous cell; Tab in the last cell adds a row |
| ↑ / ↓ | ↑ / ↓ | On a cell's first or last line, the cell above or below |
| Tab / ⇧Tab in columns | Tab / Shift+Tab in columns | Next or previous column |
| Return in a tab's title | Enter in a tab's title | Go to the tab's content |

## Collapsible sections and steps

| macOS | Windows and Linux | Does |
|---|---|---|
| Return in a section's summary | Enter in a section's summary | Go to the section's content |
| Return in a step's label | Enter in a step's label | Go to the step's text |

## Forms

| macOS | Windows and Linux | Does |
|---|---|---|
| Return in a text field | Enter in a text field | Add a paragraph after it |
| Return in a choice | Enter in a choice | Add another choice, in radio groups and dropdowns |
| Delete in an empty choice | Backspace in an empty choice | Remove the choice |

## Pictures, video, audio and embeds

With the editor's `keyboardControls` option on, Tab from the selected block moves to its resize
handle, and the next Tab moves on to the next block.

| macOS | Windows and Linux | Does |
|---|---|---|
| ← / → | ← / → | Narrower or wider by 10 pixels (the other way round in right-to-left text) |
| ↓ / ↑ | ↓ / ↑ | Narrower or wider by 10 pixels |
| ⇧ with an arrow | Shift with an arrow | By 50 pixels |
| Page Down / Page Up | Page Down / Page Up | By 100 pixels |
| Home / End | Home / End | Narrowest or widest |

In the gallery's full-size viewer, ← and → show the previous and next picture (the other way round
in right-to-left text), and Escape closes it.

## Maps

With the editor's `keyboardControls` option on, Tab from the selected map moves to the map, and the
next Tab moves on to the next block.

| macOS | Windows and Linux | Does |
|---|---|---|
| ↑ ↓ ← → | ↑ ↓ ← → | Move the map; with ⇧ (Shift), further |
| + or = | + or = | Zoom in |
| − | − | Zoom out |

## Formulas and notes

| macOS | Windows and Linux | Does |
|---|---|---|
| ⇧⌘E | Ctrl+Shift+E | Insert a formula in the text |
| Return in the formula's field | Enter in the formula's field | Finish the formula |

## Menus, pickers and dialogs

| macOS | Windows and Linux | Does |
|---|---|---|
| ↑ / ↓ | ↑ / ↓ | Previous or next item |
| Home / End | Home / End | First or last item |
| → / ← | → / ← | Open or close a submenu (the other way round in right-to-left text) |
| Return or Space | Enter or Space | Choose the item |
| Tab | Tab | In the "/" chooser and suggestions, choose the item |
| Arrows, then Return | Arrows, then Enter | Pick a table's size in the table grid |
| Escape | Escape | Close the menu, picker or dialog |

## Find and replace

| macOS | Windows and Linux | Does |
|---|---|---|
| Return / ⇧Return | Enter / Shift+Enter | Next or previous match |
| Return in Replace | Enter in Replace | Replace the match |
| Escape | Escape | Close |

## Comments and panels

| macOS | Windows and Linux | Does |
|---|---|---|
| Return in a comment | Enter in a comment | Post it; ⇧Return (Shift+Enter) for a new line |
| ⌥↑ / ⌥↓ on an outline entry | Alt+↑ / Alt+↓ on an outline entry | Move the section up or down |
| Escape | Escape | Close a date's picker |
