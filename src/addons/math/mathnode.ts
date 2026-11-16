import {BlockShortcut, CodeBlockNode, Editor, HTMLImporter, InspectorDefaults, InspectorEditors, InspectorItem, InspectorSection, Node, RichText, Strings, Stylesheet, TextHost, Utilities} from "scriviamo"

/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
const MathStrings = {
  TextMathCaption: "Math",
  TextMathSourceCaption: "LaTeX",
  TextMathPlaceholder: "LaTeX, such as E = mc^2",
  TextMathLoadingCaption: "Loading math…",
  TextMathUnavailableMessage: "The math renderer couldn't be loaded."
}

type MathStringsTable = typeof MathStrings

declare module "scriviamo" {
  interface Strings extends MathStringsTable {}
}

Strings.register(MathStrings)

/**
 * Loads KaTeX, which draws the formulas, the first time one is shown. By default it comes from
 * a CDN. An application that bundles KaTeX itself, or whose content security policy doesn't
 * allow the CDN, passes it to use() before formulas are shown, and loads KaTeX's stylesheet.
 *
 *     import katex from "katex"
 *     import "katex/dist/katex.min.css"
 *     MathRenderer.use(katex)
 */
export class MathRenderer {
  /** Where KaTeX's ES module and stylesheet are loaded from. */
  static moduleURL: string = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.mjs"
  static stylesheetURL: string = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"

  static #katex: any = null
  static #loading: Promise<any> | null = null

  /** Uses a KaTeX the application loaded itself, instead of loading it from moduleURL. */
  static use(katex: any) {
    MathRenderer.#katex = katex && typeof katex.renderToString == "function" ? katex : null
    MathRenderer.#loading = null
  }

  /** KaTeX, once it has loaded; null before then. */
  static get katex(): any {
    if (!MathRenderer.#katex) {
      let global = (globalThis as any).katex
      if (global && typeof global.renderToString == "function") MathRenderer.#katex = global
    }
    return MathRenderer.#katex
  }

  /** Resolves with KaTeX, loading it and its stylesheet the first time. */
  static load(): Promise<any> {
    if (MathRenderer.katex) return Promise.resolve(MathRenderer.katex)
    if (!MathRenderer.#loading) {
      if (typeof document != "undefined" && MathRenderer.stylesheetURL && !document.querySelector("link[data-scv-katex]")) {
        document.head.append(Utilities.element("link", "", {rel: "stylesheet", href: MathRenderer.stylesheetURL, "data-scv-katex": "true", crossorigin: "anonymous"}))
      }
      let url = MathRenderer.moduleURL
      // Loaded at run time from the address: bundlers leave this import alone.
      MathRenderer.#loading = import(/* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ url).then(module => {
        let katex = module.default || module
        MathRenderer.#katex = katex
        return katex
      }, error => {
        MathRenderer.#loading = null
        throw error
      })
    }
    return MathRenderer.#loading
  }

  /** The formula as HTML; MathML for exports, which browsers draw without KaTeX's stylesheet. */
  static render(latex: string, output: "html" | "mathml" | "htmlAndMathml" = "htmlAndMathml"): string {
    return MathRenderer.katex.renderToString(latex, {displayMode: true, output, throwOnError: true, strict: "ignore", trust: false})
  }
}

/**
 * A displayed formula, written in LaTeX and drawn with KaTeX. The source is edited like a code
 * block; while the block isn't selected only the formula shows. HTML exports hold MathML, which
 * every current browser draws; Markdown exports use $$ blocks.
 */
export class MathNode extends CodeBlockNode {
  static exportStyles(sheet: Stylesheet, editor: Editor | null) {
    super.exportStyles(sheet, editor)
    sheet.addRule(".math-display", "margin: 1em 0; overflow-x: auto; text-align: center")
    sheet.addRule(".math-display math", "font-size: 1.15em")
  }

  static identifier: string = "math"
  static caption: string = "Math"
  static icon: string = "bi bi-plus-slash-minus"
  static keywords: string = "equation formula latex tex katex mathematics"
  // Higher than code blocks, so <pre><code class="language-math"> becomes a formula.
  static importPriority: number = 50
  static markdownShortcuts: Array<BlockShortcut> = [{pattern: /^\$\$$/}]

  static create(_editor: Editor): Node {
    return new MathNode()
  }

