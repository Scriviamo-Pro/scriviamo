import {Alignments, BackgroundImage, Colors, Directions, DocumentColor, Editor, FontOptions, HTMLImporter, InspectorDefaults, InspectorItem, InspectorSection, NormalLineHeightRatio, RichText, Strings, Suggestions, TextHost, TextNode, ToolbarItem, ToolbarMenuItem, Utilities} from "./internal"

export interface NodeBorder {
  visible: boolean
  size: number
  color: DocumentColor
}

/** The class side of a node type, used to register and insert nodes. */
export interface NodeClass {
  new (): Node
  /** The JSON "type" value. The toolbar identifier is "node:" + identifier. */
  identifier: string
  caption: string
  icon: string
  /** Extra words matched by the insertion search. */
  keywords: string
  /** False hides the type from the insertion menus while still restoring it from JSON. */
  insertable: boolean
  /** Creates a node ready to insert, with its default content. */
  create(editor: Editor): Node
  /** Makes nodes from an imported HTML element, or returns undefined to leave the element to other types. */
  importElement?(element: HTMLElement, importer: HTMLImporter): Node | Array<Node> | null | undefined
  /**
   * Types with a higher priority are offered an imported element first; the default is 0 and
   * equal priorities go in registration order. Use it to claim elements another type also reads,
   * such as a video service's iframes, which embeds would otherwise take.
   */
  importPriority?: number
  /** Markers typed at the start of a paragraph that turn it into this type. */
  markdownShortcuts?: Array<BlockShortcut>
  /** The entries this type adds to the block type menus: [identifier, caption, icon]. */
  blockKinds?(strings: Strings, compact: boolean): Array<[string, string, string]>
  /** Makes blocks of this type from another text block's plain content, when converting blocks. */
  fromBlockContent?(content: RichText, value: number, source: TextNode): Array<Node>
}

/** A marker typed at the start of a paragraph that turns the paragraph into a node type. */
export interface BlockShortcut {
  pattern: RegExp
  /** The value passed to setBlockType, such as a heading level, from the match. */
  value?: (match: RegExpMatchArray) => number
  /** True for types without text, which are inserted before the paragraph instead of converting it. */
  insertsBlock?: boolean
  /** Adjusts the converted node. */
  finish?: (node: Node, match: RegExpMatchArray) => void
}

/**
 * A block in the document. Subclass it to add a content type: override
 * build to draw it, toJSON and fromJSON to save it, and toHTML and
 * toMarkdown to export it, then register the class with Editor.registerNodeType
 * (every new editor) or editor.nodeTypes (one editor).
 */
export class Node {
  /**
   * The files this node type makes nodes from when they are dropped or pasted into
   * the editor: MIME types, which may end in "/*", or extensions such as ".csv".
   */
  static droppedFileTypes: Array<string> = []
  /** Decides between node types that accept the same file: the highest wins. */
  static droppedFileImportPriority: number = 0
  /** Makes a node from a dropped or pasted file, or returns null to decline it. */
  static importDroppedFile(_file: File, _editor: Editor): Node | null {
    return null
  }

  static identifier: string = "content"
  static caption: string = "Content"
  static icon: string = "bi bi-square"
  static keywords: string = ""
  static insertable: boolean = true

  static create(_editor: Editor): Node {
    return new this()
  }

  /** Makes nodes from an imported HTML element, or returns undefined to leave the element to other types. */
  static importElement(_element: HTMLElement, _importer: HTMLImporter): Node | Array<Node> | null | undefined {
    return undefined
  }

  static markdownShortcuts: Array<BlockShortcut> = []

  /** The entries this type adds to the block type menus: [identifier, caption, icon]. */
  static blockKinds(_strings: Strings, _compact: boolean): Array<[string, string, string]> {
    return []
  }

  nodeId: string = Utilities.uuid()
  editor: Editor | null = null
  /** The container node that holds this node, or null at the document root. */
  parent: Node | null = null

