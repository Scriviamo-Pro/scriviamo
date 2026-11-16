import {Editor} from "@/lib/scriviamo"
import {loadDocument, saveDocument, titleOf, validId} from "@/lib/documents"

export async function GET(_request: Request, {params}: {params: Promise<{id: string}>}) {
  let {id} = await params
  let document = await loadDocument(id)
  return document ? Response.json(document) : new Response("Not found", {status: 404})
}

/** Saves a document: the body is what editor.toJSON() returns. */
export async function PUT(request: Request, {params}: {params: Promise<{id: string}>}) {
  let {id} = await params
  if (!validId(id)) return new Response("Invalid id", {status: 400})
  let content = await request.text()
  // Loading it checks it's a document, and gives the title for the list.
  let editor = new Editor(null)
  if (!editor.fromJSON(content)) return new Response("Not a Scriviamo document", {status: 400})
  await saveDocument({id, title: titleOf(editor.toPlainText()), content, updated: new Date().toISOString()})
  return new Response(null, {status: 204})
}
