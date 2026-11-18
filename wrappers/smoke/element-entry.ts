import "../element/dist/index.js"
import {connectRunner, sample} from "./page"

const wait = (ms = 60) => new Promise(r => setTimeout(r, ms))

async function runSmoke() {
  let log: any = {}
  let form = document.createElement("form")
  form.innerHTML = '<scriviamo-editor name="body" format="markdown" style="height: 300px">\n    # Hello\n\n    World\n  </scriviamo-editor>'
  let element = form.querySelector("scriviamo-editor") as any
  let ready: any = null
  let changes: Array<string> = []
  element.addEventListener("ready", (event: CustomEvent) => ready = event.detail.editor)
  element.addEventListener("change", (event: CustomEvent) => changes.push(event.detail.value))
  document.body.append(form)
  await wait()
  let editor = element.editor
  log.ready = ready === editor && !!editor
  log.loadedFromText = editor.nodes().map((n: any) => `${n.type}:${n.text}`).join(",") == "heading:Hello,text:World"
  log.editableByDefault = !editor.readOnly
  editor.addNode(new (editor.nodes()[1].constructor)("Added"))
  await wait()
  log.changeEvent = changes.length == 1 && changes[0].includes("Added")
  log.formValue = String(new FormData(form).get("body") || "").includes("Added")
  let before = changes.length
  element.value = "Replaced"
  element.setAttribute("read-only", "")
  await wait()
  log.noSpuriousChange = changes.length == before
  log.replaced = editor.nodes().map((n: any) => n.text).join("|")
  log.readOnlyAttribute = editor.readOnly
  element.readOnly = false
  log.readOnlyProperty = !editor.readOnly
  form.reset()
  await wait()
  log.formReset = editor.nodes().map((n: any) => n.text).join("|") == "Hello|World"
  form.remove()
  await wait()
  log.removed = element.editor === null
  return log
}

/** A live editor and inspector, shown while the page is open. */
let demo = document.getElementById("demo")!
demo.style.cssText = "display: flex; gap: 12px"
let live = document.createElement("scriviamo-editor") as any
live.id = "live-editor"
live.setAttribute("format", "markdown")
live.style.cssText = "flex: 1; height: 360px"
live.value = sample
demo.append(live)
connectRunner(runSmoke)
