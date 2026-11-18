import {Alignments, BackgroundImage, Colors, Directions, DocumentColor, Editor, ImageNode, LineBreak, Node, NodeClass, NormalLineHeightRatio, ParagraphBreak, RichText, TableNode, TextHost, TextNode, TextStyle, Utilities} from "./internal"

/** Builds nodes from HTML. Used by fromHTML, insertHTML and pasting. */
/** The document-level appearance read from imported HTML or Markdown; null values are left as they are. */
export interface DocumentStyle {
  fontName: string
  fontSize: number
  backgroundColor: DocumentColor | null
  backgroundImage: BackgroundImage | null
  direction: Directions | null
}

export class HTMLImporter {
  #editor: Editor

  /** Readers for inline elements that become text of their own; see registerInlineElement. */
  static #inlineReaders: Array<InlineElementReader> = []

  /**
   * Reads inline elements an add-on exports, such as formulas, into text with a style, instead of
   * reading their contents. The reader returns null for elements it doesn't know.
   */
  static registerInlineElement(reader: InlineElementReader) {
    if (HTMLImporter.#inlineReaders.indexOf(reader) < 0) HTMLImporter.#inlineReaders.push(reader)
  }

  constructor(editor: Editor) {
    this.#editor = editor
  }

  /** Parses HTML into nodes. The nodes belong to no list until they are inserted. */
  import(html: string): Array<Node> {
    let parsed = new DOMParser().parseFromString(html, "text/html")
    parsed.querySelectorAll("script, style, template, meta, link, title, noscript").forEach(element => element.remove())
    return this.importChildren(parsed.body)
  }

  /** The document-level styles of a full HTML page: the body's font and background, and the page's direction. */
  documentStyle(html: string): DocumentStyle {
    let parsed = new DOMParser().parseFromString(html, "text/html")
    let result = this.elementDocumentStyle(parsed.body)
    let direction = (parsed.documentElement.getAttribute("dir") || "").trim().toLowerCase()
    if (direction == "rtl") result.direction = Directions.rightToLeft
    if (direction == "ltr") result.direction = Directions.leftToRight
    return result
  }

  /** The document-level styles an element sets, such as a page's body. */
  elementDocumentStyle(element: HTMLElement | null): DocumentStyle {
    let result: DocumentStyle = {fontName: "", fontSize: 0, backgroundColor: null, backgroundImage: null, direction: null}
    if (!element) return result
    let style = new TextStyle()
    TextHost.applyElementStyle(element, style)
    result.fontName = style.fontName
    result.fontSize = style.fontSize
    result.backgroundColor = Colors.fromCSS(element.style.backgroundColor)
    if (element.style.backgroundImage.length > 0) {
      let image = new BackgroundImage()
      BackgroundImage.applyCSS(image, element.style)
      if (!image.isEmpty) result.backgroundImage = image
    }
    let direction = (element.getAttribute("dir") || element.style.direction || "").trim().toLowerCase()
    if (direction == "rtl") result.direction = Directions.rightToLeft
    if (direction == "ltr") result.direction = Directions.leftToRight
    return result
  }

  importChildren(parent: globalThis.Node): Array<Node> {
    let result: Array<Node> = []
    let inline: Array<globalThis.Node> = []
    let flush = () => {
      if (inline.length == 0) return
      let rich = this.richText(inline)
      inline = []
      if (rich.text.trim().length == 0) return
      let node = new TextNode()
      node.content = this.trimmed(rich)
      result.push(this.attach(node))
    }

    parent.childNodes.forEach(child => {
      if (child.nodeType == 3) {
        inline.push(child)
        return
      }
      // MathML elements, such as a displayed formula, are elements but not HTMLElements.
      if (!(child instanceof HTMLElement) && !(typeof MathMLElement != "undefined" && child instanceof MathMLElement)) return
      let element = child as HTMLElement
      let block = this.blockNode(element)
      if (block === undefined) {
        inline.push(child)
        return
      }
      flush()
      if (Array.isArray(block)) {
        // A wrapper around one block, as Markdown export writes for a styled node, styles that block.
        if (block.length == 1) this.readBlockStyle(element, block[0])
        result.push(...block)
      } else if (block) {
        this.readBlockStyle(element, block)
        result.push(block)
      }
    })
    flush()
    return result
  }

  /**
   * Applies an element's block styles to the node made from it: background image,
   * direction, borders, corner radii, block alignment from automatic margins, and
   * line height. Values the element doesn't set are left alone.
   */
  readBlockStyle(element: HTMLElement, node: Node) {
    if (!element || !node || !element.style) return
    let style = element.style
    BackgroundImage.applyCSS(node.backgroundImage, style)

    // The dir attribute and the CSS direction property both set the direction; dir="auto" leaves it Automatic.
    let direction = (element.getAttribute("dir") || style.direction || "").trim().toLowerCase()
    if (direction == "rtl") node.direction = Directions.rightToLeft
    if (direction == "ltr") node.direction = Directions.leftToRight

    let sides = ["Top", "Right", "Bottom", "Left"]
    sides.forEach(side => {
      let lineStyle = style.getPropertyValue(`border-${side.toLowerCase()}-style`).trim().toLowerCase()
      let width = style.getPropertyValue(`border-${side.toLowerCase()}-width`).trim().toLowerCase()
      let color = style.getPropertyValue(`border-${side.toLowerCase()}-color`).trim()
      if (lineStyle.length == 0 && width.length == 0 && color.length == 0) return
      let size = /^[\d.]+(px|pt)?$/.test(width) ? Math.max(0, parseFloat(width)) : 1
      node[`border${side}`] = {
        visible: lineStyle.length > 0 && lineStyle != "none" && lineStyle != "hidden",
        size: size,
        color: Colors.fromCSS(color) || Colors.empty
      }
    })

    // Elliptical corners keep their horizontal radius.
    let corners: Array<[string, string]> = [["borderTopLeftRadius", "border-top-left-radius"], ["borderTopRightRadius", "border-top-right-radius"], ["borderBottomRightRadius", "border-bottom-right-radius"], ["borderBottomLeftRadius", "border-bottom-left-radius"]]
    corners.forEach(([property, css]) => {
      let value = style.getPropertyValue(css).trim().toLowerCase()
      if (value.length == 0 || value.indexOf("%") >= 0) return
      let radius = parseFloat(value.split(/[\s\/]+/)[0])
      if (isFinite(radius)) node[property] = Math.max(0, radius)
    })

    // Margins are physical: an automatic left margin puts the block on the right,
    // which is the trailing edge of left-to-right content.
    let marginLeft = style.marginLeft.trim().toLowerCase()
    let marginRight = style.marginRight.trim().toLowerCase()
    let rightToLeft = node.direction == Directions.rightToLeft
    if (marginLeft == "auto" && marginRight == "auto") {
      node.alignment = Alignments.middle
    } else if (marginLeft == "auto") {
      node.alignment = rightToLeft ? Alignments.leading : Alignments.trailing
    } else if (marginRight == "auto") {
      node.alignment = rightToLeft ? Alignments.trailing : Alignments.leading
    }

    node.readImportedStyle(style)

    if (node instanceof TextNode) {
      let metrics = HTMLImporter.lineMetrics(style.lineHeight)
      if (metrics) {
        // CSS gives the height as a multiple of the font size; the editor uses a
        // multiple of the font's normal line height.
        node.lineHeight = Number((metrics.lineHeight / NormalLineHeightRatio).toFixed(4))
        node.lineSpacing = metrics.lineSpacing
      }
    }
  }

  /** Reads a CSS line-height as a multiple of the font size and extra spacing in pixels, or null. */
  static lineMetrics(value: string): {lineHeight: number, lineSpacing: number} | null {
    value = (value || "").trim().toLowerCase().replace(/\s+/g, "")
    if (value == "" || value == "normal" || value == "initial" || value == "inherit") return null
    if (value.startsWith("calc(") && value.endsWith(")")) value = value.substring(5, value.length - 1)
    let em = value.indexOf("em")
    if (em >= 0) {
      let height = parseFloat(value.substring(0, em))
      if (!(height > 0)) return null
      let spacing = value.substring(em + 2).match(/^\+?(-?[\d.]+)px/)
      return {lineHeight: height, lineSpacing: spacing ? parseFloat(spacing[1]) : 0}
    }
    if (value.indexOf("px") < 0 && value.indexOf("%") < 0) {
      let height = parseFloat(value)
      if (height > 0) return {lineHeight: height, lineSpacing: 0}
    }
    return null
  }

  /** The editor the nodes are imported into. */
  get editor(): Editor {
    return this.#editor
  }

  /** Connects an imported node to the editor, so it reads the editor's settings. Returns the node. */
  attach<T extends Node>(node: T): T {
    node.editor = this.#editor
    return node
  }

  /** Whether the editor has a node type registered, so its content can be imported. */
  hasType(identifier: string): boolean {
    return !!this.#editor.nodeTypes.item(identifier)
  }

  /** Returns the node(s) for a block element, or undefined when the element is inline. */
  /** The types that read elements themselves, highest import priority first, then in registration order. */
  #importingTypes(): Array<NodeClass> {
    let types = this.#editor.nodeTypes.items().filter(type => Object.prototype.hasOwnProperty.call(type, "importElement") && !!type.importElement)
    let priority = (type: NodeClass) => Number(Editor.ownStatic(type, "importPriority")) || 0
    return types.map((type, index) => ({type, index})).sort((a, b) => priority(b.type) - priority(a.type) || a.index - b.index).map(item => item.type)
  }