  static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined {
    let latex: string | null = null
    if (element.tagName == "PRE") {
      let code = element.querySelector("code") || element
      if (/(^|\s)language-(math|latex|tex)(\s|$)/.test(code.className || "")) latex = code.textContent || ""
    } else if (element.hasAttribute("data-latex") && /(^|\s)math-display(\s|$)/.test(element.className || "")) {
      latex = element.getAttribute("data-latex")
    } else if (element.tagName.toLowerCase() == "math" && element.getAttribute("display") == "block") {
      let annotation = element.querySelector("annotation[encoding='application/x-tex']")
      if (annotation) latex = annotation.textContent
    }
    if (latex === null) return undefined
    let node = new MathNode()
    node.content = new RichText(latex.trim())
    return importer.attach(node)
  }

  #output: HTMLElement | null = null
  #timer: ReturnType<typeof setTimeout> | null = null

  /** The formula's LaTeX source. */
  get latex(): string {
    return this.content.text
  }

  set latex(value: string) {
    this.content = new RichText(String(value || ""))
  }

  get typeName(): string {
    return this.strings.TextMathCaption
  }

  protected get placeholderText(): string {
    return this.strings.TextMathPlaceholder
  }

  inspectorSections(): Array<InspectorSection> {
    let strings = this.strings
    let source = InspectorItem.bound("latex", strings.TextMathSourceCaption, InspectorEditors.multilineText, target => target.content.text, (target, value) => target.content = new RichText(String(value || "")))
    return [InspectorDefaults.section("math", strings.TextMathCaption, [source])].concat(InspectorDefaults.node(this))
  }

  protected build(body: HTMLElement) {
    super.build(body)
    let frame = body.querySelector(".scv-code") as HTMLElement
    frame?.classList.add("scv-math-source")
    let input = body.querySelector(".scv-code-language") as HTMLInputElement
    if (input) {
      input.value = this.strings.TextMathSourceCaption
      input.readOnly = true
      input.removeAttribute("list")
    }
    this.#output = Utilities.element("div", "scv-math-output", {contenteditable: "false"})
    body.prepend(this.#output)
    body.classList.add("scv-math")
    this.#render()
  }

  textChanged(host: TextHost) {
    super.textChanged(host)
    if (this.#timer !== null) clearTimeout(this.#timer)
    this.#timer = setTimeout(() => {
      this.#timer = null
      this.#render()
    }, 200)
  }

  #render() {
    let output = this.#output
    if (!output) return
    let latex = this.latex.trim()
    output.parentElement?.classList.toggle("scv-math-empty", latex.length == 0)
    if (latex.length == 0) {
      output.replaceChildren()
      return
    }
    if (!MathRenderer.katex) {
      output.textContent = this.strings.TextMathLoadingCaption
      output.className = "scv-math-output scv-math-pending"
      MathRenderer.load().then(() => {
        if (this.#output === output) this.#render()
      }, () => {
        if (this.#output !== output) return
        output.textContent = this.strings.TextMathUnavailableMessage
        output.className = "scv-math-output scv-math-error"
      })
      return
    }
    try {
      output.innerHTML = MathRenderer.render(latex)
      output.className = "scv-math-output"
    } catch (error) {
      output.textContent = String((error as Error)?.message || error).replace(/^KaTeX parse error: /, "")
      output.className = "scv-math-output scv-math-error"
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
    let latex = this.latex.trim()
    let attribute = Utilities.escapeAttribute(latex)
    let style = this.htmlBackgroundCSS()
    let styleAttribute = style.length > 0 ? ` style="${style}"` : ""
    if (MathRenderer.katex) {
      try {
        return `<div class="math-display" data-latex="${attribute}"${styleAttribute}>${MathRenderer.render(latex, "mathml")}</div>`
      } catch {}
    }
    // Without KaTeX, the source between \[ and \], which MathJax and KaTeX's auto-render read.
    return `<div class="math-display" data-latex="${attribute}"${styleAttribute}>\\[${Utilities.escapeText(latex)}\\]</div>`
  }

  toMarkdown(): string {
    return this.markdownWithBackground(`$$\n${this.latex.trim()}\n$$`)
  }

  toPlainText(): string {
    return this.latex
  }
}

Editor.registerNodeType(MathNode, 65)
