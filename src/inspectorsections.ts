import {Alignments, BackgroundFills, BackgroundImage, BackgroundRepeats, Colors, DefaultFontSize, Directions, DocumentColor, Editor, HeadingNode, LineBreak, Node, ParagraphBreak, RichText, Strings, TableNode, TextNode, TextStyle, Utilities} from "./internal"

export enum InspectorEditors {
  automatic = 0,
  text = 1,
  multilineText = 2,
  number = 3,
  toggle = 4,
  menu = 5,
  color = 6,
  image = 7,
  file = 8,
  action = 9
}

export interface InspectorChoice {
  caption: string
  value: any
}

/**
 * One row of the inspector: a caption and an editor for one value of the
 * inspected object. The value is read and written with getter and setter,
 * or, when they aren't set, with the property named by propertyName.
 */
export class InspectorItem {
  identifier: string
  caption: string
  propertyName: string
  editor: InspectorEditors
  description: string = ""
  enabled: boolean = true
  readOnly: boolean = false
  minimumValue: number = -2147483648
  maximumValue: number = 2147483647
  stepValue: number = 1
  /** False applies text only when the edit is committed (Return, Tab or leaving the field). */
  updatesLive: boolean = true
  /** The button caption of an action item. */
  actionCaption: string = "Run"
  /** The accept attribute of a file item's chooser, such as "image/*". */
  fileFilter: string = ""
  /** A number item whose value is zero shows this instead, such as "Automatic". */
  zeroCaption: string = ""

  getter: ((target: any) => any) | null = null
  setter: ((target: any, value: any) => void) | null = null
  /** Returns false for targets the item doesn't apply to. */
  availability: ((target: any) => boolean) | null = null
  /** Runs an action item. Without it, the target's inspectorAction handles the item. */
  action: ((target: any) => void) | null = null

  #choices: Array<InspectorChoice> = []
  #defaultValue: any = undefined
  #hasDefaultValue: boolean = false
  #defaultFor: ((target: any) => any) | null = null

  constructor(identifier: string, caption: string, propertyName: string = "", editor: InspectorEditors = InspectorEditors.automatic) {
    this.identifier = identifier
    this.caption = caption
    this.propertyName = propertyName
    this.editor = editor
  }

  /** Makes an item read and written by functions. */
  static bound(identifier: string, caption: string, editor: InspectorEditors, getter: (target: any) => any, setter: ((target: any, value: any) => void) | null): InspectorItem {
    let result = new InspectorItem(identifier, caption, "", editor)
    result.getter = getter
    result.setter = setter
    if (!setter && editor != InspectorEditors.action) result.readOnly = true
    return result
  }

  static menu(identifier: string, caption: string, choices: Array<[string, any]>, getter: (target: any) => any, setter: (target: any, value: any) => void): InspectorItem {
    let result = InspectorItem.bound(identifier, caption, InspectorEditors.menu, getter, setter)
    choices.forEach(([choiceCaption, value]) => result.addChoice(choiceCaption, value))
    return result
  }

  static number(identifier: string, caption: string, getter: (target: any) => any, setter: (target: any, value: any) => void, minimum: number = -2147483648, maximum: number = 2147483647, step: number = 1): InspectorItem {
    let result = InspectorItem.bound(identifier, caption, InspectorEditors.number, getter, setter)
    result.minimumValue = minimum
    result.maximumValue = maximum
    result.stepValue = step
    return result
  }

  static actionItem(identifier: string, caption: string, actionCaption: string, run: (target: any) => void): InspectorItem {
    let result = new InspectorItem(identifier, caption, "", InspectorEditors.action)
    result.actionCaption = actionCaption
    result.action = run
    return result
  }

  addChoice(caption: string, value: any) {
    this.#choices.push({caption: caption, value: value})
    if (this.editor == InspectorEditors.automatic) this.editor = InspectorEditors.menu
  }

  choices(): Array<InspectorChoice> {
    return this.#choices.slice()
  }

  get lastChoiceIndex(): number {
    return this.#choices.length - 1
  }

  choiceCaptionAt(index: number): string {
    return this.#choices[index] ? this.#choices[index].caption : ""
  }

  choiceValueAt(index: number): any {
    return this.#choices[index] ? this.#choices[index].value : undefined
  }

  /** Sets the value Reset to Default assigns. A function receives the target. */
  setDefaultValue(value: any) {
    if (typeof value == "function") {
      this.#defaultFor = value
    } else {
      this.#defaultValue = value
    }
    this.#hasDefaultValue = true
  }

