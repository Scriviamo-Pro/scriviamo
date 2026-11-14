# Text and formatting

## Rich text

Text in a node is a `RichText`: the characters, plus one `TextStyle` for each character. A
paragraph's `content`, a table cell, a quote's text and an image caption are all `RichText`.

```ts
import {RichText, TextStyle} from "scriviamo"

let bold = new TextStyle()
bold.bold = true

let text = new RichText("Hello, ")
text.insert(text.length, "world", bold)
text.applyStyle(0, 5, style => style.italic = true)   // "Hello" becomes italic
```

| Member | Meaning |
|---|---|
| `text`, `length` | The characters |
| `styleAt(index)` | One character's style |
| `insert(offset, value, style)` | Inserts a string, with a style, or another `RichText` with its own styles |
| `remove(start, end)` | Removes the characters from `start` up to, not including, `end` |
| `append(other)` | Adds another `RichText` at the end |
| `slice(start, end)` | A copy of part of the text |
| `applyStyle(start, end, change)` | Calls `change` with each character's style in the range |
| `everyStyle(start, end, test)` | True when `test` holds for every character in the range |
| `runs(start, end)` | The range as runs of characters with equal styles |
| `paragraphs()` | Where each paragraph starts and ends, for multi-paragraph text such as list items |
| `htmlText(start, end)`, `markdownText(start, end)` | The range as HTML or Markdown |
| `clone()`, `toJSON()`, `RichText.fromJSON(data)` | Copying and saving |

Two characters separate lines:

| Constant | Character | Meaning |
|---|---|---|
| `ParagraphBreak` | `"\n"` | Ends a paragraph, list item or code line, in text that holds several |
| `LineBreak` | `" "` | A line break inside a paragraph, as Shift+Return types |

After changing a node's text in code, call `node.refresh()` to redraw it, and `node.changed()`
to record the change. See [Changes and undo](custom-node-types.md#changes-and-undo).

## Text styles

A `TextStyle` holds one character's formatting.

| Property | Meaning |
|---|---|
| `bold`, `italic`, `underline`, `strikethrough` | |
| `code` | Inline code |
| `keyboard` | A keyboard key, drawn like a key cap |
| `highlight` | Highlighted with the theme's highlight color |
| `superscript`, `subscript` | |
| `fontName` | A font family; "" follows the paragraph and document |
| `fontSize` | A size in points; 0 follows the paragraph and document |
| `textColor` | A `DocumentColor`; `Colors.empty` follows the theme |
| `backgroundColor`, `hasBackgroundColor` | A background color behind the text |
| `linkURL`, `linkTitle`, `linkTarget` | A link; `linkTarget` is `"_blank"` to open a new window |
| `linkColor`, `hasLinkColor` | A link color of its own |

`clone()`, `equals(other)` and `isDefault()` compare and copy styles. Text suggestions mark
their text with `suggestionProviderIdentifier` and `suggestionIdentifier`; see
[Comments and suggestions](comments-and-suggestions.md#text-suggestions).

## Formatting what the user is working on

`editor.formatting` formats the text being edited, or the selected nodes' text, as the toolbar
does. With only a caret and no selected text, the formatting applies to what the user types
next.

```ts
import {FormattingStyles, Alignments, Colors} from "scriviamo"

editor.formatting.toggle(FormattingStyles.bold)
editor.formatting.setTextColor(Colors.make(200, 0, 0))
editor.formatting.setFontSize(18)
editor.formatting.align(Alignments.middle)
```

| Member | Does |
|---|---|
| `toggle(style)` | Turns a `FormattingStyles` format on or off: `bold`, `italic`, `underline`, `strikethrough`, `code`, `highlight`, `keyboard`, `superscript`, `subscript` |
| `isApplied(style)`, `canApply(style)` | Whether a format is on, and whether it is available here |
| `apply(change)` | Calls `change` with every targeted character's style, for any other change |
| `currentStyle()` | The style at the caret, or of the first selected character |
| `setTextColor(color)`, `setBackgroundColor(color)` | null removes the color |
| `setFontName(name)`, `setFontSize(size)` | "" and 0 follow the document |
| `clearFormatting()`, `canClearFormatting` | Removes character formatting, keeping links |
| `align(value)`, `alignment`, `canAlign` | Aligns the text being edited within its block, or the selected nodes on the page |
| `editLink()`, `removeLink()`, `canEditLink` | Shows the link dialog for the selection, or removes its link |

## Font choices

`editor.fontOptions` is a `FontOptions`: the fonts and sizes the toolbar offers, and which
formats are available.

```ts
editor.fontOptions.setFontNames(["System", "Georgia", "Menlo"])
editor.fontOptions.setSizes([12, 14, 16, 20, 28])
editor.fontOptions.allowCustomFontSize = false
editor.fontOptions.allowKeyboard = false       // removes the keyboard-key format
editor.updateToolbarState()
```

| Member | Meaning |
|---|---|
| `fontNames()`, `setFontNames(values)`, `addFontName(value)`, `removeFontName(value)` | The Font menu. `"System"` is the platform's interface font. |
| `sizes()`, `setSizes(values)`, `addSize(value)`, `removeSize(value)` | The Size menu. The list starts with 0, which stands for Default; `setSizes` adds it for you. |
| `allowCustomFontSize` | Adds Custom… to the Size menu, for typing any size from 1 to 1000 |
| `allowBold`, `allowItalic`, `allowUnderline`, `allowStrikethrough`, `allowCode`, `allowHighlight`, `allowKeyboard`, `allowSuperscript`, `allowSubscript` | Which formats are available |

`editor.fontNames` and `editor.fontSizes` are shortcuts to the same lists.

A node can have its own `fontOptions`, which replace the editor's while that node is
formatted. Use it, for example, to offer only monospaced fonts in a node type of your own. `editor.activeFontOptions()`
is the set in effect.
