import {createApp, h, nextTick, ref, shallowRef} from "vue"
import {ScriviamoEditor} from "../vue/dist/index.js"
import {connectRunner, sample} from "./page"

const wait = (ms = 60) => new Promise(r => setTimeout(r, ms))

async function runSmoke() {
  let log: any = {}
  let host = document.createElement("div")
  document.body.append(host)
  let value = ref("# Hello\n\nWorld")
  let readOnly = ref(false)
  let editorRef = ref<any>(null)
  let ready = shallowRef<any>(null)
  let changes: Array<string> = []
  let app = createApp({
    render: () => h("div", [
      h(ScriviamoEditor, {
        ref: editorRef, modelValue: value.value, format: "markdown", readOnly: readOnly.value, style: "height: 300px",
        "onUpdate:modelValue": (v: string) => { value.value = v; changes.push(v) },
        onReady: (e: any) => ready.value = e
      }),
    ])
  })
  app.mount(host)
  await nextTick(); await wait()
  let editor = editorRef.value.editor
  log.ready = ready.value === editor && !!editor
  log.loaded = editor.nodes().map((n: any) => n.type).join(",")
  log.editableByDefault = !editor.readOnly
  editor.addNode(new (editor.nodes()[1].constructor)("Added"))
  await nextTick(); await wait()
  log.vModelUpdated = changes.length == 1 && value.value.includes("Added")
  log.echoKeptDocument = editor.nodes().length == 3
  let before = changes.length
  value.value = "Replaced"
  readOnly.value = true
  await nextTick(); await wait()
  log.noSpuriousChange = changes.length == before
  log.replaced = editor.nodes().map((n: any) => n.text).join("|")
  log.readOnly = editor.readOnly
  app.unmount()
  log.unmounted = host.querySelector(".scv-editor") === null
  host.remove()
  return log
}

/** A live editor and inspector, shown while the page is open. */
const demoValue = ref(sample)
const demoEditor = shallowRef<any>(null)
createApp({
  render: () => h("div", {style: "display: flex; gap: 12px"}, [
    h(ScriviamoEditor, {
      modelValue: demoValue.value, format: "markdown", style: "flex: 1; height: 360px",
      "onUpdate:modelValue": (v: string) => demoValue.value = v,
      onReady: (e: any) => demoEditor.value = e
    }),
  ])
}).mount("#demo")
connectRunner(runSmoke)
