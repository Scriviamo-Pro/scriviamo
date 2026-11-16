# Server rendering

Saved documents can be turned into HTML, Markdown or plain text without a browser, such as on a
Node server that shows published documents, sends them by email, or indexes them for search.
Pages then load fast and work without JavaScript, and the editor is loaded only where people
edit.

```js
import {Editor} from "scriviamo"
import "scriviamo/dist/addons/scriviamo.callouts.js"   // the add-ons the documents use

const saved = await db.documents.find(id)               // what editor.toJSON() saved

const html = Editor.renderHTML(saved.content)            // the content, to put in your own page
const page = Editor.renderHTML(saved.content, true)      // a whole page with its stylesheet
const markdown = Editor.renderMarkdown(saved.content)
const text = Editor.renderPlainText(saved.content)       // for search indexes and previews
```

The output is the same as a visible editor's `toHTML()`, `toMarkdown()` and `toPlainText()`.
Node 18 or later loads the bundles in `dist/` as ES modules.

## Headless editors

`Editor.renderHTML` and the others create a *headless* editor: one made with `null` instead of
an element. It draws nothing and needs no browser, but loads, changes and exports documents like
any other, so a server can also build or change documents:

```js
import {Editor, HeadingNode, TextNode} from "scriviamo"

const editor = new Editor(null, {content: saved.content})
editor.addNode(new TextNode(`Updated ${new Date().toLocaleDateString()}`))
const updated = editor.toJSON()
```

## Add-ons

Import the add-ons the documents use before rendering them, as in the browser. A node type that
isn't registered is kept unchanged in JSON, but writes nothing into HTML.

Add-ons import the base package as `"scriviamo"`, so that name must lead to the same
`dist/scriviamo.js` the server imports, through an installed package, a `paths` or alias
setting in your bundler, or an import map.

Some add-ons draw with a library in the browser, which a server doesn't load:

- **Formulas** export the LaTeX source between `\[` and `\]`, which MathJax and KaTeX's
  auto-render read. For MathML, as in the browser, give the math add-on KaTeX:

  ```js
  import katex from "katex"
  import {MathRenderer} from "scriviamo/dist/addons/scriviamo.math.js"
  MathRenderer.use(katex)
  ```

- **Diagrams** export Mermaid's own `<pre class="mermaid">`, which a page that loads Mermaid
  draws, since Mermaid needs a browser to draw.

## Reading HTML and Markdown

Rendering JSON needs nothing from a browser. Reading HTML or Markdown, with `fromHTML`,
`fromMarkdown` or the `html` and `markdown` options, parses HTML with the browser's `DOMParser`,
which Node doesn't have; on a server, store documents as JSON, the format that keeps everything.
