# Getting started

## Requirements

Scriviamo draws its interface with [Bootstrap 5](https://getbootstrap.com/) styles, 5.3 or later,
and [Bootstrap Icons](https://icons.getbootstrap.com/), 1.11 or later. Load both stylesheets on
any page with an editor: without them, the toolbar, menus, dialogs and settings panels show
unstyled, and the toolbar has no icons.

Only the stylesheets are needed. The editor doesn't use Bootstrap's JavaScript or Popper, so
a page doesn't need to load them for the editor.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
```

Installed from npm, Bootstrap and Bootstrap Icons are peer dependencies: your app provides
them, so the editor uses the same Bootstrap as the rest of the page.

The editor follows Bootstrap's color modes, so `data-bs-theme="dark"` on the page gives a dark
editor. It also takes its colors from Bootstrap's CSS variables, such as `--bs-primary` and
`--bs-border-color`, so a customized Bootstrap theme carries over to it.

## Installing from npm

```bash
npm install scriviamo bootstrap bootstrap-icons
```

Import the base package and the add-ons you use by name, with their stylesheets:

```js
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.min.css"
import "scriviamo/dist/scriviamo.css"
import {Editor} from "scriviamo"
import "scriviamo/addons/callouts"
import "scriviamo/dist/addons/scriviamo.callouts.css"
```

Every file in `dist/` below is in the package under `scriviamo/dist/`, so the paths in these docs
work with `scriviamo/` in front. `npm install scriviamo` gets the newest version.

## Building

The source is in `src/`. Building needs Node.js.

```bash
cd src
npm install
npm run build
```

`npm run build` type-checks every module, then writes:

| Output | Contents |
|---|---|
| `dist/scriviamo.js` | The base package, with a minified `.min.js` |
| `dist/scriviamo.css` | The base stylesheet, with a minified `.min.css` |
| `dist/addons/scriviamo.<name>.js` and `.css` | Each add-on |
| `dist/examples/scriviamo.example.<name>.js` | Each example node type |
| `dist/types/` | TypeScript declarations |

`node build.mjs base` builds only the base package, and `node build.mjs forms media` builds
only the named add-ons or examples. `npm run check` type-checks without writing anything.

## Loading the editor in a page

Every module is an ES module. Add-ons import the base package by its name,
`scriviamo`, so a page needs an import map that says where that is. Load the
base package's stylesheet, plus the stylesheet of each add-on that has one.

```html
<link rel="stylesheet" href="dist/scriviamo.css">
<link rel="stylesheet" href="dist/addons/scriviamo.forms.css">

<script type="importmap">
  {"imports": {"scriviamo": "./dist/scriviamo.js"}}
</script>

<div id="editor" style="height: 500px"></div>

<script type="module">
  import {Editor} from "scriviamo"
  import "./dist/addons/scriviamo.forms.js"

  let editor = new Editor(document.getElementById("editor"), {
    markdown: "# Hello\n\nStart typing here."
  })
</script>
```

Import add-ons before creating editors. Each add-on registers its node types when it is
imported, and an editor starts with the types registered at that moment.

With a bundler such as esbuild, Vite or webpack, import `scriviamo` and the
add-ons as you would any package, and the bundler resolves them instead of an import map.

## Creating an editor

```ts
import {Editor, ToolbarDisplayModes} from "scriviamo"

let editor = new Editor(document.getElementById("editor"), {
  html: "<h1>Report</h1><p>Draft</p>",
  toolbarDisplayMode: ToolbarDisplayModes.iconOnly,
  fontSize: 16
})
```

The editor fills the element you give it. Give that element a height, or set `adaptiveHeight`
so the editor grows with its content.

The second argument is optional. It can include:

| Option | Meaning |
|---|---|
| `content` | A document in the JSON format, as a string or object |
| `html` | HTML to load when `content` isn't given |
| `markdown` | Markdown to load when neither `content` nor `html` is given |
| `readOnly` | Shows the document without allowing changes |
| `toolbarVisible` | Shows or hides the toolbar |
| `toolbarDisplayMode` | `ToolbarDisplayModes.iconOnly`, `iconAndText` or `textOnly` |
| `showContextualToolbars` | Shows the small toolbar over the selected node |
| `isHoverInsertionEnabled` | Shows the add and drag buttons beside the block under the pointer |
| `markdownShortcuts` | Turns Markdown typed while editing, such as `## `, into formatting |
| `allowAnnotations` | Turns comments on or off |
| `adaptiveHeight` | Makes the editor as tall as its content |
| `fontName`, `fontSize` | The document font and size |
| `strings` | A locale pack or an object of localized strings; see [Localization](localization.md) |
| `class` | Extra classes for the editor element |
| `statusBar` | Shows the status bar under the document: counts, reading time and the autosave state |
| `insertMenuSearchThreshold` | How many block types the toolbar's Insert menu offers before it shows a search field. 5 by default |
| `fileUploader` | Uploads pictures and other files people add, instead of embedding them; see [Files and uploads](import-export.md#files-and-uploads) |
| `autosave` | Saves the document a moment after each change; see [Autosave](undo-search-statistics.md#autosave) |

To show saved documents on a server, without the editor, see
[Server rendering](server-rendering.md). For a whole app to start from, see the Next.js and Nuxt
starters in [`starters/`](../starters/README.md).

`editor.updateOptions(options)` changes them later. Most also have a property of their own,
such as `editor.readOnly`.

## Saving and loading

The JSON format keeps everything in a document, so use it for saving:

```ts
let saved = editor.toJSON()          // a string
editor.fromJSON(saved)               // false if it can't be loaded; see editor.lastValidationIssues
```

`editor.isChanged` is true after the document changes. Clear it after saving:

```ts
editor.addEventListener("contentChanged", () => saveButton.disabled = !editor.isChanged)
// After saving:
editor.isChanged = false
```

To save automatically as the user writes, give the editor a save function; see
[Autosave](undo-search-statistics.md#autosave).

See [Import and export](import-export.md) for HTML, Markdown and plain text.


## Removing an editor

`editor.destroy()` removes the editor from the page and releases its listeners.

## The demo and tests

- `index.html` is a demo page that loads the base package, the add-ons and the examples. Serve
  the repository root with any static web server and open `index.html`.
- `test/index.html` runs the test suites. `?packages=base` tests the base package alone, and
  `?packages=forms` tests the base package with the forms add-on.
