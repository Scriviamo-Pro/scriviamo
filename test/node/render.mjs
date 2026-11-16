// Renders documents in Node, with no browser: node test/node/render.mjs [folder]
// The folder holds dist/ (this repository by default). Exits 1 on a failure.
import {realpathSync} from "node:fs"
import {resolve} from "node:path"
import {pathToFileURL} from "node:url"

// The real path, as Node loads modules by theirs: through a symlink, such as macOS's temporary
// folder, the base package would otherwise load twice, and add-ons register with the other copy.
const root = realpathSync(resolve(process.argv[2] || new URL("../..", import.meta.url).pathname))
const dist = pathToFileURL(`${root}/dist/`).href
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }

// Add-ons import the base package as "scriviamo"; give Node the same module through a loader hook.
const {register} = await import("node:module")
register(`data:text/javascript,${encodeURIComponent(`export async function resolve(specifier, context, next) { return specifier == "scriviamo" ? {url: ${JSON.stringify(`${dist}scriviamo.js`)}, shortCircuit: true} : next(specifier, context) }`)}`)

const base = await import(`${dist}scriviamo.js`)
const {Editor, HeadingNode, TextNode, ListNode, ListTypes, TableNode} = base
const {existsSync} = await import("node:fs")
const addons = {}
for (const name of ["callouts", "math", "diagrams", "footnotes", "columns", "blocks", "forms", "media", "linkcards", "datatable", "rawcontent", "templates", "pdf", "assistant", "inspector", "collaboration"]) {
  if (!existsSync(`${root}/dist/addons/scriviamo.${name}.js`)) continue
  try {
    addons[name] = await import(`${dist}addons/scriviamo.${name}.js`)
  } catch (error) {
    failures.push(`The ${name} add-on didn't load in Node: ${error.message}`)
  }
}

const source = new Editor(null)
check(source.element === null, "A headless editor had an element")
source.addNode(new HeadingNode("Report", 1))
source.addNode(new TextNode("Body text"))
source.addNode(new ListNode("One\nTwo", ListTypes.bulleted))
let table = new TableNode(1, 2)
table.cell(0, 0).insert(0, "Cell")
source.addNode(table)
if (addons.callouts) {
  let alert = new addons.callouts.AlertNode()
  alert.content.insert(0, "Careful")
  source.addNode(alert)
}
if (addons.math) {
  let math = new addons.math.MathNode()
  math.latex = "x^2"
  source.addNode(math)
}
const json = source.toJSON()

const html = Editor.renderHTML(json)
check(html.includes(">Report</span></h1>") && html.includes("<p style=\"text-align:start;\">Body text</p>") && html.includes("<li>One</li>") && html.includes("Cell</td>"), `The HTML was wrong:\n${html}`)
if (addons.callouts) check(html.includes(`<aside class="alert alert-info"`), "The alert wasn't exported")
if (addons.math) check(html.includes(`data-latex="x^2"`), "The formula wasn't exported")
const page = Editor.renderHTML(json, true)
check(page.startsWith("<!doctype html>") && page.includes("<style>") && page.includes("</html>"), "The full page wasn't made")
check(Editor.renderMarkdown(json).startsWith("# Report\n\nBody text\n\n- One\n- Two"), `The Markdown was wrong:\n${Editor.renderMarkdown(json)}`)
check(Editor.renderPlainText(json).startsWith("Report\nBody text\nOne\nTwo"), `The plain text was wrong:\n${Editor.renderPlainText(json)}`)

if (failures.length > 0) {
  console.log(`✗  Node rendering: ${failures.length} failed\n${failures.map(failure => `    ${failure}`).join("\n")}`)
  process.exit(1)
}
console.log(`✓  Node rendering: passed, with ${Object.keys(addons).length} add-ons`)
