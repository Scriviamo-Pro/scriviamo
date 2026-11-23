// The add-ons this app's documents use, on the server, so rendering knows every node type.
import "../../../../dist/addons/scriviamo.callouts.js"
import "../../../../dist/addons/scriviamo.media.js"
import "../../../../dist/addons/scriviamo.math.js"
import "../../../../dist/addons/scriviamo.diagrams.js"
import {DocumentSchema, Editor} from "scriviamo"

/**
 * What the app's documents may hold: the node types of the add-ons above, and links and media
 * with safe addresses. Saving checks every document against it, whatever the browser sent.
 */
export const schema = new DocumentSchema({maxNodes: 5000})

/** A headless editor holding a saved document, or null when it isn't one or doesn't fit the schema. */
export function loadEditor(content: string): Editor | null {
  let editor = new Editor(null, {schema})
  return editor.fromJSON(content) ? editor : null
}
