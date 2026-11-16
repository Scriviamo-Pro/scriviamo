import {BlockShortcut, CodeBlockNode, Editor, HTMLImporter, InspectorDefaults, InspectorEditors, InspectorItem, InspectorSection, Node, RichText, Strings, Stylesheet, TextHost, Utilities} from "scriviamo"

/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
const DiagramsStrings = {
  TextDiagramCaption: "Diagram",
  TextDiagramSourceCaption: "Mermaid",
  TextDiagramRedrawCaption: "Redraw",
  TextDiagramPlaceholder: "A Mermaid diagram, such as: graph LR; A --> B",
  TextDiagramLoadingCaption: "Drawing the diagram…",
  TextDiagramUnavailableMessage: "The diagram renderer couldn't be loaded."
}

type DiagramsStringsTable = typeof DiagramsStrings

declare module "scriviamo" {
  interface Strings extends DiagramsStringsTable {}
}

Strings.register(DiagramsStrings)

/**
 * Loads Mermaid, which draws the diagrams, the first time one is shown. By default it comes from
 * a CDN. An application that bundles Mermaid itself, or whose content security policy doesn't
 * allow the CDN, passes it to use() before diagrams are shown.
 *
 *     import mermaid from "mermaid"
 *     DiagramRenderer.use(mermaid)
 */
export class DiagramRenderer {
  /** Where Mermaid's ES module is loaded from. */
  static moduleURL: string = "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs"
  /** Settings passed to mermaid.initialize. securityLevel "strict" keeps scripts and clicks out of diagrams. */
  static settings: {[name: string]: unknown} = {securityLevel: "strict"}

  static #mermaid: any = null
  static #loading: Promise<any> | null = null
  static #initializedTheme: string = ""
  static #counter: number = 0

  /** Uses a Mermaid the application loaded itself, instead of loading it from moduleURL. */
  static use(mermaid: any) {
    DiagramRenderer.#mermaid = mermaid && typeof mermaid.render == "function" ? mermaid : null
    DiagramRenderer.#loading = null
    DiagramRenderer.#initializedTheme = ""
  }

  /** Mermaid, once it has loaded; null before then. */
  static get mermaid(): any {
    if (!DiagramRenderer.#mermaid) {
      let global = (globalThis as any).mermaid
      if (global && typeof global.render == "function") DiagramRenderer.#mermaid = global
    }
    return DiagramRenderer.#mermaid
  }

  /** Resolves with Mermaid, loading it the first time. */
  static load(): Promise<any> {
    if (DiagramRenderer.mermaid) return Promise.resolve(DiagramRenderer.mermaid)
    if (!DiagramRenderer.#loading) {
      let url = DiagramRenderer.moduleURL
      // Loaded at run time from the address: bundlers leave this import alone.
      DiagramRenderer.#loading = import(/* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ url).then(module => {
        let mermaid = module.default || module
        DiagramRenderer.#mermaid = mermaid
        return mermaid
      }, error => {
        DiagramRenderer.#loading = null
        throw error
      })
    }
    return DiagramRenderer.#loading
  }

  /** Draws a diagram, resolving with its SVG. dark picks Mermaid's dark theme. */
  static async render(source: string, dark: boolean = false): Promise<string> {
    let mermaid = await DiagramRenderer.load()
    let theme = dark ? "dark" : "default"
    if (DiagramRenderer.#initializedTheme != theme && typeof mermaid.initialize == "function") {
      mermaid.initialize({startOnLoad: false, theme, ...DiagramRenderer.settings})
      DiagramRenderer.#initializedTheme = theme
    }
    let id = `scv-diagram-${++DiagramRenderer.#counter}`
    try {
      let result = await mermaid.render(id, source)
      return String(result && typeof result == "object" ? result.svg : result || "")
    } finally {
      // Mermaid leaves a scratch element behind when a diagram has an error.
      if (typeof document != "undefined") document.getElementById(`d${id}`)?.remove()
    }
  }
}

/**
 * A diagram written in Mermaid's language and drawn with Mermaid: flowcharts, sequence diagrams,
 * Gantt charts and more. The source is edited like a code block; while the block isn't selected
 * only the diagram shows. HTML exports hold the drawn SVG; Markdown exports use ```mermaid
 * fences, which GitHub and many other sites draw.
 */
export class DiagramNode extends CodeBlockNode {
  static exportStyles(sheet: Stylesheet, editor: Editor | null) {
    super.exportStyles(sheet, editor)
    sheet.addRule("figure.diagram", "margin: 1em 0; overflow-x: auto; text-align: center")
    sheet.addRule("figure.diagram svg", "max-width: 100%; height: auto")
  }