  lineHeight: number = 1
  lineSpacing: number = 0
  /** Supplies this node's text suggestions ahead of the editor's providers. Not saved with the document. */
  suggestionProvider: Suggestions.Provider | null = null
  /** Replaces the editor's font choices and available formats while this node is formatted. Not saved with the document. */
  fontOptions: FontOptions | null = null
  alignment: Alignments = Alignments.automatic
  direction: Directions = Directions.automatic
  borderTop: NodeBorder = Node.defaultBorder()
  borderRight: NodeBorder = Node.defaultBorder()
  borderBottom: NodeBorder = Node.defaultBorder()
  borderLeft: NodeBorder = Node.defaultBorder()
  borderTopLeftRadius: number = 0
  borderTopRightRadius: number = 0
  borderBottomRightRadius: number = 0
  borderBottomLeftRadius: number = 0
  backgroundImage: BackgroundImage = new BackgroundImage()
  /** Explicit width in points, or 0 to follow the natural width. Only used when canResize is true. */
  width: number = 0
  /** Explicit height in points, or 0 to follow the natural height. */
  height: number = 0
  #locked: boolean = false

  /**
   * Locked nodes can't be edited, moved or deleted. Not saved. While collaborating, a
   * node is also locked when another user holds the lock on it, on a node containing
   * it, or on a node it contains.
   */
  get locked(): boolean {
    return this.#locked || (!!this.editor && this.editor.isLockedByCollaborator(this))
  }

  set locked(value: boolean) {
    this.#locked = value
  }

  /** The rendered wrapper, while the node is in an editor. */
  element: HTMLElement | null = null
  /** The rendered content inside the wrapper. */
  body: HTMLElement | null = null

  #hosts: Array<TextHost> = []

  static defaultBorder(): NodeBorder {
    return {visible: false, size: 1, color: Colors.empty}
  }

  get type(): string {
    return (this.constructor as typeof Node).identifier
  }

  get typeName(): string {
    return (this.constructor as typeof Node).caption
  }

  get strings(): Strings {
    return this.editor ? this.editor.strings : Strings.shared
  }

  /** True when users can drag the node's resize handle. */
  get canResize(): boolean {
    return false
  }

  /** True when the node toolbar offers Width and Height. */
  get toolbarCanResize(): boolean {
    return this.canResize
  }

  /** False for nodes whose height follows their width, so the toolbar offers Width alone. */
  get toolbarResizesHeight(): boolean {
    return true
  }

  /** The size the node toolbar shows: the explicit size, or the drawn size when it follows its content. */
  toolbarSize(): {width: number, height: number} {
    let rect = this.body ? this.body.getBoundingClientRect() : null
    return {width: this.width > 0 ? this.width : (rect ? rect.width : 0), height: this.height > 0 ? this.height : (rect ? rect.height : 0)}
  }

  /** Sets a dimension from the node toolbar. Zero returns it to the natural size. */
  setToolbarSize(dimension: "width" | "height", value: number) {
    if (dimension == "width") this.width = Math.max(0, value)
    if (dimension == "height") this.height = Math.max(0, value)
  }

  /** True when the node can be narrower than its container, so it can be aligned within it. */
  get canAlignBlock(): boolean {
    return this.canResize
  }

  /** The inspector's sections for this node. Override to add or change sections; call super to keep the built-in ones. */
  inspectorSections(): Array<InspectorSection> {
    return InspectorDefaults.sections(this)
  }

  /** True when the inspector's items depend on which of the node's hosts has the caret, such as a table's active cell. */
  get inspectorFollowsCaret(): boolean {
    return false
  }

  /** Handles an action item that has no action of its own. Return true when handled. */
  inspectorAction(_item: InspectorItem): boolean {
    return false
  }

  /** True for nodes whose main content is a paragraph of text that can be split, merged and converted. */
  get isTextual(): boolean {
    return false
  }

  /** Editable text regions, in order. Set while the node builds. */
  hosts(): Array<TextHost> {
    return this.#hosts
  }

  get primaryHost(): TextHost | null {
    return this.#hosts[0] || null
  }

  /** Lists of child nodes this node contains. */
  childLists(): Array<Array<Node>> {
    return []
  }

  /** True when the child nodes are document-level blocks, which get the insertion gutter and drop targets. */
  get holdsBlocks(): boolean {
    return false
  }

  /** Shows content that is hidden, such as a collapsed section's children, when a descendant is selected. */
  revealContent() {
  }

  /** Where a node inserted while host has the caret goes, or null to insert it after this node. */
  insertionPoint(_host: TextHost): {list: Array<Node>, index: number} | null {
    return null
  }

