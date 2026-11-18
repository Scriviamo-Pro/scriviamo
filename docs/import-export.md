# Import and export

## JSON

The JSON document format keeps everything in a document: every node and setting, the comment
threads, and the character styles of all text. Use it to save and load documents.

```ts
let json = editor.toJSON()           // a string
let object = editor.toJSONObject()   // the same document as an object

if (!editor.fromJSON(json)) {
  console.log(editor.lastValidationIssues)
}
```

`fromJSON` accepts a string or an object. When a document can't be loaded, it returns false
and leaves the editor unchanged; `lastValidationIssues` then lists the problems, each with a
`severity` (`ValidationSeverities.warning` or `error`) and a `message`.
`editor.validateJSON(value)` checks a document without loading it.

Documents record their format version. A document from a newer version of the format than
the editor reads is refused. Older versions are read and saved in the current format.

Nodes whose type isn't registered load as unknown nodes, which save their JSON back unchanged.
See [Node types](node-types.md#unknown-content--unknownnode).

## HTML

```ts
editor.fromHTML("<h1>Title</h1><p>Text</p>")   // replaces the document
editor.insertHTML("<p>More</p>")               // inserts where the user is working
editor.insertHTML("<p>More</p>", node)         // inserts after node

let fragment = editor.toHTML()                       // the content
let page = editor.toHTML(true)                       // a complete page, with the stylesheet
let withComments = editor.toHTML(true, true)         // with the comment threads after the content
```

HTML import keeps what the editor can show: headings, paragraphs, lists, quotes, code, tables,
images, links, character formatting, alignment, colors and fonts, and anything a registered
node type reads, such as forms with the forms add-on. Pasting HTML uses the same import. HTML
with nothing the editor can import leaves the document as it was.

Each node type decides how elements become nodes. See
[Writing node types](custom-node-types.md#reading-html).

## Markdown

```ts
editor.fromMarkdown("# Title\n\nSome **bold** text.")
editor.insertMarkdown("- one\n- two")
let markdown = editor.toMarkdown()
```

Markdown covers headings, paragraphs, emphasis, strikethrough, inline code, links, images,
lists and checklists, quotes, GitHub-style alerts (`> [!NOTE]`) with the callouts add-on, code
blocks, and tables. Formatting Markdown can't express, such as colors or a node's background,
is exported as inline HTML.

## Plain text

```ts
let text = editor.toPlainText()
```

## Pasting from Word and Google Docs

Pasting from Microsoft Word or Google Docs keeps the structure, headings, lists, tables, links,
bold, italic, underline, strikethrough, colors and highlights, and drops what those apps add to
every run of text: fonts and sizes, Word's own styles and markup, and the wrapper Google Docs puts
around a paste. Word's lists, which it writes as paragraphs with typed bullets and numbers, become
real lists, nested as they were; its Title and Subtitle styles become headings; and pictures that
point to files on the copier's computer, which no one else could open, are left out. HTML from
anywhere else is pasted as it is.

`PasteCleanup.clean(html)` is the cleanup, for HTML from elsewhere, such as an application's own
import; `PasteCleanup.source(html)` says whether HTML came from Word (`"word"`), Google Docs
(`"googledocs"`), or neither (null).

## Files and uploads

Pictures, audio, video and background images that people choose, drop or paste are embedded in
the document as data by default. That keeps a document self-contained, but makes it large, and
many applications can't store documents that size. Give the editor a `fileUploader` to store
files on your own server or storage service instead; the document then keeps only each file's
address.

```ts
let editor = new Editor(element, {
  fileUploader: async upload => {
    let body = new FormData()
    body.append("file", upload.file, upload.name || "file")
    let response = await fetch("/uploads", {method: "POST", body, signal: upload.signal})
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`)
    return (await response.json()).url
  }
})
```

The uploader receives one `FileUpload`, and returns the address to show the file from, or a
Promise of it:

| Member | Meaning |
|---|---|
| `file`, `name`, `type` | The file, its name (or "" for pasted content), and its MIME type |
| `kind` | What it's for: `"image"`, `"audio"`, `"video"`, `"background"` or `"file"` |
| `node`, `editor` | The node it's for (null for the document's background and the inspector), and the editor |
| `progress(fraction)` | Reports progress from 0 to 1; a picture shows it as a progress bar |
| `signal` | An `AbortSignal` that fires when the user cancels; pass it to `fetch` |

Returning null or "" embeds that file after all, so an uploader can, for example, embed small
files and upload large ones. Throwing or rejecting shows "The file couldn't be uploaded." and
leaves the document as it was.

While a picture uploads, it shows a preview with a progress bar and a Cancel button, and its
node's `isUploading` is true. The picture becomes part of the document, as one undo step, once
the upload finishes, so a document saved during an upload doesn't have it yet.

`editor.storeFile(file, kind, node)` runs the same steps for your own node types: it resolves
with the uploader's address, or a data URI when there's no uploader.

## Exporters

`editor.exporters` lists the formats `export` and `exportToFile` offer: `"html"`, `"json"`,
`"markdown"` and `"text"`.

```ts
let html = editor.export("html")
editor.exportToFile("markdown", "notes")   // downloads notes.md
```

Add a format by subclassing `Exporter`:

```ts
import {Exporter} from "scriviamo"

class OutlineExporter extends Exporter {
  constructor() {
    super("outline")
    this.fileExtension = "txt"
    this.mimeType = "text/plain"
  }

  export(editor) {
    return editor.nodes().filter(node => node.type == "heading").map(node => node.text).join("\n")
  }
}

editor.exporters.add(new OutlineExporter())
editor.exportToFile("outline")
```

A format that makes a binary file, such as a Word document, overrides `exportBlob(editor)`, which
resolves to the file, instead of `export`; `exportToFile` saves it once it's made. For text
formats, `exportBlob` is the text as a file. `Exporter.download(blob, fileName)` saves any file
through the browser.

## The export stylesheet

`toHTML(true)` writes a stylesheet into the page. Each node type in the document adds its own
rules, so the stylesheet only has rules for the types the document uses.

```ts
let css = editor.exportCSS()            // the stylesheet as CSS text
let sheet = editor.exportStylesheet()   // the same, as a Stylesheet to read or change
```

A node type adds rules with a static `exportStyles(sheet, editor)` method; see
[Writing node types](custom-node-types.md#exporting).

### Theme colors

The export stylesheet draws with a set of theme colors: background, text, links, borders,
alert colors and so on. Change them per editor:

```ts
import {ThemeColors, Colors} from "scriviamo"

editor.setThemeColor(ThemeColors.link, Colors.make(0, 102, 204))
editor.setThemeColor(ThemeColors.link, null)   // back to the default
```

`ThemeColors` has `background`, `primary`, `selection`, `textSelection`, `information`,
`success`, `warning`, `danger`, `text`, `textMuted`, `link`, `border`, `borderStrong`,
`surface`, `dark`, `light` and `highlight`.

Colors are `DocumentColor` objects, `{red, green, blue, alpha}`, with each channel from 0 to
255. Alpha is transparency: 0 is opaque and 255 is fully transparent. `Colors.make`,
`Colors.fromCSS` and `Colors.toCSS` create and convert them.

## Printing

`editor.print()` prints the document through the browser's print dialog. Page breaks from the
blocks add-on start new pages.
