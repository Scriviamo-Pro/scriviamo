import {Alignments, CodePoints, Colors, DocumentColor, LineBreak, Node, ParagraphBreak, TextStyle, Utilities} from "./internal"

export enum BackgroundFills {
  actualSize = 0,
  stretch = 1,
  fit = 2,
  fill = 3
}

export enum BackgroundRepeats {
  noRepeat = 0,
  repeatX = 1,
  repeatY = 2,
  repeat = 3
}

/** A background picture for the document, a node, or a table cell. */
export class BackgroundImage {
  /** A data: URI or an http(s) URL. Empty when there is no image. */
  source: string = ""
  fill: BackgroundFills = BackgroundFills.fill
  repeat: BackgroundRepeats = BackgroundRepeats.noRepeat

  static fromJSON(data: any): BackgroundImage {
    let result = new BackgroundImage()
    if (typeof data == "string") {
      result.source = data
    } else if (data && typeof data == "object") {
      result.source = Utilities.string(data.source)
      result.fill = Utilities.clamp(Utilities.integer(data.fill, BackgroundFills.fill), 0, 3)
      result.repeat = Utilities.clamp(Utilities.integer(data.repeat, BackgroundRepeats.noRepeat), 0, 3)
    }
    return result
  }

  toJSON(): object {
    let result = {source: this.source}
    if (this.fill != BackgroundFills.fill) result["fill"] = this.fill
    if (this.repeat != BackgroundRepeats.noRepeat) result["repeat"] = this.repeat
    return result
  }

  clone(): BackgroundImage {
    return BackgroundImage.fromJSON(this.toJSON())
  }

  get isEmpty(): boolean {
    return this.source.length == 0
  }

  clear() {
    this.source = ""
    this.fill = BackgroundFills.fill
    this.repeat = BackgroundRepeats.noRepeat
  }

  toCSS(): string {
    if (this.isEmpty) return ""
    let size = "auto"
    switch (this.fill) {
      case BackgroundFills.stretch: size = "100% 100%"; break
      case BackgroundFills.fit: size = "contain"; break
      case BackgroundFills.fill: size = "cover"; break
    }
    let repeat = "no-repeat"
    switch (this.repeat) {
      case BackgroundRepeats.repeatX: repeat = "repeat-x"; break
      case BackgroundRepeats.repeatY: repeat = "repeat-y"; break
      case BackgroundRepeats.repeat: repeat = "repeat"; break
    }
    return `background-image:url('${this.source.replace(/'/g, "%27").replace(/"/g, "%22")}');background-size:${size};background-repeat:${repeat};background-position:center`
  }

