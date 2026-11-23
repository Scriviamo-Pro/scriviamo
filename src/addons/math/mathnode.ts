import {BlockShortcut, CodeBlockNode, Colors, Editor, EditorExtension, HTMLImporter, InspectorDefaults, InspectorEditors, InspectorItem, InspectorSection, MarkdownConverter, Node, Popup, RichText, Strings, Stylesheet, TextHost, TextHostModes, TextStyle, ToolbarItem, ToolbarItemKinds, Utilities} from "scriviamo"

/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
const MathStrings = {
  TextMathCaption: "Math",
  TextMathSourceCaption: "LaTeX",
  TextMathPlaceholder: "LaTeX, such as E = mc^2",
  TextMathLoadingCaption: "Loading math…",
  TextMathUnavailableMessage: "The math renderer couldn't be loaded.",
  TextInlineMathCaption: "Inline Math",
  TextInsertInlineMathCaption: "Insert Inline Math",
  TextInlineMathPlaceholder: "LaTeX, such as x^2",
  TextInlineMathHint: "Enter to finish. Leave it empty to remove the formula."
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

  /**
   * The formula as HTML; MathML for exports, which browsers draw without KaTeX's stylesheet. A
   * displayed formula stands on its own line; an inline one sits in the text.
   */
  static render(latex: string, output: "html" | "mathml" | "htmlAndMathml" = "htmlAndMathml", displayMode: boolean = true): string {
    return MathRenderer.katex.renderToString(latex, {displayMode, output, throwOnError: true, strict: "ignore", trust: false})
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
    // Formulas read left to right, in right-to-left text too.
    sheet.addRule(".math-display", "margin: 1em 0; overflow-x: auto; text-align: center; direction: ltr")
    sheet.addRule(".math-inline", "direction: ltr; unicode-bidi: isolate")
    sheet.addRule(".math-display math", "font-size: 1.15em")
  }

  static identifier: string = "math"
  static caption: string = "Math"
  static captionString: string = "TextMathCaption"
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

/** The suggestion provider identifier that marks inline formulas in text. */
export const InlineMathTag = "math"

/** An inline formula found in text: where it is, and its LaTeX source. */
export interface InlineFormula {
  host: TextHost
  start: number
  end: number
  id: string
  latex: string
}

/**
 * Formulas inside text, such as $x^2$. A formula is a tag in the text, marked with the "math"
 * provider, whose text is its LaTeX source. The editor draws it with KaTeX and treats it as one
 * character: clicking it, or pressing Ctrl+Shift+E (Command-Shift-E on a Mac) beside it, edits its
 * source. Typing $x^2$ makes one, unless Markdown shortcuts are off.
 */
export class InlineMath {
  /** The style of a formula: the text's style, marked as a formula, with the tag's colors left out. */
  static style(base: TextStyle, id: string = Utilities.uuid()): TextStyle {
    let style = base.clone()
    style.suggestionProviderIdentifier = InlineMathTag
    style.suggestionIdentifier = id
    style.superscript = false
    style.subscript = false
    style.code = false
    style.suggestionTextColor = Colors.make(0, 0, 0, 255)
    style.suggestionBackgroundColor = Colors.make(0, 0, 0, 255)
    style.suggestionBorderColor = Colors.make(0, 0, 0, 255)
    return style
  }

  /** The text style without the formula's marking, for text typed after one. */
  static untagged(style: TextStyle): TextStyle {
    let result = style.clone()
    result.suggestionProviderIdentifier = ""
    result.suggestionIdentifier = ""
    result.suggestionTextColor = Colors.clone(TextStyle.defaults.suggestionTextColor)
    result.suggestionBackgroundColor = Colors.clone(TextStyle.defaults.suggestionBackgroundColor)
    result.suggestionBorderColor = Colors.clone(TextStyle.defaults.suggestionBorderColor)
    return result
  }

  /** The formulas in one text, in order. */
  static formulas(host: TextHost): Array<InlineFormula> {
    let result: Array<InlineFormula> = []
    let offset = 0
    for (let run of host.rich.runs()) {
      let style = run.style
      if (style.suggestionProviderIdentifier == InlineMathTag) {
        let previous = result[result.length - 1]
        // Runs split by other formatting are still one formula.
        if (previous && previous.id == style.suggestionIdentifier && previous.end == offset) {
          previous.end += run.text.length
          previous.latex += run.text
        } else {
          result.push({host, start: offset, end: offset + run.text.length, id: style.suggestionIdentifier, latex: run.text})
        }
      }
      offset += run.text.length
    }
    return result
  }

  /** The formula the caret is beside or the selection covers, or null. */
  static at(host: TextHost, start: number, end: number = start): InlineFormula | null {
    return InlineMath.formulas(host).find(formula => start == end ? (formula.start == start || formula.end == start) : formula.start <= start && formula.end >= end) || null
  }

  /** Whether formulas can go in a text: rich text that isn't code. */
  static allowedIn(host: TextHost | null): boolean {
    return !!host && host.mode != TextHostModes.plain && !(host.node instanceof CodeBlockNode)
  }

  /**
   * Puts a formula in place of start through end, or removes the range when latex is empty. One
   * undo step. The caret goes after it, and text typed there isn't part of it.
   */
  static replace(editor: Editor, host: TextHost, start: number, end: number, latex: string, id: string = Utilities.uuid()): boolean {
    if (editor.readOnly) return false
    latex = latex.replace(/[\n\r\u2028\u2029]+/g, " ").trim()
    let rich = host.rich
    let base = start > 0 || end < rich.length ? rich.styleAt(start < rich.length ? start : start - 1) : new TextStyle()
    base = InlineMath.untagged(base)
    editor.history.breakCoalescing()
    editor.history.checkpoint()
    rich.remove(start, end)
    if (latex.length > 0) rich.insert(start, latex, InlineMath.style(base, id))
    host.render()
    let caret = start + latex.length
    host.select(caret)
    if (latex.length > 0) editor.setPendingStyle(host, caret, base)
    host.node.textChanged(host)
    host.node.changed()
    editor.history.breakCoalescing()
    editor.updateToolbarState()
    return true
  }

  /**
   * Edits the formula beside the caret, or covering the selection; or else starts a new one at the
   * caret, from the selected text if there is any. Shows the formula's source in a popover.
   */
  static insert(editor: Editor): boolean {
    let host = editor.activeHost
    if (!InlineMath.allowedIn(host) || editor.readOnly) return false
    let selection = host!.selection()
    if (!selection) return false
    let formula = InlineMath.at(host!, selection.start, selection.end)
    if (formula) {
      InlineMath.edit(editor, formula)
      return true
    }
    let selected = host!.rich.text.substring(selection.start, selection.end)
    InlineMath.edit(editor, {host: host!, start: selection.start, end: selection.end, id: Utilities.uuid(), latex: selected.replace(/^\$+|\$+$/g, "")})
    return true
  }

  /** Shows the popover that edits a formula's source, with a preview. Enter finishes; Escape cancels. */
  static edit(editor: Editor, formula: InlineFormula) {
    if (editor.readOnly || !editor.element) return
    let strings = editor.strings
    let host = formula.host
    let popup = new Popup("dropdown-menu show scv-inline-math-popup")
    popup.keepsFocus = false
    let input = Utilities.element("input", "form-control form-control-sm scv-inline-math-input", {type: "text", dir: "ltr", spellcheck: "false", autocomplete: "off", placeholder: strings.TextInlineMathPlaceholder, "aria-label": strings.TextInlineMathCaption}) as HTMLInputElement
    input.value = formula.latex
    let preview = Utilities.element("div", "scv-inline-math-preview", {"aria-hidden": "true"})
    let hint = Utilities.element("div", "scv-inline-math-hint")
    hint.textContent = strings.TextInlineMathHint
    popup.element.append(input, preview, hint)
    let showPreview = () => {
      let latex = input.value.trim()
      preview.classList.remove("scv-math-error")
      if (latex.length == 0) {
        preview.replaceChildren()
        return
      }
      if (!MathRenderer.katex) {
        preview.textContent = strings.TextMathLoadingCaption
        MathRenderer.load().then(showPreview, () => preview.textContent = strings.TextMathUnavailableMessage)
        return
      }
      try {
        preview.innerHTML = MathRenderer.render(latex, "html", false)
      } catch (error) {
        preview.textContent = String((error as Error)?.message || error).replace(/^KaTeX parse error: /, "")
        preview.classList.add("scv-math-error")
      }
    }
    // A new formula, from the caret or the selected text, isn't in the text yet.
    let isNew = !InlineMath.formulas(host).some(item => item.id == formula.id)
    // The text may have changed while the popover was open; find the formula again.
    let current = () => isNew ? formula : InlineMath.formulas(host).find(item => item.id == formula.id) || null
    let committed = false
    let commit = () => {
      if (committed) return
      committed = true
      popup.close()
      let target = current()
      if (target && (isNew || input.value.trim() != formula.latex.trim())) InlineMath.replace(editor, host, target.start, target.end, input.value, formula.id)
      else host.select(target ? target.end : formula.end)
    }
    input.addEventListener("input", showPreview)
    input.addEventListener("keydown", event => {
      if (event.key == "Enter") {
        event.preventDefault()
        commit()
      } else if (event.key == "Escape") {
        event.preventDefault()
        event.stopPropagation()
        committed = true
        popup.close()
        let target = current()
        host.select(isNew ? formula.end : target ? target.end : formula.end)
      }
    })
    popup.onClose = () => {
      // Clicking elsewhere keeps what was typed.
      if (!committed && input.value.trim() != formula.latex.trim() && input.value.trim().length > 0) {
        committed = true
        let target = current()
        if (target) InlineMath.replace(editor, host, target.start, target.end, input.value, formula.id)
      }
    }
    let anchor = (): DOMRect | null => {
      let element = host.element.querySelector(`[data-scv-tag="${InlineMathTag}"][data-scv-tag-id="${CSS.escape(formula.id)}"]`) as HTMLElement | null
      if (element) return element.getBoundingClientRect()
      return host.caretRect() || host.element.getBoundingClientRect()
    }
    popup.anchorProvider = anchor
    popup.show(anchor() || host.element.getBoundingClientRect(), editor.element)
    showPreview()
    input.focus()
    input.select()
  }

  /** Draws a formula's elements: its source stays as hidden text, and KaTeX draws it beside. */
  static render(elements: Array<HTMLElement>, _host: TextHost) {
    let latex = ""
    elements.forEach(element => {
      latex += element.textContent || ""
      element.setAttribute("contenteditable", "false")
      element.classList.add("scv-inline-math")
      let source = Utilities.element("span", "scv-inline-math-source")
      source.append(...Array.from(element.childNodes))
      element.append(source)
    })
    let last = elements[elements.length - 1]
    let drawn = Utilities.element("span", "scv-widget scv-inline-math-drawn")
    last.append(drawn)
    elements.forEach(element => element.title = latex)
    let draw = () => {
      if (!drawn.isConnected && drawn.parentElement === null) return
      drawn.classList.remove("scv-math-error", "scv-math-pending")
      if (!MathRenderer.katex) {
        drawn.textContent = latex
        drawn.classList.add("scv-math-pending")
        MathRenderer.load().then(draw, () => {})
        return
      }
      try {
        drawn.innerHTML = MathRenderer.render(latex, "htmlAndMathml", false)
      } catch {
        drawn.textContent = latex
        drawn.classList.add("scv-math-error")
      }
    }
    draw()
  }
}

TextHost.registerTagRenderer(InlineMathTag, InlineMath.render)

// Formulas export as MathML, which browsers draw on their own, and as $…$ in Markdown.
RichText.registerTagExport(InlineMathTag, {
  html(text) {
    let latex = text.trim()
    let attribute = Utilities.escapeAttribute(latex)
    if (MathRenderer.katex) {
      try {
        return `<span class="math-inline" data-latex="${attribute}">${MathRenderer.render(latex, "mathml", false)}</span>`
      } catch {}
    }
    // Without KaTeX, the source between \( and \), which MathJax and KaTeX's auto-render read.
    return `<span class="math-inline" data-latex="${attribute}">\\(${Utilities.escapeText(latex)}\\)</span>`
  },
  markdown(text) {
    return `$${text.trim()}$`
  }
})

// Formulas come back from this add-on's HTML, from MathML that carries its LaTeX, and from the tags
// the base package exports when this add-on isn't loaded.
HTMLImporter.registerInlineElement((element, style) => {
  let latex: string | null = null
  if (element.hasAttribute("data-latex") && /(^|\s)math-inline(\s|$)/.test(element.className || "")) {
    latex = element.getAttribute("data-latex")
  } else if (element.tagName.toLowerCase() == "math" && element.getAttribute("display") != "block") {
    let annotation = element.querySelector("annotation[encoding='application/x-tex']")
    if (annotation) latex = annotation.textContent
  } else if (element.getAttribute("data-scriviamo-suggestion-provider") == InlineMathTag) {
    latex = element.textContent
  }
  if (latex === null) return null
  latex = latex.replace(/\s+/g, " ").trim()
  return {text: latex, style: InlineMath.style(InlineMath.untagged(style))}
})

// $formula$ in Markdown: the opening $ is followed by a character other than a space, the closing
// $ follows one and isn't followed by a digit, so prices such as $5 and $10 stay text.
MarkdownConverter.registerInlineRule((text, stash) => text.replace(/(^|[^\\$\w])\$(?=[^\s$])((?:\\\$|[^$\n])*?[^\s\\$])\$(?![\d$])/g, (_match, before, latex) =>
  before + stash(`<span class="math-inline" data-latex="${Utilities.escapeAttribute(latex)}">${Utilities.escapeText(latex)}</span>`)))

/** The Inline Math tool, its key, clicking formulas, Backspace and Delete over them, and typing $…$. */
export const InlineMathExtension: EditorExtension = {
  toolbarIdentifiers: ["inlinemath"],
  defaultToolbarIdentifiers: ["inlinemath"],
  defaultToolbarAfter: "link",

  install(editor: Editor) {
    let root = editor.element
    if (!root) return
    let formulaAt = (target: EventTarget | null): HTMLElement | null => target instanceof Element ? target.closest(".scv-inline-math") as HTMLElement : null
    // Clicking a formula edits it.
    root.addEventListener("click", event => {
      let element = formulaAt(event.target)
      if (!element || editor.readOnly) return
      let host = TextHost.from(element)
      if (!host || !root!.contains(host.element)) return
      let formula = InlineMath.formulas(host).find(item => item.id == (element!.dataset.scvTagId || ""))
      if (!formula) return
      event.preventDefault()
      if (editor.activeHost !== host) editor.focusNode(host.node, formula.end, host.index)
      else host.select(formula.end)
      InlineMath.edit(editor, formula)
    })
    // A formula is removed whole: Backspace after it, or Delete before it.
    editor.addEventListener("keyPress", (event: CustomEvent) => {
      let key = event.detail && event.detail.key
      if (key != "Backspace" && key != "Delete") return
      let host = editor.activeHost
      let selection = host ? host.selection() : null
      if (!host || !selection || selection.start != selection.end || editor.readOnly) return
      let formula = InlineMath.formulas(host).find(item => key == "Backspace" ? item.end == selection!.start : item.start == selection!.start)
      if (!formula) return
      event.preventDefault()
      InlineMath.replace(editor, host, formula.start, formula.end, "")
    })
    // Typing the closing $ of $formula$ makes it a formula, as its own undo step. The editor
    // inserts some typing itself, such as after a tag, and then there's no input event.
    let typedDollar = () => {
      if (!editor.markdownShortcuts || editor.readOnly) return
      let host = editor.activeHost
      if (!InlineMath.allowedIn(host)) return
      let selection = host!.selection()
      if (!selection || selection.start != selection.end) return
      let rich = host!.rich
      let caret = selection.start
      let before = rich.text.substring(0, caret)
      let lineStart = Math.max(before.lastIndexOf("\u2029"), before.lastIndexOf("\u2028"), before.lastIndexOf("\n")) + 1
      let match = before.substring(lineStart).match(/(^|[^\\$\w])\$([^\s$](?:[^$]*[^\s\\$])?)\$$/)
      if (!match) return
      let start = caret - match[2].length - 2
      for (let index = start; index < caret; index++) {
        let style = rich.styleAt(index)
        if (style.code || style.suggestionProviderIdentifier.length > 0) return
      }
      InlineMath.replace(editor, host!, start, caret, match[2])
    }
    root.addEventListener("beforeinput", event => {
      let input = event as InputEvent
      if (input.inputType == "insertText" && !!input.data && input.data.endsWith("$") && input.defaultPrevented) typedDollar()
    })
    root.addEventListener("input", event => {
      let input = event as InputEvent
      if (input.inputType == "insertText" && !!input.data && input.data.endsWith("$")) typedDollar()
    })
  },

  makeToolbarItem(editor: Editor, identifier: string): ToolbarItem | null {
    if (identifier != "inlinemath") return null
    let strings = editor.strings
    return new ToolbarItem(identifier, strings.TextInsertInlineMathCaption, "bi bi-plus-slash-minus", ToolbarItemKinds.button, `${strings.TextInsertInlineMathCaption} (${Editor.isMac ? "⌘⇧E" : "Ctrl+Shift+E"})`)
  },

  activateToolbarItem(editor: Editor, identifier: string): boolean {
    if (identifier != "inlinemath") return false
    InlineMath.insert(editor)
    return true
  },

  updateToolbarState(editor: Editor, set: (identifier: string, enabled: boolean, active?: boolean) => void) {
    let host = editor.activeHost
    let selection = host ? host.selection() : null
    set("inlinemath", InlineMath.allowedIn(host) && !editor.readOnly, !!host && !!selection && InlineMath.at(host, selection.start, selection.end) !== null)
  },

  handleCommandKey(editor: Editor, event: KeyboardEvent): boolean {
    if (!event.shiftKey || event.altKey || event.code != "KeyE") return false
    if (!InlineMath.allowedIn(editor.activeHost) || editor.readOnly) return false
    return InlineMath.insert(editor)
  }
}

Editor.registerExtension(InlineMathExtension)
