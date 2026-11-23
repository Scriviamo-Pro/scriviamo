# Angular

`scriviamo-angular` puts the editor in an Angular app as a standalone component that works with
`[(value)]` and Angular forms. This page walks through setting it up, keeping and saving the
document, and server rendering. The [package's README](../wrappers/angular/README.md) lists every
input and output.

## Installing

```bash
npm install scriviamo scriviamo-angular bootstrap bootstrap-icons
```

Angular 17 or later. Add the stylesheets to the `styles` in `angular.json`: Bootstrap's CSS and
Bootstrap Icons, which Scriviamo's interface uses, then Scriviamo's own and those of the add-ons
you use.

```json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "node_modules/bootstrap-icons/font/bootstrap-icons.min.css",
  "node_modules/scriviamo/dist/scriviamo.css",
  "node_modules/scriviamo/dist/addons/scriviamo.callouts.css",
  "src/styles.css"
]
```

Add-ons register their node types when they're imported. Import them in one module, and import
that module wherever documents are edited or rendered, so every editor knows every node type:

```ts
// src/app/scriviamo.ts
import "scriviamo/addons/callouts"
import "scriviamo/addons/math"
export {Editor} from "scriviamo"
```

## An editor

```ts
import {Component} from "@angular/core"
import {ScriviamoEditorComponent} from "scriviamo-angular"
import "./scriviamo"

@Component({
  selector: "app-notes",
  imports: [ScriviamoEditorComponent],
  template: `<scriviamo-editor [(value)]="doc" format="markdown" [statusBar]="true" style="height: 500px" />`
})
export class Notes {
  doc = "# Notes\n\nStart writing."
}
```

Give the editor a height, or set `adaptiveHeight` to let it grow with the document.

- `[(value)]` keeps the document in your component, in `format`: `"json"` (the default, which
  keeps everything), `"html"` or `"markdown"`. Changing it from outside replaces the document; the
  editor's own changes coming back don't reload anything.
- It's also a form control, so `ngModel`, `formControl` and `formControlName` work. Disabling the
  control makes the editor read-only.
- `changeDelay` reports changes only once typing pauses, for large documents.
- Every other input is an editor setting, applied as it changes: `readOnly`, `toolbarVisible`,
  `locale` and the others in the [wrappers README](../wrappers/README.md#settings).

## Saving

`autosave` saves the document a moment after each change, and the status bar shows whether it
has:

```ts
@Component({
  selector: "app-document-editor",
  imports: [ScriviamoEditorComponent],
  template: `<scriviamo-editor [value]="initial()" [autosave]="autosave" [statusBar]="true" />`
})
export class DocumentEditor {
  id = input.required<string>()
  initial = input.required<string>()
  autosave = {
    save: async (editor: Editor) => {
      let response = await fetch(`/api/documents/${this.id()}`, {method: "PUT", headers: {"Content-Type": "application/json"}, body: editor.toJSON()})
      if (!response.ok) throw new Error(`Saving failed: ${response.status}`)
    },
    warnBeforeLeaving: true
  }
}
```

See [Autosave](undo-search-statistics.md#autosave) for its settings.

## The editor itself

For anything the inputs don't cover, use the `Editor`: the component's `editor` property is it,
so a template variable reaches it, and the `ready` output gives it too.

```html
<scriviamo-editor #notes />
<button (click)="notes.editor?.print()">Print</button>
```

The editor's own listeners run outside Angular's zone; only the outputs come back into it.
`events` listens to the editor's events by name, such as `{linkPressed: event => …}`. See
[The editor](editor.md) for what it offers.

## Server rendering

With `@angular/ssr`, the components render on the server as the empty element the editor fills,
and create the editor once the page is running in the browser. They aren't hydrated, since the
editor builds its own content. Wrapping the editor in `@defer` also loads its code only once the
page is up:

```html
@defer (on immediate) {
  <app-document-editor [id]="id()" [initial]="initial()" />
} @placeholder {
  <div class="editor-frame"></div>
}
```

Documents render on the server without the editor's interface: a headless editor, made with
`new Editor(null)`, loads the saved JSON and returns its HTML and the stylesheet it needs, in an
Express route in `server.ts`. With a [schema](schema.md), it also checks a document before saving it, whatever the browser sent:

```ts
api.get("/render/:id", async (request, response) => {
  let document = await loadDocument(request.params.id)
  let editor = new Editor(null, {content: document.content})
  response.json({html: editor.toHTML(), css: editor.exportCSS()})
})
```

A page shows that HTML with `[innerHTML]`, after `DomSanitizer.bypassSecurityTrustHtml`, since
Angular would otherwise drop the document's styles; the HTML comes from your own headless editor.

See [Server rendering](server-rendering.md) for what a headless editor can do. The
[Angular starter](../starters/angular/README.md) is a complete app with all of this: a list of
documents, an editor page with autosave, a save endpoint, and server-rendered pages.