  /** Called when one of the node's hosts gets the caret. */
  noteCaretHost(_host: TextHost) {
  }

  /** Called after the user inserts a new node of this type, to ask for its content. */
  inserted() {
  }

  /** True for nodes that show the document's headings, which are refreshed when headings change. */
  get followsHeadings(): boolean {
    return false
  }

  /** Reads type-specific styles from the element the node was imported from. */
  readImportedStyle(_style: CSSStyleDeclaration) {
  }

  /** The block kind the toolbar shows, such as "text" or "heading:2". */
  get blockKind(): string {
    return this.type
  }

  /** Every descendant, depth first. */
  descendants(): Array<Node> {
    let result: Array<Node> = []
    this.childLists().forEach(list => list.forEach(child => {
      result.push(child)
      result.push(...child.descendants())
    }))
    return result
  }

  /** The node's position: its list and the index in it. */
  location(): {list: Array<Node>, index: number} | null {
    if (!this.editor) return null
    let list = this.editor.listContaining(this)
    if (!list) return null
    return {list: list, index: list.indexOf(this)}
  }

  protected addHost(host: TextHost): TextHost {
    host.index = this.#hosts.length
    this.#hosts.push(host)
    host.editable = this.editor ? this.editor.isEditingNode(this) : false
    return host
  }

  /** Builds the node's DOM. The editor calls this; use refresh to rebuild an attached node. */
  render(): HTMLElement {
    this.#hosts = []
    let wrapper = Utilities.element("div", `scv-node scv-node-${this.type}`)
    wrapper.dataset.nodeId = this.nodeId
    wrapper.dataset.type = this.type
    let body = Utilities.element("div", "scv-node-body")
    wrapper.append(body)
    this.element = wrapper
    this.body = body
    this.build(body)
    this.applyAppearance(wrapper, body)
    return wrapper
  }

  /** Rebuilds the node in place, keeping the selection in its text when possible. */
  refresh() {
    if (this.editor) {
      this.editor.refreshNode(this)
    } else if (this.element) {
      let old = this.element
      old.replaceWith(this.render())
    }
  }

  /** Creates the node's content inside body. */
  protected build(_body: HTMLElement) {
  }

  /** Applies the common Node appearance: borders, corners, background image, size, alignment and direction. */
  protected applyAppearance(wrapper: HTMLElement, body: HTMLElement) {
    let style = body.style
    let sides: Array<[string, NodeBorder]> = [["Top", this.borderTop], ["Right", this.borderRight], ["Bottom", this.borderBottom], ["Left", this.borderLeft]]
    let hasBorder = false
    sides.forEach(([side, border]) => {
      if (border.visible && border.size > 0) {
        style[`border${side}`] = `${border.size}px solid ${Colors.isEmpty(border.color) ? "var(--bs-border-color)" : Colors.toCSS(border.color)}`
        hasBorder = true
      }
    })
    if (this.hasCornerRadius) {
      style.borderRadius = `${this.borderTopLeftRadius}px ${this.borderTopRightRadius}px ${this.borderBottomRightRadius}px ${this.borderBottomLeftRadius}px`
      style.overflow = "hidden"
    }
    if (!this.backgroundImage.isEmpty) body.setAttribute("style", body.getAttribute("style") + ";" + this.backgroundImage.toCSS())
    if (hasBorder || !this.backgroundImage.isEmpty) body.classList.add("scv-decorated")
    if (this.direction == Directions.rightToLeft) wrapper.dir = "rtl"
    if (this.direction == Directions.leftToRight) wrapper.dir = "ltr"
    if (this.lineHeight != 1 || this.lineSpacing != 0) {
      body.style.lineHeight = this.lineSpacing == 0 ? String(this.lineHeight * 1.5) : `calc(${this.lineHeight * 1.5}em + ${this.lineSpacing}px)`
    }
    if (this.canResize && this.width > 0) body.style.width = `${this.width}px`
    if (this.canResize && this.height > 0) body.style.height = `${this.height}px`
    let alignment = this.resolvedAlignment()
    wrapper.classList.toggle("scv-align-center", alignment == Alignments.middle)
    wrapper.classList.toggle("scv-align-end", alignment == Alignments.trailing)
  }

