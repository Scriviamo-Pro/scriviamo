import {Alignments, BlockShortcut, Editor, HTMLImporter, InspectorDefaults, InspectorItem, InspectorSection, Node, RichText, Strings, Stylesheet, TextHost, TextHostModes, TextStyle, ThemeColors, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem, Utilities} from "../internal"

/** A paragraph of styled text. The base class of the other text blocks. */
export class TextNode extends Node {
  /** Adds this node type's rules to the HTML export stylesheet. Called once per type in the document. */
  static exportStyles(sheet: Stylesheet, _editor: Editor | null) {
    sheet.addRule("p", "white-space: pre-wrap; overflow-wrap: anywhere")
  }

  static identifier: string = "text"
  static caption: string = "Text"
  static captionString: string = "TextTextCaption"
  static icon: string = "bi bi-text-paragraph"
  static keywords: string = "paragraph body plain"

  static create(editor: Editor): Node {
    let result = new this()
    result.editor = editor
    return result
  }

  content: RichText = new RichText()
  fontName: string = ""
  fontSize: number = 0
  bold: boolean = false
  italic: boolean = false
  underline: boolean = false
  textAlignment: Alignments = Alignments.automatic

  constructor(text: string = "") {
    super()
    this.content = new RichText(text)
  }

  get isTextual(): boolean {
    return true
  }

  static blockKinds(strings: Strings, _compact: boolean): Array<[string, string, string]> {
    return [["text", strings.TextTextCaption, "bi bi-text-paragraph"]]
  }

  /** Makes a block of this type from another text block's plain content, when converting blocks. */
  static fromBlockContent(content: RichText, _value: number, source: TextNode): Array<Node> {
    let result = new this()
    result.content = content
    source.copyAppearanceTo(result)
    result.textAlignment = source.textAlignment
    return [result]
  }

  /**
   * True for ordinary text blocks, which can be converted to other block types, split
   * to insert content, and joined with neighboring text. False for blocks whose text
   * is a caption for other content, such as a collapsible section's summary.
   */
  get isTextBlock(): boolean {
    return true
  }

  /** True when Delete at the end joins the following text into this block, and this block into the one before. */
  get joinsForward(): boolean {
    return this.isTextBlock
  }

  /** True when Backspace at the start turns the block into a paragraph before joining it to the one before. */
  get becomesTextOnBackspace(): boolean {
    return this.constructor !== TextNode
  }

  /** True when the text keeps line feeds as paragraphs, such as list items or code, instead of turning them into line breaks. */
  get keepsParagraphs(): boolean {
    return false
  }

  /** Whether the inspector offers the block's text and its typography. */
  get inspectorShowsText(): boolean {
    return true
  }

  /**
   * Whether the text lines up within the block, so the inspector offers Text Alignment. False for
   * a block only as wide as its text, such as a button, which moves with Alignment instead.
   */
  get alignsText(): boolean {
    return true
  }

  get inspectorShowsTypography(): boolean {
    return true
  }

  /** Adjusts content that replaces this block's text from the inspector, which has paragraphs paragraphs. */
  prepareReplacementContent(_replacement: RichText, _paragraphs: number) {
  }

  /** Text from another block that is being joined onto the end of this one, adjusted to this block's kind. */
  joinedContent(addition: RichText): RichText {
    return addition
  }

  /** The content without this block type's own styling, for converting it into another type. */
  protected undrawnTexts(): Array<RichText> {
    return [this.content]
  }

  plainContent(): RichText {
    let content = this.content.clone()
    content.headingLevel = 0
    content.alertType = 0
    content.listType = 0
    content.listLevels = []
    content.listChecked = []
    return content
  }

  /**
   * Converts this block for setBlockType when the block handles the conversion itself,
   * or returns null to make a block of the requested type from its plain content.
   * Choosing a block's own type turns it back into a paragraph.
   */
  convertBlock(kind: string, _value: number): Array<Node> | null {
    if (kind == this.type && kind != "text") return TextNode.fromBlockContent(this.plainContent(), 0, this)
    return null
  }

  inspectorSections(): Array<InspectorSection> {
    return InspectorDefaults.text(this)
  }

  get text(): string {
    return this.content.text
  }

  set text(value: string) {
    this.content.text = value
    this.content.styles = []
    for (let index = 0; index < value.length; index++) this.content.styles.push(this.baseStyle())
    if (this.primaryHost) this.primaryHost.render()
  }

  /** The element that holds the editable text. */
  protected get tagName(): string {
    return "p"
  }

  protected get hostMode(): TextHostModes {
    return TextHostModes.inline
  }

  /** Placeholder shown while the text is empty. */
  protected get placeholderText(): string {
    return this.strings.TextDefaultTextCaption
  }

  /** The style new text receives when the paragraph is empty. */
  baseStyle(): TextStyle {
    return new TextStyle()
  }

  protected build(body: HTMLElement) {
    let element = document.createElement(this.tagName)
    body.append(element)
    let host = this.addHost(new TextHost(this, this.content, element, this.hostMode))
    host.placeholder = this.placeholderText
    this.applyTextAppearance(element)
    host.render()
  }

