// The app's API: listing, loading and saving documents, and rendering one as HTML.
import express, {Router} from "express"
import {Editor, schema} from "../app/scriviamo"
import {listDocuments, loadDocument, saveDocument, titleOf, validId} from "./documents"

export const api = Router()

api.get("/documents", async (_request, response) => {
  let documents = await listDocuments()
  response.json(documents.map(({id, title, updated}) => ({id, title, updated})))
})

api.get("/documents/:id", async (request, response) => {
  let document = await loadDocument(request.params.id)
  if (document) response.json(document)
  else response.status(404).send("Not found")
})

/** Saves a document: the body is what editor.toJSON() returns. */
api.put("/documents/:id", express.text({type: "application/json", limit: "20mb"}), async (request, response) => {
  let id = request.params.id
  if (!validId(id)) {
    response.status(400).send("Invalid id")
    return
  }
  let content = typeof request.body == "string" ? request.body : ""
  // Loading it checks it's a document that fits the schema, and gives the title for the list.
  let editor = new Editor(null, {schema})
  if (!editor.fromJSON(content)) {
    response.status(400).json(editor.lastValidationIssues)
    return
  }
  await saveDocument({id, title: titleOf(editor.toPlainText()), content, updated: new Date().toISOString()})
  response.status(204).end()
})

/** The document's HTML and the stylesheet it needs, from a headless editor. */
api.get("/render/:id", async (request, response) => {
  let document = await loadDocument(request.params.id)
  if (!document) {
    response.status(404).send("Not found")
    return
  }
  let editor = new Editor(null, {content: document.content})
  // The page has its own body and html styles; keep the document's to the article.
  let css = editor.exportCSS().replace(/(^|\})\s*body\s*\{[^}]*\}/g, "$1").replace(/(^|\})\s*html\s*\{[^}]*\}/g, "$1")
  response.json({title: document.title, html: editor.toHTML(), css})
})
