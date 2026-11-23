import {Component, input} from "@angular/core"
import type {Editor} from "scriviamo"
import {ScriviamoEditorComponent} from "scriviamo-angular"
import "../scriviamo"

const Welcome = "# A new document\n\nStart writing. Type / to add a block: a list, a table, a formula, a diagram and more."

/** The editor, saving the document a moment after each change. */
@Component({
  selector: "app-document-editor",
  imports: [ScriviamoEditorComponent],
  template: `
    <scriviamo-editor
      class="editor-frame"
      [value]="initial() ?? welcome"
      [format]="initial() ? 'json' : 'markdown'"
      [statusBar]="true"
      [autosave]="autosave" />
  `
})
export class DocumentEditor {
  id = input.required<string>()
  /** The saved document, or null for a new one. */
  initial = input<string | null>(null)
  welcome = Welcome

  autosave = {
    save: async (editor: Editor) => {
      let response = await fetch(`/api/documents/${encodeURIComponent(this.id())}`, {method: "PUT", headers: {"Content-Type": "application/json"}, body: editor.toJSON()})
      if (!response.ok) throw new Error(`Saving failed: ${response.status}`)
    },
    warnBeforeLeaving: true
  }
}
