import type {Editor} from "scriviamo"
import {EditorBinding, type ScriviamoFormat, type ScriviamoSettings} from "./editorbinding"

export type {ScriviamoFormat, ScriviamoSettings} from "./editorbinding"

/** Attributes and the settings they set: [attribute, setting, kind]. */
const Attributes: Array<[string, keyof ScriviamoSettings, "string" | "boolean" | "number"]> = [
  ["format", "format", "string"],
  ["read-only", "readOnly", "boolean"],
  ["toolbar-visible", "toolbarVisible", "boolean"],
  ["toolbar-display-mode", "toolbarDisplayMode", "number"],
  ["show-contextual-toolbars", "showContextualToolbars", "boolean"],
  ["hover-insertion", "hoverInsertion", "boolean"],
  ["markdown-shortcuts", "markdownShortcuts", "boolean"],
  ["allow-annotations", "allowAnnotations", "boolean"],
  ["adaptive-height", "adaptiveHeight", "boolean"],
  ["font-name", "fontName", "string"],
  ["font-size", "fontSize", "number"],
  ["editor-class", "editorClass", "string"],
  ["status-bar", "statusBar", "boolean"],
  ["change-delay", "changeDelay", "number"]
]

// On a server, such as while a page renders there, there are no elements: importing this module
// defines nothing, and the class extends a stand-in.
const ElementBase: typeof HTMLElement = typeof HTMLElement == "undefined" ? (class {} as unknown as typeof HTMLElement) : HTMLElement

/**
 * A Scriviamo editor as an HTML element, for pages and apps with any framework or none. Import the
 * add-ons you use, and this module, which defines the element:
 *
 *     <scriviamo-editor name="body" format="markdown" status-bar style="height: 500px">
 *     # Notes
 *
 *     Start writing.
 *     </scriviamo-editor>
 *
 * The text inside the element is the document it starts with, in its format, unless it has a
 * value attribute. Boolean attributes are on when present, and off when set to "false".
 *
 * Properties: value, format, editor (the Editor), a property for each attribute, such as readOnly,
 * and the settings that can't be attributes: autosave, fileUploader, locale and events.
 *
 * Events: change and input (detail: {value, editor}) as the document changes; selectionchange
 * (detail: {node, editor}); ready (detail: {editor}) once the editor is made.
 *
 * In a form, it's a form field: its value is submitted under its name, and form.reset() brings
 * back the document it started with.
 */
export class ScriviamoEditorElement extends ElementBase {
  static formAssociated = true

  static get observedAttributes(): Array<string> {
    return ["value", ...Attributes.map(([attribute]) => attribute)]
  }

  #binding: EditorBinding | null = null
  #host: HTMLElement | null = null
  #internals: ElementInternals | null = null
  /** Settings given as properties, which attributes don't cover. */
  #properties: ScriviamoSettings = {}
  #value: string | undefined = undefined
  #initialValue: string | undefined = undefined

  constructor() {
    super()
    if (typeof this.attachInternals == "function") {
      try {
        this.#internals = this.attachInternals()
      } catch {
        this.#internals = null
      }
    }
  }

  /** The Editor, once the element is on the page. */
  get editor(): Editor | null {
    return this.#binding ? this.#binding.editor : null
  }

  /** The document, in format. Setting it replaces the document. */
  get value(): string {
    return this.#binding ? this.#binding.value : this.#value ?? ""
  }

  set value(value: string) {
    this.#value = String(value ?? "")
    this.#update()
  }

  get format(): ScriviamoFormat {
    let format = this.getAttribute("format")
    return format == "html" || format == "markdown" ? format : "json"
  }

  set format(value: ScriviamoFormat) {
    this.setAttribute("format", value)
  }

  get form(): HTMLFormElement | null {
    return this.#internals ? this.#internals.form : null
  }

  get name(): string {
    return this.getAttribute("name") || ""
  }