  /** Reads background-image, background-size and background-repeat from a style into an image. */
  static applyCSS(image: BackgroundImage, style: CSSStyleDeclaration) {
    if (!image || !style) return
    let source = style.backgroundImage.trim()
    let match = source.match(/^url\(\s*(['"]?)(.*)\1\s*\)$/i)
    if (match) image.source = match[2]
    switch (style.backgroundSize.trim().toLowerCase().replace(/\s+/g, "")) {
      case "cover": image.fill = BackgroundFills.fill; break
      case "contain": image.fill = BackgroundFills.fit; break
      case "100%100%": image.fill = BackgroundFills.stretch; break
      case "auto": image.fill = BackgroundFills.actualSize; break
    }
    switch (style.backgroundRepeat.trim().toLowerCase()) {
      case "repeat-x": image.repeat = BackgroundRepeats.repeatX; break
      case "repeat-y": image.repeat = BackgroundRepeats.repeatY; break
      case "repeat": image.repeat = BackgroundRepeats.repeat; break
      case "no-repeat": image.repeat = BackgroundRepeats.noRepeat; break
    }
  }
}

/** One side of a table cell's border. */
export interface CellBorder {
  visible: boolean
  size: number
  color: DocumentColor
}

export interface TextRun {
  start: number
  length: number
  text: string
  style: TextStyle
}

/**
 * Styled text with the state of the container that holds it. Text nodes,
 * list items, table cells and column cells all keep their content in one.
 *
 * Indexes are JavaScript string (UTF-16) indexes. JSON uses character
 * (code point) counts, and conversion happens in fromJSON and toJSON.
 */
/** How an add-on exports its own tags; see RichText.registerTagExport. */
export interface TagExport {
  html?(text: string, identifier: string, style: TextStyle): string
  markdown?(text: string, identifier: string, style: TextStyle): string
}

export class RichText {
  text: string = ""
  styles: Array<TextStyle> = []

  alertType: number = 0
  headingLevel: number = 0
  textAlignment: Alignments = Alignments.automatic
  listType: number = 0
  verticalAlignment: number = 0

  hasCellBackgroundColor: boolean = false
  cellBackgroundColor: DocumentColor = Colors.empty
  cellBorderTop: CellBorder = RichText.defaultBorder()
  cellBorderRight: CellBorder = RichText.defaultBorder()
  cellBorderBottom: CellBorder = RichText.defaultBorder()
  cellBorderLeft: CellBorder = RichText.defaultBorder()
  columnSpan: number = 1
  rowSpan: number = 1
  backgroundImage: BackgroundImage = new BackgroundImage()

  listLevels: Array<number> = []
  listChecked: Array<boolean> = []

  /** Nodes embedded in this text's container, such as the blocks inside a table cell or a column. */
  nodes: Array<Node> = []

  constructor(text: string = "", style?: TextStyle) {
    this.text = text
    for (let index = 0; index < text.length; index++) this.styles.push(style ? style.clone() : new TextStyle())
  }

  static defaultBorder(): CellBorder {
    return {visible: false, size: 1, color: Colors.empty}
  }

  get length(): number {
    return this.text.length
  }

  /** Restores a snapshot. nodeFactory builds embedded nodes from their JSON. */
  static fromJSON(data: any, nodeFactory?: (data: any) => Node | null): RichText {
    let result = new RichText()
    if (!data || typeof data != "object") return result

    result.text = Utilities.string(data.text)
    result.alertType = Utilities.integer(data.alertType, 0)
    result.headingLevel = Utilities.integer(data.headingLevel, 0)
    result.listType = Utilities.integer(data.listType, 0)
    result.verticalAlignment = Utilities.integer(data.verticalAlignment, 0)

    result.textAlignment = Alignments.automatic
    if ("textAlignment" in data) {
      let value = Utilities.integer(data.textAlignment, 0)
      if (value >= 0 && value <= 3) result.textAlignment = value
    } else {
      // Documents saved before cells had Automatic store horizontalAlignment.
      switch (Utilities.integer(data.horizontalAlignment, 0)) {
        case 1: result.textAlignment = Alignments.middle; break
        case 2: result.textAlignment = Alignments.trailing; break
      }
    }

    result.hasCellBackgroundColor = Utilities.boolean(data.hasCellBackgroundColor, false)
    result.cellBackgroundColor = Colors.fromJSON(data.cellBackgroundColor, Colors.empty)
    let sides = ["Top", "Right", "Bottom", "Left"]
    sides.forEach(side => {
      result[`cellBorder${side}`] = {
        visible: Utilities.boolean(data[`cellBorder${side}Visible`], false),
        size: Math.max(0, Utilities.number(data[`cellBorder${side}Size`], 1)),
        color: Colors.fromJSON(data[`cellBorder${side}Color`], Colors.empty)
      }
    })
    result.columnSpan = Math.max(1, Utilities.integer(data.columnSpan, 1))
    result.rowSpan = Math.max(1, Utilities.integer(data.rowSpan, 1))
    if (data.backgroundImage) result.backgroundImage = BackgroundImage.fromJSON(data.backgroundImage)

    // Styles are stored per character (code point). Expand them, then give
    // the second half of a surrogate pair the same style as the first.
    let characterStyles: Array<TextStyle> = []
    let characterCount = CodePoints.count(result.text)
    if (Array.isArray(data.styleRuns)) {
      let prototypes: Array<TextStyle> = []
      if (Array.isArray(data.styleTable)) data.styleTable.forEach(item => prototypes.push(TextStyle.fromJSON(item)))
      let runs: Array<any> = data.styleRuns
      for (let runIndex = 0; runIndex + 1 < runs.length && characterStyles.length < characterCount; runIndex += 2) {
        let runLength = Math.min(Utilities.integer(runs[runIndex], 0), characterCount - characterStyles.length)
        let styleIndex = Utilities.integer(runs[runIndex + 1], -1)
        let prototype = styleIndex >= 0 && styleIndex < prototypes.length ? prototypes[styleIndex] : new TextStyle()
        for (let unit = 0; unit < runLength; unit++) characterStyles.push(prototype.clone())
      }
    } else if (Array.isArray(data.styles)) {
      // Document formats 1 and 2 store one style object per character.
      data.styles.forEach(item => characterStyles.push(TextStyle.fromJSON(item)))
    }
    while (characterStyles.length < characterCount) characterStyles.push(new TextStyle())

    result.styles = []
    let character = 0
    for (let index = 0; index < result.text.length; index++) {
      let style = characterStyles[character] || new TextStyle()
      result.styles.push(style)
      if (CodePoints.widthAt(result.text, index) == 2) {
        result.styles.push(style.clone())
        index++
      }
      character++
    }

    if (Array.isArray(data.listLevels)) result.listLevels = data.listLevels.map(value => Math.max(0, Utilities.integer(value, 0)))
    if (Array.isArray(data.listChecked)) result.listChecked = data.listChecked.map(value => Utilities.boolean(value, false))

    if (Array.isArray(data.nodes) && nodeFactory) {
      data.nodes.forEach(item => {
        let node = nodeFactory(item)
        if (node) result.nodes.push(node)
      })
    }

    return result
  }

  toJSON(): object {
    let result = {}
    if (this.text.length > 0) result["text"] = this.text
    if (this.alertType != 0) result["alertType"] = this.alertType
    if (this.headingLevel != 0) result["headingLevel"] = this.headingLevel
    if (this.textAlignment != Alignments.automatic) result["textAlignment"] = this.textAlignment
    if (this.listType != 0) result["listType"] = this.listType
    if (this.verticalAlignment != 0) result["verticalAlignment"] = this.verticalAlignment
    if (this.hasCellBackgroundColor) result["hasCellBackgroundColor"] = true
    if (!Colors.isEmpty(this.cellBackgroundColor)) result["cellBackgroundColor"] = Colors.toJSON(this.cellBackgroundColor)
    let sides = ["Top", "Right", "Bottom", "Left"]
    sides.forEach(side => {
      let border: CellBorder = this[`cellBorder${side}`]
      if (border.visible) result[`cellBorder${side}Visible`] = true
      if (border.size != 1) result[`cellBorder${side}Size`] = border.size
      if (!Colors.isEmpty(border.color)) result[`cellBorder${side}Color`] = Colors.toJSON(border.color)
    })
    if (this.columnSpan > 1) result["columnSpan"] = this.columnSpan
    if (this.rowSpan > 1) result["rowSpan"] = this.rowSpan
    if (!this.backgroundImage.isEmpty) result["backgroundImage"] = this.backgroundImage.toJSON()

    // Distinct styles once, then [count, index] runs counted in code points.
    let table: Array<TextStyle> = []
    let tableKeys: Array<string> = []
    let runs: Array<number> = []
    let runKey: string | null = null
    let runLength = 0
    let runIndex = -1
    for (let index = 0; index < this.text.length; index++) {
      let style = this.styles[index] || TextStyle.defaults
      let width = CodePoints.widthAt(this.text, index)
      let key = style.key()
      if (runKey !== null && key == runKey) {
        runLength++
      } else {
        if (runKey !== null) runs.push(runLength, runIndex)
        runIndex = tableKeys.indexOf(key)
        if (runIndex < 0) {
          table.push(style)
          tableKeys.push(key)
          runIndex = table.length - 1
        }
        runKey = key
        runLength = 1
      }
      index += width - 1
    }
    if (runKey !== null) runs.push(runLength, runIndex)

    if (!(table.length == 0 || (table.length == 1 && table[0].isDefault()))) {
      result["styleTable"] = table.map(style => style.toCompactJSON())
      result["styleRuns"] = runs
    }

    if (this.listLevels.length > 0) result["listLevels"] = this.listLevels.slice()
    if (this.listChecked.indexOf(true) >= 0) result["listChecked"] = this.listChecked.slice()
    if (this.nodes.length > 0) result["nodes"] = this.nodes.map(node => node.toJSON())

    return result
  }

  /** Copies the text, styles and container state. Embedded nodes are not copied. */
  clone(): RichText {
    let result = new RichText()
    result.copyStateFrom(this)
    result.text = this.text
    result.styles = this.styles.map(style => style.clone())
    result.listLevels = this.listLevels.slice()
    result.listChecked = this.listChecked.slice()
    return result
  }

  /** Copies container state (alignment, cell appearance, spans) but not the text. */
  copyStateFrom(other: RichText) {
    this.alertType = other.alertType
    this.headingLevel = other.headingLevel
    this.textAlignment = other.textAlignment
    this.listType = other.listType
    this.verticalAlignment = other.verticalAlignment
    this.hasCellBackgroundColor = other.hasCellBackgroundColor
    this.cellBackgroundColor = Colors.clone(other.cellBackgroundColor)
    let sides = ["Top", "Right", "Bottom", "Left"]
    sides.forEach(side => {
      let border: CellBorder = other[`cellBorder${side}`]
      this[`cellBorder${side}`] = {visible: border.visible, size: border.size, color: Colors.clone(border.color)}
    })
    this.columnSpan = other.columnSpan
    this.rowSpan = other.rowSpan
    this.backgroundImage = other.backgroundImage.clone()
  }

  styleAt(index: number): TextStyle {
    if (this.styles.length == 0) return new TextStyle()
    index = Utilities.clamp(index, 0, this.styles.length - 1)
    return this.styles[index]
  }

  /** The style typing at the offset would receive: the previous character's, without link or tag. */
  insertionStyleAt(offset: number): TextStyle {
    if (this.text.length == 0) return new TextStyle()
    let style = this.styleAt(offset > 0 ? offset - 1 : 0).clone()
    // A paragraph break doesn't carry formatting into the next paragraph's start.
    return style
  }

  /** Returns the text and styles from start through end (exclusive). */
  slice(start: number, end: number = this.text.length): RichText {
    start = Utilities.clamp(start, 0, this.text.length)
    end = Utilities.clamp(end, start, this.text.length)
    let result = new RichText()
    result.text = this.text.substring(start, end)
    result.styles = this.styles.slice(start, end).map(style => style.clone())
    return result
  }

  insert(offset: number, value: string | RichText, style?: TextStyle) {
    offset = Utilities.clamp(offset, 0, this.text.length)
    if (value instanceof RichText) {
      this.text = this.text.substring(0, offset) + value.text + this.text.substring(offset)
      this.styles.splice(offset, 0, ...value.styles.map(item => item.clone()))
      return
    }
    if (value.length == 0) return
    let insertStyle = style || this.insertionStyleAt(offset)
    let added: Array<TextStyle> = []
    for (let index = 0; index < value.length; index++) added.push(insertStyle.clone())
    this.text = this.text.substring(0, offset) + value + this.text.substring(offset)
    this.styles.splice(offset, 0, ...added)
  }

  remove(start: number, end: number) {
    start = Utilities.clamp(start, 0, this.text.length)
    end = Utilities.clamp(end, start, this.text.length)
    if (end == start) return
    this.text = this.text.substring(0, start) + this.text.substring(end)
    this.styles.splice(start, end - start)
  }

  append(other: RichText) {
    this.insert(this.text.length, other)
  }

  /** Calls change for the style of each character from start through end (exclusive). */
  applyStyle(start: number, end: number, change: (style: TextStyle) => void) {
    start = Utilities.clamp(start, 0, this.text.length)
    end = Utilities.clamp(end, start, this.text.length)
    for (let index = start; index < end; index++) {
      if (this.text[index] == ParagraphBreak) continue
      change(this.styles[index])
    }
  }

  /** True when test returns true for every non-break character in the range. */
  everyStyle(start: number, end: number, test: (style: TextStyle) => boolean): boolean {
    let checked = 0
    for (let index = start; index < end; index++) {
      if (this.text[index] == ParagraphBreak || this.text[index] == LineBreak) continue
      checked++
      if (!test(this.styleAt(index))) return false
    }
    return checked > 0
  }

  /** Groups consecutive characters with equal styles. */
  runs(start: number = 0, end: number = this.text.length, matches?: (a: TextStyle, b: TextStyle) => boolean): Array<TextRun> {
    start = Utilities.clamp(start, 0, this.text.length)
    end = Utilities.clamp(end, start, this.text.length)
    let compare = matches || ((a: TextStyle, b: TextStyle) => a.equals(b))
    let result: Array<TextRun> = []
    let current: TextRun | null = null
    for (let index = start; index < end; index++) {
      let style = this.styleAt(index)
      if (current && compare(current.style, style)) {
        current.length++
      } else {
        current = {start: index, length: 1, text: "", style: style}
        result.push(current)
      }
    }
    result.forEach(run => run.text = this.text.substring(run.start, run.start + run.length))
    return result
  }

  /** Character offsets where each paragraph (list item, code line) starts and ends. */
  paragraphs(): Array<{start: number, end: number}> {
    let result: Array<{start: number, end: number}> = []
    let start = 0
    for (let index = 0; index < this.text.length; index++) {
      if (this.text[index] == ParagraphBreak) {
        result.push({start: start, end: index})
        start = index + 1
      }
    }
    result.push({start: start, end: this.text.length})
    return result
  }

  paragraphIndexAt(offset: number): number {
    let result = 0
    for (let index = 0; index < offset && index < this.text.length; index++) {
      if (this.text[index] == ParagraphBreak) result++
    }
    return result
  }

  /** Exported HTML for the range. Paragraph and line breaks become br elements. */
  htmlText(start: number = 0, end: number = this.text.length): string {
    let result = ""
    let pieces = this.runs(start, end)
    pieces.forEach(run => {
      let segments = run.text.split(/\r\n|[\n\r\u2028]/)
      segments.forEach((segment, index) => {
        if (index > 0) result += "<br>"
        result += RichText.htmlRun(segment, run.style)
      })
    })
    return result
  }

  /** How tags from one suggestion provider are exported, set by an add-on with registerTagExport. */
  static #tagExports: {[provider: string]: TagExport} = {}

  /**
   * Exports one provider's tags differently from the default span, such as footnote references
   * as links to their notes. Each function receives the tag's text, its suggestion identifier
   * and its style, and returns HTML or Markdown.
   */
  static registerTagExport(provider: string, exporter: TagExport | null) {
    if (exporter) RichText.#tagExports[provider] = exporter
    else delete RichText.#tagExports[provider]
  }

  static tagExport(provider: string): TagExport | null {
    return provider.length > 0 ? RichText.#tagExports[provider] || null : null
  }

  static htmlRun(value: string, style: TextStyle): string {
    if (value.length == 0) return ""
    let custom = RichText.tagExport(style.suggestionProviderIdentifier)
    if (custom && custom.html) return custom.html(value, style.suggestionIdentifier, style)
    let content = Utilities.escapeText(value)
    let suggestionAttributes = ""
    if (style.suggestionProviderIdentifier.length > 0) suggestionAttributes = ` data-scriviamo-suggestion-provider="${Utilities.escapeAttribute(style.suggestionProviderIdentifier)}" data-scriviamo-suggestion-id="${Utilities.escapeAttribute(style.suggestionIdentifier)}"`
    if (style.code) content = `<code>${content}</code>`
    if (style.keyboard) content = `<kbd>${content}</kbd>`
    if (style.superscript) content = `<sup>${content}</sup>`
    if (style.subscript) content = `<sub>${content}</sub>`
    if (style.highlight) content = `<mark>${content}</mark>`
    let css = style.htmlCSS()
    if (css.length > 0 || suggestionAttributes.length > 0) content = `<span${suggestionAttributes}${css.length > 0 ? ` style="${Utilities.escapeAttribute(css)}"` : ""}>${content}</span>`
    if (style.linkURL.length > 0) {
      let title = style.linkTitle.length > 0 ? ` title="${Utilities.escapeAttribute(style.linkTitle)}"` : ""
      let target = style.linkTarget.length > 0 ? ` target="${Utilities.escapeAttribute(style.linkTarget)}"` : ""
      content = `<a href="${Utilities.escapeAttribute(style.linkURL)}"${title}${target}>${content}</a>`
    }
    return RichText.changeHTML(content, style)
  }

  /** A tracked change as an <ins> or <del> element around content, which imports back as the change. */
  static changeHTML(content: string, style: TextStyle): string {
    if (style.change != "insert" && style.change != "delete") return content
    let tag = style.change == "insert" ? "ins" : "del"
    let time = style.changeTime.length > 0 ? ` datetime="${Utilities.escapeAttribute(style.changeTime)}"` : ""
    return `<${tag} data-scriviamo-change="${Utilities.escapeAttribute(style.changeID)}" data-scriviamo-author="${Utilities.escapeAttribute(style.changeAuthor)}"${time}>${content}</${tag}>`
  }

  /** Markdown for the range. */
  markdownText(start: number = 0, end: number = this.text.length, ignoreBold: boolean = false): string {
    let result = ""
    let markdownMatches = (a: TextStyle, b: TextStyle) => {
      return (ignoreBold || a.bold == b.bold) && a.italic == b.italic && a.underline == b.underline && a.strikethrough == b.strikethrough && a.sameInlineFormat(b) && a.linkURL == b.linkURL && a.linkTitle == b.linkTitle && a.linkTarget == b.linkTarget && a.suggestionProviderIdentifier == b.suggestionProviderIdentifier && a.suggestionIdentifier == b.suggestionIdentifier && a.change == b.change && a.changeID == b.changeID
    }
    this.runs(start, end, markdownMatches).forEach(run => {
      let style = run.style
      let raw = run.text
      let custom = RichText.tagExport(style.suggestionProviderIdentifier)
      if (custom && custom.markdown) {
        result += custom.markdown(raw, style.suggestionIdentifier, style)
        return
      }
      let content = RichText.markdownEscape(raw).replace(/\u2028/g, "  \n")
      if (style.code) content = RichText.markdownCodeSpan(raw)
      if (style.keyboard) content = `<kbd>${content}</kbd>`
      if (style.superscript) content = `<sup>${content}</sup>`
      if (style.subscript) content = `<sub>${content}</sub>`
      if (style.highlight) content = `<mark>${content}</mark>`
      if (style.underline) content = `<u>${content}</u>`
      if (style.strikethrough) content = `~~${content}~~`
      if (style.italic) content = `_${content}_`
      if (style.bold && !ignoreBold) content = `**${content}**`
      if (style.suggestionProviderIdentifier.length > 0) {
        let css = `color:${Colors.toCSS(style.suggestionTextColor)};background-color:${Colors.toCSS(style.suggestionBackgroundColor)};border:1px solid ${Colors.toCSS(style.suggestionBorderColor)}`
        content = `<span data-scriviamo-suggestion-provider="${Utilities.escapeAttribute(style.suggestionProviderIdentifier)}" data-scriviamo-suggestion-id="${Utilities.escapeAttribute(style.suggestionIdentifier)}" style="${Utilities.escapeAttribute(css)}">${content}</span>`
      }
      if (style.linkURL.length > 0) {
        if (style.linkTarget.length > 0) {
          let title = style.linkTitle.length > 0 ? ` title="${Utilities.escapeAttribute(style.linkTitle)}"` : ""
          content = `<a href="${Utilities.escapeAttribute(style.linkURL)}" target="${Utilities.escapeAttribute(style.linkTarget)}"${title}>${content}</a>`
        } else {
          let title = style.linkTitle.length > 0 ? ` "${style.linkTitle.replace(/"/g, '\\"')}"` : ""
          content = `[${content}](${style.linkURL.replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29")}${title})`
        }
      }
      result += RichText.changeHTML(content, style)
    })
    return result
  }

  static markdownEscape(value: string): string {
    return value.replace(/([\\`*_\[\]<>~|])/g, "\\$1").replace(/^(\s*)([#>+-])/gm, "$1\\$2").replace(/^(\s*\d+)\./gm, "$1\\.")
  }

  static markdownCodeSpan(value: string): string {
    let longest = 0
    let matches = value.match(/`+/g)
    if (matches) matches.forEach(item => longest = Math.max(longest, item.length))
    let fence = "`".repeat(longest + 1)
    let padding = value.startsWith("`") || value.endsWith("`") ? " " : ""
    return `${fence}${padding}${value}${padding}${fence}`
  }
}