  get hasCornerRadius(): boolean {
    return this.borderTopLeftRadius > 0 || this.borderTopRightRadius > 0 || this.borderBottomRightRadius > 0 || this.borderBottomLeftRadius > 0
  }

  /** The block alignment, resolving Automatic to the editor's alignment. */
  resolvedAlignment(): Alignments {
    if (this.alignment != Alignments.automatic) return this.alignment
    return this.editor ? this.editor.alignment : Alignments.leading
  }

  /** Called after a host read edited text from the DOM. */
  textChanged(_host: TextHost) {
  }

  /** Tells the editor the node's content or persistent properties changed. */
  changed() {
    if (this.editor) this.editor.nodeChanged(this)
  }

  /** Records an undo step before the node changes itself, such as from a toolbar action. */
  willChange() {
    if (this.editor) this.editor.history.checkpoint()
  }

  // Contextual toolbar

  /** Node-specific items for the contextual toolbar. */
  actions(): Array<ToolbarItem> {
    return []
  }

  /** Handles one of the items returned by actions. Returns true when handled. */
  performAction(_item: ToolbarItem, _menuItem: ToolbarMenuItem | null): boolean {
    return false
  }

  /**
   * Extra entries for the editor's context menu, after the clipboard commands and
   * the node's actions. Build them each time, so they reflect the node's state.
   */
  contextMenuItems(): Array<ToolbarMenuItem> {
    return []
  }

  /** Handles one of the entries returned by contextMenuItems. Returns true when handled. */
  performContextMenuItem(_item: ToolbarMenuItem): boolean {
    return false
  }

  /** Handles a key press while one of the node's hosts has focus. Return true to stop the editor's handling. */
  handleKeyDown(_event: KeyboardEvent, _host: TextHost | null): boolean {
    return false
  }

  /** Handles a click in the node. Return true to stop the editor's handling. */
  handleClick(_event: MouseEvent): boolean {
    return false
  }

  // Persistence

  toJSON(): object {
    let result = {nodeId: this.nodeId, type: this.type}
    if (this.lineHeight != 1) result["lineHeight"] = this.lineHeight
    if (this.lineSpacing != 0) result["lineSpacing"] = this.lineSpacing
    if (this.alignment != Alignments.automatic) result["alignment"] = this.alignment
    if (this.direction != Directions.automatic) result["direction"] = this.direction
    let sides: Array<[string, NodeBorder]> = [["Top", this.borderTop], ["Right", this.borderRight], ["Bottom", this.borderBottom], ["Left", this.borderLeft]]
    sides.forEach(([side, border]) => {
      if (border.visible) result[`border${side}Visible`] = true
      if (border.size != 1) result[`border${side}Size`] = border.size
      if (!Colors.isEmpty(border.color)) result[`border${side}Color`] = Colors.toJSON(border.color)
    })
    if (this.borderTopLeftRadius != 0) result["borderTopLeftRadius"] = this.borderTopLeftRadius
    if (this.borderTopRightRadius != 0) result["borderTopRightRadius"] = this.borderTopRightRadius
    if (this.borderBottomRightRadius != 0) result["borderBottomRightRadius"] = this.borderBottomRightRadius
    if (this.borderBottomLeftRadius != 0) result["borderBottomLeftRadius"] = this.borderBottomLeftRadius
    if (!this.backgroundImage.isEmpty) result["backgroundImage"] = this.backgroundImage.toJSON()
    // Explicit sizes are kept even where this editor can't resize the node, so documents keep them.
    if (this.width > 0) result["width"] = this.width
    if (this.height > 0) result["height"] = this.height
    return result
  }

