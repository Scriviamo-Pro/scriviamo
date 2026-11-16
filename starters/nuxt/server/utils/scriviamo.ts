// The add-ons this app's documents use, on the server, so rendering knows every node type.
import "../../../../dist/addons/scriviamo.callouts.js"
import "../../../../dist/addons/scriviamo.media.js"
import "../../../../dist/addons/scriviamo.math.js"
import "../../../../dist/addons/scriviamo.diagrams.js"
import {Editor} from "scriviamo"

/** A headless editor holding a saved document, or null when it isn't one. */
export function loadEditor(content: string): Editor | null {
  let editor = new Editor(null)
  return editor.fromJSON(content) ? editor : null
}