  get hasDefaultValue(): boolean {
    return this.#hasDefaultValue
  }

  /** The value a reset assigns for target, or undefined when there is none. */
  defaultValueFor(target: any): any {
    if (this.#defaultFor) return this.#defaultFor(target)
    if (this.#hasDefaultValue) return this.#defaultValue
    // Otherwise the value on a new object of the target's class.
    let pristine = InspectorItem.pristine(target)
    if (!pristine) return undefined
    try {
      return this.value(pristine)
    } catch {
      return undefined
    }
  }

  static #pristine: Map<any, any> = new Map()

  static pristine(target: any): any {
    // Only nodes are created; other targets must give their items defaults.
    if (!(target instanceof Node)) return null
    let type: any = target.constructor
    if (!InspectorItem.#pristine.has(type)) {
      let instance = null
      try {
        instance = new type()
      } catch {
        instance = null
      }
      InspectorItem.#pristine.set(type, instance)
    }
    return InspectorItem.#pristine.get(type)
  }

  isAvailable(target: any): boolean {
    if (this.availability) return this.availability(target)
    if (this.getter || this.action || this.editor == InspectorEditors.action || this.editor == InspectorEditors.file) return true
    return this.propertyName.length > 0 && target && this.propertyName in target
  }

  value(target: any): any {
    if (this.getter) return this.getter(target)
    return this.propertyName.length > 0 && target ? target[this.propertyName] : undefined
  }

  /** Assigns value to target. Returns false when the item can't be written. */
  setValue(target: any, value: any): boolean {
    if (this.readOnly) return false
    if (this.setter) {
      this.setter(target, value)
      return true
    }
    if (this.propertyName.length == 0 || !target) return false
    target[this.propertyName] = value
    return true
  }

  /** Whether two values are the same, comparing colors and objects by content. */
  static same(a: any, b: any): boolean {
    if (a === b) return true
    if (a === null || b === null || a === undefined || b === undefined) return false
    if (typeof a == "object" || typeof b == "object") return JSON.stringify(a) == JSON.stringify(b)
    return false
  }
}

/** An ordered, collapsible group of related inspector items. */
export class InspectorSection {
  identifier: string
  caption: string
  #items: Array<InspectorItem> = []

  constructor(identifier: string, caption: string) {
    this.identifier = identifier
    this.caption = caption
  }

  add(item: InspectorItem): InspectorItem {
    this.#items.push(item)
    return item
  }

  addAt(index: number, item: InspectorItem) {
    this.#items.splice(Utilities.clamp(index, 0, this.#items.length), 0, item)
  }

  indexOf(item: InspectorItem | string): number {
    if (typeof item == "string") return this.#items.findIndex(candidate => candidate.identifier == item)
    return this.#items.indexOf(item)
  }

  item(identifier: string): InspectorItem | null {
    return this.#items.find(candidate => candidate.identifier == identifier) || null
  }

  itemAt(index: number): InspectorItem | null {
    return this.#items[index] || null
  }

  items(): Array<InspectorItem> {
    return this.#items.slice()
  }

  get lastIndex(): number {
    return this.#items.length - 1
  }

  removeAt(index: number) {
    this.#items.splice(index, 1)
  }

  remove(item: InspectorItem | string) {
    let index = this.indexOf(item)
    if (index >= 0) this.removeAt(index)
  }

  removeAll() {
    this.#items = []
  }
}

/** The inspector sections of the built-in nodes and of the document. */
export class InspectorDefaults {
  static alignmentChoices(strings: Strings, automatic: boolean): Array<[string, any]> {
    let result: Array<[string, any]> = []
    if (automatic) result.push([strings.TextAutomatic, Alignments.automatic])
    result.push([strings.TextStartAlignmentCaption, Alignments.leading], [strings.TextCenterAlignmentCaption, Alignments.middle], [strings.TextEndAlignmentCaption, Alignments.trailing])
    return result
  }

  static #directionChoices(strings: Strings): Array<[string, any]> {
    return [[strings.TextAutomatic, Directions.automatic], [strings.TextLeftToRightDirectionCaption, Directions.leftToRight], [strings.TextRightToLeftDirectionCaption, Directions.rightToLeft]]
  }

  static #fontChoices(editor: Editor | null, strings: Strings, current: string, defaultValue: any): Array<[string, any]> {
    let names = editor ? editor.fontNames.slice() : ["System"]
    if (current.length > 0 && names.indexOf(current) < 0) names.push(current)
    return [[strings.TextDefault, defaultValue] as [string, any]].concat(names.filter(name => name !== defaultValue).map(name => [name, name] as [string, any]))
  }

