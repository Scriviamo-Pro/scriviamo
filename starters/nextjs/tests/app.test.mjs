// The starter's own tests: they build nothing, but start the built app (npm run build first, as
// npm test does), with its documents in a temporary folder, and use it as people and browsers
// do: the API, the pages the server renders, and the editor in a headless browser.
//
//   npm test
//
// When a feature reaches this app, add a test for it here.
import assert from "node:assert/strict"
import {spawn} from "node:child_process"
import {mkdtempSync, readFileSync, rmSync} from "node:fs"
import {createServer} from "node:net"
import {tmpdir} from "node:os"
import {dirname, join} from "node:path"
import {after, before, test} from "node:test"
import {fileURLToPath} from "node:url"
import {chromium} from "playwright"

const here = dirname(fileURLToPath(import.meta.url))
const app = join(here, "..")

/** How this app's built server starts, on a port. */
const start = port => [process.execPath, [join(app, "node_modules/next/dist/bin/next"), "start", "-p", String(port)], {}]

const fixture = readFileSync(join(here, "document.json"), "utf8")
let server
let base
let documents
let browser
let pageErrors = []

function freePort() {
  return new Promise((resolve, reject) => {
    let probe = createServer()
    probe.on("error", reject)
    probe.listen(0, "127.0.0.1", () => {
      let {port} = probe.address()
      probe.close(() => resolve(port))
    })
  })
}

async function waitFor(check, what, timeout = 30000) {
  let started = Date.now()
  let last
  while (Date.now() - started < timeout) {
    try {
      if (await check()) return
    } catch (error) {
      last = error
    }
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  throw new Error(`Timed out waiting for ${what}${last ? `: ${last.message}` : ""}`)
}

/** Saves a document through the API, as the editor's autosave does. */
function save(id, body) {
  return fetch(`${base}/api/documents/${id}`, {method: "PUT", headers: {"Content-Type": "application/json"}, body})
}

async function newPage() {
  let page = await browser.newPage()
  page.on("pageerror", error => pageErrors.push(`${page.url()}: ${error.message}`))
  return page
}

before(async () => {
  documents = mkdtempSync(join(tmpdir(), "scriviamo-starter-"))
  let port = await freePort()
  base = `http://localhost:${port}`
  let [command, args, environment] = start(port)
  server = spawn(command, args, {cwd: app, env: {...process.env, ...environment, PORT: String(port), DOCUMENTS_FOLDER: documents}, stdio: ["ignore", "pipe", "pipe"]})
  let output = ""
  server.stdout.on("data", chunk => output += chunk)
  server.stderr.on("data", chunk => output += chunk)
  await waitFor(async () => (await fetch(`${base}/`)).status < 500, `the app to start:\n${output}`, 60000)
  browser = await chromium.launch()
})

after(async () => {
  await browser?.close()
  server?.kill()
  if (documents) rmSync(documents, {recursive: true, force: true})
})

test("the list of documents renders on the server", async () => {
  let response = await fetch(`${base}/`)
  assert.equal(response.status, 200)
  let html = await response.text()
  assert.match(html, /Documents/)
  assert.match(html, /New document/)
})

test("saving takes a document and refuses what the schema doesn't allow", async () => {
  let id = "saved-by-the-api"
  assert.equal((await save(id, fixture)).status, 204, "A document")
  let stored = await (await fetch(`${base}/api/documents/${id}`)).json()
  assert.equal(stored.title, "Hello from the fixture", "The title kept for the list")

  assert.equal((await save("not-json", "{not json")).status, 400, "Text that isn't JSON")
  let unknown = JSON.parse(fixture)
  unknown.nodes.push({type: "rawcontent", nodeId: "raw", content: {text: "<script>alert(1)</script>"}})
  assert.equal((await save("unknown-type", JSON.stringify(unknown))).status, 400, "A node type the app doesn't have")
  let unsafe = fixture.replace("https://example.com/", "javascript:alert(1)")
  assert.notEqual(unsafe, fixture)
  assert.equal((await save("unsafe-link", unsafe)).status, 400, "A javascript: link")
  assert.notEqual((await save("NOT a valid id", fixture)).status, 204, "An id that could reach outside the folder")
  let list = await (await fetch(`${base}/`)).text()
  assert.match(list, /Hello from the fixture/, "The saved document is listed")
})

test("a document renders on the server as a page, with no JavaScript needed", async () => {
  assert.equal((await save("rendered", fixture)).status, 204)
  let html = await (await fetch(`${base}/view/rendered`)).text()
  assert.match(html, /<h1[^>]*>.*Hello from the fixture/s, "The heading")
  assert.match(html, /<a href="https:\/\/example\.com\/"[^>]*>link<\/a>/, "The link")
  let page = await browser.newPage({javaScriptEnabled: false})
  await page.goto(`${base}/view/rendered`)
  assert.equal(await page.locator("article h1").innerText(), "Hello from the fixture")
  await page.close()
})

test("the editor opens a saved document, and saves changes as they're made", async () => {
  assert.equal((await save("edited", fixture)).status, 204)
  let page = await newPage()
  await page.goto(`${base}/edit/edited`)
  let document = page.locator(".scv-document")
  await document.waitFor()
  await waitFor(async () => (await document.innerText()).includes("Hello from the fixture"), "the saved document in the editor")
  let paragraph = document.locator(".scv-text", {hasText: "A paragraph with a link."})
  await paragraph.dblclick()
  await page.keyboard.press("End")
  await page.keyboard.type(" Typed in a test.")
  await waitFor(async () => (await (await fetch(`${base}/api/documents/edited`)).json()).content.includes("Typed in a test."), "the change to be saved")
  await waitFor(async () => /Saved/.test(await page.locator(".scv-status-save").innerText()), "the status bar to say it's saved")
  let html = await (await fetch(`${base}/view/edited`)).text()
  assert.match(html, /Typed in a test\./, "The page shows the change")
  await page.close()
})

test("a new document starts in the editor and is saved once written in", async () => {
  let page = await newPage()
  await page.goto(`${base}/`)
  await page.getByText("New document").click()
  await page.waitForURL(/\/edit\//)
  let id = page.url().split("/edit/")[1]
  let document = page.locator(".scv-document")
  await document.waitFor()
  await waitFor(async () => (await document.innerText()).includes("Start writing"), "the starting text")
  let last = document.locator(".scv-text").last()
  await last.dblclick()
  await page.keyboard.press("End")
  await page.keyboard.type(" A new document from a test.")
  await waitFor(async () => {
    let response = await fetch(`${base}/api/documents/${id}`)
    return response.ok && (await response.json()).content.includes("A new document from a test.")
  }, "the new document to be saved")
  await page.close()
})

test("no page raised an error in the browser", () => {
  assert.deepEqual(pageErrors, [])
})
