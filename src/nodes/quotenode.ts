import {BlockShortcut, Editor, HTMLImporter, InspectorDefaults, InspectorEditors, InspectorItem, InspectorSection, LineBreak, Node, RichText, Strings, Stylesheet, TextHost, TextHostModes, TextNode, ThemeColors, Utilities} from "../internal"

export class QuoteNode extends TextNode {
  static exportStyles(sheet: Stylesheet, editor: Editor | null) {
    super.exportStyles(sheet, editor)
    sheet.addRule("blockquote.quote", `margin: 0; padding: 16px; padding-inline-start: 20px; border-inline-start: 4px solid ${Editor.themeCSS(editor, ThemeColors.border)}`)
    sheet.addRule("blockquote.quote footer", `margin-top: 6px; color: ${Editor.themeCSS(editor, ThemeColors.textMuted)}; font-size: 0.85em; font-style: italic`)
  }

  static identifier: string = "quote"
  static caption: string = "Quote"
  static captionString: string = "TextQuoteCaption"
  static icon: string = "bi bi-quote"
  static keywords: string = "blockquote citation"
  static markdownShortcuts: Array<BlockShortcut> = [{pattern: /^> /}]

  static blockKinds(strings: Strings, _compact: boolean): Array<[string, string, string]> {
    return [["quote", strings.TextQuoteCaption, "bi bi-quote"]]
  }

  static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined {
    if (element.tagName != "BLOCKQUOTE") return undefined
    // An alert written as a blockquote belongs to the alert type when it is registered.
    if (/alert-(info|success|warning|danger)/.test(element.className || "") && importer.hasType("alert")) return undefined
    let quote = new QuoteNode()
    let footer = element.querySelector(":scope > footer")
    if (footer) {
      quote.citation = (footer.textContent || "").trim()
      footer.remove()
    }
    let blocks = Array.from(element.children).filter(child => /^(P|DIV)$/.test(child.tagName))
    let content = new RichText()
    if (blocks.length > 0 && blocks.length == element.children.length) {
      blocks.forEach((block, index) => {
        if (index > 0) content.insert(content.length, LineBreak)
        content.append(importer.trimmed(importer.richText(Array.from(block.childNodes))))
      })
    } else {
      content = importer.trimmed(importer.richText(Array.from(element.childNodes)))
    }
    quote.content = content
    return importer.attach(quote)
  }

  inspectorSections(): Array<InspectorSection> {
    let strings = this.strings
    return [InspectorDefaults.section("quote", strings.TextQuoteCaption, [new InspectorItem("citation", strings.TextCitationCaption, "citation", InspectorEditors.text)])].concat(InspectorDefaults.text(this))
  }

  citation: string = ""
  #citationText: RichText = new RichText()

  protected get placeholderText(): string {
    return this.strings.TextDefaultQuote
  }

  protected build(body: HTMLElement) {
    let quote = Utilities.element("blockquote", "scv-quote")
    body.append(quote)
    let paragraph = Utilities.element("div", "scv-quote-text")
    quote.append(paragraph)
    let host = this.addHost(new TextHost(this, this.content, paragraph, TextHostModes.inline))
    host.placeholder = this.placeholderText
    this.applyTextAppearance(paragraph)
    host.render()

    let footer = Utilities.element("footer", "scv-quote-citation")
    quote.append(footer)
    this.#citationText = new RichText(this.citation)
    let citationHost = this.addHost(new TextHost(this, this.#citationText, footer, TextHostModes.plain))
    citationHost.placeholder = this.strings.TextCitationCaption
    citationHost.render()
  }

  textChanged(host: TextHost) {
    if (host.rich === this.#citationText) this.citation = this.#citationText.text.replace(/\n/g, " ")
  }

  toJSON(): object {
    let result = super.toJSON()
    if (this.citation.length > 0) result["citation"] = this.citation
    return result
  }

  fromJSON(data: any): boolean {
    if (!super.fromJSON(data)) return false
    this.citation = Utilities.string(data.citation)
    return true
  }

  toHTML(): string {
    let result = `<blockquote class="quote" style="${this.htmlBackgroundCSS()}${this.htmlTextAlignmentCSS()}${this.htmlLineHeightCSS()}">${this.content.htmlText()}`
    if (this.citation.trim().length > 0) result += `<footer><cite>${Utilities.escapeText(this.citation.trim())}</cite></footer>`
    return result + "</blockquote>"
  }

  toMarkdown(): string {
    let lines = this.content.markdownText().replace(/\r/g, "").split("\n")
    if (this.citation.trim().length > 0) lines.push(`— ${this.citation.trim()}`)
    return this.markdownWithBackground(lines.map(line => `> ${line}`).join("\n"))
  }

  toPlainText(): string {
    let result = this.content.text.replace(/\u2028/g, "\n")
    if (this.citation.trim().length > 0) result += `\n— ${this.citation.trim()}`
    return result
  }
}
