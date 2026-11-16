export default defineEventHandler(async event => {
  let document = await loadDocument(getRouterParam(event, "id") || "")
  if (!document) throw createError({statusCode: 404, statusMessage: "Not found"})
  return document
})