  protected applyTextAppearance(element: HTMLElement) {
    if (this.fontName.length > 0) element.style.fontFamily = Utilities.fontFamilyCSS(this.fontName)
    if (this.fontSize > 0) element.style.fontSize = `${this.fontSize}px`
    if (this.bold) element.style.fontWeight = "bold"
    if (this.italic) element.style.fontStyle = "italic"
    if (this.underline) element.style.textDecoration = "underline"
    element.style.textAlign = TextNode.cssAlignment(this.resolvedTextAlignment())
  }

  resolvedTextAlignment(): Alignments {
    if (this.textAlignment != Alignments.automatic) return this.textAlignment
    return this.editor ? this.editor.textAlignment : Alignments.leading
  }

  static cssAlignment(value: Alignments): string {
    switch (value) {
      case Alignments.middle: return "center"
      case Alignments.trailing: return "end"
    }
    return "start"
  }

  /** Creates the node that Enter splits off the end of this one. Paragraphs follow most blocks. */
  createFollowingNode(): TextNode {
    return new TextNode()
  }

  toJSON(): object {
    let result = super.toJSON()
    if (this.bold) result["bold"] = true
    if (this.fontName.length > 0) result["fontName"] = this.fontName
    if (this.fontSize != 0) result["fontSize"] = this.fontSize
    if (this.italic) result["italic"] = true
    if (this.textAlignment != Alignments.automatic) result["textAlignment"] = this.textAlignment
    if (this.underline) result["underline"] = true
    result["content"] = this.content.toJSON()
    return result
  }

  fromJSON(data: any): boolean {
    if (!super.fromJSON(data)) return false
    this.bold = Utilities.boolean(data.bold, false)
    this.fontName = Utilities.string(data.fontName)
    this.fontSize = Utilities.number(data.fontSize, 0)
    this.italic = Utilities.boolean(data.italic, false)
    this.underline = Utilities.boolean(data.underline, false)
    let alignment = Utilities.integer(data.textAlignment, 0)
    this.textAlignment = alignment >= 0 && alignment <= 3 ? alignment : Alignments.automatic
    this.content = RichText.fromJSON(data.content, item => this.editor ? this.editor.nodeFromJSON(item) : null)
    return true
  }

  protected htmlTextAlignmentCSS(): string {
    return `text-align:${TextNode.cssAlignment(this.resolvedTextAlignment())};`
  }

  toHTML(): string {
    return `<p style="${this.htmlBackgroundCSS()}${this.htmlTextAlignmentCSS()}${this.htmlLineHeightCSS()}">${this.content.htmlText()}</p>`
  }

  toMarkdown(): string {
    return this.markdownWithBackground(this.content.markdownText())
  }
}

export enum HeadingLevels {
  heading1 = 1,
  heading2 = 2,
  heading3 = 3,
  heading4 = 4,
  heading5 = 5,
  heading6 = 6
}

export class HeadingNode extends TextNode {
  static exportStyles(sheet: Stylesheet, editor: Editor | null) {
    super.exportStyles(sheet, editor)
    sheet.addRule("h1, h2, h3, h4, h5, h6", `display: block; width: 100%; max-width: 100%; padding: 16px; color: ${Editor.themeCSS(editor, ThemeColors.text)}; font-weight: 700; overflow-wrap: anywhere; line-height: 1.25`)
  }

  static identifier: string = "heading"
  static caption: string = "Heading"
  static captionString: string = "TextHeadingCaption"
  static icon: string = "bi bi-type-h1"
  static keywords: string = "title h1 h2 h3 h4 h5 h6 section"

  static create(editor: Editor): Node {
    let result = new HeadingNode("", HeadingLevels.heading2)
    result.editor = editor
    return result
  }

  constructor(text: string = "", level: HeadingLevels = HeadingLevels.heading2) {
    super(text)
    this.content.headingLevel = 0
    this.level = level
  }

