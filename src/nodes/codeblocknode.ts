import {BlockShortcut, Editor, HTMLImporter, InspectorDefaults, InspectorEditors, InspectorItem, InspectorSection, LineBreak, Node, RichText, Strings, Stylesheet, TextHost, TextHostModes, TextNode, TextStyle, ThemeColors, Utilities} from "../internal"

/** Unstyled monospaced text, such as source code. */
export class CodeBlockNode extends TextNode {
  static exportStyles(sheet: Stylesheet, editor: Editor | null) {
    super.exportStyles(sheet, editor)
    sheet.addRule("pre", `margin-left: 0; margin-right: 0; padding: 16px; overflow-x: auto; border-radius: 8px; background: ${Editor.themeCSS(editor, ThemeColors.dark)}; color: ${Editor.themeCSS(editor, ThemeColors.light)}; white-space: pre`)
    sheet.addRule("pre code", "font-family: Menlo, Courier, monospace; font-size: 14px")
  }

  static identifier: string = "codeblock"
  static caption: string = "Code"
  static icon: string = "bi bi-code-square"
  static keywords: string = "source program snippet pre monospace"
  static languages: Array<string> = ["", "bash", "c", "cpp", "csharp", "css", "go", "html", "java", "javascript", "json", "kotlin", "markdown", "php", "python", "ruby", "rust", "sql", "swift", "typescript", "xml", "yaml"]

