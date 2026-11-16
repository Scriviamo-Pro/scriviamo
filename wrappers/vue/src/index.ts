import {defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef, watch, type PropType} from "vue"
import type {Editor, ToolbarDisplayModes} from "scriviamo"
import {EditorBinding, type ScriviamoFormat, type ScriviamoSettings} from "./editorbinding"

export type {ScriviamoFormat, ScriviamoSettings} from "./editorbinding"

/**
 * A Scriviamo editor. Import the add-ons you use before mounting it.
 *
 *     <ScriviamoEditor v-model="doc" format="markdown" style="height: 500px" @ready="onReady" />
 *
 * modelValue is read when it changes from outside: the editor's own changes come back through
 * update:modelValue, and passing them back in doesn't reload the document.
 *
 * Events: update:modelValue (value), change (value, editor), selection-change (node, editor),
 * ready (editor). The editor is also exposed, as the component's editor, through a template ref.
 */
export const ScriviamoEditor = defineComponent({
  name: "ScriviamoEditor",
  props: {
    modelValue: {type: String, default: undefined},
    format: {type: String as PropType<ScriviamoFormat>, default: "json"},
    readOnly: {type: Boolean, default: undefined},
    toolbarVisible: {type: Boolean, default: undefined},
    toolbarDisplayMode: {type: Number as PropType<ToolbarDisplayModes>, default: undefined},
    showContextualToolbars: {type: Boolean, default: undefined},
    hoverInsertion: {type: Boolean, default: undefined},
    markdownShortcuts: {type: Boolean, default: undefined},
    allowAnnotations: {type: Boolean, default: undefined},
    adaptiveHeight: {type: Boolean, default: undefined},
    fontName: {type: String, default: undefined},
    fontSize: {type: Number, default: undefined},
    locale: {type: [String, Object] as PropType<string | object>, default: undefined},
    editorClass: {type: String, default: undefined},
    statusBar: {type: Boolean, default: undefined},
    autosave: {type: [Function, Object] as PropType<ScriviamoSettings["autosave"]>, default: undefined},
    fileUploader: {type: Function as PropType<ScriviamoSettings["fileUploader"]>, default: undefined},
    changeDelay: {type: Number, default: undefined},
    events: {type: Object as PropType<ScriviamoSettings["events"]>, default: undefined}
  },
  emits: {
    "update:modelValue": (_value: string) => true,
    change: (_value: string, _editor: Editor) => true,
    "selection-change": (_node: unknown, _editor: Editor) => true,
    ready: (_editor: Editor) => true
  },
  setup(props, {emit, expose}) {
    const host = ref<HTMLElement | null>(null)
    const editor = shallowRef<Editor | null>(null)
    let binding: EditorBinding | null = null

    const settings = (): ScriviamoSettings => ({...props, value: props.modelValue} as ScriviamoSettings)

    onMounted(() => {
      binding = new EditorBinding(host.value!, settings(), {
        change: (value, instance) => {
          emit("update:modelValue", value)
          emit("change", value, instance)
        },
        selectionChange: (node, instance) => emit("selection-change", node, instance),
        ready: instance => {
          editor.value = instance
          emit("ready", instance)
        }
      })
    })

    // The binding compares with the previous settings and applies only what changed.
    watch(() => settings(), value => binding?.update(value))

    onBeforeUnmount(() => {
      binding?.destroy()
      binding = null
      editor.value = null
    })

    expose({editor})
    return () => h("div", {ref: host})
  }
})

/** Registers the editor component globally: app.use(ScriviamoPlugin). The inspector has its own plugin in "scriviamo-vue/inspector". */
export const ScriviamoPlugin = {
  install(app: {component(name: string, component: unknown): unknown}) {
    app.component("ScriviamoEditor", ScriviamoEditor)
  }
}