  static #sizeChoices(editor: Editor | null, strings: Strings, current: number, defaultValue: number): Array<[string, any]> {
    let sizes = (editor ? editor.fontSizes : [0, 12, 14, 16, 18, 24]).filter(size => size > 0)
    if (current > 0 && sizes.indexOf(current) < 0) sizes.push(current)
    sizes.sort((a, b) => a - b)
    return [[strings.TextDefault, defaultValue] as [string, any]].concat(sizes.filter(size => size !== defaultValue).map(size => [String(size), size] as [string, any]))
  }

  /** The Background Image section for an object with a backgroundImage property. */
  static backgroundImageSection(strings: Strings, read: (target: any) => BackgroundImage, write: (target: any, value: BackgroundImage) => void, identifier: string = "backgroundimage"): InspectorSection {
    let section = new InspectorSection(identifier, strings.TextBackgroundImageCaption)
    let update = (target: any, change: (image: BackgroundImage) => void) => {
      let image = read(target).clone()
      change(image)
      write(target, image)
    }
    let file = InspectorItem.bound(`${identifier}:file`, strings.TextLocalFileCaption, InspectorEditors.file, target => read(target).source.startsWith("data:") ? read(target).source : "", (target, value) => update(target, image => image.source = String(value || "")))
    file.fileFilter = "image/*"
    section.add(file)
    let url = InspectorItem.bound(`${identifier}:url`, strings.TextURLCaption, InspectorEditors.text, target => read(target).source.startsWith("data:") ? "" : read(target).source, (target, value) => update(target, image => image.source = String(value || "").trim()))
    url.updatesLive = false
    url.setDefaultValue("")
    section.add(url)
    section.add(InspectorItem.menu(`${identifier}:fill`, strings.TextFillCaption, [[strings.TextActualSizeCaption, BackgroundFills.actualSize], [strings.TextStretchCaption, BackgroundFills.stretch], [strings.TextFitCaption, BackgroundFills.fit], [strings.TextFillCaption, BackgroundFills.fill]], target => read(target).fill, (target, value) => update(target, image => image.fill = value)))
    section.items()[2].setDefaultValue(BackgroundFills.fill)
    section.add(InspectorItem.menu(`${identifier}:repeat`, strings.TextRepeatCaption, [[strings.TextNoRepeatCaption, BackgroundRepeats.noRepeat], [strings.TextRepeatHorizontallyCaption, BackgroundRepeats.repeatX], [strings.TextRepeatVerticallyCaption, BackgroundRepeats.repeatY], [strings.TextRepeatBothCaption, BackgroundRepeats.repeat]], target => read(target).repeat, (target, value) => update(target, image => image.repeat = value)))
    section.items()[3].setDefaultValue(BackgroundRepeats.noRepeat)
    let remove = InspectorItem.actionItem(`${identifier}:remove`, strings.TextImageCaption, strings.TextRemoveImageCaption, target => update(target, image => image.clear()))
    remove.availability = target => !read(target).isEmpty
    section.add(remove)
    return section
  }

  static borderItems(section: InspectorSection, strings: Strings, prefix: string, read: (target: any, side: string) => {visible: boolean, size: number, color: DocumentColor}, write: (target: any, side: string, change: (border: {visible: boolean, size: number, color: DocumentColor}) => void) => void) {
    ;["Top", "Right", "Bottom", "Left"].forEach(side => {
      let visible = InspectorItem.bound(`${prefix}${side.toLowerCase()}visible`, strings[`Text${side}VisibleCaption`], InspectorEditors.toggle, target => read(target, side).visible, (target, value) => write(target, side, border => border.visible = value === true))
      visible.setDefaultValue(false)
      section.add(visible)
      let size = InspectorItem.number(`${prefix}${side.toLowerCase()}size`, strings[`Text${side}SizeCaption`], target => read(target, side).size, (target, value) => write(target, side, border => border.size = value), 0, 100, 0.5)
      size.setDefaultValue(1)
      section.add(size)
      let color = InspectorItem.bound(`${prefix}${side.toLowerCase()}color`, strings[`Text${side}ColorCaption`], InspectorEditors.color, target => read(target, side).color, (target, value) => write(target, side, border => border.color = value ? Colors.clone(value) : Colors.empty))
      color.setDefaultValue(Colors.empty)
      section.add(color)
    })
  }

  /** Sections every node has: content, appearance, borders, corners, dimensions and background image. */
  /**
   * The sections every block shares: content, appearance, borders, corners, dimensions and
   * background image. A block leaves out the ones that can't show on it: appearance for one with
   * no text, the background image for one its content covers.
   */
  static node(node: Node, options: {appearance?: boolean, backgroundImage?: boolean} = {}): Array<InspectorSection> {
    let strings = node.strings
    let result: Array<InspectorSection> = []
    let content = new InspectorSection("content", strings.TextContentInspectorCaption)
    if (node.canAlignBlock) {
      let alignment = InspectorItem.menu("alignment", strings.TextAlignmentCaption, InspectorDefaults.alignmentChoices(strings, true), target => target.alignment, (target, value) => target.alignment = value)
      alignment.setDefaultValue(Alignments.automatic)
      content.add(alignment)
    }
    let direction = InspectorItem.menu("direction", strings.TextDirectionInspectorCaption, InspectorDefaults.#directionChoices(strings), target => target.direction, (target, value) => target.direction = value)
    direction.setDefaultValue(Directions.automatic)
    content.add(direction)
    result.push(content)

    if (options.appearance !== false) {
      let appearance = new InspectorSection("appearance", strings.TextAppearanceInspectorCaption)
      InspectorDefaults.lineItems(strings).forEach(item => appearance.add(item))
      result.push(appearance)
    }

    let borders = new InspectorSection("borders", strings.TextBordersInspectorCaption)
    InspectorDefaults.borderItems(borders, strings, "border", (target, side) => target[`border${side}`], (target, side, change) => {
      let border = {...target[`border${side}`], color: Colors.clone(target[`border${side}`].color)}
      change(border)
      target[`border${side}`] = border
    })
    result.push(borders)

    let corners = new InspectorSection("corners", strings.TextCornersInspectorCaption)
    ;[["TopLeft", strings.TextTopLeftRadiusCaption], ["TopRight", strings.TextTopRightRadiusCaption], ["BottomRight", strings.TextBottomRightRadiusCaption], ["BottomLeft", strings.TextBottomLeftRadiusCaption]].forEach(([corner, caption]) => {
      let property = `border${corner}Radius`
      let item = corners.add(InspectorItem.number(property.toLowerCase(), caption, target => target[property], (target, value) => target[property] = value, 0, 500, 1))
      item.setDefaultValue(0)
    })
    result.push(corners)

    if (node.canResize) {
      let dimensions = new InspectorSection("dimensions", strings.TextDimensionsInspectorCaption)
      let width = dimensions.add(InspectorItem.number("width", strings.TextWidthInspectorCaption, target => target.width, (target, value) => target.width = Math.max(0, value), 0, 10000, 1))
      width.zeroCaption = strings.TextAutomatic
      width.setDefaultValue(0)
      let height = dimensions.add(InspectorItem.number("height", strings.TextHeightInspectorCaption, target => target.height, (target, value) => target.height = Math.max(0, value), 0, 10000, 1))
      height.zeroCaption = strings.TextAutomatic
      height.setDefaultValue(0)
      if (!node.toolbarResizesHeight) dimensions.remove("height")
      result.push(dimensions)
    }

    if (options.backgroundImage !== false) result.push(InspectorDefaults.backgroundImageSection(strings, target => target.backgroundImage, (target, value) => target.backgroundImage = value))
    return result
  }

  /** Line height and line spacing, for a block's text. */
  static lineItems(strings: Strings): Array<InspectorItem> {
    let lineHeight = InspectorItem.number("lineheight", strings.TextLineHeightInspectorCaption, target => target.lineHeight, (target, value) => target.lineHeight = value, 0.1, 10, 0.1)
    lineHeight.setDefaultValue(1)
    let lineSpacing = InspectorItem.number("linespacing", strings.TextLineSpacingInspectorCaption, target => target.lineSpacing, (target, value) => target.lineSpacing = value, 0, 100, 1)
    lineSpacing.setDefaultValue(0)
    return [lineHeight, lineSpacing]
  }

  /** Replaces a text block's text, keeping the style of its first character. */
  static setPlainText(node: TextNode, value: string) {
    let text = String(value || "").replace(/\r\n?/g, "\n")
    if (!node.keepsParagraphs) text = text.replace(/\n/g, LineBreak)
    let current = node.content.text.replace(/\u2028/g, "\n")
    if (current == String(value || "")) return
    let style = node.content.length > 0 ? node.content.styleAt(0) : node.baseStyle()
    let replacement = new RichText(text, style)
    replacement.copyStateFrom(node.content)
    replacement.nodes = node.content.nodes
    replacement.listLevels = node.content.listLevels.slice()
    replacement.listChecked = node.content.listChecked.slice()
    let count = text.split(ParagraphBreak).length
    node.prepareReplacementContent(replacement, count)
    node.content = replacement
  }

  static text(node: TextNode): Array<InspectorSection> {
    let strings = node.strings
    let editor = node.editor
    let content = new InspectorSection("content", strings.TextContentInspectorCaption)
    if (node.inspectorShowsText) {
      let text = content.add(InspectorItem.bound("text", strings.TextTextCaption, InspectorEditors.multilineText, target => target.content.text.replace(/\u2028/g, "\n"), (target, value) => InspectorDefaults.setPlainText(target, value)))
      text.setDefaultValue(undefined)
    }
    let color = content.add(InspectorItem.bound("textcolor", strings.TextTextColorCaption, InspectorEditors.color, target => target.content.length > 0 ? target.content.styleAt(0).textColor : Colors.empty, (target, value) => {
      let color = value ? Colors.clone(value) : Colors.empty
      target.content.styles.forEach(style => style.textColor = Colors.clone(color))
    }))
    color.setDefaultValue(Colors.empty)
    let alignment = content.add(InspectorItem.menu("textalignment", strings.TextTextAlignmentInspectorCaption, InspectorDefaults.alignmentChoices(strings, true), target => target.textAlignment, (target, value) => target.textAlignment = value))
    alignment.setDefaultValue(Alignments.automatic)

    let typography = new InspectorSection("typography", strings.TextTypographyInspectorCaption)
    let applyToCharacters = (target: TextNode, change: (style: TextStyle) => void) => target.content.styles.forEach(change)
    let defaultSize = (target: any) => target instanceof HeadingNode ? HeadingNode.fontSizeForLevel(target.level) : 0
    let font = typography.add(InspectorItem.menu("fontname", strings.TextFontCaption, InspectorDefaults.#fontChoices(editor, strings, node.fontName, ""), target => target.fontName, (target, value) => {
      target.fontName = value
      applyToCharacters(target, style => style.fontName = value)
    }))
    font.setDefaultValue("")
    let size = typography.add(InspectorItem.menu("fontsize", strings.TextSizeCaption, InspectorDefaults.#sizeChoices(editor, strings, node.fontSize, defaultSize(node)), target => target.fontSize, (target, value) => {
      target.fontSize = value
      applyToCharacters(target, style => style.fontSize = value)
    }))
    size.setDefaultValue(defaultSize)
    ;[["bold", strings.TextBoldCaption], ["italic", strings.TextItalicCaption], ["underline", strings.TextUnderlineCaption]].forEach(([name, caption]) => {
      let item = typography.add(InspectorItem.bound(name, caption, InspectorEditors.toggle, target => target[name], (target, value) => {
        target[name] = value === true
        applyToCharacters(target, style => style[name] = value === true)
      }))
      item.setDefaultValue((target: any) => name == "bold" && target instanceof HeadingNode)
    })
    if (!node.inspectorShowsTypography) typography.removeAll()
    let result = [content]
    if (typography.lastIndex >= 0) result.push(typography)
    return result.concat(InspectorDefaults.node(node))
  }

  /** A section holding items. */
  static section(identifier: string, caption: string, items: Array<InspectorItem>): InspectorSection {
    let result = new InspectorSection(identifier, caption)
    items.forEach(item => result.add(item))
    return result
  }

  /** The built-in sections for a node: a text block's text, typography and appearance, or another node's appearance. Node types add their own sections by overriding inspectorSections. */
  static sections(node: Node): Array<InspectorSection> {
    return node instanceof TextNode ? InspectorDefaults.text(node) : InspectorDefaults.node(node)
  }

  /** The selected cell's appearance and borders. */
  static cellSections(node: TableNode, caption: string): Array<InspectorSection> {
    let strings = node.strings
    let cell = (target: TableNode) => target.cells[target.currentCellIndex()] || new RichText()
    let active = new InspectorSection("activecell", caption)
    let alignment = active.add(InspectorItem.menu("celltextalignment", strings.TextTextAlignmentInspectorCaption, InspectorDefaults.alignmentChoices(strings, true), target => cell(target).textAlignment, (target, value) => cell(target).textAlignment = value))
    alignment.setDefaultValue(Alignments.automatic)
    let vertical = active.add(InspectorItem.menu("cellverticalalignment", strings.TextVerticalAlignmentCaption, [[strings.TextTopAlignmentCaption, 0], [strings.TextMiddleAlignmentCaption, 1], [strings.TextBottomAlignmentCaption, 2]], target => cell(target).verticalAlignment, (target, value) => cell(target).verticalAlignment = value))
    vertical.setDefaultValue(0)
    let hasFill = active.add(InspectorItem.bound("cellhasbackground", strings.TextUseBackgroundColorCaption, InspectorEditors.toggle, target => cell(target).hasCellBackgroundColor, (target, value) => cell(target).hasCellBackgroundColor = value === true))
    hasFill.setDefaultValue(false)
    let fill = active.add(InspectorItem.bound("cellbackgroundcolor", strings.TextFillColorCaption, InspectorEditors.color, target => cell(target).cellBackgroundColor, (target, value) => {
      cell(target).cellBackgroundColor = value ? Colors.clone(value) : Colors.empty
      cell(target).hasCellBackgroundColor = value !== null
    }))
    fill.setDefaultValue(Colors.empty)
    let borders = new InspectorSection("cellborders", strings.TextCellBordersInspectorCaption)
    InspectorDefaults.borderItems(borders, strings, "cellborder", (target, side) => cell(target)[`cellBorder${side}`], (target, side, change) => {
      let current = cell(target)[`cellBorder${side}`]
      let border = {...current, color: Colors.clone(current.color)}
      change(border)
      cell(target)[`cellBorder${side}`] = border
    })
    let image = InspectorDefaults.backgroundImageSection(strings, target => cell(target).backgroundImage, (target, value) => cell(target).backgroundImage = value, "cellbackgroundimage")
    return [active, borders, image]
  }

  /** The document's sections. */
  static document(editor: Editor): Array<InspectorSection> {
    let strings = editor.strings
    let section = new InspectorSection("document", strings.TextDocumentInspectorCaption)
    let alignment = section.add(InspectorItem.menu("alignment", strings.TextAlignmentCaption, InspectorDefaults.alignmentChoices(strings, false), target => target.alignment, (target, value) => target.alignment = value))
    alignment.setDefaultValue(Alignments.leading)
    let textAlignment = section.add(InspectorItem.menu("textalignment", strings.TextTextAlignmentInspectorCaption, InspectorDefaults.alignmentChoices(strings, false), target => target.textAlignment, (target, value) => target.textAlignment = value))
    textAlignment.setDefaultValue(Alignments.leading)
    let direction = section.add(InspectorItem.menu("direction", strings.TextDirectionInspectorCaption, InspectorDefaults.#directionChoices(strings), target => target.direction, (target, value) => target.direction = value))
    direction.setDefaultValue(Directions.automatic)
    let font = section.add(InspectorItem.menu("fontname", strings.TextFontCaption, InspectorDefaults.#fontChoices(editor, strings, editor.fontName, "System").map(choice => choice[1] == "System" ? [strings.TextDefault, "System"] as [string, any] : choice), target => target.fontName, (target, value) => target.fontName = value))
    font.setDefaultValue("System")
    let size = section.add(InspectorItem.menu("fontsize", strings.TextSizeCaption, InspectorDefaults.#sizeChoices(editor, strings, editor.fontSize, DefaultFontSize), target => target.fontSize, (target, value) => target.fontSize = value))
    size.setDefaultValue(DefaultFontSize)
    let background = section.add(InspectorItem.bound("backgroundcolor", strings.TextDocumentBackgroundCaption, InspectorEditors.color, target => target.backgroundColor, (target, value) => target.backgroundColor = value ? value : Colors.make(255, 255, 255)))
    background.setDefaultValue(Colors.make(255, 255, 255))
    return [section, InspectorDefaults.backgroundImageSection(strings, target => target.backgroundImage, (target, value) => target.backgroundImage = value)]
  }
}
