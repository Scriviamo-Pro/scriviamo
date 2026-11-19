import {Colors, DocumentColor, Utilities} from "./internal"

/**
 * The font names and sizes the toolbar offers, whether a custom size may be typed,
 * and which character formats are available. The editor has one; a node may set
 * its own, which replaces those choices while that node is being formatted.
 */
export class FontOptions {
  #fontNames: Array<string> = []
  #sizes: Array<number> = []
  allowBold: boolean = true
  allowItalic: boolean = true
  allowUnderline: boolean = true
  allowStrikethrough: boolean = true
  allowCode: boolean = true
  allowHighlight: boolean = true
  allowKeyboard: boolean = true
  allowSuperscript: boolean = true
  allowSubscript: boolean = true
  /** Adds Custom… to the size menu, for typing any size from 1 to 1000. */
  allowCustomFontSize: boolean = true

  static readonly defaultFontNames: Array<string> = ["System", "Arial", "Georgia", "Helvetica", "Times New Roman", "Trebuchet MS", "Verdana", "Courier New"]
  static readonly defaultSizes: Array<number> = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48]

  constructor(includeSystemFonts: boolean = true, includeDefaultSizes: boolean = true) {
    if (includeSystemFonts) this.#fontNames = FontOptions.defaultFontNames.slice()
    if (includeDefaultSizes) this.#sizes = FontOptions.defaultSizes.slice()
  }

  fontNames(): Array<string> { return this.#fontNames.slice() }
  sizes(): Array<number> { return this.#sizes.slice() }
  fontNameAt(index: number): string { return this.#fontNames[index] || "" }
  sizeAt(index: number): number { return this.#sizes[index] || 0 }
  get lastFontNameIndex(): number { return this.#fontNames.length - 1 }
  get lastSizeIndex(): number { return this.#sizes.length - 1 }
  indexOfFontName(value: string): number { return this.#fontNames.findIndex(name => name.toLowerCase() == String(value).toLowerCase()) }
  indexOfSize(value: number): number { return this.#sizes.findIndex(size => Math.abs(size - value) < 0.001) }

  addFontName(value: string) {
    value = String(value || "").trim()
    if (value.length > 0 && this.indexOfFontName(value) < 0) this.#fontNames.push(value)
  }

  addFontNameAt(index: number, value: string) {
    value = String(value || "").trim()
    if (value.length == 0 || this.indexOfFontName(value) >= 0) return
    this.#fontNames.splice(Utilities.clamp(index, 0, this.#fontNames.length), 0, value)
  }

  addSize(value: number) {
    if (value > 0 && this.indexOfSize(value) < 0) this.#sizes.push(value)
  }

  addSizeAt(index: number, value: number) {
    if (!(value > 0) || this.indexOfSize(value) >= 0) return
    this.#sizes.splice(Utilities.clamp(index, 0, this.#sizes.length), 0, value)
  }

  removeFontName(value: string) { this.removeFontNameAt(this.indexOfFontName(value)) }
  removeFontNameAt(index: number) { if (index >= 0 && index < this.#fontNames.length) this.#fontNames.splice(index, 1) }
  removeAllFontNames() { this.#fontNames = [] }
  removeSize(value: number) { this.removeSizeAt(this.indexOfSize(value)) }
  removeSizeAt(index: number) { if (index >= 0 && index < this.#sizes.length) this.#sizes.splice(index, 1) }
  removeAllSizes() { this.#sizes = [] }

  /** Replaces the font names. */
  setFontNames(values: Array<string>) {
    this.#fontNames = []
    values.forEach(value => this.addFontName(value))
  }

  /** Replaces the sizes. Zero, which stands for Default, is ignored. */
  setSizes(values: Array<number>) {
    this.#sizes = []
    values.forEach(value => this.addSize(Number(value)))
  }

  /** Whether a character format is available, by its property name such as "bold". */
  allows(name: string): boolean {
    let key = `allow${name.charAt(0).toUpperCase()}${name.substring(1)}`
    return this[key] !== false
  }
}

/**
 * Character formatting. Each character of a RichText has its own TextStyle,
 * Field names match the JSON names.
 */
export class TextStyle {
  backgroundColor: DocumentColor = Colors.empty
  bold: boolean = false
  code: boolean = false
  fontName: string = ""
  fontSize: number = 0
  hasBackgroundColor: boolean = false
  hasLinkColor: boolean = false
  highlight: boolean = false
  italic: boolean = false
  keyboard: boolean = false
  linkColor: DocumentColor = Colors.make(0x00, 0x66, 0xCC)
  linkTarget: string = ""
  linkTitle: string = ""
  linkURL: string = ""
  strikethrough: boolean = false
  subscript: boolean = false
  superscript: boolean = false
  suggestionBackgroundColor: DocumentColor = Colors.make(0xDB, 0xEA, 0xFE)
  suggestionBorderColor: DocumentColor = Colors.make(0x93, 0xC5, 0xFD)
  suggestionIdentifier: string = ""
  suggestionProviderIdentifier: string = ""
  suggestionTextColor: DocumentColor = Colors.make(0x1E, 0x40, 0xAF)
  textColor: DocumentColor = Colors.empty
  underline: boolean = false
  /**
   * A tracked change: "insert" for text suggested as added, "delete" for text suggested as removed,
   * or "" for neither. The track changes add-on makes and resolves them; any editor shows them.
   */
  change: string = ""
  /** The tracked change's identifier, shared by the text one edit added or removed. */
  changeID: string = ""
  /** Who suggested the change. */
  changeAuthor: string = ""
  /** When the change was suggested, as an ISO date and time. */
  changeTime: string = ""

  static readonly #booleanNames: Array<string> = ["bold", "code", "hasBackgroundColor", "hasLinkColor", "highlight", "italic", "keyboard", "strikethrough", "subscript", "superscript", "underline"]
  static readonly #stringNames: Array<string> = ["change", "changeAuthor", "changeID", "changeTime", "fontName", "linkTarget", "linkTitle", "linkURL", "suggestionIdentifier", "suggestionProviderIdentifier"]
  static readonly #colorNames: Array<string> = ["backgroundColor", "linkColor", "suggestionBackgroundColor", "suggestionBorderColor", "suggestionTextColor", "textColor"]

  static #defaults: TextStyle | null = null
  static get defaults(): TextStyle {
    if (!TextStyle.#defaults) TextStyle.#defaults = new TextStyle()
    return TextStyle.#defaults
  }

  static fromJSON(data: any): TextStyle {
    let result = new TextStyle()
    result.applyJSON(data)
    return result
  }

  /** Applies the names present in data, keeping current values for missing names. */
  applyJSON(data: any) {
    if (!data || typeof data != "object") return
    TextStyle.#booleanNames.forEach(name => { if (name in data) this[name] = Utilities.boolean(data[name], this[name]) })
    TextStyle.#stringNames.forEach(name => { if (name in data) this[name] = Utilities.string(data[name], this[name]) })
    TextStyle.#colorNames.forEach(name => { if (name in data) this[name] = Colors.fromJSON(data[name], this[name]) })
    if ("fontSize" in data) this.fontSize = Utilities.number(data.fontSize, this.fontSize)
  }

  clone(): TextStyle {
    let result = new TextStyle()
    TextStyle.#booleanNames.forEach(name => result[name] = this[name])
    TextStyle.#stringNames.forEach(name => result[name] = this[name])
    TextStyle.#colorNames.forEach(name => result[name] = Colors.clone(this[name]))
    result.fontSize = this.fontSize
    return result
  }

  equals(other: TextStyle): boolean {
    if (!other) return false
    if (other === this) return true
    for (let name of TextStyle.#booleanNames) if (this[name] !== other[name]) return false
    for (let name of TextStyle.#stringNames) if (this[name] !== other[name]) return false
    for (let name of TextStyle.#colorNames) if (!Colors.equals(this[name], other[name])) return false
    return this.fontSize === other.fontSize
  }

  isDefault(): boolean {
    return this.equals(TextStyle.defaults)
  }

  /** Every attribute. */
  toJSON(): object {
    let result = {}
    TextStyle.#colorNames.forEach(name => result[name] = Colors.toJSON(this[name]))
    TextStyle.#booleanNames.forEach(name => result[name] = this[name])
    TextStyle.#stringNames.forEach(name => result[name] = this[name])
    result["fontSize"] = this.fontSize
    return result
  }

  /** Only the attributes that differ from a new TextStyle, as written into a style table. */
  toCompactJSON(): object {
    let defaults = TextStyle.defaults
    let result = {}
    TextStyle.#colorNames.forEach(name => { if (!Colors.equals(this[name], defaults[name])) result[name] = Colors.toJSON(this[name]) })
    TextStyle.#booleanNames.forEach(name => { if (this[name] !== defaults[name]) result[name] = this[name] })
    TextStyle.#stringNames.forEach(name => { if (this[name] !== defaults[name]) result[name] = this[name] })
    if (this.fontSize !== defaults.fontSize) result["fontSize"] = this.fontSize
    return result
  }

  /** Stable key used to group runs and build style tables. */
  key(): string {
    return JSON.stringify(this.toCompactJSON())
  }

  /** True when the inline formats that change the element (code, kbd, sup, sub, mark) match. */
  sameInlineFormat(other: TextStyle): boolean {
    return this.code == other.code && this.keyboard == other.keyboard && this.superscript == other.superscript && this.subscript == other.subscript && this.highlight == other.highlight
  }

  /** CSS used while editing. Default colors are left out so the theme applies. */
  editorCSS(): string {
    let declarations: Array<string> = []
    if (this.fontName.length > 0) declarations.push(`font-family:${Utilities.fontFamilyCSS(this.fontName)}`)
    if (this.fontSize > 0) declarations.push(`font-size:${this.fontSize}px`)
    if (this.bold) declarations.push("font-weight:bold")
    if (this.italic) declarations.push("font-style:italic")
    if (this.linkURL.length > 0 && this.hasLinkColor) {
      declarations.push(`color:${Colors.toCSS(this.linkColor)}`)
    } else if (!Colors.isEmpty(this.textColor)) {
      declarations.push(`color:${Colors.toCSS(this.textColor)}`)
    }
    if (this.hasBackgroundColor) declarations.push(`background-color:${Colors.toCSS(this.backgroundColor)}`)
    if (this.suggestionProviderIdentifier.length > 0) {
      declarations.push(`color:${Colors.toCSS(this.suggestionTextColor)}`)
      declarations.push(`background-color:${Colors.toCSS(this.suggestionBackgroundColor)}`)
      declarations.push(`border:1px solid ${Colors.toCSS(this.suggestionBorderColor)}`)
      declarations.push("border-radius:4px")
      declarations.push("padding:1px 3px")
    }
    let decorations: Array<string> = []
    if (this.underline || this.change == "insert") decorations.push("underline")
    if (this.strikethrough || this.change == "delete") decorations.push("line-through")
    if (decorations.length > 0) declarations.push(`text-decoration:${decorations.join(" ")}`)
    declarations.push(...this.changeCSS())
    return declarations.join(";")
  }

  /** How a tracked change looks: added text green and underlined, removed text red and struck through. */
  changeCSS(): Array<string> {
    if (this.change == "insert") return ["text-decoration-color:#1fa774", "background-color:rgba(31,167,116,0.14)"]
    if (this.change == "delete") return ["text-decoration-color:#e03131", "color:#c92a2a", "background-color:rgba(224,49,49,0.10)"]
    return []
  }

  /** CSS written into exported HTML. */
  htmlCSS(): string {
    let declarations: Array<string> = []
    if (this.fontName.toLowerCase() == "system") {
      declarations.push("font-family:sans-serif")
    } else if (this.fontName.length > 0) {
      declarations.push(`font-family:${Utilities.fontFamilyCSS(this.fontName).replace(/"/g, "'")}`)
    }
    if (this.fontSize > 0) declarations.push(`font-size:${this.fontSize}px`)
    if (this.bold) declarations.push("font-weight:bold")
    if (this.italic) declarations.push("font-style:italic")
    let effectiveColor = this.linkURL.length > 0 && this.hasLinkColor ? this.linkColor : this.textColor
    if (!Colors.isEmpty(effectiveColor)) declarations.push(`color:${Colors.toCSS(effectiveColor)}`)
    if (this.hasBackgroundColor) declarations.push(`background-color:${Colors.toCSS(this.backgroundColor)}`)
    if (this.suggestionProviderIdentifier.length > 0) {
      declarations.push(`color:${Colors.toCSS(this.suggestionTextColor)}`)
      declarations.push(`background-color:${Colors.toCSS(this.suggestionBackgroundColor)}`)
      declarations.push(`border:1px solid ${Colors.toCSS(this.suggestionBorderColor)}`)
      declarations.push("border-radius:4px")
      declarations.push("padding:1px 3px")
    }
    let decorations: Array<string> = []
    if (this.underline) decorations.push("underline")
    if (this.strikethrough) decorations.push("line-through")
    if (decorations.length > 0) declarations.push(`text-decoration:${decorations.join(" ")}`)
    return declarations.join(";")
  }
}
