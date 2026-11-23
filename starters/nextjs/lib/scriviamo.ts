// The add-ons this app's documents use. Import this module wherever documents are edited or
// rendered, on the server and in the browser, so each knows every node type.
import "../../../dist/addons/scriviamo.callouts.js"
import "../../../dist/addons/scriviamo.media.js"
import "../../../dist/addons/scriviamo.math.js"
import "../../../dist/addons/scriviamo.diagrams.js"

import {DocumentSchema} from "scriviamo"

export {Editor} from "scriviamo"

/**
 * What the app's documents may hold: the node types of the add-ons above, and links and media
 * with safe addresses. Saving checks every document against it, whatever the browser sent.
 */
export const schema = new DocumentSchema({maxNodes: 5000})
