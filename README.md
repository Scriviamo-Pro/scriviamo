# Scriviamo

Scriviamo is a block-based rich text editor for the web, written in TypeScript. Its name is
Italian for "we write" and "let's write".

A document is a list of blocks, called nodes: paragraphs, headings, lists, quotes, code,
tables, images, and any node types you add. Each block edits its own content, and the editor
saves documents as JSON and reads and writes HTML, Markdown and plain text.

This repository is the free edition, MIT licensed.

## Features

- Block editing with a toolbar, a contextual toolbar on the selected block, insertion and
  drag handles, and command search
- Rich text formatting, links, colors and fonts, with Markdown shortcuts as you type
- Tables with merged cells, header and footer rows, and blocks inside cells
- Alerts, audio and video, forms, and raw HTML, as add-ons
- Comments on text or whole blocks, with threads that can be answered and resolved
- Text suggestions, such as @-mentions and emoji
- Find and replace, undo and redo, and word counts
- Localization of all interface text, including add-ons'
- Your own node types, toolbar items and export formats
- Components for React, Vue and Angular

## Packages

Scriviamo is a base package plus add-ons, all ES modules.

| Package | Contents |
|---|---|
| Base (`scriviamo`) | The editor, import and export, localization, and text, heading, list, quote, code, table, image and divider blocks |
| `callouts` | Alerts |
| `rawcontent` | HTML written into exports unchanged |
| `media` | Audio and video |
| `forms` | Forms and form controls |

`src/examples/` has two example node types an application might add: a text block with its own
commands, and an embedded YouTube video.

Premium add-ons, such as columns, data tables, an inspector panel and real-time
collaboration, are available separately from [scriviamo.dev](https://scriviamo.dev/). Documents
that use them still open in the free edition, which keeps their blocks unchanged.

## Quick start

You need [Node.js](https://nodejs.org/) to build.

```bash
cd src
npm install
npm run build
```

The build writes `dist/scriviamo.js` and `dist/scriviamo.css`, each add-on in `dist/addons/`,
the examples in `dist/examples/`, and TypeScript declarations in `dist/types/`. The built files
are committed, so you can use `dist/` without building.

Use it in a page with Bootstrap 5 and Bootstrap Icons for the interface, and an import map for
the package name:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
<link rel="stylesheet" href="dist/scriviamo.css">

<script type="importmap">
  {"imports": {"scriviamo": "./dist/scriviamo.js"}}
</script>

<div id="editor" style="height: 500px"></div>

<script type="module">
  import {Editor} from "scriviamo"

  let editor = new Editor(document.getElementById("editor"), {
    markdown: "# Hello\n\nStart typing here."
  })
</script>
```

[Getting started](docs/getting-started.md) covers the options, saving and loading, and add-ons.

## Framework wrappers

[`wrappers/`](wrappers/README.md) has components for React, Vue and Angular, each its own package,
with the editor's settings as properties and the document as a two-way value.

## Running the demo

Serve the repository root with any static web server, such as `npx serve` or
`python3 -m http.server`, and open `index.html`. The demo loads the base package, the add-ons
and the examples.

## Tests

Open `test/index.html` from a web server.

- `?packages=base` tests the base package on its own.
- `?packages=forms` tests the base package with one add-on; `?packages=forms,media` with
  several.
- With no parameter, every package is tested.

## Documentation

The [docs](docs/README.md) cover the editor's API, node types, writing your own node types and
their settings, import and export, the toolbar, and localization.

## Repository layout

```
index.html               the demo page
src/
  index.ts               the base package's entry module
  *.ts, nodes/           the base package
  scriviamo.css          the base stylesheet
  addons/<name>/         each add-on, with its stylesheet
  examples/<name>/       each example node type
  build.mjs              the build
dist/                    built packages
test/
  index.html             the test page
  suites/                tests for the base package, each add-on, and combinations
docs/                    documentation
wrappers/                React, Vue and Angular components
```

## License

MIT. See [LICENSE](LICENSE).