  static markdownShortcuts: Array<BlockShortcut> = [{pattern: /^(#{1,6}) /, value: match => match[1].length}]

  static blockKinds(strings: Strings, compact: boolean): Array<[string, string, string]> {
    let levels = compact ? [1, 2, 3] : [1, 2, 3, 4, 5, 6]
    return levels.map(level => [`heading:${level}`, Utilities.format(strings.TextHeadingLevelCaption, {level: level}), `bi bi-type-h${level}`] as [string, string, string])
  }

  static fromBlockContent(content: RichText, value: number, source: TextNode): Array<Node> {
    let heading = new HeadingNode("", HeadingLevels.heading2)
    heading.content = content
    heading.content.headingLevel = 0
    heading.level = value || 2
    source.copyAppearanceTo(heading)
    heading.textAlignment = source.textAlignment
    return [heading]
  }

  static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined {
    if (!/^H[1-6]$/.test(element.tagName)) return undefined
    let level = Number(element.tagName.substring(1))
    let heading = new HeadingNode("", level)
    heading.content = importer.trimmed(importer.richText(Array.from(element.childNodes)))
    heading.content.headingLevel = 0
    heading.level = level
    heading.content.styles.forEach(style => {
      style.bold = true
      style.fontSize = HeadingNode.fontSizeForLevel(heading.level)
    })
    importer.readAlignment(element, heading)
    return importer.attach(heading)
  }

  get blockKind(): string {
    return `heading:${this.level}`
  }

  convertBlock(kind: string, value: number): Array<Node> | null {
    if (kind != "heading" || this.level == value) return super.convertBlock(kind, value)
    this.level = value
    return [this]
  }

  plainContent(): RichText {
    let content = super.plainContent()
    let size = HeadingNode.fontSizeForLevel(this.level)
    content.styles.forEach(style => {
      if (style.fontSize == size) style.fontSize = 0
      style.bold = false
    })
    return content
  }

  joinedContent(addition: RichText): RichText {
    addition.styles.forEach(style => {
      style.bold = true
      style.fontSize = HeadingNode.fontSizeForLevel(this.level)
    })
    return addition
  }

  inspectorSections(): Array<InspectorSection> {
    let strings = this.strings
    let level = InspectorItem.menu("level", strings.TextLevelCaption, [1, 2, 3, 4, 5, 6].map(value => [Utilities.format(strings.TextHeadingLevelCaption, {level: value}), value] as [string, any]), target => target.level, (target, value) => target.level = value)
    level.setDefaultValue(HeadingLevels.heading2)
    return [InspectorDefaults.section("heading", strings.TextHeadingCaption, [level])].concat(InspectorDefaults.text(this))
  }

  static fontSizeForLevel(level: number): number {
    return [32, 32, 28, 24, 20, 18, 16][Utilities.clamp(level, 1, 6)]
  }

  get level(): HeadingLevels {
    return Utilities.clamp(this.content.headingLevel || 2, 1, 6)
  }

  set level(value: HeadingLevels) {
    value = Utilities.clamp(Math.trunc(value), 1, 6)
    if (this.content.headingLevel == value) return
    this.content.headingLevel = value
    this.fontSize = HeadingNode.fontSizeForLevel(value)
    this.bold = true
    this.content.styles.forEach(style => {
      style.fontSize = this.fontSize
      style.bold = true
    })
  }

  /** The fragment identifier a table of contents links to. */
  get anchor(): string {
    if (!this.editor) return Utilities.slug(this.text)
    return this.editor.anchorFor(this)
  }

  baseStyle(): TextStyle {
    let result = new TextStyle()
    result.bold = true
    result.fontSize = HeadingNode.fontSizeForLevel(this.level)
    return result
  }

  protected get tagName(): string {
    return `h${this.level}`
  }

  protected get placeholderText(): string {
    return Utilities.format(this.strings.TextHeadingLevelCaption, {level: this.level})
  }

  textChanged(_host: TextHost) {
    // Text typed into an empty heading gets the heading's size and weight.
    let size = HeadingNode.fontSizeForLevel(this.level)
    this.content.styles.forEach(style => {
      if (style.fontSize == 0) {
        style.fontSize = size
        style.bold = true
      }
    })
  }

  fromJSON(data: any): boolean {
    if (!super.fromJSON(data)) return false
    let level = this.content.headingLevel
    this.content.headingLevel = level >= 1 && level <= 6 ? level : 2
    if (this.fontSize == 0) this.fontSize = HeadingNode.fontSizeForLevel(this.content.headingLevel)
    this.bold = true
    return true
  }

  actions(): Array<ToolbarItem> {
    let item = new ToolbarItem("headinglevel", `H${this.level}`, "", ToolbarItemKinds.menu, this.strings.TextHeadingCaption)
    item.alwaysShowCaption = true
    for (let level = 1; level <= 6; level++) {
      let menuItem = new ToolbarMenuItem(String(level), Utilities.format(this.strings.TextHeadingLevelCaption, {level: level}), `bi bi-type-h${level}`)
      menuItem.checked = level == this.level
      item.menuItems.push(menuItem)
    }
    return [item]
  }

  performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean {
    if (item.identifier == "headinglevel" && menuItem) {
      this.willChange()
      this.level = Number(menuItem.identifier)
      this.refresh()
      this.changed()
      return true
    }
    return false
  }

  toHTML(): string {
    let tag = `h${this.level}`
    let anchor = this.anchor
    let id = anchor.length > 0 ? ` id="${Utilities.escapeAttribute(anchor)}"` : ""
    return `<${tag}${id} style="${this.htmlBackgroundCSS()}${this.htmlTextAlignmentCSS()}${this.htmlLineHeightCSS()}">${this.content.htmlText()}</${tag}>`
  }

  toMarkdown(): string {
    // Bold is the heading's baseline, not an inline style.
    return this.markdownWithBackground(`${"#".repeat(this.level)} ${this.content.markdownText(0, this.content.length, true)}`)
  }
}
