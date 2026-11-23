/** Saves a document: the body is what editor.toJSON() returns. */
export default defineEventHandler(async event => {
  let id = getRouterParam(event, "id") || ""
  if (!validId(id)) throw createError({statusCode: 400, statusMessage: "Invalid id"})
  let content = await readRawBody(event, "utf8") || ""
  // Loading it checks it's a document that fits the schema, and gives the title for the list.
  let editor = loadEditor(content)
  if (!editor) throw createError({statusCode: 400, statusMessage: "Not a Scriviamo document, or not one this app allows"})
  await saveDocument({id, title: titleOf(editor.toPlainText()), content, updated: new Date().toISOString()})
  setResponseStatus(event, 204)
  return null
})