  blockNode(element: HTMLElement): Node | Array<Node> | null | undefined {
    let tag = element.tagName
    // An exported comments section is never content.
    if (element.dataset.scriviamoAnnotations !== undefined) return null
    // Registered node types read their own elements first.
    for (let type of this.#importingTypes()) {
      let result = type.importElement(element, this)
      if (result !== undefined) return result
    }
    switch (tag) {
      case "P": {
        let node = new TextNode()
        node.content = this.trimmed(this.richText(Array.from(element.childNodes)))
        this.readAlignment(element, node)
        return this.attach(node)
      }
      // Content no registered type reads is left out.
      case "HR": case "AUDIO": case "VIDEO": case "IFRAME": case "INPUT": case "TEXTAREA": case "SELECT": case "DATALIST": case "BUTTON": case "BR":
        return null
      case "LABEL":
        return element.querySelector("input, select, textarea") ? this.importChildren(element) : undefined
      case "IMG": case "FIGURE": case "PICTURE": {
        let image = tag == "IMG" ? element as HTMLImageElement : element.querySelector("img")
        if (!image) break
        if (!this.hasType("image")) return null
        let node = new ImageNode()
        let source = image.getAttribute("src") || ""
        if (source.startsWith("data:")) {
          node.imageData = source.substring(source.indexOf(",") + 1)
        } else {
          node.sourceURL = source
        }
        let width = parseFloat(image.style.width || image.getAttribute("width") || "0")
        let height = parseFloat(image.style.height || image.getAttribute("height") || "0")
        if (!(width > 0 && height > 0) && node.imageData.length > 0) {
          // Without a size, an embedded picture keeps its own pixel dimensions.
          let size = Utilities.imageDataSize(node.imageData)
          if (size) {
            width = size.width
            height = size.height
          }
        }
        if (width > 0 && height > 0) {
          node.displayWidth = width
          node.displayHeight = height
        }
        let caption = element.querySelector("figcaption")
        if (caption) {
          node.captionText = this.trimmed(this.richText(Array.from(caption.childNodes)))
        } else {
          node.caption = image.getAttribute("alt") || ""
        }
        return this.attach(node)
      }
      case "TABLE":
        return this.hasType("table") ? this.attach(this.#tableNode(element as HTMLTableElement)) : null
      case "DIV": case "SECTION": case "ARTICLE": case "MAIN": case "HEADER": case "FOOTER": case "CENTER": case "FORM": case "FIELDSET": case "DL": case "DD": case "DT": case "BODY": case "NAV": {
        let hasBlocks = Array.from(element.children).some(child => this.isBlockElement(child as HTMLElement))
        if (!hasBlocks && tag != "NAV") {
          let rich = this.trimmed(this.richText(Array.from(element.childNodes)))
          if (rich.text.length == 0) return null
          let node = new TextNode()
          node.content = rich
          this.readAlignment(element, node)
          return this.attach(node)
        }
        return this.importChildren(element)
      }
      case "LI":
        return this.importChildren(element)
    }
    return this.isBlockElement(element) ? this.importChildren(element) : undefined
  }

  /** Whether an element starts a block of its own rather than continuing the text around it. */
  isBlockElement(element: HTMLElement): boolean {
    if (element.tagName.toLowerCase() == "math") return element.getAttribute("display") == "block"
    return /^(P|DIV|H[1-6]|UL|OL|LI|PRE|BLOCKQUOTE|ASIDE|HR|TABLE|FIGURE|DETAILS|SECTION|ARTICLE|MAIN|HEADER|FOOTER|NAV|CENTER|FORM|FIELDSET|DL|DD|DT|IMG|PICTURE)$/.test(element.tagName)
  }

  /** Reads a text block's alignment from an element's text-align or align. */
  readAlignment(element: HTMLElement, node: TextNode) {
    let alignment = HTMLImporter.alignmentFromCSS(element.style.textAlign || element.getAttribute("align") || "", HTMLImporter.isRightToLeft(element, node.content.text))
    if (alignment !== null) node.textAlignment = alignment
  }

  /** Whether an element's content runs right to left: from its dir or direction, or from its text. */
  static isRightToLeft(element: HTMLElement, text: string): boolean {
    let direction = (element.getAttribute("dir") || element.style.direction || "").trim().toLowerCase()
    if (direction == "rtl") return true
    if (direction == "ltr") return false
    let ancestor = element.parentElement ? element.parentElement.closest("[dir]") : null
    let inherited = ancestor ? (ancestor.getAttribute("dir") || "").toLowerCase() : ""
    if (inherited == "rtl") return true
    if (inherited == "ltr") return false
    return Utilities.isRightToLeftText(text)
  }

  /** Maps a CSS text-align keyword to a logical alignment; physical left and right follow the direction. */
  static alignmentFromCSS(value: string, rightToLeft: boolean): Alignments | null {
    switch (value.trim().toLowerCase()) {
      case "center": return Alignments.middle
      case "start": return Alignments.leading
      case "end": return Alignments.trailing
      case "left": return rightToLeft ? Alignments.trailing : Alignments.leading
      case "right": return rightToLeft ? Alignments.leading : Alignments.trailing
    }
    return null
  }

  #tableNode(element: HTMLTableElement): TableNode {
    let rows = Array.from(element.rows)
    let columns = 0
    // Measure with spans so covered positions are counted.
    let occupied: Array<Array<boolean>> = []
    let placements: Array<{row: number, column: number, cell: HTMLTableCellElement}> = []
    rows.forEach((row, rowIndex) => {
      occupied[rowIndex] = occupied[rowIndex] || []
      let column = 0
      Array.from(row.cells).forEach(cell => {
        while (occupied[rowIndex][column]) column++
        placements.push({row: rowIndex, column: column, cell: cell})
        for (let r = 0; r < Math.max(1, cell.rowSpan); r++) {
          occupied[rowIndex + r] = occupied[rowIndex + r] || []
          for (let c = 0; c < Math.max(1, cell.colSpan); c++) occupied[rowIndex + r][column + c] = true
        }
        column += Math.max(1, cell.colSpan)
        columns = Math.max(columns, column)
      })
    })
    let table = new TableNode(Math.max(1, rows.length), Math.max(1, columns))
    this.attach(table)
    table.hasHeader = !!element.tHead || (rows.length > 0 && Array.from(rows[0].cells).every(cell => cell.tagName == "TH"))
    table.hasFooter = !!element.tFoot
    placements.forEach(placement => {
      let children = this.importChildren(placement.cell)
      let rich = new RichText()
      // Text from blocks that share one alignment, such as right-aligned lines, keeps it in the cell.
      let blockAlignment: Alignments | null = null
      let mixedAlignments = false
      let noteAlignment = (node: Node) => {
        let value = node instanceof TextNode ? node.textAlignment : Alignments.automatic
        if (blockAlignment === null) blockAlignment = value
        else if (blockAlignment != value) mixedAlignments = true
      }
      if (children.length > 0 && children[0].constructor === TextNode) {
        noteAlignment(children[0])
        rich = (children.shift() as TextNode).content
      }
      while (children.length > 0 && children[0].constructor === TextNode) {
        noteAlignment(children[0])
        rich.insert(rich.length, ParagraphBreak)
        rich.append((children.shift() as TextNode).content)
      }
      if (placement.cell.tagName == "TH") rich.styles.forEach(style => style.bold = true)
      rich.nodes = children
      rich.rowSpan = Math.max(1, placement.cell.rowSpan)
      rich.columnSpan = Math.max(1, placement.cell.colSpan)
      let align = HTMLImporter.alignmentFromCSS(placement.cell.style.textAlign || placement.cell.getAttribute("align") || "", HTMLImporter.isRightToLeft(placement.cell, rich.text))
      if (align !== null) {
        rich.textAlignment = align
      } else if (blockAlignment !== null && !mixedAlignments) {
        rich.textAlignment = blockAlignment
      }
      this.#readCellBorders(placement.cell, rich)
      let background = Colors.fromCSS(placement.cell.style.backgroundColor)
      if (background && background.alpha < 255) {
        rich.hasCellBackgroundColor = true
        rich.cellBackgroundColor = background
      }
      table.cells[placement.row * table.columns + placement.column] = rich
    })
    return table
  }