  static markdownShortcuts: Array<BlockShortcut> = [{pattern: /^```$/}]

  static blockKinds(strings: Strings, _compact: boolean): Array<[string, string, string]> {
    return [["codeblock", strings.TextCodeInspectorCaption, "bi bi-code-square"]]
  }

  static fromBlockContent(_content: RichText, _value: number, source: TextNode): Array<Node> {
    let code = new this()
    code.content = new RichText(source.content.text.replace(/\u2028/g, "\n"))
    source.copyAppearanceTo(code)
    return [code]
  }

  static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined {
    if (element.tagName != "PRE") return undefined
    let code = element.querySelector("code")
    let source = code || element
    let match = (source.className || "").match(/language-([\w+#-]+)/)
    let node = new CodeBlockNode()
    node.content = new RichText((source.textContent || "").replace(/\n$/, ""))
    node.language = match ? match[1] : ""
    return importer.attach(node)
  }

  language: string = ""
  tabWidth: number = 2

  get keepsParagraphs(): boolean {
    return true
  }

  get inspectorShowsTypography(): boolean {
    return false
  }

  plainContent(): RichText {
    return new RichText(this.content.text.replace(/\n/g, LineBreak))
  }

  joinedContent(addition: RichText): RichText {
    return new RichText(addition.text.replace(/\u2028/g, "\n"))
  }

  inspectorSections(): Array<InspectorSection> {
    let strings = this.strings
    let language = new InspectorItem("language", strings.TextLanguageCaption, "language", InspectorEditors.text)
    let tabWidth = InspectorItem.number("tabwidth", strings.TextTabWidthInspectorCaption, target => target.tabWidth, (target, value) => target.tabWidth = Math.max(1, Math.round(value)), 1, 16, 1)
    tabWidth.setDefaultValue(2)
    return [InspectorDefaults.section("code", strings.TextCodeInspectorCaption, [language, tabWidth])].concat(InspectorDefaults.text(this))
  }

  protected get hostMode(): TextHostModes {
    return TextHostModes.plain
  }

  protected get placeholderText(): string {
    return this.strings.TextCodeInspectorCaption
  }

  protected build(body: HTMLElement) {
    let frame = Utilities.element("div", "scv-code")
    body.append(frame)

    let header = Utilities.element("div", "scv-code-header", {contenteditable: "false"})
    frame.append(header)
    let language = Utilities.element("input", "scv-code-language form-control form-control-sm", {type: "text", list: "scv-code-languages", placeholder: this.strings.TextLanguageCaption, "aria-label": this.strings.TextLanguageCaption})
    language.value = this.language
    language.readOnly = this.editor ? this.editor.readOnly : false
    language.addEventListener("change", () => {
      this.willChange()
      this.language = language.value.trim()
      this.changed()
    })
    header.append(language)
    if (!document.getElementById("scv-code-languages")) {
      let list = Utilities.element("datalist", "", {id: "scv-code-languages"})
      CodeBlockNode.languages.forEach(name => { if (name.length > 0) list.append(new Option(name)) })
      document.body.append(list)
    }
    let copy = Utilities.element("button", "btn btn-sm btn-link scv-code-copy", {type: "button", title: this.strings.TextCopyCodeTooltip})
    copy.innerHTML = `<i class="bi bi-clipboard"></i>`
    copy.addEventListener("click", () => {
      navigator.clipboard?.writeText(this.content.text)
      copy.innerHTML = `<i class="bi bi-clipboard-check"></i>`
      setTimeout(() => copy.innerHTML = `<i class="bi bi-clipboard"></i>`, 1200)
    })
    header.append(copy)

    let pre = Utilities.element("pre", "scv-code-body")
    frame.append(pre)
    let code = document.createElement("code")
    pre.append(code)
    let host = this.addHost(new TextHost(this, this.content, code, TextHostModes.plain))
    host.placeholder = this.placeholderText
    host.render()
  }

  handleKeyDown(event: KeyboardEvent, host: TextHost | null): boolean {
    if (!host || host !== this.primaryHost) return false
    let selection = host.selection()
    if (!selection) return false
    let text = this.content.text

    if (event.key == "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      let paragraph = new TextNode()
      this.editor.insertNodesAfter(this, [paragraph])
      this.editor.focusNode(paragraph, 0)
      return true
    }

    if (event.key == "Enter" && !event.altKey) {
      event.preventDefault()
      this.willChange()
      let lineStart = text.lastIndexOf("\n", selection.start - 1) + 1
      let indentation = text.substring(lineStart, selection.start).match(/^[ \t]*/)[0]
      this.content.remove(selection.start, selection.end)
      this.content.insert(selection.start, "\n" + indentation, new TextStyle())
      host.render()
      host.select(selection.start + 1 + indentation.length)
      this.changed()
      return true
    }

    if (event.key == "Tab" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault()
      this.willChange()
      let spaces = " ".repeat(Math.max(1, this.tabWidth))
      let lineStart = text.lastIndexOf("\n", selection.start - 1) + 1
      if (selection.start == selection.end && !event.shiftKey) {
        this.content.insert(selection.start, spaces, new TextStyle())
        host.render()
        host.select(selection.start + spaces.length)
      } else {
        // Indent or outdent every selected line.
        let lines = text.substring(lineStart, selection.end).split("\n")
        let firstDelta = 0
        let totalDelta = 0
        let changedLines = lines.map((line, index) => {
          let delta = 0
          let result = line
          if (event.shiftKey) {
            let leading = line.match(/^ */)[0].length
            let removed = Math.min(leading, spaces.length)
            result = line.substring(removed)
            delta = -removed
          } else {
            result = spaces + line
            delta = spaces.length
          }
          if (index == 0) firstDelta = delta
          totalDelta += delta
          return result
        })
        this.content.remove(lineStart, selection.end)
        this.content.insert(lineStart, changedLines.join("\n"), new TextStyle())
        host.render()
        host.select(Math.max(lineStart, selection.start + firstDelta), selection.end + totalDelta)
      }
      this.changed()
      return true
    }
    return false
  }

  fromJSON(data: any): boolean {
    if (!super.fromJSON(data)) return false
    this.language = Utilities.string(data.language)
    this.tabWidth = Math.max(1, Utilities.integer(data.tabWidth, 2))
    this.content.styles = this.content.styles.map(() => new TextStyle())
    return true
  }

  toJSON(): object {
    let result = super.toJSON()
    if (this.language.length > 0) result["language"] = this.language
    if (this.tabWidth != 2) result["tabWidth"] = this.tabWidth
    return result
  }

  toHTML(): string {
    let classAttribute = this.language.length > 0 ? ` class="language-${Utilities.escapeAttribute(this.language)}"` : ""
    return `<pre style="${this.htmlBackgroundCSS()}"><code${classAttribute}>${Utilities.escapeText(this.content.text)}</code></pre>`
  }

  toMarkdown(): string {
    let longest = 2
    let matches = this.content.text.match(/`+/g)
    if (matches) matches.forEach(item => longest = Math.max(longest, item.length))
    let fence = "`".repeat(longest + 1)
    let text = this.content.text
    let closing = text.endsWith("\n") ? "" : "\n"
    return this.markdownWithBackground(`${fence}${this.language.replace(/`/g, "").trim()}\n${text}${closing}${fence}`)
  }

  toPlainText(): string {
    return this.content.text
  }
}
