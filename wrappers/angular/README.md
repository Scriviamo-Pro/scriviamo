# Scriviamo for Angular

Standalone Angular components for the Scriviamo editor: `<scriviamo-editor>`.

```ts
import {Component} from "@angular/core"
import {ScriviamoEditorComponent} from "scriviamo-angular"

@Component({
  selector: "notes-page",
  standalone: true,
  imports: [ScriviamoEditorComponent],
  template: `
    <div style="display: flex; gap: 8px">
      <scriviamo-editor #notes [(value)]="doc" format="markdown" style="flex: 1; height: 500px"></scriviamo-editor>
    </div>
  `
})
export class NotesPage {
  doc = "# Notes\n\nStart writing."
}
```

Add Bootstrap 5's CSS and Bootstrap Icons, which Scriviamo's interface uses, then Scriviamo's
stylesheet and those of the add-ons you use, to the `styles` in your `angular.json`. Bootstrap's
JavaScript isn't needed.

## scriviamo-editor

Takes every setting in the [wrappers README](../README.md#settings) as an input. `value` and
`valueChange` make `[(value)]` work.

| Output | Gives | When |
|---|---|---|
| `valueChange` | the value | The document changed, in `format` |
| `selectionChange` | the node, or null | The primary selected node changed |
| `ready` | the editor | The editor was created |

The component's `editor` property is the editor, so a template variable reaches it:
`#notes` then `notes.editor`. It exists from the component's first check, so a binding such as
`[editor]="notes.editor"` sees it straight away.

The editor is created when the component starts and destroyed with it. Inputs are applied as
they change; only `value` changing from outside reloads the document. The editor's own
listeners run outside Angular's zone, and only the outputs come back into it.

### Angular forms

The component is a form control, so `ngModel`, `formControl` and `formControlName` work:

```html
<scriviamo-editor [formControl]="body" format="html"></scriviamo-editor>
```

Disabling the control makes the editor read-only, and leaving the editor marks the control
touched.


## Building

```bash
npm install
npm run build
```

The build uses `ng-packagr`, which needs Node.js 20.19 or later, and writes an Angular Package
Format library to `dist/`, with the components compiled in partial mode so apps compile them
ahead of time. Angular and Scriviamo stay external, as peer dependencies.