  /** Reads a table cell's border sides. Sides the cell doesn't set are left alone. */
  #readCellBorders(element: HTMLElement, cell: RichText) {
    let sides = ["Top", "Right", "Bottom", "Left"]
    sides.forEach(side => {
      let lineStyle = element.style.getPropertyValue(`border-${side.toLowerCase()}-style`).trim().toLowerCase()
      let width = element.style.getPropertyValue(`border-${side.toLowerCase()}-width`).trim().toLowerCase()
      let color = element.style.getPropertyValue(`border-${side.toLowerCase()}-color`).trim()
      if (lineStyle.length == 0 && width.length == 0 && color.length == 0) return
      cell[`cellBorder${side}`] = {
        visible: lineStyle.length > 0 && lineStyle != "none" && lineStyle != "hidden",
        size: /^[\d.]+(px|pt)?$/.test(width) ? Math.max(0, parseFloat(width)) : 1,
        color: Colors.fromCSS(color) || Colors.empty
      }
    })
  }

  /** Converts inline DOM content into styled text. */
  richText(nodes: Array<globalThis.Node>, inherited: TextStyle = new TextStyle(), preformatted: boolean = false): RichText {
    let result = new RichText()
    let walk = (node: globalThis.Node, style: TextStyle, pre: boolean) => {
      if (node.nodeType == 3) {
        let value = node.nodeValue || ""
        if (!pre) value = value.replace(/[\t\n\r ]+/g, " ")
        if (pre) value = value.replace(/\r\n?/g, "\n").replace(/\n/g, LineBreak)
        if (value.length > 0) result.insert(result.length, value, style)
        return
      }
      // MathML and SVG elements aren't HTML elements, but readers may know them.
      if (node instanceof Element) {
        for (let reader of HTMLImporter.#inlineReaders) {
          let read = reader(node, style)
          if (read) {
            if (read.text.length > 0) result.insert(result.length, read.text, read.style)
            return
          }
        }
      }
      if (!(node instanceof HTMLElement)) return
      if (node.tagName == "BR") {
        result.insert(result.length, LineBreak, style)
        return
      }
      if (node.tagName == "IMG" || node.tagName == "INPUT") return
      let childStyle = style.clone()
      TextHost.applyElementStyle(node, childStyle)
      let isBlock = /^(P|DIV|LI|H[1-6]|BLOCKQUOTE|TR)$/.test(node.tagName)
      if (isBlock && result.length > 0 && !result.text.endsWith(LineBreak)) result.insert(result.length, LineBreak, style)
      let childPre = pre || node.tagName == "PRE"
      node.childNodes.forEach(child => walk(child, childStyle, childPre))
    }
    nodes.forEach(node => walk(node, inherited, preformatted))
    return result
  }

  /** Removes leading and trailing whitespace and collapses spaces around line breaks. */
  /** The text without leading and trailing white space. */
  trimmed(rich: RichText): RichText {
    let text = rich.text
    let start = 0
    let end = text.length
    while (start < end && /[ \u2028]/.test(text[start])) start++
    while (end > start && /[ \u2028]/.test(text[end - 1])) end--
    let result = rich.slice(start, end)
    result.copyStateFrom(rich)
    for (let index = result.text.length - 1; index > 0; index--) {
      if (result.text[index] == " " && (result.text[index - 1] == LineBreak || result.text[index + 1] == LineBreak)) result.remove(index, index + 1)
    }
    return result
  }
}