  /** Settings with no attribute, or set from script: autosave, fileUploader, locale, events and the rest. */
  get settings(): ScriviamoSettings {
    return {...this.#properties}
  }

  set settings(value: ScriviamoSettings) {
    this.#properties = {...value}
    this.#update()
  }

  connectedCallback() {
    if (this.#binding) return
    // The text inside is the starting document.
    if (this.#value === undefined && !this.hasAttribute("value")) {
      let inline = this.format == "html" ? this.innerHTML.trim() : this.#dedent(this.textContent || "")
      if (inline.length > 0) this.#value = inline
    }
    if (this.#value === undefined && this.hasAttribute("value")) this.#value = this.getAttribute("value") || ""
    this.#initialValue = this.#value
    this.replaceChildren()
    if (!this.style.display) this.style.display = "block"
    this.#host = document.createElement("div")
    this.#host.style.height = "100%"
    this.append(this.#host)
    this.#binding = new EditorBinding(this.#host, this.#settings(), {
      change: (value, editor) => {
        this.#value = value
        this.#setFormValue(value)
        this.dispatchEvent(new CustomEvent("input", {bubbles: true, detail: {value, editor}}))
        this.dispatchEvent(new CustomEvent("change", {bubbles: true, detail: {value, editor}}))
      },
      selectionChange: (node, editor) => this.dispatchEvent(new CustomEvent("selectionchange", {detail: {node, editor}})),
      ready: editor => this.dispatchEvent(new CustomEvent("ready", {detail: {editor}}))
    })
    this.#setFormValue(this.#binding.value)
  }

  disconnectedCallback() {
    // Moving the element around the page keeps its editor; only leaving the page ends it.
    queueMicrotask(() => {
      if (this.isConnected || !this.#binding) return
      this.#value = this.#binding.value
      this.#binding.destroy()
      this.#binding = null
      this.#host = null
    })
  }

  attributeChangedCallback(name: string, previous: string | null, next: string | null) {
    if (previous === next) return
    if (name == "value") this.#value = next ?? ""
    this.#update()
  }

  formResetCallback() {
    this.value = this.#initialValue ?? ""
  }

  formDisabledCallback(disabled: boolean) {
    this.#properties = {...this.#properties, readOnly: disabled ? true : this.#properties.readOnly}
    this.#update()
  }

  /** Removes the indent every line of text shares, so the document can be indented in the page's HTML. */
  #dedent(text: string): string {
    let lines = text.replace(/\r\n?/g, "\n").split("\n")
    while (lines.length > 0 && lines[0].trim() == "") lines.shift()
    while (lines.length > 0 && lines[lines.length - 1].trim() == "") lines.pop()
    let indent = Math.min(...lines.filter(line => line.trim().length > 0).map(line => line.match(/^[ \t]*/)![0].length))
    return lines.map(line => line.substring(isFinite(indent) ? indent : 0)).join("\n")
  }

  #settings(): ScriviamoSettings {
    let settings: any = {...this.#properties}
    for (let [attribute, setting, kind] of Attributes) {
      if (!this.hasAttribute(attribute)) continue
      let text = this.getAttribute(attribute) || ""
      if (kind == "boolean") settings[setting] = text != "false"
      else if (kind == "number") settings[setting] = Number(text)
      else settings[setting] = text
    }
    if (this.#value !== undefined) settings.value = this.#value
    return settings
  }

  #update() {
    if (this.#binding) this.#binding.update(this.#settings())
  }

  #setFormValue(value: string) {
    if (!this.#internals) return
    try {
      this.#internals.setFormValue(value)
    } catch {}
  }
}

// Each attribute's setting is also a property, such as element.readOnly = true, which sets the
// attribute, as built-in elements' properties do.
for (let [attribute, setting, kind] of Attributes) {
  if (setting == "format") continue
  Object.defineProperty(ScriviamoEditorElement.prototype, setting, {
    configurable: true,
    get(this: ScriviamoEditorElement) {
      if (!this.hasAttribute(attribute)) return undefined
      let text = this.getAttribute(attribute) || ""
      return kind == "boolean" ? text != "false" : kind == "number" ? Number(text) : text
    },
    set(this: ScriviamoEditorElement, value: unknown) {
      if (value === undefined || value === null) this.removeAttribute(attribute)
      else this.setAttribute(attribute, kind == "boolean" ? (value ? "" : "false") : String(value))
    }
  })
}
for (let setting of ["autosave", "fileUploader", "locale", "events"] as Array<keyof ScriviamoSettings>) {
  Object.defineProperty(ScriviamoEditorElement.prototype, setting, {
    configurable: true,
    get(this: ScriviamoEditorElement) {
      return (this.settings as any)[setting]
    },
    set(this: ScriviamoEditorElement, value: unknown) {
      this.settings = {...this.settings, [setting]: value}
    }
  })
}

/** Defines the element, as <scriviamo-editor> unless another name is given. Importing this module defines it. */
export function defineScriviamoEditor(name: string = "scriviamo-editor") {
  if (typeof customElements == "undefined") return
  if (!customElements.get(name)) customElements.define(name, name == "scriviamo-editor" ? ScriviamoEditorElement : class extends ScriviamoEditorElement {})
}

defineScriviamoEditor()

declare global {
  interface HTMLElementTagNameMap {
    "scriviamo-editor": ScriviamoEditorElement
  }
}
