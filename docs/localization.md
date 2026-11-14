# Localization

All of the editor's interface text is in a `Strings` object: menu and toolbar captions,
tooltips, inspector labels, placeholders and messages. Each piece of text has a name that
starts with `Text`, such as `TextBoldCaption`.

Each editor has its own `strings`, and the inspector uses its editor's.

## Locale packs

A locale pack is JSON with a language tag and the text by name:

```json
{
  "language": "fr-CA",
  "strings": {
    "Editor": {
      "TextBoldCaption": "Gras",
      "TextItalicCaption": "Italique"
    }
  }
}
```

Text under the `Editor` and `Inspector` sections applies; other sections are ignored. A pack
whose language tag is invalid, or with a value that isn't text, is rejected whole.

A plain object of names and text works too:

```ts
editor.localize({TextBoldCaption: "Gras", TextItalicCaption: "Italique"})
```

## Applying a locale

| Where | Applies to |
|---|---|
| `new Editor(element, {strings: pack})` | One editor, from the start |
| `editor.localize(pack)` | One editor, rebuilding its toolbar and nodes with the new text; returns how many values applied |
| `Strings.useLocale(pack)` | Every editor created afterwards; `Strings.useLocale(null)` goes back to the built-in text |

Each accepts a locale pack, an object of strings, or JSON text of either.

When the same text is set in more than one place, the most specific wins:

1. A locale pack applied to one editor.
2. The application's locale, from `Strings.useLocale`.
3. The built-in text of the base package or an add-on.

## Add-ons and your own node types

Add-ons bring their own text and add it to `Strings` with `Strings.register` when they are
imported. A locale pack translates it the same way as the base package's text.

A locale pack can include text for an add-on that hasn't been imported yet. The text is kept,
and used once the add-on is imported, so the order you load add-ons and apply locales in
doesn't matter.

Your own node types can do the same. Define the text with names that start with `Text`,
register it, and read it from the node's `strings`, which are its editor's:

```ts
import {Strings, TextNode} from "scriviamo"

const NoteStrings = {
  TextNoteCaption: "Note",
  TextNotePlaceholder: "Write a note"
}

// Lets TypeScript know about the new names.
type NoteStringTable = typeof NoteStrings
declare module "scriviamo" {
  interface Strings extends NoteStringTable {}
}

Strings.register(NoteStrings)

export class NoteNode extends TextNode {
  get typeName() {
    return this.strings.TextNoteCaption
  }
}
```

A name that already has text keeps it, so registering can't change the base package's text or
another add-on's. `Strings.registeredNames` lists the names add-ons have registered.

## Formats

Some text has placeholders in percent signs, such as `TextHeadingLevelCaption`, which is
`"Heading %level%"`. Keep the placeholders when translating. `Utilities.format(text, values)`
fills them in for your own text.
