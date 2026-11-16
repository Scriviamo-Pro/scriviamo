/** A document as HTML and the stylesheet it needs, rendered with a headless editor. */
export default defineEventHandler(async event => {
  let document = await loadDocument(getRouterParam(event, "id") || "")
  let editor = document ? loadEditor(document.content) : null
  if (!editor) throw createError({statusCode: 404, statusMessage: "Not found"})
  // The page has its own body and background, so leave out the export's.
  let css = editor.exportCSS().replace(/(^|\})\s*(body|html)\s*\{[^}]*\}/g, "$1")
  return {html: editor.toHTML(), css}
})
