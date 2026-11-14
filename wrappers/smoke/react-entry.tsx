import {createRoot} from "react-dom/client"
import {flushSync} from "react-dom"
import {createRef, useState} from "react"
import {ScriviamoEditor, type ScriviamoEditorHandle} from "../react/dist/index.js"
import {connectRunner, sample} from "./page"

const wait = (ms = 50) => new Promise(r => setTimeout(r, ms))

async function runSmoke() {
  let log: any = {}
  let host = document.createElement("div")
  document.body.append(host)
  let root = createRoot(host)
  let changes: Array<string> = []
  let ready: any = null
  let ref = createRef<ScriviamoEditorHandle>()
  let render = (value: string, readOnly: boolean) => flushSync(() => root.render(<div>
    <ScriviamoEditor ref={ref} value={value} format="markdown" readOnly={readOnly} style={{height: 300}} onChange={v => changes.push(v)} onReady={e => ready = e} />
  </div>))
  render("# Hello\n\nWorld", false)
  await wait()
  let editor = ref.current!.editor!
  log.ready = ready === editor
  log.loaded = editor.nodes().map(n => n.type).join(",")
  log.initialChanges = changes.length
  editor.addNode(new (editor.nodes()[1].constructor as any)("Added"))
  await wait()
  log.changeReported = changes.length == 1 && changes[0].includes("Added")
  render(changes[0], false)
  await wait()
  log.echoKeptDocument = editor.nodes().length == 3 && !editor.history.canUndo === false
  let before = changes.length
  render("Replaced", true)
  await wait()
  log.noSpuriousChange = changes.length == before
  render(changes[0], true)
  await wait()
  log.resetToEarlierValue = editor.nodes().length == 3
  render("Replaced", true)
  await wait()
  log.replaced = editor.nodes().map(n => n.text).join("|")
  log.readOnly = editor.readOnly
  render("Replaced", false)
  await wait()
  flushSync(() => root.unmount())
  log.unmounted = host.querySelector(".scv-editor") === null
  host.remove()
  return log
}

/** A live editor and inspector, shown while the page is open. */
function Demo() {
  const [value, setValue] = useState(sample)
  const [editor, setEditor] = useState<any>(null)
  return <div style={{display: "flex", gap: 12}}>
    <ScriviamoEditor value={value} format="markdown" onChange={setValue} onReady={setEditor} style={{flex: 1, height: 360}} />
  </div>
}

createRoot(document.getElementById("demo")!).render(<Demo />)
connectRunner(runSmoke)