/**
 * Reads one inline element into text: the text and its style, given the style around the element.
 * Returns null for elements it doesn't read.
 */
export type InlineElementReader = (element: Element, style: TextStyle) => {text: string, style: TextStyle} | null

/**
 * An inline Markdown syntax an add-on adds, such as $formulas$. It receives the text with code
 * spans and escapes already set aside, and returns it with its syntax replaced by HTML, each piece
 * of HTML passed through stash so later rules leave it alone.
 */
export type MarkdownInlineRule = (text: string, stash: (html: string) => string) => string

/** Converts Markdown into HTML for the HTML importer. Covers CommonMark blocks, GitHub tables, task lists and alerts. */
export class MarkdownConverter {
  static #inlineRules: Array<MarkdownInlineRule> = []

  /** Adds an inline syntax; see MarkdownInlineRule. */
  static registerInlineRule(rule: MarkdownInlineRule) {
    if (MarkdownConverter.#inlineRules.indexOf(rule) < 0) MarkdownConverter.#inlineRules.push(rule)
  }

  static toHTML(markdown: string): string {
    let lines = markdown.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n")
    let notes = MarkdownConverter.#footnotes(lines)
    return MarkdownConverter.#blocks(lines) + notes
  }

  /**
   * Takes footnote definitions ("[^label]: text", with indented lines continuing them) out of
   * the lines, and returns them as a footnotes section, which the footnotes add-on reads.
   * References, [^label], become tags in the inline text.
   */
  static #footnotes(lines: Array<string>): string {
    let items: Array<string> = []
    let fence: string | null = null
    for (let index = 0; index < lines.length; index++) {
      let opening = lines[index].match(/^ {0,3}(`{3,}|~{3,})/)
      if (opening) fence = fence === null ? opening[1] : (lines[index].trim().startsWith(fence) ? null : fence)
      if (fence !== null) continue
      let definition = lines[index].match(/^ {0,3}\[\^([^\]\s]+)\]:\s?(.*)$/)
      if (!definition) continue
      let text = [definition[2]]
      let end = index + 1
      while (end < lines.length && /^( {4}|\t)\S/.test(lines[end])) text.push(lines[end++].trim())
      lines.splice(index, end - index)
      index--
      let label = definition[1]
      items.push(`<li id="fn-${Utilities.escapeAttribute(label)}" data-footnote-id="${Utilities.escapeAttribute(label)}">${MarkdownConverter.inline(text.join(" ").trim())}</li>`)
    }
    return items.length == 0 ? "" : `<section class="footnotes" data-scriviamo-footnotes="true"><ol>${items.join("")}</ol></section>`
  }

  static #blocks(lines: Array<string>): string {
    let html = ""
    let index = 0
    let paragraph: Array<string> = []
    let flush = () => {
      if (paragraph.length == 0) return
      let text = paragraph.map((line, lineIndex) => {
        let hardBreak = / {2,}$/.test(line) || line.endsWith("\\")
        let content = MarkdownConverter.inline(line.replace(/\\$/, "").trim())
        return content + (hardBreak && lineIndex < paragraph.length - 1 ? "<br>" : "")
      }).join(" ")
      let image = text.match(/^<img [^>]+>$/)
      html += image ? `<figure>${text}</figure>` : `<p>${text}</p>`
      paragraph = []
    }

    while (index < lines.length) {
      let line = lines[index]

      // Display math: $$ on its own lines, or $$ formula $$ on one. It becomes code in the "math"
      // language, which the math add-on reads as a formula and the base package keeps as code.
      let math = line.match(/^ {0,3}\$\$(.*)$/)
      if (math) {
        flush()
        let body: Array<string> = []
        let rest = math[1]
        let oneLine = rest.match(/^(.*?)\$\$\s*$/)
        if (oneLine) {
          body.push(oneLine[1].trim())
          index++
        } else {
          if (rest.trim().length > 0) body.push(rest.trim())
          index++
          while (index < lines.length && !/^\s*\$\$\s*$/.test(lines[index])) {
            let closing = lines[index].match(/^(.*?)\$\$\s*$/)
            if (closing) {
              body.push(closing[1])
              break
            }
            body.push(lines[index])
            index++
          }
          index++
        }
        html += `<pre><code class="language-math">${Utilities.escapeText(body.join("\n").trim())}</code></pre>`
        continue
      }

      // Fenced code
      let fence = line.match(/^ {0,3}(`{3,}|~{3,})\s*([^`\s]*)/)
      if (fence) {
        flush()
        let marker = fence[1]
        let body: Array<string> = []
        index++
        while (index < lines.length && !lines[index].trim().startsWith(marker)) {
          body.push(lines[index])
          index++
        }
        index++
        let language = fence[2] ? ` class="language-${Utilities.escapeAttribute(fence[2])}"` : ""
        html += `<pre><code${language}>${Utilities.escapeText(body.join("\n"))}</code></pre>`
        continue
      }

      if (line.trim().length == 0) {
        flush()
        index++
        continue
      }

      let heading = line.match(/^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/)
      if (heading) {
        flush()
        html += `<h${heading[1].length}>${MarkdownConverter.inline(heading[2])}</h${heading[1].length}>`
        index++
        continue
      }

      if (/^ {0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) {
        flush()
        html += "<hr>"
        index++
        continue
      }

      // Setext headings
      if (paragraph.length > 0 && /^ {0,3}(=+|-+)\s*$/.test(line)) {
        let level = line.trim().startsWith("=") ? 1 : 2
        let text = paragraph.join(" ")
        paragraph = []
        html += `<h${level}>${MarkdownConverter.inline(text)}</h${level}>`
        index++
        continue
      }

      if (/^ {0,3}>/.test(line)) {
        flush()
        let body: Array<string> = []
        while (index < lines.length && /^ {0,3}>/.test(lines[index])) {
          body.push(lines[index].replace(/^ {0,3}> ?/, ""))
          index++
        }
        let alert = body.length > 0 ? body[0].match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i) : null
        if (alert) {
          let type = {NOTE: "info", TIP: "success", IMPORTANT: "info", WARNING: "warning", CAUTION: "danger"}[alert[1].toUpperCase()]
          html += `<aside class="alert alert-${type}">${body.slice(1).map(text => MarkdownConverter.inline(text)).join("<br>")}</aside>`
        } else {
          let citationIndex = body.length - 1
          let citation = ""
          if (citationIndex > 0 && /^(—|--)\s*/.test(body[citationIndex])) {
            citation = body[citationIndex].replace(/^(—|--)\s*/, "")
            body.pop()
          }
          html += `<blockquote>${MarkdownConverter.#blocks(body)}${citation.length > 0 ? `<footer><cite>${Utilities.escapeText(citation)}</cite></footer>` : ""}</blockquote>`
        }
        continue
      }

      let listMatch = line.match(/^(\s*)([-*+]|\d+[.)])\s+/)
      if (listMatch && (paragraph.length == 0 || /^\s*([-*+]|1[.)])\s/.test(line))) {
        flush()
        let items: Array<{level: number, ordered: boolean, text: string}> = []
        let indents: Array<number> = []
        while (index < lines.length) {
          let current = lines[index]
          let match = current.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/)
          if (match) {
            let indent = match[1].length
            while (indents.length > 0 && indent < indents[indents.length - 1]) indents.pop()
            if (indents.length == 0 || indent > indents[indents.length - 1]) indents.push(indent)
            items.push({level: indents.length - 1, ordered: /\d/.test(match[2]), text: match[3]})
            index++
          } else if (current.trim().length > 0 && /^\s{2,}/.test(current) && items.length > 0) {
            items[items.length - 1].text += " " + current.trim()
            index++
          } else {
            break
          }
        }
        html += MarkdownConverter.#listHTML(items)
        continue
      }

      // Tables
      if (line.indexOf("|") >= 0 && index + 1 < lines.length && /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(lines[index + 1])) {
        flush()
        let split = (value: string) => value.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, "|"))
        let header = split(line)
        let alignments = split(lines[index + 1]).map(cell => cell.startsWith(":") && cell.endsWith(":") ? "center" : (cell.endsWith(":") ? "right" : ""))
        index += 2
        let hasHeader = header.some(cell => cell.length > 0)
        let table = "<table>"
        let cellHTML = (tag: string, value: string, column: number) => `<${tag}${alignments[column] ? ` style="text-align:${alignments[column]}"` : ""}>${MarkdownConverter.inline(value)}</${tag}>`
        if (hasHeader) table += `<thead><tr>${header.map((cell, column) => cellHTML("th", cell, column)).join("")}</tr></thead>`
        table += "<tbody>"
        while (index < lines.length && lines[index].indexOf("|") >= 0 && lines[index].trim().length > 0) {
          let cells = split(lines[index])
          while (cells.length < header.length) cells.push("")
          table += `<tr>${cells.slice(0, header.length).map((cell, column) => cellHTML("td", cell, column)).join("")}</tr>`
          index++
        }
        html += table + "</tbody></table>"
        continue
      }

      // HTML blocks pass through until a blank line.
      if (/^ {0,3}<(\/?)(div|details|summary|table|aside|section|nav|figure|pre|p|h[1-6]|ul|ol|hr|blockquote|kbd|br)\b/i.test(line)) {
        flush()
        let body: Array<string> = []
        let markdownInside = false
        while (index < lines.length && lines[index].trim().length > 0) {
          body.push(lines[index])
          index++
        }
        // Details and similar containers hold Markdown between blank lines.
        if (/^<(details|div)\b/i.test(body[0].trim()) && !/<\/(details|div)>\s*$/i.test(body[body.length - 1])) markdownInside = true
        if (markdownInside) {
          let inner: Array<string> = []
          let closing = new RegExp(`^\\s*</${body[0].trim().match(/^<(\w+)/)[1]}>`, "i")
          while (index < lines.length && !closing.test(lines[index])) {
            inner.push(lines[index])
            index++
          }
          let close = index < lines.length ? lines[index] : ""
          index++
          html += body.join("\n") + MarkdownConverter.#blocks(inner) + close
        } else {
          html += body.join("\n")
        }
        continue
      }

      paragraph.push(line)
      index++
    }
    flush()
    return html
  }

  static #listHTML(items: Array<{level: number, ordered: boolean, text: string}>): string {
    let html = ""
    let stack: Array<string> = []
    let open = (ordered: boolean, checklist: boolean) => {
      let tag = ordered ? "ol" : "ul"
      stack.push(tag)
      html += `<${tag}${checklist ? ` class="checklist"` : ""}>`
    }
    items.forEach((item, index) => {
      let task = item.text.match(/^\[([ xX])\]\s+(.*)$/)
      while (stack.length > item.level + 1) {
        html += `</li></${stack.pop()}>`
      }
      if (stack.length < item.level + 1) {
        while (stack.length < item.level + 1) open(item.ordered, !!task)
      } else if (index > 0) {
        html += "</li>"
      }
      html += "<li>"
      if (task) {
        html += `<input type="checkbox"${task[1].trim().length > 0 ? " checked" : ""}> ${MarkdownConverter.inline(task[2])}`
      } else {
        html += MarkdownConverter.inline(item.text)
      }
    })
    while (stack.length > 0) html += `</li></${stack.pop()}>`
    return html
  }

  /** Converts inline Markdown into HTML. */
  static inline(value: string): string {
    let tokens: Array<string> = []
    let stash = (html: string) => {
      tokens.push(html)
      return `\u0000${tokens.length - 1}\u0000`
    }
    let text = value
    // Code spans
    text = text.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_match, _fence, code) => stash(`<code>${Utilities.escapeText(code.trim().length > 0 ? code.replace(/^ (.*) $/, "$1") : code)}</code>`))
    // Inline HTML elements that Markdown export writes
    text = text.replace(/<(\/?)(kbd|sup|sub|mark|u|br|span|a)([^>]*)>/gi, match => stash(match))
    // Escapes
    text = text.replace(/\\([\\`*_{}\[\]()#+\-.!|~<>$])/g, (_match, character) => stash(Utilities.escapeText(character)))
    // Syntax add-ons add
    for (let rule of MarkdownConverter.#inlineRules) text = rule(text, stash)
    // Footnote references
    text = text.replace(/\[\^([^\]\s]+)\]/g, (_match, label) => stash(`<sup data-scriviamo-suggestion-provider="footnote" data-scriviamo-suggestion-id="${Utilities.escapeAttribute(label)}">${Utilities.escapeText(label)}</sup>`))
    // Images and links
    text = text.replace(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"([^"]*)")?\s*\)/g, (_match, alt, source) => stash(`<img src="${Utilities.escapeAttribute(source)}" alt="${Utilities.escapeAttribute(alt)}">`))
    text = text.replace(/\[([^\]]+)\]\(\s*<?([^)\s>]+)>?(?:\s+"([^"]*)")?\s*\)/g, (_match, label, href, title) => stash(`<a href="${Utilities.escapeAttribute(href)}"${title ? ` title="${Utilities.escapeAttribute(title)}"` : ""}>`) + label + stash("</a>"))
    text = text.replace(/<(https?:\/\/[^>\s]+)>/g, (_match, href) => stash(`<a href="${Utilities.escapeAttribute(href)}">${Utilities.escapeText(href)}</a>`))
    text = Utilities.escapeText(text)
    text = text.replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, "<strong>$2</strong>")
    text = text.replace(/(\*|_)(?=\S)([\s\S]*?\S)\1(?![\w*])/g, "<em>$2</em>")
    text = text.replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<del>$1</del>")
    text = text.replace(/==(?=\S)([\s\S]*?\S)==/g, "<mark>$1</mark>")
    // Restore stashed tokens, which may hold other tokens.
    for (let pass = 0; pass < 3 && text.indexOf("\u0000") >= 0; pass++) {
      text = text.replace(/\u0000(\d+)\u0000/g, (_match, number) => tokens[Number(number)])
    }
    return text
  }
}

/** Where pasted HTML came from, when it's an app whose HTML needs cleaning up. */
export type PasteSource = "word" | "googledocs" | null

/**
 * Cleans up HTML pasted from Microsoft Word and Google Docs, keeping its structure (headings,
 * lists, tables, links, bold, italic, underline, strikethrough, colors and highlights) and dropping
 * its clutter: fonts and sizes set on every run, Word's own classes, styles and markup, its lists
 * written as paragraphs with typed bullets, and Google Docs' wrapper that would make the whole
 * paste bold. HTML from anywhere else is returned unchanged. The editor runs this on every paste.
 */
export class PasteCleanup {
  /** The app pasted HTML came from, or null. */
  static source(html: string): PasteSource {
    if (/id="docs-internal-guid-/.test(html)) return "googledocs"
    if (/urn:schemas-microsoft-com:office:(word|office)|<meta[^>]+content=["']?Microsoft Word|class=["']?Mso|mso-[a-z-]+:/i.test(html)) return "word"
    return null
  }

  static clean(html: string): string {
    let source = PasteCleanup.source(html)
    if (!source || typeof DOMParser == "undefined") return html
    let parsed = new DOMParser().parseFromString(html, "text/html")
    let body = parsed.body
    body.querySelectorAll("style, script, meta, link, title, xml").forEach(element => element.remove())
    if (source == "googledocs") PasteCleanup.#cleanGoogleDocs(body)
    else PasteCleanup.#cleanWord(body)
    PasteCleanup.#cleanStyles(body)
    body.querySelectorAll("br.Apple-interchange-newline").forEach(element => element.remove())
    return body.innerHTML
  }

  static #unwrap(element: Element) {
    element.replaceWith(...Array.from(element.childNodes))
  }

  static #cleanGoogleDocs(body: HTMLElement) {
    // The whole paste is wrapped in a <b> whose style undoes the bold.
    body.querySelectorAll("b[id^='docs-internal-guid-']").forEach(element => PasteCleanup.#unwrap(element))
    // Paragraphs in list items and table cells are wrapped in <p>, which would make each a block.
    body.querySelectorAll("li > p:only-child, td > p:only-child, th > p:only-child").forEach(element => PasteCleanup.#unwrap(element))
  }

  static #cleanWord(body: HTMLElement) {
    // Office's own elements, such as <o:p>, and empty conditional leftovers.
    Array.from(body.querySelectorAll("*")).forEach(element => {
      if (element.tagName.includes(":")) {
        if (/^O:P$/i.test(element.tagName)) PasteCleanup.#unwrap(element)
        else element.remove()
      }
    })
    let comments = parsedComments(body)
    comments.forEach(comment => comment.parentNode?.removeChild(comment))
    // Pictures Word pastes point at files on the copier's computer, which no one else can open.
    body.querySelectorAll("img").forEach(image => {
      if (/^file:/i.test(image.getAttribute("src") || "")) image.remove()
    })
    // Word's title style is a heading.
    body.querySelectorAll<HTMLElement>("p.MsoTitle").forEach(paragraph => PasteCleanup.#rename(paragraph, "h1"))
    body.querySelectorAll<HTMLElement>("p.MsoSubtitle").forEach(paragraph => PasteCleanup.#rename(paragraph, "h2"))
    PasteCleanup.#wordLists(body)
    // Empty paragraphs, which Word uses for spacing.
    body.querySelectorAll("p").forEach(paragraph => {
      if ((paragraph.textContent || "").replace(/[\s\u00a0]+/g, "").length == 0 && !paragraph.querySelector("img, table, input")) paragraph.remove()
    })
  }

  static #rename(element: HTMLElement, tag: string): HTMLElement {
    let replacement = element.ownerDocument.createElement(tag)
    for (let attribute of Array.from(element.attributes)) replacement.setAttribute(attribute.name, attribute.value)
    replacement.append(...Array.from(element.childNodes))
    element.replaceWith(replacement)
    return replacement
  }

  /** Word writes lists as paragraphs with mso-list styles and typed bullets or numbers. */
  static #wordLists(body: HTMLElement) {
    let isItem = (element: Element | null): element is HTMLElement => !!element && element.tagName == "P" && /mso-list\s*:\s*l\d+/i.test(element.getAttribute("style") || "")
    let paragraphs = Array.from(body.querySelectorAll("p")).filter(isItem)
    let done = new Set<Element>()
    for (let first of paragraphs) {
      if (done.has(first)) continue
      // A run of list paragraphs next to each other is one list.
      let run: Array<HTMLElement> = [first]
      let listID = (style: string) => (style.match(/mso-list\s*:\s*(l\d+)/i) || [])[1] || ""
      let id = listID(first.getAttribute("style") || "")
      let next = first.nextElementSibling
      // Word numbers each list with an id, such as l0; another id starts another list.
      while (isItem(next) && listID(next.getAttribute("style") || "") == id) {
        run.push(next)
        next = next.nextElementSibling
      }
      run.forEach(item => done.add(item))
      let document = first.ownerDocument
      let root: HTMLElement | null = null
      let stack: Array<{level: number, list: HTMLElement}> = []
      for (let paragraph of run) {
        let style = paragraph.getAttribute("style") || ""
        let level = Number((style.match(/level(\d+)/i) || [])[1]) || 1
        // The typed bullet or number, in a span marked mso-list:Ignore.
        let marker = Array.from(paragraph.querySelectorAll("span")).find(span => /mso-list\s*:\s*ignore/i.test(span.getAttribute("style") || "")) || null
        let markerText = marker ? (marker.textContent || "").replace(/\s+/g, "") : ""
        if (marker) marker.remove()
        let ordered = /^(\(?[0-9]+|\(?[a-z]{1,3}|\(?[ivxlc]+)[.)]$/i.test(markerText)
        while (stack.length > 0 && stack[stack.length - 1].level > level) stack.pop()
        if (stack.length == 0 || stack[stack.length - 1].level < level) {
          let list = document.createElement(ordered ? "ol" : "ul")
          if (stack.length == 0) {
            root = list
          } else {
            let parentList = stack[stack.length - 1].list
            let lastItem = parentList.lastElementChild || parentList.appendChild(document.createElement("li"))
            lastItem.append(list)
          }
          stack.push({level, list})
        }
        let item = document.createElement("li")
        item.append(...Array.from(paragraph.childNodes))
        stack[stack.length - 1].list.append(item)
      }
      if (root) first.before(root)
      run.forEach(paragraph => paragraph.remove())
    }
  }

  /**
   * Drops the styles every run carries, keeping what formats the text: weight, slant, decoration,
   * raised and lowered text, colors other than plain black, and backgrounds other than none.
   */
  static #cleanStyles(body: HTMLElement) {
    let plain = /^(#0{3}|#0{6}|black|rgb\(0,\s*0,\s*0\)|windowtext|initial|inherit|auto)$/i
    let none = /^(transparent|initial|inherit|white|#fff|#ffffff|rgb\(255,\s*255,\s*255\)|rgba\(0,\s*0,\s*0,\s*0\))$/i
    body.querySelectorAll("[style]").forEach(element => {
      let html = element as HTMLElement
      let kept: Array<string> = []
      let css = html.style
      let weight = css.fontWeight
      if (weight == "bold" || weight == "bolder" || Number(weight) >= 600) kept.push("font-weight:bold")
      if (css.fontStyle == "italic" || css.fontStyle == "oblique") kept.push("font-style:italic")
      let decoration = `${css.textDecorationLine || css.textDecoration}`
      let lines = ["underline", "line-through"].filter(line => decoration.includes(line))
      if (lines.length > 0) kept.push(`text-decoration:${lines.join(" ")}`)
      if (css.verticalAlign == "super" || css.verticalAlign == "sub") kept.push(`vertical-align:${css.verticalAlign}`)
      if (css.color && !plain.test(css.color.trim())) kept.push(`color:${css.color}`)
      let background = css.backgroundColor || css.background
      if (background && !none.test(background.trim()) && !/url\(/i.test(background)) kept.push(`background-color:${css.backgroundColor || background}`)
      if (/^(center|right|justify)$/.test(css.textAlign) && /^(P|H[1-6]|DIV|TD|TH|LI)$/.test(html.tagName)) kept.push(`text-align:${css.textAlign}`)
      if (kept.length > 0) html.setAttribute("style", kept.join(";"))
      else html.removeAttribute("style")
    })
    body.querySelectorAll("[class]").forEach(element => {
      if (/^(Mso|xl\d|Apple-)/.test(element.getAttribute("class") || "")) element.removeAttribute("class")
    })
    // Spans left with nothing to say are just their text.
    Array.from(body.querySelectorAll("span, font")).forEach(element => {
      if (element.attributes.length == 0 || (element.tagName == "FONT" && !element.getAttribute("color"))) PasteCleanup.#unwrap(element)
    })
  }
}

/** The comment nodes inside an element, such as Word's conditional comments. */
function parsedComments(root: HTMLElement): Array<globalThis.Node> {
  let result: Array<globalThis.Node> = []
  let walker = root.ownerDocument.createTreeWalker(root, 128)
  while (walker.nextNode()) result.push(walker.currentNode)
  return result
}