  static identifier: string = "diagram"
  static caption: string = "Diagram"
  static icon: string = "bi bi-diagram-3"
  static keywords: string = "mermaid flowchart chart graph sequence gantt"
  // Higher than code blocks, so <pre><code class="language-mermaid"> becomes a diagram.
  static importPriority: number = 50
  static markdownShortcuts: Array<BlockShortcut> = [{pattern: /^```mermaid$/}]

  static create(_editor: Editor): Node {
    return new DiagramNode()
  }

  static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined {
    let source: string | null = null
    if (element.tagName == "PRE") {
      let code = element.querySelector("code")
      if (/(^|\s)mermaid(\s|$)/.test(element.className || "")) source = element.textContent || ""
      else if (code && /(^|\s)language-mermaid(\s|$)/.test(code.className || "")) source = code.textContent || ""
    } else if (element.hasAttribute("data-mermaid")) {
      source = element.getAttribute("data-mermaid")
    }
    if (source === null) return undefined
    let node = new DiagramNode()
    node.content = new RichText(source.replace(/\n$/, ""))
    return importer.attach(node)
  }

  #output: HTMLElement | null = null
  #timer: ReturnType<typeof setTimeout> | null = null
  /** The last drawing, and the source it was drawn from, for HTML exports. */
  #drawn: {source: string, svg: string, dark: boolean} | null = null
  #generation: number = 0

  /** The diagram's Mermaid source. */
  get source(): string {
    return this.content.text
  }

  set source(value: string) {
    this.content = new RichText(String(value || ""))
  }

  /** The drawn diagram's SVG, when it has been drawn from the current source; otherwise "". */
  get svg(): string {
    return this.#drawn && this.#drawn.source == this.source.trim() ? this.#drawn.svg : ""
  }

  get typeName(): string {
    return this.strings.TextDiagramCaption
  }

  protected get placeholderText(): string {
    return this.strings.TextDiagramPlaceholder
  }

  inspectorSections(): Array<InspectorSection> {
    let strings = this.strings
    let source = InspectorItem.bound("source", strings.TextDiagramSourceCaption, InspectorEditors.multilineText, target => target.content.text, (target, value) => target.content = new RichText(String(value || "")))
    let redraw = InspectorItem.actionItem("redraw", "", strings.TextDiagramRedrawCaption, target => target.redraw())
    return [InspectorDefaults.section("diagram", strings.TextDiagramCaption, [source, redraw])].concat(InspectorDefaults.node(this))
  }

  protected build(body: HTMLElement) {
    super.build(body)
    body.querySelector(".scv-code")?.classList.add("scv-diagram-source")
    let input = body.querySelector(".scv-code-language") as HTMLInputElement
    if (input) {
      input.value = this.strings.TextDiagramSourceCaption
      input.readOnly = true
      input.removeAttribute("list")
    }
    this.#output = Utilities.element("div", "scv-diagram-output", {contenteditable: "false"})
    body.prepend(this.#output)
    body.classList.add("scv-diagram")
    this.#render()
  }

  textChanged(host: TextHost) {
    super.textChanged(host)
    if (this.#timer !== null) clearTimeout(this.#timer)
    this.#timer = setTimeout(() => {
      this.#timer = null
      this.#render()
    }, 400)
  }

  /** Draws the diagram now, resolving once it is shown. */
  redraw(): Promise<void> {
    return this.#render()
  }

  async #render(): Promise<void> {
    let output = this.#output
    if (!output) return
    let source = this.source.trim()
    let generation = ++this.#generation
    output.parentElement?.classList.toggle("scv-diagram-empty", source.length == 0)
    if (source.length == 0) {
      output.replaceChildren()
      return
    }
    // The editor's element is on the page even while this block is still being built.
    let place: Element = (this.editor && this.editor.element) || output
    let dark = !!place.closest("[data-bs-theme=dark]")
    if (this.#drawn && this.#drawn.source == source && this.#drawn.dark == dark) {
      output.innerHTML = this.#drawn.svg
      output.className = "scv-diagram-output"
      return
    }
    if (!DiagramRenderer.mermaid && output.childElementCount == 0) {
      output.textContent = this.strings.TextDiagramLoadingCaption
      output.className = "scv-diagram-output scv-diagram-pending"
    }
    try {
      let svg = await DiagramRenderer.render(source, dark)
      if (generation != this.#generation || this.#output !== output) return
      this.#drawn = {source, svg, dark}
      output.innerHTML = svg
      output.className = "scv-diagram-output"
    } catch (error) {
      if (generation != this.#generation || this.#output !== output) return
      let loaded = !!DiagramRenderer.mermaid
      output.textContent = loaded ? String((error as Error)?.message || error).trim() : this.strings.TextDiagramUnavailableMessage
      output.className = "scv-diagram-output scv-diagram-error"
    }
  }

  fromJSON(data: any): boolean {
    if (!super.fromJSON(data)) return false
    this.language = ""
    return true
  }

  toJSON(): object {
    let result = super.toJSON()
    delete result["language"]
    return result
  }

  toHTML(): string {
    let source = this.source.trim()
    let style = this.htmlBackgroundCSS()
    let styleAttribute = style.length > 0 ? ` style="${style}"` : ""
    let svg = this.svg
    if (svg.length > 0) return `<figure class="diagram" data-mermaid="${Utilities.escapeAttribute(source)}"${styleAttribute}>${svg}</figure>`
    // Not drawn yet: Mermaid's own form, which a page that loads Mermaid draws.
    return `<pre class="mermaid"${styleAttribute}>${Utilities.escapeText(source)}</pre>`
  }

  toMarkdown(): string {
    let source = this.source.trim()
    let longest = 2
    for (let run of source.match(/`+/g) || []) longest = Math.max(longest, run.length)
    let fence = "`".repeat(longest + 1)
    return this.markdownWithBackground(`${fence}mermaid\n${source}\n${fence}`)
  }

  toPlainText(): string {
    return this.source
  }
}

Editor.registerNodeType(DiagramNode, 67)
