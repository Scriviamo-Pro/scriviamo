import {AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse} from "@angular/ssr/node"
import express from "express"
import {join} from "node:path"
import {api} from "./server/api"

const browserDistFolder = join(import.meta.dirname, "../browser")

const app = express()
const angularApp = new AngularNodeAppEngine()

app.use("/api", api)

app.use(express.static(browserDistFolder, {maxAge: "1y", index: false, redirect: false}))

// Every other request is a page, rendered on the server.
app.use((request, response, next) => {
  angularApp.handle(request).then(result => result ? writeResponseToNodeResponse(result, response) : next()).catch(next)
})

if (isMainModule(import.meta.url) || process.env["pm_id"]) {
  const port = process.env["PORT"] || 4000
  app.listen(port, error => {
    if (error) throw error
    console.log(`Listening on http://localhost:${port}`)
  })
}

/** The request handler for the Angular CLI's dev server and build. */
export const reqHandler = createNodeRequestHandler(app)