  /** Restores the node. Missing names restore their defaults. Returns false when data can't be used. */
  fromJSON(data: any): boolean {
    if (!data || typeof data != "object") return false
    let identifier = Utilities.string(data.nodeId).trim()
    if (identifier.length > 0) this.nodeId = identifier
    this.lineHeight = Utilities.number(data.lineHeight, 1)
    this.lineSpacing = Utilities.number(data.lineSpacing, 0)
    let alignment = Utilities.integer(data.alignment, 0)
    this.alignment = alignment >= 0 && alignment <= 3 ? alignment : Alignments.automatic
    let direction = Utilities.integer(data.direction, 0)
    this.direction = direction >= 0 && direction <= 2 ? direction : Directions.automatic
    let sides = ["Top", "Right", "Bottom", "Left"]
    sides.forEach(side => {
      this[`border${side}`] = {
        visible: Utilities.boolean(data[`border${side}Visible`], false),
        size: Math.max(0, Utilities.number(data[`border${side}Size`], 1)),
        color: Colors.fromJSON(data[`border${side}Color`], Colors.empty)
      }
    })
    this.borderTopLeftRadius = Math.max(0, Utilities.number(data.borderTopLeftRadius, 0))
    this.borderTopRightRadius = Math.max(0, Utilities.number(data.borderTopRightRadius, 0))
    this.borderBottomRightRadius = Math.max(0, Utilities.number(data.borderBottomRightRadius, 0))
    this.borderBottomLeftRadius = Math.max(0, Utilities.number(data.borderBottomLeftRadius, 0))
    this.backgroundImage = data.backgroundImage ? BackgroundImage.fromJSON(data.backgroundImage) : new BackgroundImage()
    this.width = Math.max(0, Utilities.number(data.width, 0))
    this.height = Math.max(0, Utilities.number(data.height, 0))
    return true
  }

  /** Copies the common Node properties to another node, such as when converting a paragraph into a heading. */
  copyAppearanceTo(other: Node) {
    let data = Node.prototype.toJSON.call(this)
    delete data["nodeId"]
    delete data["type"]
    Node.prototype.fromJSON.call(other, Object.assign({nodeId: other.nodeId}, data))
  }

  // Export

  toHTML(): string {
    return ""
  }

  toMarkdown(): string {
    return this.toHTML()
  }

  toPlainText(): string {
    let parts: Array<string> = []
    this.hosts().forEach(host => { if (host.rich.text.length > 0) parts.push(host.rich.text.replace(/\u2028/g, "\n")) })
    this.childLists().forEach(list => list.forEach(child => {
      let value = child.toPlainText()
      if (value.length > 0) parts.push(value)
    }))
    return parts.join("\n")
  }

  /** Whether the node writes anything into exported HTML. */
  get canExportHTML(): boolean {
    return true
  }

  /** Common CSS for exported HTML: background image, borders, corners, direction and block alignment. */
  protected htmlBackgroundCSS(): string {
    let result = ""
    if (!this.backgroundImage.isEmpty) result += this.backgroundImage.toCSS() + ";"
    let sides: Array<[string, NodeBorder]> = [["top", this.borderTop], ["right", this.borderRight], ["bottom", this.borderBottom], ["left", this.borderLeft]]
    sides.forEach(([side, border]) => {
      if (border.visible && border.size > 0) result += `border-${side}:${border.size}px solid ${Colors.toCSS(border.color)};`
    })
    if (this.hasCornerRadius) {
      let corners = [this.borderTopLeftRadius, this.borderTopRightRadius, this.borderBottomRightRadius, this.borderBottomLeftRadius]
      result += corners.every(value => value == corners[0]) ? `border-radius:${corners[0]}px;` : `border-radius:${corners.join("px ")}px;`
    }
    if (this.direction == Directions.rightToLeft) result += "direction:rtl;unicode-bidi:isolate;"
    if (this.direction == Directions.leftToRight) result += "direction:ltr;unicode-bidi:isolate;"
    let alignment = this.resolvedAlignment()
    if (alignment == Alignments.middle) {
      result += "margin-left:auto;margin-right:auto;"
    } else if (alignment == Alignments.trailing) {
      result += "margin-inline-start:auto;margin-inline-end:0;"
    }
    return result
  }

  protected htmlLineHeightCSS(): string {
    if (this.lineHeight == 1 && this.lineSpacing == 0) return ""
    let height = Number((this.lineHeight * NormalLineHeightRatio).toFixed(4))
    if (this.lineSpacing == 0) return `line-height:${height};`
    return `line-height:calc(${height}em + ${this.lineSpacing}px);`
  }

  /** Wraps Markdown in an HTML element when the node has a background or border Markdown can't express. */
  protected markdownWithBackground(markdown: string): string {
    let css = this.htmlBackgroundCSS().replace(/margin-[a-z-]+:[^;]+;/g, "")
    if (css.length == 0) return markdown
    return `<div style="${Utilities.escapeAttribute(css)}">\n\n${markdown}\n\n</div>`
  }
}
