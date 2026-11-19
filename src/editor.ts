import {Alignments, Annotation, AnnotationHandler, Annotations, Autosave, AutosaveFunction, BackgroundImage, BlockShortcut, ChoiceItem, ChoicePopup, CodeBlockNode, CodePoints, Colors, CurrentDocumentVersion, DefaultFontSize, Dialog, DialogField, Directions, DocumentColor, DocumentStyle, Exporter, Exporters, ExportFormats, FileUploader, FileUploadKind, FontOptions, Formatting, FormattingStyles, HeadingNode, History, HTMLImporter, InsertionChoice, InsertionChooser, InspectorDefaults, InspectorSection, LineBreak, MarkdownConverter, MediaUI, Node, NodeClass, NodeSelection, NodeTypes, Notification, NotificationTypes, ParagraphBreak, PasteCleanup, Popup, PopupMenu, RichText, Search, SelectionState, Statistics, StatusBar, Strings, Stylesheet, SuggestionProviders, Suggestions, TableNode, TableSizePicker, TextHost, TextHostModes, TextNode, TextStyle, ThemeColors, ToolbarDisplayModes, ToolbarItem, ToolbarItemKinds, ToolbarItems, ToolbarMenuItem, ToolbarView, UnknownNode, Utilities, WebFonts} from "./internal"

export enum ValidationSeverities {
  warning = 0,
  error = 1
}

export class ValidationIssue {
  severity: ValidationSeverities
  message: string

  constructor(severity: ValidationSeverities, message: string) {
    this.severity = severity
    this.message = message
  }
}

export interface EditorOptions {
  /** Document JSON, as a string or object. */
  content?: string | object
  /** HTML to load when content isn't given. */
  html?: string
  /** Markdown to load when content and html aren't given. */
  markdown?: string
  readOnly?: boolean
  toolbarVisible?: boolean
  toolbarDisplayMode?: ToolbarDisplayModes
  showContextualToolbars?: boolean
  isHoverInsertionEnabled?: boolean
  markdownShortcuts?: boolean
  /** Turns comments on or off. Threads already in the document are kept either way. */
  allowAnnotations?: boolean
  adaptiveHeight?: boolean
  fontName?: string
  fontSize?: number
  /** A locale pack, an object of localized strings, or a list of either. */
  strings?: string | object
  /** Extra classes for the editor element. */
  class?: string
  /** Shows the status bar under the document: word and character counts, reading time, and the autosave state. */
  statusBar?: boolean
  /** How many block types the toolbar's Insert menu offers before it shows a search field; see insertMenuSearchThreshold. */
  insertMenuSearchThreshold?: number
  /** Uploads files the user adds, such as pictures, and returns their addresses; see FileUploader. */
  fileUploader?: FileUploader | null
  /** Saves the document a moment after each change: a save function, or one with settings. See Autosave. */
  autosave?: AutosaveFunction | {save: AutosaveFunction, delay?: number, maximumWait?: number, retryDelay?: number, warnBeforeLeaving?: boolean}
}

interface PendingStyle {
  host: TextHost
  offset: number
  style: TextStyle
}

const ClipboardType: string = "application/x-scriviamo"

/**
 * A block-based rich text editor. The document is an ordered list of nodes;
 * container nodes (tables, columns, collapsible sections) hold nodes of their own.
 *
 * Events (CustomEvent; detail described below):
 * - contentChanged: {node} after content or a persistent property changes; node is null for document-wide changes.
 * - selectionChanged: {node} after the primary selected node changes.
 * - keyPress: {key, event} before the editor handles a key. Call preventDefault to handle it yourself.
 * - linkPressed: {node, url, text, title} when a link is Ctrl/Command-clicked, or clicked while read-only. Call preventDefault to stop the editor opening it.
 * - toolbarItemPressed: {item, menuItem} for toolbar items the editor doesn't handle.
 * - messageShowing: {notification, text, indicator}. Call preventDefault to show it yourself.
 * - nodeDragging: {node, nodes, beforeNode, parentNode, x, y} while nodes are dragged. Call preventDefault to refuse the position.
 * - nodeDropped: {node, nodes, beforeNode, parentNode}. Call preventDefault to cancel the move.
 * - nodeKeyPress: {node, key, event} before a selected (not edited) node handles a key. Call preventDefault to handle it yourself.
 * - nodePointerEnter, nodePointerExit: {node}; nodePointerMove: {node, x, y} relative to the node.
 * - pointerEnter, pointerExit, pointerMoved: {x, y} relative to the editor.
 * - pickerOpened: {picker}; pickerClosed: {picker, committed, value} for the editor's menus and popovers.
 * - suggestionCommitted: {node, provider, suggestion} after a suggestion is chosen.
 * - annotationAdded, annotationChanged, annotationRemoved: {annotation}, including those undo and redo restore.
 * - annotationSelected: {annotation} when a comment marker is clicked. Call preventDefault to show it yourself.
 * - toolbarCustomized: {state} when the customizer closes with changes; toolbarReset after resetToolbar.
 * - scrollChanged: {x, y}; editingChanged: {node}; readOnlyChanged.
 * - heightChanged: the editor's height, while adaptiveHeight is true.
 * - autosaveStateChanged: {state, error} as autosave moves between saved, unsaved, saving and failed.
 *
 * While a collaboration client is attached (the collaboration add-on):
 * - collaborationConnected: {user} after a shared document opened; collaborationDisconnected when it closed.
 * - collaborationUserConnected, collaborationUserDisconnected: {collaborator} as other users join and leave.
 * - remoteDocumentChanged: {collaborator, revision} after another user's change was applied.
 * - remoteNodeLockChanged: {collaborator, node, nodeID, locked} when another user locks or releases a node.
 * - remotePointerMoved: {collaborator, node, x, y} with the pointer in points from the page's top-left corner; node is the user's selected node.
 * - remoteSelectionChanged: {collaborator, node} when another user selects a node; node is null when they clear the selection.
 */
/**
 * Adds commands to every editor, such as the toolbar items and keyboard shortcuts
 * of an optional node type. Register one with Editor.registerExtension.
 */
export interface EditorExtension {
  /** Called for each new editor once its built-in setup is done. */
  install?(editor: Editor): void
  /** The tools this extension adds, in the order the toolbar customizer lists them. */
  toolbarIdentifiers?: Array<string>
  /** The tools the default toolbar shows, placed after the tool named by defaultToolbarAfter, or at the end. */
  defaultToolbarIdentifiers?: Array<string>
  defaultToolbarAfter?: string
  /** Makes the tool for one of toolbarIdentifiers. */
  makeToolbarItem?(editor: Editor, identifier: string): ToolbarItem | null
  /** Performs one of the extension's tools. Return true when handled. */
  activateToolbarItem?(editor: Editor, identifier: string, menuItem: ToolbarMenuItem | null): boolean
  /** Sets the enabled and active states of the extension's tools for the current selection. */
  updateToolbarState?(editor: Editor, set: (identifier: string, enabled: boolean, active?: boolean) => void): void
  /** Handles a key press with the command key held. Return true when handled. */
  handleCommandKey?(editor: Editor, event: KeyboardEvent): boolean
  /** Choices the insertion chooser ("/" and Insert) and command search offer besides node types. */
  insertionChoices?(editor: Editor): Array<InsertionChoice>
}

/**
 * A panel about the document shown beside an editor, such as the outline add-on's. Register one
 * with Editor.registerPanel; the inspector add-on shows each as a tab, and an application can
 * place one anywhere with build.
 */
export interface EditorPanel {
  identifier: string
  /** The panel's name, as its tab shows it. */
  caption(editor: Editor): string
  /** Fills container for an editor, and keeps it up to date until the function it returns is called. */
  build(container: HTMLElement, editor: Editor): () => void
}

/**
 * A connection that shares the document with other users, such as the collaboration
 * add-on's client. The editor reports local changes to it and draws other users'
 * presence through it.
 */
/** A point as fractions of a top-level node's width and height, measured from its top-left corner. */
export interface PointerAnchor {
  nodeID: string
  x: number
  y: number
}

export interface CollaborationConnection {
  editorContentChanged(node: Node | null): void
  editorSelectionChanged(nodeChanged: boolean): void
  /** The pointer moved: x and y from the page's top-left corner, and the node it is over, or the nearest one. */
  editorPointerMoved(x: number, y: number, anchor: PointerAnchor | null): void
  editorAnnotationChanged(annotation: Annotation, removed: boolean): void
  /** Applies a remote operation to a document object in the JSON format, so the undo history keeps it. */
  applyToDocument(document: any, operation: any): void
  /** The local user's identity for comments, or null. */
  identity(): {id: string, name: string} | null
  /** Draws the other users' selections, carets, pointers and locks into layer, which covers the page. */
  renderPresence(layer: HTMLElement): void
}

export class Editor extends EventTarget {
  static #nodeTypeRegistry: Array<{type: NodeClass, order: number}> = []
  static #extensions: Array<EditorExtension> = []
  static #panels: Array<EditorPanel> = []

  /**
   * Registers a node type for every editor created afterwards. order places it in
   * the insertion and block type menus; the built-in types use multiples of 10.
   * A type with the same identifier is replaced.
   */
  static registerNodeType(type: NodeClass, order: number = 1000) {
    let list = Editor.#nodeTypeRegistry.filter(entry => entry.type.identifier != type.identifier)
    list.push({type: type, order: order})
    list.sort((a, b) => a.order - b.order)
    Editor.#nodeTypeRegistry = list
  }

  /** The node types new editors start with, in menu order. */
  static registeredNodeTypes(): Array<NodeClass> {
    return Editor.#nodeTypeRegistry.map(entry => entry.type)
  }

  /** Registers an extension for every editor created afterwards. */
  static registerExtension(extension: EditorExtension) {
    if (Editor.#extensions.indexOf(extension) < 0) Editor.#extensions.push(extension)
  }

  static extensions(): Array<EditorExtension> {
    return Editor.#extensions.slice()
  }

  /** Registers a panel about the document, such as an outline; one with the same identifier is replaced. */
  static registerPanel(panel: EditorPanel) {
    Editor.#panels = Editor.#panels.filter(item => item.identifier != panel.identifier).concat([panel])
  }

  /** The registered panels, in the order they were registered. */
  static panels(): Array<EditorPanel> {
    return Editor.#panels.slice()
  }

  /** A static member a node type declares itself, rather than inherits from the type it extends. */
  static ownStatic(type: NodeClass, name: string): any {
    return Object.prototype.hasOwnProperty.call(type, name) ? type[name] : undefined
  }

  id: string = Utilities.uuid()
  documentID: string = ""

  strings: Strings = new Strings()
  nodeTypes: NodeTypes
  toolbarItems: ToolbarItems = new ToolbarItems()
  history: History
  formatting: Formatting
  selection: NodeSelection
  search: Search
  statistics: Statistics
  importer: HTMLImporter
  /** Text suggestion providers, asked in order while typing. Starts with an emoji provider, "emoji". */
  suggestionProviders: SuggestionProviders
  lastValidationIssues: Array<ValidationIssue> = []
  /** The export formats offered by export and exportToFile. */
  exporters: Exporters
  /** The document's discussion threads. */
  annotations: Annotations
  /** Saves the document after changes, through the application's save function. */
  autosave: Autosave
  /** The bar under the document; shown while statusBarVisible is true. */
  statusBar: StatusBar
  /**
   * The toolbar's Insert menu shows a search field once it offers at least this many block
   * types. 0 always shows it; Infinity never does.
   */
  insertMenuSearchThreshold: number = 5
  /**
   * Uploads files the user adds (pictures, audio, video and backgrounds) and returns the address
   * each is shown from. Without one, files are embedded in the document as data.
   */
  fileUploader: FileUploader | null = null

  /** The font names and sizes the toolbar offers, and the character formats available. A node's own fontOptions replace these while it is formatted. */
  fontOptions: FontOptions = new FontOptions()

  /** Font families offered by the Font menu. "System" is the platform's interface font. */
  get fontNames(): Array<string> {
    return this.fontOptions.fontNames()
  }

  set fontNames(value: Array<string>) {
    this.fontOptions.setFontNames(value || [])
  }

  /** Font sizes offered by the Size menu, after Default. */
  get fontSizes(): Array<number> {
    return [0].concat(this.fontOptions.sizes())
  }

  set fontSizes(value: Array<number>) {
    this.fontOptions.setSizes(value || [])
  }

  /** The font options in effect: those of the node being formatted, or the editor's. */
  activeFontOptions(): FontOptions {
    let node = this.#activeHost ? this.#activeHost.node : this.selectedNode
    return node && node.fontOptions ? node.fontOptions : this.fontOptions
  }

  #parentElement: HTMLElement | null
  #element: HTMLDivElement | null = null
  #toolbarElement: HTMLDivElement | null = null
  #searchContainer: HTMLDivElement | null = null
  #statusBarElement: HTMLDivElement | null = null
  #statusBarVisible: boolean = false
  #scrollerElement: HTMLDivElement | null = null
  #pageElement: HTMLDivElement | null = null
  #documentElement: HTMLDivElement | null = null
  #nodeToolbarElement: HTMLDivElement | null = null
  #gutterElement: HTMLDivElement | null = null
  #dropIndicator: HTMLDivElement | null = null
  #messagesElement: HTMLDivElement | null = null
  #disabledLayer: HTMLDivElement | null = null

  #nodes: Array<Node> = []
  #listElements: WeakMap<Array<Node>, HTMLElement> = new WeakMap()
  #listOwners: WeakMap<Array<Node>, Node | null> = new WeakMap()
  #selected: Array<Node> = []
  #activeHost: TextHost | null = null
  #editingNode: Node | null = null
  #pending: PendingStyle | null = null
  #composing: boolean = false
  #updateDepth: number = 0
  #deferredChange: boolean = false
  #isChanged: boolean = false
  #allowAnnotations: boolean = true
  #annotationLayer: HTMLDivElement | null = null
  #annotationTimer: number = 0
  #hoveredAnnotationLine: string = ""
  #annotationRanges: Array<Range> = []
  #tocTimer: number = 0
  #stateFrame: number = 0
  #hoverNode: Node | null = null
  #dragNode: Node | null = null
  #dragNodes: Array<Node> = []
  #anchorNode: Node | null = null
  #dropTarget: {list: Array<Node>, index: number, owner: Node | null} | null = null
  #suggestionPopup: ChoicePopup | null = null
  #suggestionState: {host: TextHost, provider: Suggestions.Provider, request: Suggestions.Request, items: Array<Suggestions.Suggestion>} | null = null
  #suggestionSerial: number = 0

  #backgroundImage: BackgroundImage = new BackgroundImage()
  #fontName: string = "System"
  #fontSize: number = DefaultFontSize
  #backgroundColor: DocumentColor = Colors.make(255, 255, 255)
  #alignment: Alignments = Alignments.leading
  #textAlignment: Alignments = Alignments.leading
  #direction: Directions = Directions.automatic
  #readOnly: boolean = false
  #enabled: boolean = true
  #toolbarVisible: boolean = true
  #toolbarDisplayMode: ToolbarDisplayModes = ToolbarDisplayModes.iconOnly
  #showContextualToolbars: boolean = true
  #adaptiveHeight: boolean = false
  #class: string = ""
  /** Shows the add and drag buttons beside the block under the pointer. */
  isHoverInsertionEnabled: boolean = true
  /** Turns Markdown typed while editing into the formatting or block it describes. False types the characters as they are. */
  markdownShortcuts: boolean = true

  // Not on a server, where there is nothing to observe.
  #heightObserver: ResizeObserver | null = typeof ResizeObserver == "undefined" ? null : new ResizeObserver(() => {
    if (this.#adaptiveHeight && this.#element) this.dispatchEvent(new CustomEvent("heightChanged", {detail: this.#element.offsetHeight}))
    this.#positionNodeToolbar()
    this.#scheduleAnnotationMarkers()
    this.#schedulePresence()
  })

  #selectionChangeHandler = () => this.#onSelectionChange()

  /**
   * Creates an editor in element. With null instead of an element, the editor is headless: it
   * draws nothing and needs no browser, but loads, changes and exports documents, such as for
   * rendering saved documents to HTML on a server.
   */
  constructor(element: HTMLElement | null, options?: EditorOptions) {
    super()
    this.#parentElement = element
    this.nodeTypes = new NodeTypes(this)
    this.history = new History(this)
    this.formatting = new Formatting(this)
    this.selection = new NodeSelection(this)
    this.search = new Search(this)
    this.statistics = new Statistics(this)
    this.importer = new HTMLImporter(this)
    this.suggestionProviders = new SuggestionProviders(this)
    this.suggestionProviders.add(new Suggestions.EmojiProvider())
    this.annotations = new Annotations(this, this.#annotationHandler())
    this.autosave = new Autosave(this)
    this.statusBar = new StatusBar(this)
    this.exporters = new Exporters(this)
    this.exporters.add(new Exporter("html", ExportFormats.html))
    this.exporters.add(new Exporter("json", ExportFormats.json))
    this.exporters.add(new Exporter("markdown", ExportFormats.markdown))
    this.exporters.add(new Exporter("text", ExportFormats.plainText))

    Editor.registeredNodeTypes().forEach(type => this.nodeTypes.add(type))

    // The editor's own text first, so the toolbar is built in its language.
    if (options && options.strings) this.strings.apply(options.strings)
    this.#buildDefaultToolbar()
    this.toolbarItems.addEventListener("changed", () => this.#renderToolbar())
    this.nodeTypes.addEventListener("changed", () => this.#renderToolbar())
    this.history.addEventListener("changed", () => this.updateToolbarState())

    this.#applyOptions(options, true)
    Editor.#extensions.forEach(extension => extension.install?.(this))
  }

  /**
   * Stores a file the user added and returns the address to show it from: the fileUploader's
   * result, or a data: URI when there's no uploader or it returns null. Rejects when the upload
   * fails or is aborted.
   */
  async storeFile(file: Blob, kind: FileUploadKind, node: Node | null = null, progress?: (fraction: number) => void, signal?: AbortSignal): Promise<string> {
    let uploader = this.fileUploader
    if (!uploader) return MediaUI.readDataURI(file)
    let result = await uploader({
      file,
      name: typeof (file as File).name == "string" ? (file as File).name : "",
      type: file.type || "",
      kind,
      node,
      editor: this,
      progress: fraction => progress?.(Utilities.clamp(Number(fraction) || 0, 0, 1)),
      signal: signal || new AbortController().signal
    })
    if (signal && signal.aborted) throw new DOMException("The upload was cancelled.", "AbortError")
    if (result === null || result === undefined || result === "") return MediaUI.readDataURI(file)
    if (typeof result != "string") throw new TypeError("The file uploader didn't return an address.")
    return result
  }

  /**
   * A saved document (JSON, as a string or object) as HTML, without a page or a visible editor,
   * such as on a server. includeDocumentElements makes a whole page with its stylesheet. Import
   * the add-ons the document uses first.
   */
  static renderHTML(content: string | object, includeDocumentElements: boolean = false, includeAnnotations: boolean = false): string {
    return new Editor(null, {content}).toHTML(includeDocumentElements, includeAnnotations)
  }

  /** A saved document as Markdown, without a page or a visible editor. */
  static renderMarkdown(content: string | object): string {
    return new Editor(null, {content}).toMarkdown()
  }

  /** A saved document as plain text, without a page or a visible editor. */
  static renderPlainText(content: string | object): string {
    return new Editor(null, {content}).toPlainText()
  }

  /** Sets up autosave from a save function, a save function with settings, or null to turn it off. */
  updateAutosave(value: EditorOptions["autosave"] | null) {
    if (value && typeof value == "object") {
      for (let name of ["delay", "maximumWait", "retryDelay"]) if (typeof value[name] == "number") this.autosave[name] = value[name]
      if (typeof value.warnBeforeLeaving == "boolean") this.autosave.warnBeforeLeaving = value.warnBeforeLeaving
      this.autosave.save = value.save
    } else {
      this.autosave.save = typeof value == "function" ? value : null
    }
  }

  updateOptions(options?: EditorOptions) {
    this.#applyOptions(options, false)
  }

  #applyOptions(options: EditorOptions | undefined, constructing: boolean) {
    let defaults: EditorOptions = {
      readOnly: false,
      toolbarVisible: true,
      toolbarDisplayMode: ToolbarDisplayModes.iconOnly,
      showContextualToolbars: true,
      isHoverInsertionEnabled: true,
      markdownShortcuts: true,
      allowAnnotations: true,
      adaptiveHeight: false,
      class: ""
    }
    let instanceOptions: EditorOptions = {...defaults, ...options}
    // While constructing, the text was applied before the toolbar was built; later, the toolbar and
    // the document are rebuilt in the new language.
    if (instanceOptions.strings && !constructing) this.localize(instanceOptions.strings)
    if (instanceOptions.fontName) this.#fontName = instanceOptions.fontName
    if (instanceOptions.fontSize) this.#fontSize = instanceOptions.fontSize
    this.#readOnly = instanceOptions.readOnly
    this.#toolbarVisible = instanceOptions.toolbarVisible
    this.#toolbarDisplayMode = instanceOptions.toolbarDisplayMode
    this.#showContextualToolbars = instanceOptions.showContextualToolbars
    this.isHoverInsertionEnabled = instanceOptions.isHoverInsertionEnabled
    this.markdownShortcuts = instanceOptions.markdownShortcuts
    this.#allowAnnotations = instanceOptions.allowAnnotations !== false
    this.#adaptiveHeight = instanceOptions.adaptiveHeight
    this.#class = instanceOptions.class
    if (instanceOptions.statusBar !== undefined) this.#statusBarVisible = !!instanceOptions.statusBar
    if (typeof instanceOptions.insertMenuSearchThreshold == "number") this.insertMenuSearchThreshold = instanceOptions.insertMenuSearchThreshold
    if (instanceOptions.autosave) this.updateAutosave(instanceOptions.autosave)
    if (instanceOptions.fileUploader !== undefined) this.fileUploader = typeof instanceOptions.fileUploader == "function" ? instanceOptions.fileUploader : null

    this.render()

    if (instanceOptions.content) {
      this.fromJSON(instanceOptions.content)
    } else if (instanceOptions.html) {
      this.fromHTML(instanceOptions.html)
    } else if (instanceOptions.markdown) {
      this.fromMarkdown(instanceOptions.markdown)
    }
  }

  // Properties

  get element(): HTMLElement | null {
    return this.#element
  }

  /** The element the search bar is placed in. */
  get searchContainer(): HTMLElement {
    return this.#searchContainer
  }

  get enabled(): boolean {
    return this.#enabled
  }

  set enabled(value: boolean) {
    this.#enabled = value
    if (this.#disabledLayer) this.#disabledLayer.classList.toggle("d-none", value)
  }

  get readOnly(): boolean {
    return this.#readOnly
  }

  set readOnly(value: boolean) {
    if (this.#readOnly == value) return
    this.#readOnly = value
    this.dispatchEvent(new CustomEvent("readOnlyChanged", {detail: {readOnly: value}}))
    this.#element?.classList.toggle("scv-readonly", value)
    if (value) this.endEditing()
    this.allNodes().forEach(node => node.hosts().forEach(host => host.editable = this.isEditingNode(node)))
    this.#documentElement?.querySelectorAll(".scv-code-language").forEach((input: HTMLInputElement) => input.readOnly = value)
    this.#updateEmptyDocument()
    this.#renderNodeToolbar()
    this.updateToolbarState()
  }

  get class(): string {
    return this.#class
  }

  /** Shows the bar under the document, with word and character counts and the autosave state. */
  get statusBarVisible(): boolean {
    return this.#statusBarVisible
  }

  set statusBarVisible(value: boolean) {
    value = !!value
    if (this.#statusBarVisible == value) return
    this.#statusBarVisible = value
    this.#statusBarElement?.classList.toggle("d-none", !value)
    if (value) this.statusBar.update()
  }

  set class(value: string) {
    if (this.#element && this.#class.length > 0) this.#element.classList.remove(...this.#class.split(" ").filter(name => name.length > 0))
    this.#class = value
    if (this.#element && value.length > 0) this.#element.classList.add(...value.split(" ").filter(name => name.length > 0))
  }

  get adaptiveHeight(): boolean {
    return this.#adaptiveHeight
  }

  set adaptiveHeight(value: boolean) {
    this.#adaptiveHeight = value
    this.#element?.classList.toggle("scv-adaptive", value)
  }

  get toolbarVisible(): boolean {
    return this.#toolbarVisible
  }

  set toolbarVisible(value: boolean) {
    this.#toolbarVisible = value
    this.#toolbarElement?.classList.toggle("d-none", !value)
  }

  get toolbarDisplayMode(): ToolbarDisplayModes {
    return this.#toolbarDisplayMode
  }

  set toolbarDisplayMode(value: ToolbarDisplayModes) {
    this.#toolbarDisplayMode = value
    this.#renderToolbar()
  }

  get showContextualToolbars(): boolean {
    return this.#showContextualToolbars
  }

  set showContextualToolbars(value: boolean) {
    this.#showContextualToolbars = value
    this.#renderNodeToolbar()
  }

  /** The document font. "System" uses the platform's interface font. */
  get fontName(): string {
    return this.#fontName
  }

  set fontName(value: string) {
    this.#fontName = value || "System"
    this.#applyDocumentAppearance()
  }

  /** The document font size. Text whose size is Default (zero) uses it. */
  get fontSize(): number {
    return this.#fontSize
  }

  set fontSize(value: number) {
    this.#fontSize = value > 0 ? value : DefaultFontSize
    this.#applyDocumentAppearance()
  }

  /** The picture drawn behind the document. */
  get backgroundImage(): BackgroundImage {
    return this.#backgroundImage
  }

  set backgroundImage(value: BackgroundImage) {
    this.#backgroundImage = value || new BackgroundImage()
    this.#applyDocumentAppearance()
  }

  /** The inspector's sections for the document, shown when no node is selected. */
  inspectorSections(): Array<InspectorSection> {
    return InspectorDefaults.document(this)
  }

  get backgroundColor(): DocumentColor {
    return Colors.clone(this.#backgroundColor)
  }

  set backgroundColor(value: DocumentColor) {
    this.#backgroundColor = Colors.clone(value)
    this.#applyDocumentAppearance()
  }

  /** Where nodes narrower than the page sit when their alignment is Automatic. */
  get alignment(): Alignments {
    return this.#alignment
  }

  set alignment(value: Alignments) {
    this.#alignment = value == Alignments.automatic ? Alignments.leading : value
    this.renderDocument()
  }

  /** The alignment of text whose alignment is Automatic. */
  get textAlignment(): Alignments {
    return this.#textAlignment
  }

  set textAlignment(value: Alignments) {
    this.#textAlignment = value == Alignments.automatic ? Alignments.leading : value
    this.renderDocument()
  }

  get direction(): Directions {
    return this.#direction
  }

  set direction(value: Directions) {
    this.#direction = value
    this.#applyDocumentAppearance()
  }

  /** True when the document changed since it was loaded or isChanged was cleared. */
  get isChanged(): boolean {
    return this.#isChanged
  }

  set isChanged(value: boolean) {
    this.#isChanged = value
  }

  get isEditingText(): boolean {
    return this.#activeHost !== null
  }

  /** The text being edited, if any. */
  get activeHost(): TextHost | null {
    return this.#activeHost
  }

  /** The primary selected node. */
  get selectedNode(): Node | null {
    return this.#selected[this.#selected.length - 1] || null
  }

  selectedNodes(): Array<Node> {
    return this.#selected.slice()
  }

  // Rendering

  render() {
    if (!this.#parentElement) return
    if (this.#element) {
      this.#heightObserver?.disconnect()
      document.removeEventListener("selectionchange", this.#selectionChangeHandler)
      this.#element.remove()
    }

    let root = Utilities.element("div", "scv-editor")
    root.id = this.id
    if (this.#class.length > 0) root.classList.add(...this.#class.split(" ").filter(name => name.length > 0))
    root.classList.toggle("scv-adaptive", this.#adaptiveHeight)
    root.classList.toggle("scv-readonly", this.#readOnly)
    this.#element = root

    this.#toolbarElement = Utilities.element("div", "scv-toolbar", {role: "toolbar"})
    this.#toolbarElement.classList.toggle("d-none", !this.#toolbarVisible)
    this.#attachCustomizerTargets(this.#toolbarElement)
    this.#customizer = null
    root.append(this.#toolbarElement)

    this.#searchContainer = Utilities.element("div", "scv-search-container")
    root.append(this.#searchContainer)

    this.#scrollerElement = Utilities.element("div", "scv-scroller")
    root.append(this.#scrollerElement)
    this.#scrollerElement.addEventListener("scroll", () => {
      this.#positionNodeToolbar()
      this.dispatchEvent(new CustomEvent("scrollChanged", {detail: {x: this.#scrollerElement.scrollLeft, y: this.#scrollerElement.scrollTop}}))
    })

    this.#pageElement = Utilities.element("div", "scv-page")
    this.#scrollerElement.append(this.#pageElement)

    this.#documentElement = Utilities.element("div", "scv-document")
    this.#pageElement.append(this.#documentElement)

    this.#gutterElement = Utilities.element("div", "scv-gutter d-none", {contenteditable: "false"})
    this.#pageElement.append(this.#gutterElement)
    this.#buildGutter()

    this.#nodeToolbarElement = Utilities.element("div", "scv-node-toolbar d-none", {role: "toolbar"})
    this.#pageElement.append(this.#nodeToolbarElement)

    this.#dropIndicator = Utilities.element("div", "scv-drop-indicator d-none")
    this.#pageElement.append(this.#dropIndicator)

    this.#annotationLayer = Utilities.element("div", "scv-annotation-layer", {contenteditable: "false"})
    this.#pageElement.append(this.#annotationLayer)

    this.#presenceLayer = Utilities.element("div", "scv-presence-layer", {contenteditable: "false", "aria-hidden": "true"})
    this.#pageElement.append(this.#presenceLayer)

    this.#statusBarElement = Utilities.element("div", "scv-statusbar", {role: "group", "aria-label": this.strings.TextStatusBarCaption})
    this.#statusBarElement.classList.toggle("d-none", !this.#statusBarVisible)
    root.append(this.#statusBarElement)
    this.statusBar.attach(this.#statusBarElement)

    this.#messagesElement = Utilities.element("div", "scv-messages")
    root.append(this.#messagesElement)

    this.#disabledLayer = Utilities.element("div", "scv-disabled-layer")
    this.#disabledLayer.classList.toggle("d-none", this.#enabled)
    root.append(this.#disabledLayer)

    this.#attachEvents()
    this.#parentElement.append(root)
    this.#heightObserver?.observe(root)
    document.addEventListener("selectionchange", this.#selectionChangeHandler)

    this.#renderToolbar()
    this.#applyDocumentAppearance()
    this.renderDocument()
  }

  /** Removes the editor from the page and releases its listeners. */
  destroy() {
    Popup.closeAll()
    this.statusBar.detach()
    this.autosave.dispose()
    this.#heightObserver?.disconnect()
    if (typeof document != "undefined") document.removeEventListener("selectionchange", this.#selectionChangeHandler)
    if (this.#element) this.#element.remove()
    this.#element = null
  }

  #applyDocumentAppearance() {
    let element = this.#documentElement
    if (!element) return
    element.style.fontFamily = Utilities.fontFamilyCSS(this.#fontName)
    element.style.fontSize = `${this.#fontSize}px`
    let white = Colors.make(255, 255, 255)
    element.style.backgroundColor = Colors.equals(this.#backgroundColor, white) ? "" : Colors.toCSS(this.#backgroundColor)
    element.setAttribute("style", element.getAttribute("style").replace(/background-image[^;]*;?|background-size[^;]*;?|background-repeat[^;]*;?|background-position[^;]*;?/g, "") + (this.backgroundImage.isEmpty ? "" : ";" + this.backgroundImage.toCSS()))
    if (this.#direction == Directions.rightToLeft) {
      element.dir = "rtl"
    } else if (this.#direction == Directions.leftToRight) {
      element.dir = "ltr"
    } else {
      element.removeAttribute("dir")
    }
  }

  /** Rebuilds every node's DOM. */
  renderDocument() {
    if (!this.#documentElement) return
    let state = this.captureSelection()
    this.#documentElement.textContent = ""
    this.mountChildren(this.#nodes, this.#documentElement, null)
    this.#applySelectionClasses()
    if (state && this.#documentElement.contains(document.activeElement)) this.restoreSelection(state)
    this.#renderNodeToolbar()
    this.#schedulePresence()
  }

  /** Renders a list of nodes into a container element. Container nodes call this for their children. */
  mountChildren(list: Array<Node>, container: HTMLElement, owner: Node | null) {
    this.#listElements.set(list, container)
    this.#listOwners.set(list, owner)
    container.classList.add("scv-children")
    container.textContent = ""
    list.forEach(child => {
      child.parent = owner
      container.append(this.renderNode(child))
    })
    container.classList.toggle("scv-children-empty", list.length == 0)
    if (container === this.#documentElement) this.#updateEmptyDocument()
  }

  /**
   * An empty document can take the keyboard focus, so a paragraph can be started from the
   * keyboard. Otherwise the document takes the focus only when it is selected by a click on
   * empty space, so shortcuts such as undo keep working.
   */
  #updateEmptyDocument() {
    let element = this.#documentElement
    if (!element) return
    let empty = this.#nodes.length == 0
    element.classList.toggle("scv-children-empty", empty)
    element.tabIndex = empty && !this.#readOnly ? 0 : -1
  }

  /** Builds a node's DOM for this editor. */
  renderNode(node: Node): HTMLElement {
    node.editor = this
    let element = node.render()
    element.tabIndex = -1
    element.classList.toggle("scv-locked", node.locked)
    if (this.#selected.indexOf(node) >= 0) element.classList.add("scv-selected")
    node.hosts().forEach(host => host.editable = this.isEditingNode(node))
    return element
  }

  /** Rebuilds one node in place, keeping the caret in its text. */
  refreshNode(node: Node) {
    let old = node.element
    if (!old || !old.parentNode) return
    let state = this.captureSelection()
    let keepFocus = old.contains(document.activeElement)
    let replacement = this.renderNode(node)
    old.replaceWith(replacement)
    if (keepFocus && state) {
      if (state.nodeId == node.nodeId || node.descendants().some(child => child.nodeId == state.nodeId)) {
        this.restoreSelection(state)
      } else {
        replacement.focus({preventScroll: true})
      }
    }
    this.#applySelectionClasses()
    this.#renderNodeToolbar()
  }

  /** Puts a list's nodes into its container in order, rendering new ones. */
  #syncList(list: Array<Node>) {
    let container = this.#listElements.get(list)
    if (!container) return
    let owner = this.#listOwners.get(list) || null
    let expected = new Set<HTMLElement>()
    list.forEach(child => {
      child.parent = owner
      child.editor = this
      if (!child.element || child.element.parentElement !== container) {
        if (child.element) child.element.remove()
        this.renderNode(child)
      }
      expected.add(child.element)
    })
    Array.from(container.children).forEach(child => {
      if (child.classList.contains("scv-node") && !expected.has(child as HTMLElement)) child.remove()
    })
    list.forEach(child => container.append(child.element))
    container.classList.toggle("scv-children-empty", list.length == 0)
    if (container === this.#documentElement) this.#updateEmptyDocument()
  }

  // Document structure

  /** The root nodes. */
  nodes(): Array<Node> {
    return this.#nodes.slice()
  }

  nodeAt(index: number): Node | null {
    return this.#nodes[index] || null
  }

  get lastNodeIndex(): number {
    return this.#nodes.length - 1
  }

  /** Every node, including those inside containers, in document order. */
  allNodes(): Array<Node> {
    let result: Array<Node> = []
    this.#nodes.forEach(node => {
      result.push(node)
      result.push(...node.descendants())
    })
    return result
  }

  nodeWithID(identifier: string): Node | null {
    return this.allNodes().find(node => node.nodeId == identifier) || null
  }

  /** The list that holds node: the root list or a container's list. */
  listContaining(node: Node): Array<Node> | null {
    if (this.#nodes.indexOf(node) >= 0) return this.#nodes
    let owner = node.parent
    if (owner) {
      let list = owner.childLists().find(candidate => candidate.indexOf(node) >= 0)
      if (list) return list
    }
    for (let candidate of this.allNodes()) {
      let list = candidate.childLists().find(items => items.indexOf(node) >= 0)
      if (list) return list
    }
    return null
  }

  #ownerOf(list: Array<Node>): Node | null {
    if (list === this.#nodes) return null
    if (this.#listOwners.has(list)) return this.#listOwners.get(list)
    return this.allNodes().find(node => node.childLists().indexOf(list) >= 0) || null
  }

  addNode(node: Node) {
    this.insertNodes(this.#nodes, this.#nodes.length, [node], null)
  }

  insertNode(index: number, node: Node) {
    this.insertNodes(this.#nodes, index, [node], null)
  }

  removeNodeAt(index: number) {
    let node = this.#nodes[index]
    if (node) this.removeNodes([node])
  }

  removeNode(node: Node) {
    this.removeNodes([node])
  }

  removeAllNodes() {
    this.history.checkpoint()
    this.#nodes.splice(0, this.#nodes.length)
    this.#selected = []
    this.#syncList(this.#nodes)
    this.#documentChanged(null)
  }

  /** Inserts nodes into a list at index. */
  insertNodes(list: Array<Node>, index: number, nodes: Array<Node>, owner?: Node | null) {
    if (nodes.length == 0) return
    this.history.checkpoint()
    if (owner === undefined) owner = this.#ownerOf(list)
    nodes.forEach(node => {
      node.editor = this
      node.parent = owner
    })
    list.splice(Utilities.clamp(index, 0, list.length), 0, ...nodes)
    if (this.#listElements.has(list)) {
      this.#syncList(list)
    } else if (owner) {
      owner.refresh()
    }
    this.recognizeSuggestions(nodes)
    this.#documentChanged(nodes[0])
  }

  insertNodesAfter(reference: Node, nodes: Array<Node>) {
    let list = this.listContaining(reference) || this.#nodes
    this.insertNodes(list, list.indexOf(reference) + 1, nodes, reference.parent)
  }

  insertNodesBefore(reference: Node, nodes: Array<Node>) {
    let list = this.listContaining(reference) || this.#nodes
    this.insertNodes(list, Math.max(0, list.indexOf(reference)), nodes, reference.parent)
  }

  /** Replaces a node with other nodes. Passing the node itself among them keeps it. */
  replaceNode(node: Node, replacements: Array<Node>) {
    let list = this.listContaining(node)
    if (!list) return
    this.history.checkpoint()
    let index = list.indexOf(node)
    replacements.forEach(replacement => {
      replacement.editor = this
      replacement.parent = node.parent
    })
    list.splice(index, 1, ...replacements)
    if (replacements.indexOf(node) < 0) this.#selected = this.#selected.filter(item => item !== node)
    if (replacements.indexOf(node) >= 0 && node.element) {
      let state = this.captureSelection()
      node.element.remove()
      node.element = null
      this.#syncList(list)
      if (state) this.restoreSelection(state)
    } else {
      this.#syncList(list)
    }
    this.#documentChanged(replacements[0] || null)
  }

  /** Removes nodes. selectNext selects the node that takes their place. */
  removeNodes(nodes: Array<Node>, selectNext: boolean = true) {
    let removable = nodes.filter(node => !node.locked)
    if (removable.length == 0 || this.#readOnly) return
    this.history.checkpoint()
    let focusTarget: Node | null = null
    removable.forEach(node => {
      let list = this.listContaining(node)
      if (!list) return
      let index = list.indexOf(node)
      focusTarget = list[index + 1] || list[index - 1] || node.parent
      list.splice(index, 1)
      this.#syncList(list)
    })
    this.#selected = this.#selected.filter(node => removable.indexOf(node) < 0)
    if (this.#editingNode && (removable.indexOf(this.#editingNode) >= 0 || removable.some(node => node.descendants().indexOf(this.#editingNode) >= 0))) {
      this.#editingNode = null
      this.#activeHost = null
    }
    if (!selectNext) {
      this.selectNodes([])
    } else if (focusTarget && removable.indexOf(focusTarget) < 0) {
      this.selectNode(focusTarget)
    }
    this.#documentChanged(null)
  }

  /** Moves a node up (negative) or down (positive) within its list. */
  moveNode(node: Node, delta: number) {
    this.moveNodes([node], delta)
  }

  /**
   * Moves nodes up (negative) or down (positive) one place within their lists,
   * keeping their order. A group already at the edge of its list stays put. One undo step.
   */
  moveNodes(nodes: Array<Node>, delta: number) {
    nodes = this.inDocumentOrder(nodes).filter(node => !node.locked)
    if (nodes.length == 0 || this.#readOnly || delta == 0) return
    let groups = new Map<Array<Node>, Array<Node>>()
    nodes.forEach(node => {
      let list = this.listContaining(node)
      if (!list) return
      if (!groups.has(list)) groups.set(list, [])
      groups.get(list).push(node)
    })
    let movable = Array.from(groups.entries()).filter(([list, members]) => {
      let indexes = members.map(member => list.indexOf(member))
      return delta < 0 ? Math.min(...indexes) > 0 : Math.max(...indexes) < list.length - 1
    })
    if (movable.length == 0) return
    this.history.checkpoint()
    let state = this.captureSelection()
    movable.forEach(([list, members]) => {
      let ordered = members.slice().sort((a, b) => (list.indexOf(a) - list.indexOf(b)) * (delta < 0 ? 1 : -1))
      ordered.forEach(member => {
        let index = list.indexOf(member)
        let target = index + (delta < 0 ? -1 : 1)
        list.splice(index, 1)
        list.splice(target, 0, member)
      })
      this.#syncList(list)
    })
    if (state) this.restoreSelection(state)
    nodes[delta < 0 ? 0 : nodes.length - 1].element?.scrollIntoView({block: "nearest"})
    this.#documentChanged(nodes[0])
    this.#renderNodeToolbar()
  }

  /** Moves a node to a list position, such as after a drag. */
  moveNodeTo(node: Node, list: Array<Node>, index: number) {
    this.moveNodesTo([node], list, index)
  }

  /** Moves nodes, in document order, to a list position. One undo step. */
  moveNodesTo(nodes: Array<Node>, list: Array<Node>, index: number) {
    nodes = this.inDocumentOrder(nodes).filter(node => !node.locked)
    if (nodes.length == 0 || this.#readOnly) return
    // A node can't move into itself.
    if (nodes.some(node => node.childLists().indexOf(list) >= 0 || node.descendants().some(child => child.childLists().indexOf(list) >= 0))) return
    // Nodes inside another moved node move with it.
    nodes = nodes.filter(node => !nodes.some(other => other !== node && other.descendants().indexOf(node) >= 0))
    this.history.checkpoint()
    let touched: Array<Array<Node>> = [list]
    nodes.forEach(node => {
      let current = this.listContaining(node)
      if (!current) return
      let currentIndex = current.indexOf(node)
      if (current === list && currentIndex < index) index--
      current.splice(currentIndex, 1)
      if (touched.indexOf(current) < 0) touched.push(current)
    })
    index = Utilities.clamp(index, 0, list.length)
    list.splice(index, 0, ...nodes)
    let owner = this.#ownerOf(list)
    nodes.forEach(node => {
      node.parent = owner
      node.element?.remove()
      node.element = null
    })
    touched.forEach(changed => this.#syncList(changed))
    this.selectNodes(nodes)
    this.#documentChanged(nodes[0])
  }

  /** Copies nodes, placing each copy after its original, and selects the copies. One undo step. */
  duplicateNodes(nodes: Array<Node>) {
    nodes = this.inDocumentOrder(nodes).filter(node => !node.locked)
    if (nodes.length == 0 || this.#readOnly) return
    this.history.checkpoint()
    let copies: Array<Node> = []
    this.history.suspend(() => {
      nodes.slice().reverse().forEach(node => {
        let copy = this.cloneNode(node)
        if (copy) {
          this.insertNodesAfter(node, [copy])
          copies.unshift(copy)
        }
      })
    })
    if (copies.length > 0) this.selectNodes(copies)
  }

  /** Whether moveNodes would move any of nodes. */
  canMoveNodes(nodes: Array<Node>, delta: number): boolean {
    if (this.#readOnly) return false
    return nodes.some(node => {
      let list = this.listContaining(node)
      if (!list || node.locked) return false
      let index = list.indexOf(node)
      return delta < 0 ? index > 0 && nodes.indexOf(list[index - 1]) < 0 : index < list.length - 1 && nodes.indexOf(list[index + 1]) < 0
    })
  }

  /** nodes sorted into the order they appear in the document. */
  inDocumentOrder(nodes: Array<Node>): Array<Node> {
    let order = this.allNodes()
    return nodes.filter((node, index) => nodes.indexOf(node) == index && order.indexOf(node) >= 0).sort((a, b) => order.indexOf(a) - order.indexOf(b))
  }

  /** Selects every node from one node to another in document order, keeping from as the anchor. */
  selectRange(from: Node, to: Node) {
    let order = this.#selectableNodes()
    let start = order.indexOf(from)
    let end = order.indexOf(to)
    if (start < 0 || end < 0) {
      this.selectNode(to)
      return
    }
    let range = order.slice(Math.min(start, end), Math.max(start, end) + 1)
    // Nested nodes are covered by their container.
    range = range.filter(node => !range.some(other => other !== node && other.descendants().indexOf(node) >= 0))
    if (range.indexOf(to) < 0) range.push(to)
    // The node reached last is the primary selection.
    this.selectNodes(range.filter(node => node !== to).concat([to]))
    this.#anchorNode = from
  }

  /** Copies a node, giving it and its descendants new IDs. */
  cloneNode(node: Node): Node | null {
    return this.nodeFromJSON(Editor.renewIDs(node.toJSON()))
  }

  static renewIDs(data: any): any {
    if (Array.isArray(data)) return data.map(item => Editor.renewIDs(item))
    if (data && typeof data == "object") {
      let result = {}
      Object.keys(data).forEach(key => {
        result[key] = key == "nodeId" ? Utilities.uuid() : Editor.renewIDs(data[key])
      })
      return result
    }
    return data
  }

  /** Builds a node from its JSON using the registered types. Unknown types are kept as they are. */
  nodeFromJSON(data: any): Node | null {
    if (!data || typeof data != "object") return null
    let type = this.nodeTypes.item(Utilities.string(data.type))
    let node: Node = type ? new type() : new UnknownNode()
    node.editor = this
    if (!node.fromJSON(data)) return null
    return node
  }

  /** Inserts a node of a registered type where the user is working, and starts editing it. */
  insertNodeOfType(type: NodeClass | string, replace: Node | null = null): Node | null {
    let nodeClass = typeof type == "string" ? this.nodeTypes.item(type) : type
    if (!nodeClass || this.#readOnly) return null
    return this.insertNewNode(nodeClass.create(this), replace)
  }

  /**
   * Inserts a node made for this editor where the user is working, as insertNodeOfType does:
   * at the caret, in place of an empty paragraph, or after the selected node. One undo step.
   */
  insertNewNode(node: Node, replace: Node | null = null): Node | null {
    if (this.#readOnly) return null
    node.editor = this
    let host = this.#activeHost
    let point = host ? host.node.insertionPoint(host) : null
    if (replace && replace.element) {
      this.replaceNode(replace, [node])
    } else if (host && point) {
      host.node.revealContent()
      this.insertNodes(point.list, point.index, [node], host.node)
    } else {
      let reference = host ? host.node : this.selectedNode
      if (reference && reference.constructor === TextNode && (reference as TextNode).content.length == 0) {
        this.replaceNode(reference, [node])
      } else if (reference) {
        this.insertNodesAfter(reference, [node])
      } else {
        this.addNode(node)
      }
    }
    if (node.hosts().length > 0) {
      this.focusNode(node, node instanceof TableNode ? 0 : undefined)
    } else {
      this.selectNode(node)
      // Keep a paragraph after blocks that hold no text, so typing can continue.
      let list = this.listContaining(node)
      if (list && list.indexOf(node) == list.length - 1) {
        let paragraph = new TextNode()
        this.insertNodesAfter(node, [paragraph])
        this.selectNode(node)
      }
    }
    node.inserted()
    return node
  }

  // Conversion

  /**
   * Turns text blocks into another kind: "text", "heading" (with level),
   * "quote", "alert" (with alert type), "codeblock", or "list" (with list type).
   * Selecting a list's own type turns it back into paragraphs.
   */
  setBlockType(kind: string, value: number = 0, target: TextHost | null = null) {
    if (this.#readOnly) return
    let host = target || this.#activeHost
    let selection = host ? host.selection() : null
    let nodes = host ? [host.node] : this.#selected
    nodes = nodes.filter(node => node instanceof TextNode && node.isTextBlock && !node.locked)
    if (nodes.length == 0) return
    this.history.checkpoint()
    let focusTarget: Node | null = null
    let converted: Array<Node> = []
    nodes.forEach(node => {
      let replacement = this.convertTextBlock(node as TextNode, kind, value)
      if (replacement.length == 0) return
      converted.push(...replacement)
      if (replacement.length == 1 && replacement[0] === node) {
        node.refresh()
        node.changed()
      } else {
        this.replaceNode(node, replacement)
      }
      focusTarget = replacement[0]
    })
    if (focusTarget && host) {
      let target: Node = focusTarget
      let offset = selection ? Math.min(selection.start, target.primaryHost ? target.primaryHost.rich.length : 0) : 0
      this.focusNode(target, offset)
    } else if (converted.length > 0) {
      this.selectNodes(converted)
    }
    this.updateToolbarState()
  }

  /**
   * The blocks a text block becomes for setBlockType: the block itself when it
   * handles the conversion, or a block of the registered type named by kind made
   * from its plain content. Unregistered kinds convert nothing.
   */
  convertTextBlock(node: TextNode, kind: string, value: number): Array<Node> {
    let own = node.convertBlock(kind, value)
    if (own) return own
    let type = kind == "text" ? TextNode as NodeClass : this.nodeTypes.item(kind)
    if (!type || !type.fromBlockContent) return []
    if (type === TextNode && node.constructor === TextNode) return [node]
    return type.fromBlockContent(node.plainContent(), value, node)
  }

  /** The block type menu entries of the registered text types: [identifier, caption, icon]. */
  #blockKindEntries(compact: boolean): Array<[string, string, string]> {
    let result: Array<[string, string, string]> = []
    this.nodeTypes.items().forEach(type => {
      let kinds = Editor.ownStatic(type, "blockKinds")
      if (kinds) result.push(...kinds.call(type, this.strings, compact))
    })
    return result
  }

  /** Whether a block type menu entry describes the current kind, such as "alert:0" for any alert. */
  static #blockKindMatches(identifier: string, kind: string, entries: Array<[string, string, string]>): boolean {
    if (identifier == kind) return true
    if (entries.some(entry => entry[0] == kind)) return false
    let prefix = identifier.split(":")[0]
    return identifier.indexOf(":") > 0 && kind.startsWith(prefix + ":")
  }

  /** The current block kind for the toolbar: "text", "heading:2", "list:1"... */
  #currentBlockKind(): string {
    let node = this.#activeHost ? this.#activeHost.node : this.selectedNode
    return node ? node.blockKind : ""
  }

  // Selection

  /** Starts editing a node's text at offset (the end when omitted), or selects the node when it has no text. */
  focusNode(node: Node, offset?: number, hostIndex: number = 0) {
    if (!node.element) return
    this.revealNode(node)
    let host = node.hosts()[hostIndex] || node.primaryHost
    if (host && !this.#readOnly && !node.locked) {
      host.select(offset === undefined ? host.rich.length : offset)
      host.element.scrollIntoView({block: "nearest"})
    } else {
      this.selectNode(node)
    }
  }

  /** The node whose text is being edited, or null when nodes are only selected. */
  get editingNode(): Node | null {
    return this.#editingNode
  }

  /** True when node's text can be edited right now: it is the node being edited. */
  isEditingNode(node: Node): boolean {
    return !this.#readOnly && !node.locked && node === this.#editingNode
  }

  /**
   * Starts editing a node's text, with the caret at offset (the end when omitted).
   * Selecting a node doesn't make it editable; double-click, Return or this does.
   */
  beginEditing(node: Node | null = this.selectedNode, offset?: number, hostIndex: number = 0) {
    if (!node) return
    this.focusNode(node, offset, hostIndex)
  }

  /** Stops editing text, leaving the node selected. */
  endEditing() {
    let node = this.#editingNode
    if (!node) return
    this.#editingNode = null
    this.#activeHost = null
    this.#pending = null
    this.history.breakCoalescing()
    node.hosts().forEach(host => host.editable = false)
    let selection = window.getSelection()
    if (selection && this.#documentElement && this.#documentElement.contains(selection.anchorNode)) selection.removeAllRanges()
    this.dispatchEvent(new CustomEvent("editingChanged", {detail: {node: null}}))
  }

  /** Makes node the one being edited, so its text becomes editable. */
  #setEditingNode(node: Node) {
    if (this.#editingNode === node) return
    let previous = this.#editingNode
    this.#editingNode = node
    if (previous) previous.hosts().forEach(host => host.editable = false)
    node.hosts().forEach(host => host.editable = this.isEditingNode(node))
    this.dispatchEvent(new CustomEvent("editingChanged", {detail: {node: node}}))
  }

  /** Selects a node as a whole, ending text editing. */
  selectNode(node: Node, addToSelection: boolean = false) {
    if (!node) return
    let nodes = addToSelection ? this.#selected.filter(item => item !== node).concat([node]) : [node]
    this.selectNodes(nodes)
  }

  selectNodes(nodes: Array<Node>) {
    this.endEditing()
    if (nodes.length <= 1 || !this.#anchorNode || nodes.indexOf(this.#anchorNode) < 0) this.#anchorNode = nodes[0] || null
    let selection = window.getSelection()
    if (selection && this.#documentElement && this.#documentElement.contains(selection.anchorNode)) selection.removeAllRanges()
    this.#activeHost = null
    this.#setSelection(nodes, true)
    let primary = this.selectedNode
    if (primary && primary.element) {
      primary.element.focus({preventScroll: true})
      primary.element.scrollIntoView({block: "nearest"})
    }
  }

  #setSelection(nodes: Array<Node>, nodeMode: boolean) {
    let previous = this.selectedNode
    this.#selected = nodes.slice()
    // A node inside a collapsed section is shown by expanding the section.
    nodes.forEach(node => {
      for (let parent = node.parent; parent; parent = parent.parent) parent.revealContent()
    })
    this.#element?.classList.toggle("scv-node-mode", nodeMode && nodes.length > 0)
    this.#applySelectionClasses()
    this.#renderNodeToolbar()
    if (previous !== this.selectedNode) this.dispatchEvent(new CustomEvent("selectionChanged", {detail: {node: this.selectedNode}}))
    this.#collaborationClient?.editorSelectionChanged(previous !== this.selectedNode)
    this.updateToolbarState()
  }

  #applySelectionClasses() {
    if (!this.#documentElement) return
    this.#documentElement.querySelectorAll(".scv-node.scv-selected").forEach(element => element.classList.remove("scv-selected"))
    this.#selected.forEach(node => node.element?.classList.add("scv-selected"))
  }

  #onSelectionChange() {
    if (!this.#documentElement) return
    let selection = window.getSelection()
    let host: TextHost | null = null
    if (selection && selection.rangeCount > 0 && this.#documentElement.contains(selection.anchorNode)) {
      host = TextHost.from(selection.anchorNode, this.#documentElement)
    }
    if (host !== this.#activeHost) {
      if (this.#activeHost === null && host === null) return
      this.history.breakCoalescing()
      this.#activeHost = host
    }
    if (host && !this.#readOnly && host.node !== this.#editingNode) {
      // Text can only be selected in the node being edited, unless the editor is read-only.
      if (host.node.locked) {
        host = null
        this.#activeHost = null
      } else {
        this.#setEditingNode(host.node)
      }
    }
    if (this.#suggestionState) {
      let state = this.#suggestionState
      let range = host === state.host ? host.selection() : null
      if (!range || range.start != range.end || range.start != state.request.startPosition + state.request.length) this.#updateSuggestions(host)
    }
    if (host) {
      this.#noteCaretPosition(host)
      if (this.#pending) {
        let range = host.selection()
        if (this.#pending.host !== host || !range || range.start != this.#pending.offset || range.end != range.start) this.#pending = null
      }
      if (this.#selected.length != 1 || this.#selected[0] !== host.node || this.#element.classList.contains("scv-node-mode")) this.#setSelection([host.node], false)
    } else if (this.#element && !this.#element.classList.contains("scv-node-mode")) {
      this.#pending = null
    }
    this.#collaborationClient?.editorSelectionChanged(false)
    this.updateToolbarState()
  }

  /** Opens collapsed sections that contain node. */
  revealNode(node: Node) {
    let parent = node.parent
    while (parent) {
      parent.revealContent()
      parent = parent.parent
    }
  }

  scrollToNode(node: Node) {
    this.revealNode(node)
    node.element?.scrollIntoView({block: "start", behavior: "smooth"})
  }

  scrollTo(x: number, y: number) {
    this.#scrollerElement?.scrollTo(x, y)
  }

  /** The selection, as IDs and offsets that survive re-rendering. */
  captureSelection(): SelectionState | null {
    let host = this.#activeHost
    if (host && host.element.isConnected) {
      let range = host.selection()
      if (range) return {nodeId: host.node.nodeId, hostIndex: host.index, start: range.start, end: range.end, nodeIds: []}
    }
    if (this.#selected.length > 0) return {nodeId: "", hostIndex: -1, start: 0, end: 0, nodeIds: this.#selected.map(node => node.nodeId)}
    return null
  }

  restoreSelection(state: SelectionState | null) {
    if (!state) return
    if (state.nodeId.length > 0) {
      let node = this.nodeWithID(state.nodeId)
      let host = node ? node.hosts()[state.hostIndex] : null
      if (host) {
        host.select(state.start, state.end)
        this.#activeHost = host
        this.#setSelection([node], false)
        return
      }
      if (node) {
        this.selectNode(node)
        return
      }
    }
    let nodes = state.nodeIds.map(identifier => this.nodeWithID(identifier)).filter(node => node !== null)
    if (nodes.length > 0) this.selectNodes(nodes)
  }

  /** The selected text, or the plain text of the selected nodes. */
  selectedText(): string {
    let host = this.#activeHost
    if (host) {
      let range = host.selection()
      return range ? host.rich.text.substring(range.start, range.end).replace(/\u2028/g, "\n") : ""
    }
    return this.inDocumentOrder(this.#selected).map(node => node.toPlainText()).join("\n")
  }

  /** Records the text being edited right away, before the browser reports the selection change. */
  hostActivated(host: TextHost) {
    this.#noteCaretPosition(host)
    if (!this.#readOnly && !host.node.locked) this.#setEditingNode(host.node)
    if (this.#activeHost === host) return
    this.history.breakCoalescing()
    this.#activeHost = host
    if (this.#selected.length != 1 || this.#selected[0] !== host.node || this.#element.classList.contains("scv-node-mode")) this.#setSelection([host.node], false)
  }

  /** Remembers which table cell or radio option has the caret, for commands and the inspector. */
  #noteCaretPosition(host: TextHost) {
    let node = host.node
    node.noteCaretHost(host)
  }

  pendingStyle(): TextStyle | null {
    return this.#pending ? this.#pending.style : null
  }

  /** Sets the style the next typed text at offset receives. */
  setPendingStyle(host: TextHost, offset: number, style: TextStyle) {
    this.#pending = {host: host, offset: offset, style: style}
  }

  // Changes

  /** Called by nodes after their content or persistent properties change. */
  nodeChanged(node: Node | null) {
    this.#isChanged = true
    if (this.#updateDepth > 0) {
      this.#deferredChange = true
      return
    }
    this.#syncAnnotations()
    this.dispatchEvent(new CustomEvent("contentChanged", {detail: {node: node}}))
    this.#collaborationClient?.editorContentChanged(node)
    if (!node || node instanceof HeadingNode) this.#scheduleTableOfContents()
    this.#positionNodeToolbar()
    this.#scheduleAnnotationMarkers()
    this.#schedulePresence()
  }

  #documentChanged(node: Node | null) {
    this.#scheduleTableOfContents()
    this.nodeChanged(node)
  }

  #scheduleTableOfContents() {
    if (!this.#element) return
    clearTimeout(this.#tocTimer)
    this.#tocTimer = setTimeout(() => {
      this.allNodes().forEach(node => { if (node.followsHeadings) this.refreshNode(node) })
    }, 250)
  }

  /** Starts a batch of changes. Events wait until the matching endUpdate. Batches may be nested. */
  beginUpdate() {
    this.#updateDepth++
  }

  endUpdate() {
    if (this.#updateDepth == 0) return
    this.#updateDepth--
    if (this.#updateDepth == 0 && this.#deferredChange) {
      this.#deferredChange = false
      this.nodeChanged(null)
    }
  }

  /** A unique fragment identifier for a heading, from its text. */
  anchorFor(heading: HeadingNode): string {
    let used: {[key: string]: number} = {}
    for (let node of this.allNodes()) {
      if (!(node instanceof HeadingNode)) continue
      let slug = Utilities.slug(node.text) || "section"
      let count = used[slug] || 0
      used[slug] = count + 1
      if (node === heading) return count == 0 ? slug : `${slug}-${count}`
    }
    return Utilities.slug(heading.text)
  }

  // Text editing

  /** Inserts text at the caret, replacing the selection. Returns false when no text is being edited. */
  insertText(value: string): boolean {
    let host = this.#activeHost
    if (!host || this.#readOnly) return false
    this.#insertRich(host, this.#textToRich(host, value))
    return true
  }

  /** Replaces text in the node being edited. */
  replaceText(start: number, length: number, value: string, style?: TextStyle): boolean {
    let host = this.#activeHost || (this.selectedNode ? this.selectedNode.primaryHost : null)
    if (!host || this.#readOnly) return false
    this.history.checkpoint()
    host.rich.remove(start, start + length)
    host.rich.insert(start, value, style)
    host.render()
    host.select(start + value.length)
    host.node.textChanged(host)
    host.node.changed()
    return true
  }

  deleteText(host: TextHost, start: number, end: number) {
    if (this.#readOnly) return
    this.history.checkpoint()
    host.rich.remove(start, end)
    if (host.mode == TextHostModes.list) host.sync()
    host.render()
    host.select(start)
    host.node.textChanged(host)
    host.node.changed()
  }

  #textToRich(host: TextHost, value: string): RichText {
    let normalized = value.replace(/\r\n?/g, "\n")
    if (host.mode == TextHostModes.inline) normalized = normalized.replace(/\n/g, LineBreak)
    if (host.mode == TextHostModes.list) normalized = normalized.replace(/\n/g, LineBreak)
    let selection = host.selection()
    let style = this.#pending && this.#pending.host === host ? this.#pending.style : (host.rich.length == 0 && host.node instanceof TextNode ? host.node.baseStyle() : host.rich.insertionStyleAt(selection ? selection.start : 0))
    if (host.mode == TextHostModes.plain) style = new TextStyle()
    return new RichText(normalized, style)
  }

  #insertRich(host: TextHost, rich: RichText) {
    let selection = host.selection() || {start: host.rich.length, end: host.rich.length}
    this.history.checkpoint()
    host.rich.remove(selection.start, selection.end)
    let content = rich
    if (host.mode == TextHostModes.plain) {
      content = new RichText(rich.text.replace(/\u2028/g, "\n"))
    } else if (host.mode == TextHostModes.inline || host.mode == TextHostModes.list) {
      content = rich.clone()
      content.text = content.text.replace(/\n/g, LineBreak)
    }
    host.rich.insert(selection.start, content)
    if (host.mode == TextHostModes.list) {
      host.rich.listLevels = host.rich.listLevels.slice(0, host.rich.text.split(ParagraphBreak).length)
    }
    this.#pending = null
    host.render()
    host.select(selection.start + content.length)
    host.node.textChanged(host)
    host.node.changed()
  }

  /** Splits a text node at the caret, as Enter does. */
  #splitNode(host: TextHost) {
    let node = host.node as TextNode
    let selection = host.selection()
    if (!selection) return
    this.history.checkpoint()
    if (selection.end > selection.start) host.rich.remove(selection.start, selection.end)
    let offset = selection.start
    if (offset == 0 && host.rich.length > 0) {
      let paragraph = new TextNode()
      this.insertNodesBefore(node, [paragraph])
      host.render()
      host.select(0)
      return
    }
    let following = node.createFollowingNode()
    following.content = host.rich.slice(offset)
    if (following.content.length == 0 && offset > 0) {
      // Carry the formatting at the end into the new paragraph.
      let style = host.rich.styleAt(offset - 1).clone()
      style.linkURL = ""
      style.linkTitle = ""
      style.linkTarget = ""
      if (node instanceof HeadingNode) style = new TextStyle()
      if (!style.isDefault()) this.#pending = null
    }
    host.rich.remove(offset, host.rich.length)
    host.render()
    node.textChanged(host)
    this.insertNodesAfter(node, [following])
    this.focusNode(following, 0)
  }

  /** Backspace at the start of a text node. Returns true when handled. */
  #joinBackward(host: TextHost): boolean {
    let node = host.node
    if (!(node instanceof TextNode) || host !== node.primaryHost || !node.isTextBlock) return false
    if (node.becomesTextOnBackspace) {
      // A heading, quote, alert or code block becomes a paragraph first.
      this.setBlockType("text")
      return true
    }
    let list = this.listContaining(node)
    if (!list) return false
    let index = list.indexOf(node)
    let previous = list[index - 1]
    if (!previous) {
      if (node.content.length == 0 && node.parent && list.length > 1) {
        this.removeNodes([node])
        return true
      }
      return false
    }
    if (previous instanceof TextNode && previous.isTextBlock && previous.primaryHost && !previous.locked) {
      this.history.checkpoint()
      let previousHost = previous.primaryHost
      let offset = previous.content.length
      let addition = previous.joinedContent(node.content.clone())
      previous.content.append(addition)
      previous.content.nodes.push(...node.content.nodes)
      list.splice(index, 1)
      this.#syncList(list)
      previousHost.render()
      previousHost.select(offset)
      previous.textChanged(previousHost)
      this.#documentChanged(previous)
      return true
    }
    if (node.content.length == 0) {
      this.removeNodes([node])
      this.selectNode(previous)
    } else {
      this.selectNode(previous)
    }
    return true
  }

  /** Delete at the end of a text node. Returns true when handled. */
  #joinForward(host: TextHost): boolean {
    let node = host.node
    if (!(node instanceof TextNode) || host !== node.primaryHost || !node.joinsForward) return false
    let list = this.listContaining(node)
    if (!list) return false
    let next = list[list.indexOf(node) + 1]
    if (!next) return false
    if (next instanceof TextNode && next.joinsForward && !next.locked) {
      this.history.checkpoint()
      let offset = node.content.length
      let addition = node.joinedContent(next.content.clone())
      node.content.append(addition)
      list.splice(list.indexOf(next), 1)
      this.#syncList(list)
      host.render()
      host.select(offset)
      node.textChanged(host)
      this.#documentChanged(node)
      return true
    }
    if (next instanceof TextNode && !next.joinsForward) return false
    this.selectNode(next)
    return true
  }

  /** The text hosts and text-less nodes in document order: the places arrow keys move between. */
  #stops(): Array<TextHost | Node> {
    let result: Array<TextHost | Node> = []
    let visit = (node: Node) => {
      let hosts = node.hosts()
      if (hosts.length == 0) {
        result.push(node)
      } else {
        hosts.forEach(host => result.push(host))
      }
      node.childLists().forEach(list => list.forEach(child => {
        if (child.element && child.element.offsetParent !== null) visit(child)
      }))
    }
    this.#nodes.forEach(visit)
    if (result.some(stop => stop instanceof TextHost)) {
      // Hosts of a node come before its children only when that is how they render; keep DOM order.
      result.sort((a, b) => {
        let elementA = a instanceof TextHost ? a.element : a.element
        let elementB = b instanceof TextHost ? b.element : b.element
        if (!elementA || !elementB) return 0
        return elementA.compareDocumentPosition(elementB) & 4 ? -1 : 1
      })
    }
    return result
  }

  /** Every visible node in document order, including those inside containers. */
  #selectableNodes(): Array<Node> {
    return this.allNodes().filter(node => node.element && node.element.offsetParent !== null)
  }

  /** Selects the node before or after the primary selection. Extending adds it to the selection. */
  #selectAdjacentNode(forward: boolean, extend: boolean) {
    let nodes = this.#selectableNodes()
    let current = this.selectedNode
    let index = current ? nodes.indexOf(current) : -1
    let target = nodes[index < 0 ? (forward ? 0 : nodes.length - 1) : index + (forward ? 1 : -1)]
    if (!target) return
    if (extend) {
      this.selectRange(this.#anchorNode && this.#selected.indexOf(this.#anchorNode) >= 0 ? this.#anchorNode : (current || target), target)
    } else {
      this.selectNode(target)
    }
  }

  /** The DOM position under a point, or null. */
  static caretFromPoint(x: number, y: number): {node: globalThis.Node, offset: number} | null {
    let source: any = document
    if (typeof source.caretPositionFromPoint == "function") {
      let position = source.caretPositionFromPoint(x, y)
      if (position) return {node: position.offsetNode, offset: position.offset}
    }
    if (typeof source.caretRangeFromPoint == "function") {
      let range = source.caretRangeFromPoint(x, y)
      if (range) return {node: range.startContainer, offset: range.startOffset}
    }
    return null
  }

  #moveToStop(from: TextHost | Node, delta: number): boolean {
    let stops = this.#stops()
    let index = stops.indexOf(from)
    if (index < 0) return false
    let target = stops[index + delta]
    if (!target) return false
    if (target instanceof TextHost) {
      target.select(delta < 0 ? target.rich.length : 0)
      target.element.scrollIntoView({block: "nearest"})
    } else {
      this.selectNode(target)
    }
    return true
  }

  // Keyboard

  #attachEvents() {
    let documentElement = this.#documentElement
    documentElement.addEventListener("keydown", event => this.#onKeyDown(event))
    documentElement.addEventListener("focus", event => {
      if (event.target === documentElement && this.#nodes.length == 0) this.#startEmptyDocument()
    })
    documentElement.addEventListener("beforeinput", event => this.#onBeforeInput(event as InputEvent))
    documentElement.addEventListener("input", event => this.#onInput(event as InputEvent))
    documentElement.addEventListener("compositionstart", () => this.#composing = true)
    documentElement.addEventListener("compositionend", event => {
      this.#composing = false
      this.#onInput(event as any)
    })
    documentElement.addEventListener("paste", event => this.#onPaste(event))
    documentElement.addEventListener("copy", event => this.#onCopy(event, false))
    documentElement.addEventListener("cut", event => this.#onCopy(event, true))
    documentElement.addEventListener("mousedown", event => this.#onMouseDown(event))
    documentElement.addEventListener("click", event => this.#onClick(event))
    this.#pageElement.addEventListener("contextmenu", event => this.#onContextMenu(event as MouseEvent))
    if (this.#toolbarElement) this.#toolbarElement.addEventListener("contextmenu", event => this.#onToolbarContextMenu(event as MouseEvent))
    this.#pageElement.addEventListener("mousedown", event => {
      if (event.target === this.#pageElement || event.target === this.#documentElement) this.#onBlankPress(event)
    })
    this.#scrollerElement.addEventListener("mousedown", event => {
      if (event.target === this.#scrollerElement) this.#onBlankPress(event)
    })
    this.#pageElement.addEventListener("mousemove", event => {
      this.#onHover(event)
      this.#notePointerNode(event)
      if (this.#collaborationClient) {
        let page = this.#pageElement.getBoundingClientRect()
        this.#collaborationClient.editorPointerMoved(event.clientX - page.left, event.clientY - page.top, this.#pointerAnchor(event.clientX, event.clientY))
      }
    })
    this.#pageElement.addEventListener("mouseleave", () => this.#setPointerNode(null))
    let root = this.#element
    root.addEventListener("mouseenter", event => this.dispatchEvent(new CustomEvent("pointerEnter", {detail: this.#pointerDetail(event)})))
    root.addEventListener("mouseleave", event => this.dispatchEvent(new CustomEvent("pointerExit", {detail: this.#pointerDetail(event)})))
    root.addEventListener("mousemove", event => this.dispatchEvent(new CustomEvent("pointerMoved", {detail: this.#pointerDetail(event)})))
    root.addEventListener("scv-popup-opened", event => {
      let popup = (event as CustomEvent).detail.popup
      this.dispatchEvent(new CustomEvent("pickerOpened", {detail: {picker: popup}}))
    })
    root.addEventListener("scv-popup-closed", event => {
      let popup = (event as CustomEvent).detail.popup
      this.dispatchEvent(new CustomEvent("pickerClosed", {detail: {picker: popup, committed: popup.chosenValue !== null, value: popup.chosenValue}}))
    })
    this.#pageElement.addEventListener("mouseleave", () => this.#positionGutter(null))
    this.#pageElement.addEventListener("dragover", event => this.#onDragOver(event))
    this.#pageElement.addEventListener("dragleave", event => {
      if (!this.#pageElement.contains(event.relatedTarget as globalThis.Node)) this.#dropIndicator.classList.add("d-none")
    })
    this.#pageElement.addEventListener("drop", event => this.#onDrop(event))
    window.addEventListener("resize", () => {
      this.#positionNodeToolbar()
      this.#scheduleAnnotationMarkers()
    })
  }

  static get isMac(): boolean {
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
  }

  #onKeyDown(event: KeyboardEvent) {
    if (event.isComposing || this.#composing) return
    let keyEvent = new CustomEvent("keyPress", {detail: {key: event.key, event: event}, cancelable: true})
    if (!this.dispatchEvent(keyEvent)) {
      event.preventDefault()
      return
    }
    let host = TextHost.from(event.target as globalThis.Node, this.#documentElement)
    if (host && host !== this.#activeHost) this.#activeHost = host

    // Option-Shift-Up and Down (Alt-Shift elsewhere) move the selected nodes, editing or not.
    if (event.altKey && event.shiftKey && !event.metaKey && !event.ctrlKey && (event.key == "ArrowUp" || event.key == "ArrowDown") && this.#selected.length > 0) {
      event.preventDefault()
      this.moveNodes(this.#selected, event.key == "ArrowUp" ? -1 : 1)
      return
    }
    if (this.#handleShortcut(event)) return

    if (host) {
      if (host.node.handleKeyDown(event, host) || event.defaultPrevented) return
      this.#handleTextKey(event, host)
      return
    }

    let target = (event.target as HTMLElement).closest ? (event.target as HTMLElement).closest(".scv-node") : null
    if (target && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test((event.target as HTMLElement).tagName)) return
    this.#handleNodeKey(event)
  }

  #handleShortcut(event: KeyboardEvent): boolean {
    let modifier = Editor.isMac ? event.metaKey : event.ctrlKey
    if (!modifier) {
      if (event.key == "Escape" && this.#activeHost) {
        event.preventDefault()
        this.selectNode(this.#activeHost.node)
        return true
      }
      return false
    }
    let key = event.key.toLowerCase()
    let code = event.code
    let run = (action: () => void) => {
      event.preventDefault()
      action()
      return true
    }
    if (key == "z" && !event.shiftKey) return run(() => this.history.undo())
    if ((key == "z" && event.shiftKey) || key == "y") return run(() => this.history.redo())
    if (key == "f" && !event.altKey) return run(() => this.search.show(false))
    if ((key == "f" && event.altKey) || (key == "h" && !Editor.isMac)) return run(() => this.search.show(true))
    if (key == "p" && event.shiftKey && !event.altKey) return run(() => this.showCommandSearch())
    if (key == "p" && !event.shiftKey && !event.altKey) return run(() => this.print())
    if (event.shiftKey && (key == "arrowup" || key == "arrowdown") && this.selectedNode) return run(() => this.moveNodes(this.#selected, key == "arrowup" ? -1 : 1))
    if (event.altKey && code == "KeyM" && !event.shiftKey) return run(() => this.annotations.show(null))
    if (key == "a" && !event.shiftKey && !this.#activeHost && this.#selected.length > 0) return run(() => this.selection.selectAllNodes())
    if (key == "a" && !event.shiftKey && this.#activeHost) {
      let range = this.#activeHost.selection()
      if (range && range.start == 0 && range.end == this.#activeHost.rich.length) return run(() => this.selection.selectAllNodes())
      return false
    }
    if (this.#readOnly) return false
    if (key == "b" && !event.shiftKey) return run(() => this.formatting.toggle(FormattingStyles.bold))
    if (key == "i" && !event.shiftKey) return run(() => this.formatting.toggle(FormattingStyles.italic))
    if (key == "u" && !event.shiftKey) return run(() => this.formatting.toggle(FormattingStyles.underline))
    if (event.shiftKey && (key == "x" || key == "s")) return run(() => this.formatting.toggle(FormattingStyles.strikethrough))
    if (key == "e" && !event.shiftKey) return run(() => this.formatting.toggle(FormattingStyles.code))
    if (event.shiftKey && key == "h") return run(() => this.formatting.toggle(FormattingStyles.highlight))
    if (key == "." && !event.shiftKey) return run(() => this.formatting.toggle(FormattingStyles.superscript))
    if (key == "," && !event.shiftKey) return run(() => this.formatting.toggle(FormattingStyles.subscript))
    if (key == "k") return run(() => this.formatting.editLink())
    if (key == "\\") return run(() => this.formatting.clearFormatting())
    if (event.altKey && /^Digit[0-6]$/.test(code)) {
      let level = Number(code.substring(5))
      return run(() => level == 0 ? this.setBlockType("text") : this.setBlockType("heading", level))
    }
    for (let extension of Editor.#extensions) {
      if (extension.handleCommandKey && extension.handleCommandKey(this, event)) {
        event.preventDefault()
        return true
      }
    }
    if (event.shiftKey && key == "d" && this.#selected.length > 0) return run(() => this.duplicateNodes(this.#selected))
    return false
  }

  #handleTextKey(event: KeyboardEvent, host: TextHost) {
    let selection = host.selection()
    if (!selection) return
    let collapsed = selection.start == selection.end
    let modifier = event.metaKey || event.ctrlKey || event.altKey

    if (event.key == "Enter" && !this.#readOnly) {
      event.preventDefault()
      if (event.shiftKey || host.mode == TextHostModes.multiline || host.mode == TextHostModes.plain) {
        let character = event.shiftKey && host.mode != TextHostModes.plain ? LineBreak : (host.mode == TextHostModes.plain ? "\n" : ParagraphBreak)
        if (host.mode == TextHostModes.inline || host.mode == TextHostModes.list) character = LineBreak
        let rich = this.#textToRich(host, character)
        this.#insertRich(host, rich)
        return
      }
      let node = host.node
      if (node instanceof TextNode && host === node.primaryHost && host.mode == TextHostModes.inline) {
        this.#splitNode(host)
      } else {
        // Enter in a caption or citation continues with a paragraph after the node.
        let paragraph = new TextNode()
        this.insertNodesAfter(node, [paragraph])
        this.focusNode(paragraph, 0)
      }
      return
    }

    if (event.key == "Backspace" && collapsed && selection.start == 0 && !modifier && !this.#readOnly) {
      if (this.#joinBackward(host)) event.preventDefault()
      return
    }

    if (event.key == "Delete" && collapsed && selection.end == host.rich.length && !modifier && !this.#readOnly) {
      if (this.#joinForward(host)) event.preventDefault()
      return
    }

    // Tab doesn't leave the text; Escape selects the block, and Tab then moves on.
    if (event.key == "Tab" && !modifier) {
      event.preventDefault()
      return
    }

    if (event.shiftKey || modifier) return
    if ((event.key == "ArrowUp" && host.isCaretOnFirstLine()) || (event.key == "ArrowLeft" && collapsed && selection.start == 0)) {
      if (this.#moveToStop(host, -1)) event.preventDefault()
    } else if ((event.key == "ArrowDown" && host.isCaretOnLastLine()) || (event.key == "ArrowRight" && collapsed && selection.end == host.rich.length)) {
      if (this.#moveToStop(host, 1)) event.preventDefault()
    }
  }

  #handleNodeKey(event: KeyboardEvent) {
    let node = this.selectedNode
    if (!node) return
    // The application sees keys for the selected node first.
    if (!this.dispatchEvent(new CustomEvent("nodeKeyPress", {detail: {node: node, key: event.key, event: event}, cancelable: true}))) {
      event.preventDefault()
      return
    }
    if (node.handleKeyDown(event, null) || event.defaultPrevented) return
    switch (event.key) {
      case "Backspace":
      case "Delete":
        event.preventDefault()
        this.removeNodes(this.#selected)
        break
      case "ArrowUp":
      case "ArrowDown":
        event.preventDefault()
        this.#selectAdjacentNode(event.key == "ArrowDown", event.shiftKey)
        break
      case "Tab":
        if (event.metaKey || event.ctrlKey || event.altKey) break
        event.preventDefault()
        this.#selectAdjacentNode(!event.shiftKey, false)
        break
      case "Home":
      case "End": {
        event.preventDefault()
        let nodes = this.#selectableNodes()
        let target = event.key == "End" ? nodes[nodes.length - 1] : nodes[0]
        if (!target) break
        if (event.shiftKey) {
          this.selectRange(this.#anchorNode || node, target)
        } else {
          this.selectNode(target)
        }
        break
      }
      case "Enter":
        event.preventDefault()
        if (node.primaryHost && !this.#readOnly && !node.locked) {
          this.beginEditing(node)
        } else if (!this.#readOnly) {
          let paragraph = new TextNode()
          this.insertNodesAfter(node, [paragraph])
          this.focusNode(paragraph, 0)
        }
        break
      case "Escape":
        event.preventDefault()
        this.selectNodes([])
        break
    }
  }

  #onBeforeInput(event: InputEvent) {
    let host = TextHost.from(event.target as globalThis.Node, this.#documentElement)
    if (!host) return
    this.#activeHost = host
    if (this.#readOnly) {
      event.preventDefault()
      return
    }
    switch (event.inputType) {
      case "historyUndo":
        event.preventDefault()
        this.history.undo()
        return
      case "historyRedo":
        event.preventDefault()
        this.history.redo()
        return
      case "formatBold":
        event.preventDefault()
        this.formatting.toggle(FormattingStyles.bold)
        return
      case "formatItalic":
        event.preventDefault()
        this.formatting.toggle(FormattingStyles.italic)
        return
      case "formatUnderline":
        event.preventDefault()
        this.formatting.toggle(FormattingStyles.underline)
        return
      case "insertParagraph":
      case "insertLineBreak":
        // Keyboards that don't send a key event for Enter.
        event.preventDefault()
        this.#handleTextKey(new KeyboardEvent("keydown", {key: "Enter", shiftKey: event.inputType == "insertLineBreak"}), host)
        return
    }
    if (event.inputType == "insertText" && event.data && host.mode != TextHostModes.plain) {
      let selection = host.selection()
      let style: TextStyle | null = null
      if (this.#pending && this.#pending.host === host && selection && selection.start == selection.end && selection.start == this.#pending.offset) {
        style = this.#pending.style
      } else if (host.rich.length == 0 && host.node instanceof TextNode) {
        style = host.node.baseStyle()
        if (style.isDefault()) style = null
      } else if (selection && selection.start > 0) {
        // Typing right after a suggestion tag doesn't extend it.
        let before = host.rich.styleAt(selection.start - 1)
        let after = selection.end < host.rich.length ? host.rich.styleAt(selection.end) : null
        if (before.suggestionProviderIdentifier.length > 0 && !(after && after.suggestionProviderIdentifier == before.suggestionProviderIdentifier && after.suggestionIdentifier == before.suggestionIdentifier)) {
          style = Editor.#untagged(before)
        }
      }
      if (style && selection) {
        event.preventDefault()
        this.history.checkpoint(host)
        host.rich.remove(selection.start, selection.end)
        host.rich.insert(selection.start, event.data, style)
        host.render()
        let offset = selection.start + event.data.length
        host.select(offset)
        if (this.#pending) this.#pending.offset = offset
        host.node.textChanged(host)
        host.node.changed()
        this.#afterTyping(host)
      }
    }
  }

  #onInput(event: InputEvent) {
    if (this.#composing) return
    let host = TextHost.from(event.target as globalThis.Node, this.#documentElement)
    if (!host) return
    this.#activeHost = host
    let coalesce = event.inputType && event.inputType.startsWith("delete") ? `delete-${host.node.nodeId}` : host
    this.history.checkpoint(coalesce)
    let pending = this.#pending && this.#pending.host === host ? this.#pending : null
    if (!host.sync()) return
    // Input that arrived without a beforeinput event, such as from some input
    // methods and dictation, still takes the pending style.
    if (pending && host.mode != TextHostModes.plain && (!event.inputType || event.inputType.startsWith("insert"))) {
      let range = host.selection()
      if (range && range.start == range.end && range.start > pending.offset && range.start - pending.offset <= 64) {
        host.rich.applyStyle(pending.offset, range.start, style => Object.assign(style, pending.style.clone()))
        host.render()
        host.select(range.start)
        pending.offset = range.start
        this.#pending = pending
      }
    }
    host.node.textChanged(host)
    host.node.changed()
    this.#afterTyping(host)
  }

  /** Markdown-style shortcuts typed at the start of a paragraph, and the block chooser for "/". */
  #afterTyping(host: TextHost) {
    if (this.#readOnly) return
    let selection = host.selection()
    if (!selection || selection.start != selection.end) return
    if (this.markdownShortcuts && this.#applyInlineMarkdown(host, selection.start)) {
      this.#closeSuggestions()
      return
    }
    this.#updateSuggestions(host)
    let node = host.node
    if (!(node instanceof TextNode) || node.constructor !== TextNode || host !== node.primaryHost) return
    let text = node.content.text
    let caret = selection.start

    if (text == "/" && caret == 1) {
      let rect = host.caretRect()
      this.showInsertionChooser(rect || host.element, node)
      return
    }
    if (!this.markdownShortcuts) return

    // A marker at the start of a plain paragraph turns it into a block, for registered types only.
    let rules: Array<[BlockShortcut, NodeClass]> = []
    this.nodeTypes.items().forEach(type => {
      let shortcuts: Array<BlockShortcut> = Editor.ownStatic(type, "markdownShortcuts") || []
      shortcuts.forEach(shortcut => rules.push([shortcut, type]))
    })
    for (let [shortcut, type] of rules) {
      let match = text.match(shortcut.pattern)
      if (!match || caret != match[0].length) continue
      let value = shortcut.value ? shortcut.value(match) : 0
      // Undoing the conversion leaves the text as it was before the keystroke that triggered it.
      this.history.breakCoalescing()
      node.content.remove(caret - 1, caret)
      this.history.checkpoint()
      this.history.suspend(() => {
        node.content.remove(0, match[0].length - 1)
        if (shortcut.insertsBlock) {
          let block = type.create(this)
          block.editor = this
          this.insertNodesBefore(node, [block])
          host.render()
          host.select(0)
          return
        }
        host.render()
        host.select(0)
        this.setBlockType(type.identifier, value, host)
        let replacement = this.#activeHost ? this.#activeHost.node : null
        if (replacement && shortcut.finish) shortcut.finish(replacement, match)
      })
      return
    }
  }

  /**
   * Typing the closing marker of `code`, **bold**, *italic*, _italic_,
   * ~~strikethrough~~ or ==highlight== removes both markers and formats the text
   * between them. The opening marker must start the line or follow a space, and
   * the text between must not start or end with a space, so snake_case_names and
   * 2 * 3 * 4 stay as typed. Returns true when it converted something.
   */
  #applyInlineMarkdown(host: TextHost, caret: number): boolean {
    if (host.mode == TextHostModes.plain || host.node instanceof CodeBlockNode || caret == 0) return false
    let rich = host.rich
    let typed = rich.text[caret - 1]
    let before = rich.text.substring(0, caret)
    let lineStart = Math.max(before.lastIndexOf(ParagraphBreak), before.lastIndexOf(LineBreak)) + 1
    let line = before.substring(lineStart)
    let marker = ""
    let apply: (style: TextStyle, value: boolean) => void
    switch (typed) {
      case "*":
        if (line.endsWith("**")) {
          marker = "**"
          apply = (style, value) => style.bold = value
        } else {
          marker = "*"
          apply = (style, value) => style.italic = value
        }
        break
      case "_":
        marker = "_"
        apply = (style, value) => style.italic = value
        break
      case "~":
        if (!line.endsWith("~~")) return false
        marker = "~~"
        apply = (style, value) => style.strikethrough = value
        break
      case "`":
        marker = "`"
        apply = (style, value) => style.code = value
        break
      case "=":
        if (!line.endsWith("==")) return false
        marker = "=="
        apply = (style, value) => {
          style.highlight = value
          if (value) style.hasBackgroundColor = false
        }
        break
      default:
        return false
    }
    // Formats the font options don't allow stay as typed.
    let formatName = {"**": "bold", "*": "italic", "_": "italic", "~~": "strikethrough", "`": "code", "==": "highlight"}[marker]
    if (formatName && !this.activeFontOptions().allows(formatName)) return false
    let body = line.substring(0, line.length - marker.length)
    let openIndex = body.lastIndexOf(marker)
    if (openIndex < 0) return false
    let content = body.substring(openIndex + marker.length)
    if (content.length == 0 || content.startsWith(" ") || content.endsWith(" ")) return false
    if (content.indexOf(marker[0]) >= 0) return false
    if (openIndex > 0 && body[openIndex - 1] != " ") return false

    // Its own undo step, which puts back the markers as typed.
    this.history.breakCoalescing()
    this.history.checkpoint()
    let openStart = lineStart + openIndex
    let contentStart = openStart + marker.length
    let contentEnd = contentStart + content.length
    rich.remove(contentEnd, contentEnd + marker.length)
    rich.remove(openStart, contentStart)
    rich.applyStyle(openStart, openStart + content.length, style => apply(style, true))
    host.render()
    let caretAfter = openStart + content.length
    host.select(caretAfter)
    // Text typed after the closing marker isn't formatted.
    let typingStyle = rich.styleAt(caretAfter - 1).clone()
    apply(typingStyle, false)
    this.setPendingStyle(host, caretAfter, typingStyle)
    host.node.textChanged(host)
    host.node.changed()
    this.history.breakCoalescing()
    this.updateToolbarState()
    return true
  }

  // Context menu

  /** True while the editor shows its own context menu. Holding Shift shows the browser's, with its spelling suggestions. */
  contextMenuEnabled: boolean = true

  #onToolbarContextMenu(event: MouseEvent) {
    if (!this.contextMenuEnabled || event.shiftKey) return
    event.preventDefault()
    if (this.#readOnly || this.#customizer) return
    let strings = this.strings
    let items: Array<ToolbarMenuItem> = [new ToolbarMenuItem("customizetoolbar", strings.TextCustomizeToolbarMenuCaption, "bi bi-tools"), ToolbarMenuItem.separator()]
    ;[strings.TextIconOnlyCaption, strings.TextIconAndTextCaption, strings.TextTextOnlyCaption].forEach((caption, index) => {
      let item = new ToolbarMenuItem(`toolbarmode:${index}`, caption)
      item.checked = this.#toolbarDisplayMode == index
      items.push(item)
    })
    let menu = new PopupMenu(items, item => {
      if (item.identifier == "customizetoolbar") {
        this.showToolbarCustomizer()
      } else if (item.identifier.startsWith("toolbarmode:")) {
        this.toolbarDisplayMode = Number(item.identifier.substring(12))
      }
    })
    menu.show(new DOMRect(event.clientX, event.clientY, 0, 0), this.#element)
  }

  #onContextMenu(event: MouseEvent) {
    if (!this.contextMenuEnabled || event.shiftKey) return
    let target = event.target as HTMLElement
    if (!this.#documentElement || !this.#documentElement.contains(target)) return
    // Form controls inside nodes keep the browser's menu.
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) && !TextHost.from(target, this.#documentElement)) return
    event.preventDefault()
    Popup.closeAll()
    // Pressing outside the selection selects what was pressed, as a click would.
    let host = TextHost.from(target, this.#documentElement)
    let selection = window.getSelection()
    let insideTextSelection = !!host && host === this.#activeHost && !!selection && selection.rangeCount > 0 && !selection.isCollapsed && Array.from(selection.getRangeAt(0).getClientRects()).some(rect => event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom)
    let element = target.closest(".scv-node") as HTMLElement | null
    let pressed = element ? this.allNodes().find(node => node.element === element) || null : null
    if (!insideTextSelection && pressed && !(host && host === this.#activeHost) && this.#selected.indexOf(pressed) < 0) this.selectNode(pressed)
    this.#showContextMenu(new DOMRect(event.clientX, event.clientY, 0, 0))
  }

  /** Shows the editor's context menu: undo, the clipboard, Select All, then the selected node's actions. */
  #showContextMenu(anchor: DOMRect) {
    let strings = this.strings
    let readOnly = this.#readOnly
    let host = this.#activeHost
    let range = host ? host.selection() : null
    let hasText = !!range && range.end > range.start
    let hasNodes = !host && this.#selected.length > 0
    let canChange = !readOnly && (hasText || (hasNodes && this.#selected.some(node => !node.locked)))
    let item = (identifier: string, caption: string, icon: string, enabled: boolean) => {
      let entry = new ToolbarMenuItem(identifier, caption, icon)
      entry.enabled = enabled
      return entry
    }
    let items: Array<ToolbarMenuItem> = [
      item("undo", strings.TextUndoMenuCaption, "bi bi-arrow-counterclockwise", !readOnly && this.history.canUndo),
      item("redo", strings.TextRedoMenuCaption, "bi bi-arrow-clockwise", !readOnly && this.history.canRedo),
      ToolbarMenuItem.separator(),
      item("cut", strings.TextCutMenuCaption, "bi bi-scissors", canChange),
      item("copy", strings.TextCopyMenuCaption, "bi bi-copy", hasText || hasNodes),
      item("paste", strings.TextPasteMenuCaption, "bi bi-clipboard", !readOnly && (!!host || this.#selected.length > 0) && !!navigator.clipboard),
      item("delete", strings.TextDeleteCaption, "bi bi-trash3", canChange),
      ToolbarMenuItem.separator(),
      item("selectall", strings.TextSelectAllMenuCaption, "bi bi-check2-all", true)
    ]
    // The node's actions, as on its toolbar.
    let node = this.#selected.length == 1 ? this.#selected[0] : null
    let actions: Array<ToolbarItem> = node && !node.locked ? node.actions().filter(action => action.kind != ToolbarItemKinds.separator && action.kind != ToolbarItemKinds.flexibleSpace) : []
    let extra: Array<ToolbarMenuItem> = node ? node.contextMenuItems() : []
    if (actions.length > 0 || extra.length > 0) items.push(ToolbarMenuItem.separator())
    actions.forEach((action, index) => {
      let caption = action.caption.length > 0 ? action.caption : action.tooltip
      let entry: ToolbarMenuItem
      if (action.kind == ToolbarItemKinds.menu && action.menuItems.length > 0) {
        entry = ToolbarMenuItem.submenu(`action:${index}`, caption, action.icon, action.menuItems)
      } else {
        entry = new ToolbarMenuItem(`action:${index}`, caption, action.icon)
        if (action.kind == ToolbarItemKinds.toggle) entry.checked = action.active
      }
      entry.enabled = !readOnly && action.enabled
      items.push(entry)
    })
    extra.forEach((entry, index) => {
      if (entry.isSeparator) {
        items.push(entry)
        return
      }
      let copy = entry.hasChildren ? ToolbarMenuItem.submenu(`custom:${index}`, entry.caption, entry.icon, entry.children) : new ToolbarMenuItem(`custom:${index}`, entry.caption, entry.icon)
      copy.enabled = !readOnly && entry.enabled
      copy.checked = entry.checked
      items.push(copy)
    })
    let state = this.captureSelection()
    let menu = new PopupMenu(items, chosen => {
      this.restoreSelection(state)
      this.#performContextCommand(chosen, node, actions, extra)
    })
    menu.show(anchor, this.#element)
  }

  #performContextCommand(chosen: ToolbarMenuItem, node: Node | null, actions: Array<ToolbarItem>, extra: Array<ToolbarMenuItem>) {
    let identifier = chosen.identifier
    let host = this.#activeHost
    switch (identifier) {
      case "undo": this.history.undo(); return
      case "redo": this.history.redo(); return
      case "cut": this.copyToClipboard(true); return
      case "copy": this.copyToClipboard(false); return
      case "paste": this.pasteFromClipboard(); return
      case "delete": {
        if (this.#readOnly) return
        let range = host ? host.selection() : null
        if (host && range && range.end > range.start) {
          this.deleteText(host, range.start, range.end)
        } else if (this.#selected.length > 0) {
          this.removeNodes(this.#selected)
        }
        return
      }
      case "selectall": {
        if (host) {
          host.select(0, host.rich.length)
        } else {
          this.selection.selectAllNodes()
        }
        return
      }
    }
    if (!node || this.#readOnly) return
    // A submenu choice arrives as the child item; find the action or entry that owns it.
    let owner = (entries: Array<ToolbarMenuItem>, target: ToolbarMenuItem): boolean => entries.some(entry => entry === target || (entry.hasChildren && owner(entry.children, target)))
    let actionIndex = identifier.startsWith("action:") ? Number(identifier.substring(7)) : actions.findIndex(action => owner(action.menuItems, chosen))
    if (actionIndex >= 0 && actions[actionIndex]) {
      this.history.checkpoint()
      let action = actions[actionIndex]
      if (!node.performAction(action, action.menuItems.length > 0 ? chosen : null)) this.dispatchEvent(new CustomEvent("toolbarItemPressed", {detail: {item: action, menuItem: chosen, node: node}}))
      this.#renderNodeToolbar()
      return
    }
    let extraIndex = identifier.startsWith("custom:") ? Number(identifier.substring(7)) : extra.findIndex(entry => owner(entry.children, chosen))
    let entry = extra[extraIndex]
    if (entry) {
      this.history.checkpoint()
      node.performContextMenuItem(entry.hasChildren ? chosen : entry)
      node.changed()
      this.#renderNodeToolbar()
    }
  }

  // Annotations

  /** Turns comments on or off: the margin markers, Add Comment and the popover. Threads in the document are kept. */
  get allowAnnotations(): boolean {
    return this.#allowAnnotations
  }

  set allowAnnotations(value: boolean) {
    if (this.#allowAnnotations == value) return
    this.#allowAnnotations = value
    if (!value) this.annotations.close()
    this.#scheduleAnnotationMarkers()
    this.updateToolbarState()
    this.#renderNodeToolbar()
  }

  #annotationHandler(): AnnotationHandler {
    let editor = this
    return {
      selectionAnchor: (annotation: Annotation) => editor.#selectionAnchor(annotation),
      containsNode: (node: Node) => !!node && editor.nodeWithID(node.nodeId) === node,
      willChange: () => {
        editor.#syncAnnotations()
        editor.history.breakCoalescing()
        editor.history.checkpoint()
      },
      changed: (kind, annotation) => {
        editor.#isChanged = true
        editor.#syncAnnotations()
        let name = kind == "added" ? "annotationAdded" : (kind == "removed" ? "annotationRemoved" : "annotationChanged")
        editor.dispatchEvent(new CustomEvent(name, {detail: {annotation: annotation}}))
        editor.dispatchEvent(new CustomEvent("annotationsChanged", {detail: {annotation: annotation}}))
        editor.#collaborationClient?.editorAnnotationChanged(annotation, kind == "removed")
        editor.history.breakCoalescing()
        editor.annotations.refreshPopover()
        editor.#renderAnnotationMarkers()
        editor.updateToolbarState()
      },
      redraw: () => editor.#renderAnnotationMarkers(),
      reveal: (annotation: Annotation) => {
        let node = editor.nodeWithID(annotation.nodeID)
        if (node && node.element) editor.revealNode(node)
        editor.#renderAnnotationMarkers()
        if (annotation.markerElement && annotation.markerElement.isConnected) return annotation.markerElement
        return node && node.element ? node.element.getBoundingClientRect() : null
      },
      selectionRect: () => {
        let host = editor.#activeHost
        if (host) {
          let selection = window.getSelection()
          if (selection && selection.rangeCount > 0) {
            let rects = selection.getRangeAt(0).getClientRects()
            if (rects.length > 0) return rects[0]
          }
        }
        let node = editor.selectedNode
        return node && node.element ? node.element.getBoundingClientRect() : null
      },
      segmentText: (node: Node, segment: number) => {
        let host = node.hosts()[segment]
        return host ? host.rich.text : null
      },
      segmentCount: (node: Node) => node.hosts().length,
      get allowed() { return editor.#allowAnnotations },
      get canChange() { return editor.#collaborationAnnotationsAllowed },
      identity: () => editor.#collaborationClient ? editor.#collaborationClient.identity() : null,
      get container() { return editor.#element },
      get strings() { return editor.strings }
    }
  }

  /** Anchors annotation to the selected text while editing, or else the one selected node. */
  #selectionAnchor(annotation: Annotation): boolean {
    if (!this.#allowAnnotations || this.#selected.length != 1) return false
    let node = this.#selected[0]
    let host = this.#activeHost
    let range = host && host.node === node ? host.selection() : null
    if (host && range && range.end > range.start) {
      let text = host.rich.text
      annotation.setAnchor(node.nodeId, Math.max(0, node.hosts().indexOf(host)), range.start, range.end - range.start, false, text.substring(range.start, range.end), text)
    } else {
      annotation.setAnchor(node.nodeId, 0, 0, 0, true, "", "")
    }
    return true
  }

  /** Keeps each annotation's anchor on its text, and notes which nodes are gone. */
  #syncAnnotations() {
    if (!this.annotations) return
    this.annotations.items().forEach(item => {
      let node = this.nodeWithID(item.nodeID)
      item.setNodeMissing(!node)
      if (!node || item.coversNode) return
      let host = node.hosts()[item.segment]
      if (host && item.adjustToText(host.rich.text) && !this.#applyingRemote) this.#movedAnchorIDs.add(item.id)
    })
  }

  #scheduleAnnotationMarkers() {
    if (!this.#element) return
    clearTimeout(this.#annotationTimer)
    this.#annotationTimer = setTimeout(() => this.#renderAnnotationMarkers(), 0)
  }

  /** The DOM range an annotation covers, or null for a whole node or an orphan. */
  #annotationRange(item: Annotation, node: Node): Range | null {
    if (item.coversNode || item.orphaned) return null
    let host = node.hosts()[item.segment]
    if (!host || !host.element.isConnected) return null
    let start = host.positionOf(item.start)
    let end = host.positionOf(item.start + item.length)
    let range = document.createRange()
    try {
      range.setStart(start.node, start.offset)
      range.setEnd(end.node, end.offset)
    } catch {
      return null
    }
    return range
  }

  /**
   * Marks comments in the document's trailing margin, or its leading margin in a
   * right-to-left document: one speech bubble per line that has comments, counting
   * those in its open threads, muted when all of them are resolved. Text is
   * highlighted only for the open thread and for the line whose marker is pointed at.
   */
  #renderAnnotationMarkers() {
    clearTimeout(this.#annotationTimer)
    let layer = this.#annotationLayer
    if (!layer || !this.#pageElement || !this.#documentElement) return
    layer.textContent = ""
    this.#syncAnnotations()
    let items = this.annotations.items()
    items.forEach(item => item.markerElement = null)
    if (!this.#allowAnnotations || items.length == 0) {
      this.#applyAnnotationHighlights([], [])
      return
    }
    let page = this.#pageElement.getBoundingClientRect()
    let documentRect = this.#documentElement.getBoundingClientRect()
    let documentStyle = getComputedStyle(this.#documentElement)
    let rightToLeft = documentStyle.direction == "rtl"
    let contentLeft = documentRect.left + parseFloat(documentStyle.paddingLeft || "0")
    let contentRight = documentRect.right - parseFloat(documentStyle.paddingRight || "0")
    interface Line {key: string, top: number, height: number, count: number, open: boolean, first: Annotation, items: Array<Annotation>}
    let lines: Array<Line> = []
    let ranges = new Map<Annotation, Range>()
    items.forEach(item => {
      let node = this.nodeWithID(item.nodeID)
      if (!node || !node.element || !node.element.isConnected) return
      let range = this.#annotationRange(item, node)
      if (range) ranges.set(item, range)
      let rects = range ? Array.from(range.getClientRects()).filter(rect => rect.width > 0 || rect.height > 0) : []
      let anchorTop: number
      let anchorHeight: number
      if (rects.length > 0) {
        anchorTop = rects[0].top
        anchorHeight = rects[0].height
      } else {
        // A whole node, or an orphan, is marked beside the node's first line.
        let host = node.primaryHost
        let first = host && host.element.isConnected ? host.element.getClientRects()[0] : null
        let frame = (node.body || node.element).getBoundingClientRect()
        anchorTop = frame.top
        anchorHeight = Math.min(frame.height, first ? Math.min(first.height, 24) : 24)
        let lineHeight = parseFloat(getComputedStyle(host ? host.element : node.element).lineHeight)
        if (isFinite(lineHeight) && lineHeight > 0) anchorHeight = Math.min(frame.height, lineHeight)
      }
      let key = `${node.nodeId}:${Math.round(anchorTop)}`
      let line = lines.find(entry => entry.key == key)
      if (!line) {
        line = {key: key, top: anchorTop, height: anchorHeight, count: 0, open: false, first: item, items: []}
        lines.push(line)
      }
      // The marker counts the comments in the line's open threads, replies
      // included, or in its resolved threads when none are open, and opens the
      // line's first open thread.
      if (!item.resolved && !line.open) {
        line.open = true
        line.count = 0
        line.first = item
      }
      if (!item.resolved || !line.open) line.count += item.lastCommentIndex + 1
      line.items.push(item)
    })
    let strings = this.strings
    lines.forEach(line => {
      let marker = Utilities.element("button", `scv-annotation-marker${line.open ? "" : " scv-annotation-resolved"}`, {type: "button", "aria-label": `${strings.TextCommentsCaption}: ${line.count}`, title: strings.TextCommentsCaption}) as HTMLButtonElement
      marker.append(Utilities.element("i", "bi bi-chat-fill"))
      let count = Utilities.element("span", "scv-annotation-count")
      count.textContent = String(line.count)
      marker.append(count)
      let width = 30
      let height = 20
      let left = rightToLeft ? contentLeft - 8 - width : contentRight + 8
      left = Utilities.clamp(left - page.left, 0, Math.max(0, page.width - width))
      marker.style.left = `${left}px`
      marker.style.top = `${Math.round(line.top - page.top + (line.height - height) / 2)}px`
      marker.addEventListener("mousedown", event => event.preventDefault())
      marker.addEventListener("mouseenter", () => {
        this.#hoveredAnnotationLine = line.key
        this.#applyAnnotationHighlights(lines.flatMap(entry => entry.key == line.key ? entry.items : []), ranges)
      })
      marker.addEventListener("mouseleave", () => {
        this.#hoveredAnnotationLine = ""
        this.#applyAnnotationHighlights([], ranges)
      })
      marker.addEventListener("click", () => {
        let selectedEvent = new CustomEvent("annotationSelected", {detail: {annotation: line.first}, cancelable: true})
        if (this.dispatchEvent(selectedEvent)) this.annotations.show(line.first)
      })
      line.items.forEach(item => item.markerElement = marker)
      layer.append(marker)
    })
    let hovered = this.#hoveredAnnotationLine.length > 0 ? lines.filter(line => line.key == this.#hoveredAnnotationLine).flatMap(line => line.items) : []
    this.#applyAnnotationHighlights(hovered, ranges)
  }

  static #highlights: {open: any, resolved: any, selected: any} | null = null

  /** Highlights the text of the selected annotation and of the hovered ones, with the CSS Custom Highlight API where it exists. */
  #applyAnnotationHighlights(hovered: Array<Annotation>, ranges: Map<Annotation, Range> | Array<never>) {
    let registry = (globalThis as any).CSS && (CSS as any).highlights
    let HighlightClass = (globalThis as any).Highlight
    if (!registry || !HighlightClass) return
    if (!Editor.#highlights) {
      Editor.#highlights = {open: new HighlightClass(), resolved: new HighlightClass(), selected: new HighlightClass()}
      registry.set("scv-annotation", Editor.#highlights.open)
      registry.set("scv-annotation-resolved", Editor.#highlights.resolved)
      registry.set("scv-annotation-selected", Editor.#highlights.selected)
    }
    let highlights = Editor.#highlights
    this.#annotationRanges.forEach(range => {
      highlights.open.delete(range)
      highlights.resolved.delete(range)
      highlights.selected.delete(range)
    })
    this.#annotationRanges = []
    if (!(ranges instanceof Map)) return
    let selected = this.annotations.selected
    ranges.forEach((range, item) => {
      if (item === selected) {
        highlights.selected.add(range)
      } else if (hovered.indexOf(item) >= 0) {
        (item.resolved ? highlights.resolved : highlights.open).add(range)
      } else {
        return
      }
      this.#annotationRanges.push(range)
    })
  }

  /** The comment threads as a section after the content, for toHTML. */
  #annotationsHTML(): string {
    this.#syncAnnotations()
    let strings = this.strings
    let items = this.annotations.items().map(item => {
      let json: any = item.toJSON()
      let entry = `<li class="annotation${item.resolved ? " resolved" : ""}" id="annotation-${Utilities.escapeAttribute(item.id)}" data-node-id="${Utilities.escapeAttribute(item.nodeID)}"`
      entry += item.coversNode ? ` data-covers-node="true"` : ` data-segment="${json.segment}" data-start="${json.start}" data-length="${json.length}"`
      if (item.resolved) entry += ` data-resolved="true"`
      entry += ">"
      if (item.quote.length > 0) entry += `<blockquote>${Utilities.escapeText(item.quote)}</blockquote>`
      item.comments().forEach(comment => {
        let author = comment.authorName.length > 0 ? comment.authorName : strings.TextDefaultAuthorCaption
        let stamp = comment.created.toISOString().substring(0, 19)
        let shown = comment.created.toLocaleString(undefined, {dateStyle: "medium", timeStyle: "short"})
        entry += `<p class="comment" data-author-id="${Utilities.escapeAttribute(comment.authorID)}"><strong>${Utilities.escapeText(author)}</strong> <time datetime="${stamp}">${Utilities.escapeText(shown)}</time><br>${Utilities.escapeText(comment.text).replace(/\r\n|\r|\n/g, "<br>")}</p>`
      })
      return `${entry}</li>`
    })
    if (items.length == 0) return ""
    return `\n<section class="annotations" data-scriviamo-annotations="true" style="border-top:1px solid #d0d7de;margin-top:2em;padding-top:1em;font-size:.9em"><h2>${Utilities.escapeText(strings.TextCommentsCaption)}</h2><ol>${items.join("")}</ol></section>`
  }

  // Suggestions

  static #untagged(style: TextStyle): TextStyle {
    let result = style.clone()
    result.suggestionProviderIdentifier = ""
    result.suggestionIdentifier = ""
    result.suggestionTextColor = Colors.clone(TextStyle.defaults.suggestionTextColor)
    result.suggestionBackgroundColor = Colors.clone(TextStyle.defaults.suggestionBackgroundColor)
    result.suggestionBorderColor = Colors.clone(TextStyle.defaults.suggestionBorderColor)
    return result
  }

  /** The providers asked for a host: its node's own provider, or else the editor's. */
  #providersFor(host: TextHost): Array<Suggestions.Provider> {
    let own = host.node.suggestionProvider
    return own ? [own] : this.suggestionProviders.items()
  }

  /** True while the suggestion popup is showing. */
  get suggestionsVisible(): boolean {
    return !!this.#suggestionState
  }

  /** Asks the providers about the text before the caret, and shows or hides the suggestion popup. */
  #updateSuggestions(host: TextHost | null) {
    let serial = ++this.#suggestionSerial
    let range = host ? host.selection() : null
    if (!host || !range || range.start != range.end || this.#readOnly || host.mode == TextHostModes.plain || !host.editable) {
      this.#closeSuggestions()
      return
    }
    let caret = range.start
    let textBeforeCaret = host.rich.text.substring(0, caret)
    let provider: Suggestions.Provider | null = null
    let request: Suggestions.Request | null = null
    this.#providersFor(host).forEach(candidate => {
      let candidateRequest = candidate.match(textBeforeCaret, caret, host)
      if (!candidateRequest) return
      // The request that starts nearest the caret wins.
      if (!request || candidateRequest.startPosition > request.startPosition) {
        request = candidateRequest
        provider = candidate
      }
    })
    if (!provider || !request) {
      this.#closeSuggestions()
      return
    }
    let chosenProvider: Suggestions.Provider = provider
    let chosenRequest: Suggestions.Request = request
    let show = (items: Array<Suggestions.Suggestion>) => {
      if (serial != this.#suggestionSerial) return
      if (!Array.isArray(items) || items.length == 0) {
        this.#closeSuggestions()
        return
      }
      this.#showSuggestions(host, chosenProvider, chosenRequest, items)
    }
    let result = chosenProvider.suggestions(chosenRequest, 6)
    if (Array.isArray(result)) {
      show(result)
    } else {
      Promise.resolve(result).then(show, () => { if (serial == this.#suggestionSerial) this.#closeSuggestions() })
    }
  }

  #showSuggestions(host: TextHost, provider: Suggestions.Provider, request: Suggestions.Request, items: Array<Suggestions.Suggestion>) {
    this.#suggestionState = {host: host, provider: provider, request: request, items: items}
    let choices: Array<ChoiceItem> = items.map((suggestion, index) => ({
      caption: suggestion.caption,
      value: index,
      icon: suggestion.icon,
      detail: suggestion.detail,
      render: (element: HTMLElement, selected: boolean) => suggestion.render(element, selected)
    }))
    let popup = this.#suggestionPopup
    if (!popup) {
      popup = new ChoicePopup("scv-suggestions", item => this.#commitSuggestion(item.value))
      popup.label = this.strings.TextSuggestionsCaption
      popup.tabChooses = true
      popup.anchorProvider = () => {
        let state = this.#suggestionState
        return state ? state.host.caretRect() : null
      }
      popup.element.setAttribute("aria-label", this.strings.TextSuggestionsCaption)
      popup.onClose = () => {
        if (this.#suggestionPopup === popup && !popup.chosen) {
          this.#suggestionState = null
          this.#suggestionPopup = null
        }
      }
      this.#suggestionPopup = popup
    }
    popup.setItems(choices)
    let caretRect = host.caretRect() || host.element.getBoundingClientRect()
    if (popup.isOpen) {
      popup.position()
    } else {
      popup.show(caretRect, this.#element || document.body)
    }
  }

  #closeSuggestions() {
    this.#suggestionSerial++
    let popup = this.#suggestionPopup
    this.#suggestionState = null
    this.#suggestionPopup = null
    if (popup) popup.close()
  }

  #commitSuggestion(index: number) {
    let state = this.#suggestionState
    this.#suggestionState = null
    this.#suggestionPopup = null
    if (!state || !state.items[index] || this.#readOnly) return
    let host = state.host
    this.history.breakCoalescing()
    this.history.checkpoint()
    let base = this.#pending && this.#pending.host === host ? this.#pending.style : host.rich.insertionStyleAt(state.request.startPosition)
    let caret = state.provider.commitSuggestion(host, state.request, state.items[index], Editor.#untagged(base))
    if (caret < 0) return
    host.render()
    host.select(caret)
    let inserted = host.rich.styleAt(caret - 1)
    if (inserted.suggestionProviderIdentifier.length > 0) this.setPendingStyle(host, caret, Editor.#untagged(inserted))
    host.node.textChanged(host)
    host.node.changed()
    this.history.breakCoalescing()
    this.updateToolbarState()
    this.dispatchEvent(new CustomEvent("suggestionCommitted", {detail: {node: host.node, provider: state.provider, suggestion: state.items[index]}}))
  }

  /**
   * Turns plain trigger text that exactly matches a provider's suggestion into a
   * committed tag, as when the text was loaded or pasted. Called for nodes as they
   * are added or loaded.
   */
  recognizeSuggestions(nodes: Array<Node>) {
    let visit = (node: Node) => {
      node.hosts().forEach(host => {
        if (host.mode == TextHostModes.plain || host.rich.length == 0) return
        let own = node.suggestionProvider
        let providers = own ? [own].concat(this.suggestionProviders.items().filter(item => item !== own)) : this.suggestionProviders.items()
        let changed = false
        providers.forEach(provider => { if (this.#recognize(host, provider)) changed = true })
        if (changed) host.render()
      })
      node.descendants().forEach(child => visit(child))
    }
    nodes.forEach(node => visit(node))
  }

  #recognize(host: TextHost, provider: Suggestions.Provider): boolean {
    if (provider.trigger.length > 0 && host.rich.text.indexOf(provider.trigger) < 0) return false
    let changed = false
    let caret = 1
    while (caret <= host.rich.length) {
      let text = host.rich.text
      let request = provider.match(text.substring(0, caret), caret, host)
      if (request && request.length > 0 && request.startPosition + request.length <= text.length) {
        let existing = host.rich.styleAt(request.startPosition)
        if (existing.suggestionProviderIdentifier.length == 0) {
          let matched = text.substring(request.startPosition, request.startPosition + request.length)
          let found = provider.suggestions(request, Math.max(6, provider.lastIndex + 1))
          if (Array.isArray(found)) {
            let suggestion = found.find(item => item && item.insertText == matched)
            if (suggestion) {
              let committed = provider.commitSuggestion(host, request, suggestion, existing)
              if (committed >= 0) {
                caret = committed
                changed = true
              }
            }
          }
        }
      }
      caret++
    }
    return changed
  }

  // Pointer

  #nodeFromElement(element: Element | null): Node | null {
    let nodeElement = element ? element.closest(".scv-node") as HTMLElement : null
    if (!nodeElement || !this.#documentElement.contains(nodeElement)) return null
    let identifier = nodeElement.dataset.nodeId
    return this.allNodes().find(node => node.nodeId == identifier) || null
  }

  #onMouseDown(event: MouseEvent) {
    let target = event.target as HTMLElement
    let node = this.#nodeFromElement(target)
    if (!node) return
    let host = TextHost.from(target, this.#documentElement)
    let modifier = event.shiftKey || event.metaKey || event.ctrlKey
    // In the node being edited, clicks place the caret and select text as usual.
    if (host && host.editable) {
      if (event.shiftKey && !host.element.contains(document.activeElement)) {
        event.preventDefault()
        this.selectNode(node, true)
      }
      return
    }
    // Read-only text can still be selected and copied.
    if (host && this.#readOnly) {
      if (this.#selected.length != 1 || this.#selected[0] !== node) this.#setSelection([node], false)
      return
    }
    // A double-click starts editing with the caret where it was pressed.
    if (host && event.detail >= 2 && event.button == 0 && !modifier && !node.locked && !target.closest(".scv-widget")) {
      event.preventDefault()
      let point = Editor.caretFromPoint(event.clientX, event.clientY)
      let offset = point && host.element.contains(point.node) ? host.offsetOf(point.node, point.offset) : undefined
      this.focusNode(node, offset, host.index)
      return
    }
    if (target.closest("input, select, textarea, button, a, .scv-widget, .scv-resize-handle, .scv-image-buttons")) {
      if (!target.closest(".scv-widget")) this.#setSelection([node], true)
      return
    }
    event.preventDefault()
    if (modifier && this.#selected.indexOf(node) >= 0 && this.#selected.length > 1) {
      this.selectNodes(this.#selected.filter(item => item !== node))
    } else {
      this.selectNode(node, modifier)
    }
  }

  /**
   * A press on empty space selects the document: no node is selected or edited. In an empty
   * document it starts a paragraph instead, and a double-click below the last node continues
   * typing there.
   */
  #onBlankPress(event: MouseEvent) {
    if (event.button != 0) return
    if (this.#nodes.length == 0) {
      if (this.#readOnly) return
      event.preventDefault()
      this.#startEmptyDocument()
      return
    }
    let last = this.#nodes[this.#nodes.length - 1]
    let below = !!last && !!last.element && event.clientY >= last.element.getBoundingClientRect().bottom
    if (event.detail < 2 || !below || this.#readOnly) {
      event.preventDefault()
      if (this.#selected.length > 0 || this.#editingNode) this.selectNodes([])
      this.#documentElement.focus({preventScroll: true})
      return
    }
    event.preventDefault()
    if (last instanceof TextNode && last.constructor === TextNode) {
      this.focusNode(last)
    } else {
      let paragraph = new TextNode()
      this.addNode(paragraph)
      this.focusNode(paragraph, 0)
    }
  }

  /**
   * An empty document has no nodes. Clicking or tabbing into it starts a paragraph
   * to type in; an empty paragraph isn't a change to the document.
   */
  #startEmptyDocument() {
    if (this.#nodes.length > 0 || this.#readOnly) return
    let changed = this.#isChanged
    let paragraph = new TextNode()
    this.history.suspend(() => this.addNode(paragraph))
    this.#isChanged = changed
    this.focusNode(paragraph, 0)
  }

  #onClick(event: MouseEvent) {
    let target = event.target as HTMLElement
    let node = this.#nodeFromElement(target)
    if (!node) return
    if (node.handleClick(event)) return
    let link = target.closest("a[href]") as HTMLAnchorElement
    if (link && TextHost.from(link, this.#documentElement)) {
      event.preventDefault()
      let modifier = Editor.isMac ? event.metaKey : event.ctrlKey
      if (!modifier && !this.#readOnly) return
      let url = link.getAttribute("href") || ""
      let detail = {node: node, url: url, text: link.textContent || "", title: link.title || ""}
      let pressed = new CustomEvent("linkPressed", {detail: detail, cancelable: true})
      if (this.dispatchEvent(pressed)) window.open(url, "_blank", "noopener")
    }
  }

  // Gutter and dragging

  #buildGutter() {
    let gutter = this.#gutterElement
    let add = Utilities.element("button", "scv-gutter-button scv-gutter-add", {type: "button", title: this.strings.TextInsertTooltip, "aria-label": this.strings.TextInsertTooltip})
    add.innerHTML = `<i class="bi bi-plus-lg"></i>`
    add.addEventListener("mousedown", event => event.preventDefault())
    add.addEventListener("click", () => {
      let node = this.#hoverNode
      if (!node) return
      let replace = node.constructor === TextNode && (node as TextNode).content.length == 0 ? node : null
      if (!replace) {
        this.selectNode(node)
      }
      this.showInsertionChooser(add, replace)
    })
    let grip = Utilities.element("button", "scv-gutter-button scv-gutter-grip", {type: "button", draggable: "true", title: this.strings.TextDragHandleTooltip, "aria-label": this.strings.TextDragHandleTooltip})
    grip.innerHTML = `<i class="bi bi-grip-vertical"></i>`
    grip.addEventListener("mousedown", event => event.stopPropagation())
    grip.addEventListener("click", () => {
      let node = this.#hoverNode
      if (!node) return
      if (this.#selected.indexOf(node) < 0 || this.#selected.length < 2) this.selectNode(node)
      this.#showNodeMenu(node, grip)
    })
    grip.addEventListener("dragstart", event => this.#beginNodeDrag(this.#hoverNode, event))
    grip.addEventListener("dragend", () => this.#endNodeDrag())
    gutter.append(add, grip)
  }

  /** Starts dragging a node, from the gutter or from its toolbar's move grip. */
  #beginNodeDrag(node: Node | null, event: DragEvent) {
    if (!node || this.#readOnly || node.locked) {
      event.preventDefault()
      return
    }
    Popup.closeAll()
    this.#dragNode = node
    // Dragging one of several selected nodes drags them all.
    this.#dragNodes = this.#selected.length > 1 && this.#selected.indexOf(node) >= 0 ? this.inDocumentOrder(this.#selected).filter(item => !item.locked) : [node]
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", this.#dragNodes.map(item => item.toPlainText()).join("\n"))
    if (node.element) event.dataTransfer.setDragImage(node.element, 0, 0)
    this.#dragNodes.forEach(item => item.element?.classList.add("scv-dragging"))
  }

  #endNodeDrag() {
    this.#dragNodes.forEach(item => item.element?.classList.remove("scv-dragging"))
    this.#dragNode = null
    this.#dragNodes = []
    this.#dropIndicator.classList.add("d-none")
  }

  #onHover(event: MouseEvent) {
    if (!this.isHoverInsertionEnabled || this.#readOnly || this.#dragNode) return
    let target = event.target as HTMLElement
    if (this.#gutterElement.contains(target)) return
    let node = this.#nodeFromElement(target)
    // Only blocks at the root or directly in a collapsible section get the gutter.
    while (node && node.parent && !node.parent.holdsBlocks) node = node.parent
    // In the margin beside a block, or between blocks, use the block at the
    // pointer's height, so the pointer can travel to the gutter's buttons.
    if (!node) node = this.#gutterNodeAt(event.clientY)
    if (!node) return
    if (node !== this.#hoverNode || this.#gutterElement.classList.contains("d-none")) this.#positionGutter(node)
  }

  /** The deepest block that gets a gutter whose vertical extent includes y. */
  #gutterNodeAt(y: number): Node | null {
    let result: Node | null = null
    this.allNodes().forEach(node => {
      if (node.parent && !node.parent.holdsBlocks) return
      let element = node.element
      if (!element || element.offsetParent === null) return
      let rect = element.getBoundingClientRect()
      // Half the spacing between blocks belongs to each neighbor.
      let slack = parseFloat(getComputedStyle(element).marginBottom) / 2 + 2
      if (y >= rect.top - slack && y <= rect.bottom + slack) result = node
    })
    return result
  }

  #positionGutter(node: Node | null) {
    this.#hoverNode = node
    let gutter = this.#gutterElement
    if (!node || !node.element || !this.isHoverInsertionEnabled || this.#readOnly) {
      gutter.classList.add("d-none")
      return
    }
    let page = this.#pageElement.getBoundingClientRect()
    let rect = node.element.getBoundingClientRect()
    let firstLine = node.primaryHost ? node.primaryHost.element.getBoundingClientRect() : rect
    let lineHeight = parseFloat(getComputedStyle(node.primaryHost ? node.primaryHost.element : node.element).lineHeight) || 24
    gutter.classList.remove("d-none")
    let top = firstLine.top - page.top + Math.max(0, (Math.min(lineHeight, firstLine.height) - gutter.offsetHeight) / 2)
    gutter.style.top = `${top}px`
    let rightToLeft = getComputedStyle(this.#documentElement).direction == "rtl"
    if (rightToLeft) {
      gutter.style.left = `${rect.right - page.left + 4}px`
    } else {
      gutter.style.left = `${rect.left - page.left - gutter.offsetWidth - 4}px`
    }
  }

  #onDragOver(event: DragEvent) {
    let files = event.dataTransfer && Array.from(event.dataTransfer.types).indexOf("Files") >= 0
    if (!this.#dragNode && !files) return
    if (this.#readOnly) return
    event.preventDefault()
    event.dataTransfer.dropEffect = this.#dragNode ? "move" : "copy"
    let element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement
    let node = element ? this.#nodeFromElement(element) : null
    while (node && node.parent && !node.parent.holdsBlocks) node = node.parent
    // In the margin or between blocks, use the block at the pointer's height, as over the content.
    if (!node) node = this.#gutterNodeAt(event.clientY)
    if (this.#dragNode && node && this.#dragNodes.some(dragged => node === dragged || dragged.descendants().indexOf(node) >= 0)) node = null
    let indicator = this.#dropIndicator
    let page = this.#pageElement.getBoundingClientRect()
    if (!node || !node.element) {
      let last = this.#nodes[this.#nodes.length - 1]
      if (!last || !last.element || event.clientY < last.element.getBoundingClientRect().bottom) {
        indicator.classList.add("d-none")
        this.#dropTarget = null
        return
      }
      node = last
    }
    let list = this.listContaining(node)
    let rect = node.element.getBoundingClientRect()
    let after = event.clientY > rect.top + rect.height / 2
    this.#dropTarget = {list: list, index: list.indexOf(node) + (after ? 1 : 0), owner: node.parent}
    if (this.#dragNode) {
      // The application may refuse a position.
      let detail = {node: this.#dragNode, nodes: this.#dragNodes.slice(), beforeNode: list[this.#dropTarget.index] || null, parentNode: node.parent, x: event.clientX, y: event.clientY}
      if (!this.dispatchEvent(new CustomEvent("nodeDragging", {detail: detail, cancelable: true}))) {
        event.dataTransfer.dropEffect = "none"
        indicator.classList.add("d-none")
        this.#dropTarget = null
        return
      }
    }
    indicator.classList.remove("d-none")
    indicator.style.top = `${(after ? rect.bottom : rect.top) - page.top - 2}px`
    indicator.style.left = `${rect.left - page.left}px`
    indicator.style.width = `${rect.width}px`
  }

  #onDrop(event: DragEvent) {
    let target = this.#dropTarget
    this.#dropIndicator.classList.add("d-none")
    this.#dropTarget = null
    if (this.#dragNode) {
      event.preventDefault()
      let node = this.#dragNode
      let nodes = this.#dragNodes.slice()
      this.#endNodeDrag()
      if (!target) return
      let detail = {node: node, nodes: nodes, beforeNode: target.list[target.index] || null, parentNode: target.owner}
      if (!this.dispatchEvent(new CustomEvent("nodeDropped", {detail: detail, cancelable: true}))) return
      this.moveNodesTo(nodes, target.list, target.index)
      return
    }
    let files = event.dataTransfer ? Array.from(event.dataTransfer.files) : []
    if (files.length == 0 || this.#readOnly) return
    event.preventDefault()
    let nodes = this.nodesForFiles(files)
    if (nodes.length == 0) return
    if (target) {
      this.insertNodes(target.list, target.index, nodes, target.owner)
    } else {
      nodes.forEach(node => this.addNode(node))
    }
    this.selectNode(nodes[nodes.length - 1])
  }

  /** The registered node type that takes a file: the one with the highest import priority whose droppedFileTypes match. */
  #typeForFile(file: File): NodeClass | null {
    let name = (file.name || "").toLowerCase()
    let mime = (file.type || "").toLowerCase()
    let best: NodeClass | null = null
    let bestPriority = -Infinity
    this.nodeTypes.items().forEach(type => {
      let accepted: Array<string> = (type as any).droppedFileTypes || []
      let matches = accepted.some(pattern => {
        pattern = pattern.toLowerCase()
        // "*" takes any file, for a type such as attachments that's the fallback for the rest.
        if (pattern == "*") return true
        if (pattern.startsWith(".")) return name.endsWith(pattern)
        if (pattern.endsWith("/*")) return mime.startsWith(pattern.substring(0, pattern.length - 1))
        return mime == pattern
      })
      let priority = Number((type as any).droppedFileImportPriority) || 0
      if (matches && priority > bestPriority) {
        best = type
        bestPriority = priority
      }
    })
    return best
  }

  /** Nodes made from files, by the node types that accept them. Files no type accepts are skipped. */
  nodesForFiles(files: Array<File>): Array<Node> {
    let result: Array<Node> = []
    files.forEach(file => {
      let type = this.#typeForFile(file)
      let importer = type ? (type as any).importDroppedFile : null
      let node = typeof importer == "function" ? importer.call(type, file, this) : null
      if (node) result.push(node)
    })
    return result
  }

  // Pointer events

  #pointerNode: Node | null = null

  /**
   * The top-level node under a point, or the nearest one, and the point as fractions of that
   * node's bounds. Another editor, whose layout differs, places a pointer over the same content
   * from it.
   */
  #pointerAnchor(clientX: number, clientY: number): PointerAnchor | null {
    let result: PointerAnchor | null = null
    let nearest = -1
    for (let node of this.#nodes) {
      if (!node.element || !node.element.isConnected) continue
      let rect = node.element.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) continue
      let distance = clientY < rect.top ? rect.top - clientY : clientY > rect.bottom ? clientY - rect.bottom : 0
      if (nearest < 0 || distance < nearest) {
        nearest = distance
        result = {nodeID: node.nodeId, x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height}
      }
      if (distance == 0) break
    }
    return result
  }

  #pointerDetail(event: MouseEvent): {x: number, y: number} {
    let rect = this.#element ? this.#element.getBoundingClientRect() : new DOMRect()
    return {x: event.clientX - rect.left, y: event.clientY - rect.top}
  }

  /** Raises nodePointerEnter, nodePointerExit and nodePointerMove for the innermost node under the pointer. */
  #notePointerNode(event: MouseEvent) {
    let node = this.#nodeFromElement(event.target as Element)
    this.#setPointerNode(node)
    if (node && node.element) {
      let rect = node.element.getBoundingClientRect()
      this.dispatchEvent(new CustomEvent("nodePointerMove", {detail: {node: node, x: event.clientX - rect.left, y: event.clientY - rect.top}}))
    }
  }

  #setPointerNode(node: Node | null) {
    if (node === this.#pointerNode) return
    let previous = this.#pointerNode
    this.#pointerNode = node
    if (previous) this.dispatchEvent(new CustomEvent("nodePointerExit", {detail: {node: previous}}))
    if (node) this.dispatchEvent(new CustomEvent("nodePointerEnter", {detail: {node: node}}))
  }

  // Clipboard

  #onCopy(event: ClipboardEvent, cut: boolean) {
    let eventHost = TextHost.from(event.target as globalThis.Node, this.#documentElement)
    if (eventHost) this.#activeHost = eventHost
    let host = this.#activeHost
    let range = host ? host.selection() : null
    let data = event.clipboardData
    if (!data) return
    if (host && range && range.end > range.start) {
      let slice = host.rich.slice(range.start, range.end)
      event.preventDefault()
      data.setData("text/plain", slice.text.replace(/\u2028/g, "\n"))
      data.setData("text/html", host.mode == TextHostModes.plain ? `<pre>${Utilities.escapeText(slice.text)}</pre>` : slice.htmlText())
      try {
        data.setData(ClipboardType, JSON.stringify({kind: "text", content: slice.toJSON()}))
      } catch {
      }
      if (cut && !this.#readOnly) this.deleteText(host, range.start, range.end)
      return
    }
    if (!host && this.#selected.length > 0 && this.#documentElement.contains(document.activeElement)) {
      event.preventDefault()
      let nodes = this.inDocumentOrder(this.#selected)
      data.setData("text/plain", nodes.map(node => node.toPlainText()).join("\n"))
      data.setData("text/html", nodes.filter(node => node.canExportHTML).map(node => node.toHTML()).join("\n"))
      try {
        data.setData(ClipboardType, JSON.stringify({kind: "nodes", nodes: nodes.map(node => node.toJSON())}))
      } catch {
      }
      if (cut && !this.#readOnly) this.removeNodes(nodes)
    }
  }

  /** Copies (or cuts) the selection, as the Copy and Cut commands do. */
  copyToClipboard(cut: boolean) {
    document.execCommand(cut ? "cut" : "copy")
  }

  /** Pastes from the system clipboard, when the browser allows reading it. */
  async pasteFromClipboard() {
    if (this.#readOnly) return
    let state = this.captureSelection()
    let html = ""
    let text = ""
    try {
      if (navigator.clipboard && (navigator.clipboard as any).read) {
        let items = await (navigator.clipboard as any).read()
        for (let item of items) {
          if (item.types.indexOf("text/html") >= 0) html = await (await item.getType("text/html")).text()
          if (item.types.indexOf("text/plain") >= 0) text = await (await item.getType("text/plain")).text()
        }
      } else if (navigator.clipboard) {
        text = await navigator.clipboard.readText()
      }
    } catch {
      return
    }
    this.restoreSelection(state)
    this.#paste({json: "", html: html, text: text, files: []})
  }

  #onPaste(event: ClipboardEvent) {
    let data = event.clipboardData
    if (!data) return
    let target = event.target as HTMLElement
    if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return
    event.preventDefault()
    if (this.#readOnly) return
    let eventHost = TextHost.from(target, this.#documentElement)
    if (eventHost) this.#activeHost = eventHost
    let files = Array.from(data.files || []).filter(file => this.#typeForFile(file) !== null)
    this.#paste({json: data.getData(ClipboardType), html: data.getData("text/html"), text: data.getData("text/plain"), files: files})
  }

  #paste(data: {json: string, html: string, text: string, files: Array<File>}) {
    let host = this.#activeHost

    if (data.files.length > 0 && (!host || host.mode != TextHostModes.plain)) {
      let nodes = this.nodesForFiles(data.files)
      if (nodes.length > 0) {
        this.#insertNodesAtCaret(nodes)
        return
      }
    }

    if (data.json.length > 0) {
      try {
        let parsed = JSON.parse(data.json)
        if (parsed.kind == "text" && host) {
          this.#insertRich(host, RichText.fromJSON(parsed.content))
          return
        }
        if (parsed.kind == "nodes" && Array.isArray(parsed.nodes)) {
          let nodes = parsed.nodes.map(item => this.nodeFromJSON(Editor.renewIDs(item))).filter(node => node !== null)
          if (host && nodes.length == 1 && nodes[0].constructor === TextNode) {
            this.#insertRich(host, (nodes[0] as TextNode).content)
          } else {
            this.#insertNodesAtCaret(nodes)
          }
          return
        }
      } catch {
      }
    }

    if (host && host.mode == TextHostModes.plain) {
      this.#insertRich(host, new RichText(data.text))
      return
    }

    if (data.html.trim().length > 0) {
      // Word's and Google Docs' HTML, without their clutter.
      let nodes = this.importer.import(PasteCleanup.clean(data.html))
      if (nodes.length == 0 && data.text.length == 0) return
      if (nodes.length > 0) {
        let single = nodes.length == 1 && nodes[0].constructor === TextNode
        if (host && (single || host.mode != TextHostModes.inline || host !== host.node.primaryHost)) {
          let rich = new RichText()
          nodes.forEach((node, index) => {
            if (index > 0) rich.insert(rich.length, host.mode == TextHostModes.multiline ? ParagraphBreak : LineBreak)
            if (node instanceof TextNode) {
              rich.append(node.content)
            } else {
              rich.insert(rich.length, node.toPlainText().replace(/\n/g, LineBreak))
            }
          })
          this.#insertRich(host, rich)
        } else {
          this.#insertNodesAtCaret(nodes)
        }
        return
      }
    }

    let text = data.text.replace(/\r\n?/g, "\n")
    if (text.length == 0) return
    if (host && host.mode == TextHostModes.inline && host === host.node.primaryHost && host.node.constructor === TextNode && /\n/.test(text.trim())) {
      let paragraphs = text.split(/\n{2,}|\n/).map(line => {
        let paragraph = new TextNode()
        paragraph.content = new RichText(line, host.rich.insertionStyleAt(0))
        return paragraph
      })
      this.#insertNodesAtCaret(paragraphs)
      return
    }
    if (host) {
      this.#insertRich(host, this.#textToRich(host, text))
      return
    }
    let paragraphs = text.split(/\n/).map(line => new TextNode(line))
    this.#insertNodesAtCaret(paragraphs)
  }

  /** Inserts blocks where the caret is, splitting the paragraph being edited around them. */
  #insertNodesAtCaret(nodes: Array<Node>) {
    if (nodes.length == 0) return
    let host = this.#activeHost
    this.history.checkpoint()
    this.history.suspend(() => {
      let point = host && host.node instanceof TableNode ? host.node.insertionPoint(host) : null
      if (host && point) {
        this.insertNodes(point.list, point.index, nodes, host.node)
      } else if (host && host.node instanceof TextNode && host === host.node.primaryHost && host.mode == TextHostModes.inline && host.node.isTextBlock) {
        let node = host.node
        let range = host.selection() || {start: node.content.length, end: node.content.length}
        node.content.remove(range.start, range.end)
        let tail = node.content.slice(range.start)
        node.content.remove(range.start, node.content.length)
        let additions = nodes.slice()
        if (tail.length > 0) {
          let following = node.createFollowingNode()
          following.content = tail
          additions.push(following)
        }
        if (node.content.length == 0 && node.constructor === TextNode) {
          this.replaceNode(node, additions)
        } else {
          host.render()
          this.insertNodesAfter(node, additions)
        }
      } else if (host || this.selectedNode) {
        let ordered = this.inDocumentOrder(this.#selected)
        this.insertNodesAfter(host ? host.node : ordered[ordered.length - 1], nodes)
      } else {
        nodes.forEach(node => this.addNode(node))
      }
    })
    let last = nodes[nodes.length - 1]
    if (last.hosts().length > 0) {
      this.focusNode(last)
    } else {
      this.selectNode(last)
    }
  }

  // Toolbar

  #buildDefaultToolbar() {
    let strings = this.strings
    let items = this.toolbarItems
    let add = (identifier: string, caption: string, icon: string, kind: ToolbarItemKinds = ToolbarItemKinds.button, alwaysShowCaption: boolean = false) => {
      let item = new ToolbarItem(identifier, caption, icon, kind)
      item.alwaysShowCaption = alwaysShowCaption
      items.add(item)
      return item
    }
    add("insert", strings.TextInsertCaption, "bi bi-plus-lg", ToolbarItemKinds.menu, true).tooltip = strings.TextInsertTooltip
    items.add(this.#catalogItem("table")!)
    items.add(ToolbarItem.separator())
    add("undo", strings.TextUndoCaption, "bi bi-arrow-counterclockwise")
    add("redo", strings.TextRedoCaption, "bi bi-arrow-clockwise")
    items.add(ToolbarItem.separator())
    add("blocktype", strings.TextTextCaption, "", ToolbarItemKinds.menu, true).tooltip = strings.TextBlockTypeCaption
    add("font", strings.TextDefault, "", ToolbarItemKinds.menu, true).tooltip = strings.TextFontCaption
    add("size", strings.TextDefault, "", ToolbarItemKinds.menu, true).tooltip = strings.TextFontSizeMenuCaption
    items.add(ToolbarItem.separator())
    add("bold", strings.TextBoldCaption, "bi bi-type-bold", ToolbarItemKinds.toggle)
    add("italic", strings.TextItalicCaption, "bi bi-type-italic", ToolbarItemKinds.toggle)
    add("underline", strings.TextUnderlineCaption, "bi bi-type-underline", ToolbarItemKinds.toggle)
    add("strike", strings.TextStrikethroughCaption, "bi bi-type-strikethrough", ToolbarItemKinds.toggle)
    add("inline", strings.TextInlineFormatsCaption, "bi bi-code", ToolbarItemKinds.menu)
    add("textcolor", strings.TextTextColorCaption, "bi bi-fonts", ToolbarItemKinds.color)
    add("background", strings.TextBackgroundColorCaption, "bi bi-highlighter", ToolbarItemKinds.color)
    add("link", strings.TextHyperlinkCaption, "bi bi-link-45deg", ToolbarItemKinds.toggle)
    items.add(ToolbarItem.separator())
    add("alignment", strings.TextAlignmentCaption, "bi bi-text-left", ToolbarItemKinds.menu)
    add("lineheight", strings.TextLineHeightMenuCaption, "bi bi-distribute-vertical", ToolbarItemKinds.menu)
    add("linespacing", strings.TextLineSpacingMenuCaption, "bi bi-arrows-vertical", ToolbarItemKinds.menu)
    items.add(ToolbarItem.separator())
    add("clearformatting", strings.TextClearFormattingCaption, "bi bi-eraser")
    items.add(ToolbarItem.flexibleSpace())
    add("print", strings.TextPrintDocumentTooltip, "bi bi-printer")
    add("search", strings.TextCommandSearchCaption, "bi bi-search").tooltip = strings.TextCommandSearchTooltip
    Editor.#extensions.forEach(extension => {
      let after = extension.defaultToolbarAfter ? items.indexOf(extension.defaultToolbarAfter) : -1
      let index = after >= 0 ? after + 1 : items.lastIndex + 1
      ;(extension.defaultToolbarIdentifiers || []).forEach(identifier => {
        let item = extension.makeToolbarItem ? extension.makeToolbarItem(this, identifier) : null
        if (!item) return
        items.addAt(index, item)
        index++
      })
    })
  }

  #catalog: Map<string, ToolbarItem> = new Map()

  /**
   * Every built-in tool by identifier, whether or not the toolbar shows it: the
   * toolbar's own items, and those offered only in command search and the toolbar
   * customizer, such as the inline formats, Find, Replace and Add Comment.
   */
  #catalogItem(identifier: string): ToolbarItem | null {
    let onToolbar = this.toolbarItems.item(identifier)
    if (onToolbar) return onToolbar
    let existing = this.#catalog.get(identifier)
    if (existing) return existing
    let strings = this.strings
    let make = (caption: string, icon: string, kind: ToolbarItemKinds = ToolbarItemKinds.button, tooltip: string = "") => {
      let item = new ToolbarItem(identifier, caption, icon, kind, tooltip)
      this.#catalog.set(identifier, item)
      return item
    }
    switch (identifier) {
      case "insert": return make(strings.TextInsertCaption, "bi bi-plus-lg", ToolbarItemKinds.menu, strings.TextInsertTooltip)
      case "table": {
        let item = make(strings.TextTableCaption, "bi bi-table", ToolbarItemKinds.menu)
        item.makePopup = choose => new TableSizePicker(strings, (rows, columns) => {
          let menuItem = new ToolbarMenuItem(`${rows}x${columns}`, Utilities.format(strings.TextTableSizeCaptionFormat, {rows, columns}))
          menuItem.value = {rows, columns}
          choose(menuItem)
        })
        return item
      }
      case "undo": return make(strings.TextUndoCaption, "bi bi-arrow-counterclockwise")
      case "redo": return make(strings.TextRedoCaption, "bi bi-arrow-clockwise")
      case "blocktype": return make(strings.TextTextCaption, "", ToolbarItemKinds.menu, strings.TextBlockTypeCaption)
      case "font": return make(strings.TextDefault, "", ToolbarItemKinds.menu, strings.TextFontCaption)
      case "size": return make(strings.TextDefault, "", ToolbarItemKinds.menu, strings.TextFontSizeMenuCaption)
      case "bold": return make(strings.TextBoldCaption, "bi bi-type-bold", ToolbarItemKinds.toggle)
      case "italic": return make(strings.TextItalicCaption, "bi bi-type-italic", ToolbarItemKinds.toggle)
      case "underline": return make(strings.TextUnderlineCaption, "bi bi-type-underline", ToolbarItemKinds.toggle)
      case "strike": return make(strings.TextStrikethroughCaption, "bi bi-type-strikethrough", ToolbarItemKinds.toggle)
      case "inline": return make(strings.TextInlineFormatsCaption, "bi bi-code", ToolbarItemKinds.menu)
      case "code": return make(strings.TextInlineCodeCaption, "bi bi-code", ToolbarItemKinds.toggle)
      case "highlight": return make(strings.TextHighlightCaption, "bi bi-highlights", ToolbarItemKinds.toggle)
      case "keyboard": return make(strings.TextKeyboardKeyCaption, "bi bi-keyboard", ToolbarItemKinds.toggle)
      case "superscript": return make(strings.TextSuperscriptCaption, "bi bi-superscript", ToolbarItemKinds.toggle)
      case "subscript": return make(strings.TextSubscriptCaption, "bi bi-subscript", ToolbarItemKinds.toggle)
      case "textcolor": return make(strings.TextTextColorCaption, "bi bi-fonts", ToolbarItemKinds.color)
      case "background": return make(strings.TextBackgroundColorCaption, "bi bi-highlighter", ToolbarItemKinds.color)
      case "link": return make(strings.TextHyperlinkCaption, "bi bi-link-45deg", ToolbarItemKinds.toggle)
      case "alignment": return make(strings.TextAlignmentCaption, "bi bi-text-left", ToolbarItemKinds.menu)
      case "lineheight": return make(strings.TextLineHeightMenuCaption, "bi bi-distribute-vertical", ToolbarItemKinds.menu)
      case "linespacing": return make(strings.TextLineSpacingMenuCaption, "bi bi-arrows-vertical", ToolbarItemKinds.menu)
      case "clearformatting": return make(strings.TextClearFormattingCaption, "bi bi-eraser")
      case "comment": return make(strings.TextAddCommentCaption, "bi bi-chat-left-text", ToolbarItemKinds.button, strings.TextAddCommentTooltip)
      case "documentbackground": return make(strings.TextBackgroundToolbarCaption, "bi bi-image", ToolbarItemKinds.menu, strings.TextBackgroundImageCaption)
      case "find": return make(strings.TextFindCaption, "bi bi-search")
      case "replace": return make(strings.TextReplaceCaption, "bi bi-arrow-left-right")
      case "print": return make(strings.TextPrintDocumentTooltip, "bi bi-printer")
      case "search": return make(strings.TextCommandSearchCaption, "bi bi-search", ToolbarItemKinds.button, strings.TextCommandSearchTooltip)
    }
    for (let extension of Editor.#extensions) {
      if ((extension.toolbarIdentifiers || []).indexOf(identifier) < 0 || !extension.makeToolbarItem) continue
      let item = extension.makeToolbarItem(this, identifier)
      if (item) this.#catalog.set(identifier, item)
      return item
    }
    return null
  }

  /** The identifiers of every built-in tool, in the order the customizer lists them. */
  static get catalogIdentifiers(): Array<string> {
    let result = [
      "insert", "table", "undo", "redo", "blocktype", "font", "size", "bold", "italic", "underline", "strike", "inline",
      "code", "highlight", "keyboard", "superscript", "subscript", "textcolor", "background", "link",
      "alignment", "lineheight", "linespacing", "clearformatting",
      "comment", "documentbackground", "find", "replace", "print", "search"
    ]
    Editor.#extensions.forEach(extension => {
      let identifiers = (extension.toolbarIdentifiers || []).filter(identifier => result.indexOf(identifier) < 0)
      let after = extension.defaultToolbarAfter ? result.indexOf(extension.defaultToolbarAfter) : -1
      result.splice(after >= 0 ? after + 1 : result.length, 0, ...identifiers)
    })
    return result
  }

  // Command search

  /**
   * Opens command search: a searchable list of every enabled tool, the selected
   * node's tools first. Node types to insert, and the choices inside menus, are
   * listed once something is typed. Choosing one performs it as the toolbar would.
   * Shift-Command-P (Shift-Control-P elsewhere) opens it too.
   */
  showCommandSearch(anchor?: HTMLElement | DOMRect) {
    if (this.#readOnly || !this.#element) return
    Popup.closeAll()
    this.#closeSuggestions()
    this.#applyToolbarState()
    let strings = this.strings
    let entries = this.#commandEntries()
    let state = this.captureSelection()
    let popup = new ChoicePopup("scv-command-search", item => {
      this.restoreSelection(state)
      item.value.run()
      this.updateToolbarState()
    }, {
      placeholder: strings.TextCommandSearchHint,
      emptyCaption: strings.TextNoMatchingCommandsCaption,
      filter: query => {
        let words = query.toLowerCase().split(/\s+/).filter(word => word.length > 0)
        return entries
          .filter(entry => words.length == 0 ? !entry.searchOnly : words.every(word => entry.terms.indexOf(word) >= 0))
          .map(entry => ({caption: entry.caption, value: entry, icon: entry.icon, group: entry.group, detail: entry.detail}))
      }
    })
    popup.element.setAttribute("aria-label", strings.TextCommandSearchCaption)
    popup.onClose = () => { if (!popup.chosen) this.restoreSelection(state) }
    let searchItem = this.toolbarItems.item("search")
    let target: HTMLElement | DOMRect = anchor || (searchItem && searchItem.element && searchItem.element.isConnected && searchItem.element.offsetParent ? searchItem.element : (this.#toolbarElement && this.#toolbarVisible ? this.#toolbarElement : this.#element))
    popup.show(target, this.#element)
  }

  #commandEntries(): Array<{caption: string, icon: string, group: string, detail: string, terms: string, searchOnly: boolean, run: () => void}> {
    let strings = this.strings
    let result: Array<{caption: string, icon: string, group: string, detail: string, terms: string, searchOnly: boolean, run: () => void}> = []
    let seen = new Set<string>()
    let add = (caption: string, icon: string, group: string, searchOnly: boolean, run: () => void, keywords: string = "", detail: string = "") => {
      // Each tool is listed once, in the first group that offers it.
      let key = caption.toLowerCase()
      if (seen.has(key) || caption.trim().length == 0) return
      seen.add(key)
      result.push({caption: caption, icon: icon, group: group, detail: detail, searchOnly: searchOnly, run: run, terms: `${caption} ${keywords} ${group}`.toLowerCase()})
    }
    // The choices inside a menu, listed by their path, such as "Background › Fill › Stretch".
    let addMenu = (path: string, icon: string, group: string, items: Array<ToolbarMenuItem>, run: (menuItem: ToolbarMenuItem) => void, keywords: string) => {
      items.forEach(menuItem => {
        if (menuItem.isSeparator || !menuItem.enabled) return
        let caption = `${path} \u203A ${menuItem.caption}`
        if (menuItem.hasChildren) {
          addMenu(caption, icon, group, menuItem.children, run, keywords)
        } else {
          add(caption, menuItem.icon || icon, group, true, () => run(menuItem), keywords, menuItem.checked ? "\u2713" : "")
        }
      })
    }

    // The selected node's tools.
    let node = this.selectedNode
    if (node && this.#nodeToolbarShown) {
      let group = strings.TextContextToolsCaption
      this.#nodeToolbarItems(node).forEach(item => {
        if (item.kind == ToolbarItemKinds.separator || item.kind == ToolbarItemKinds.flexibleSpace || !item.enabled || item.identifier == "node-count" || item.identifier == "node-move") return
        let caption = item.tooltip || item.caption
        if (item.kind == ToolbarItemKinds.menu && item.menuItems.length > 0) {
          addMenu(caption, item.icon, group, item.menuItems, menuItem => this.#activateNodeToolbarItem(node, item, menuItem, null) && this.#renderNodeToolbar(), node.typeName)
        } else if (item.kind != ToolbarItemKinds.menu) {
          add(caption, item.icon, group, false, () => { if (this.#activateNodeToolbarItem(node, item, null, null)) this.#renderNodeToolbar() }, node.typeName)
        }
      })
      let targets = this.#selected.length > 1 ? this.inDocumentOrder(this.#selected) : [node]
      if (this.canMoveNodes(targets, -1)) add(strings.TextMoveUpCaption, "bi bi-arrow-up", group, false, () => this.moveNodes(targets, -1))
      if (this.canMoveNodes(targets, 1)) add(strings.TextMoveDownCaption, "bi bi-arrow-down", group, false, () => this.moveNodes(targets, 1))
    }

    // Node types to insert, and the extensions' other insertion choices.
    this.nodeTypes.items().filter(type => type.insertable).forEach(type => {
      add(type.caption, type.icon, strings.TextInsertCaption, true, () => this.insertNodeOfType(type), `${type.keywords} ${type.identifier}`)
    })
    this.insertionChoices().forEach(choice => {
      add(choice.caption, choice.icon, strings.TextInsertCaption, true, () => choice.choose(null), choice.keywords || "")
    })

    // Every other tool: the toolbar's, then the rest of the catalog.
    let group = strings.TextToolbarToolsCaption
    let identifiers = this.toolbarItems.items().map(item => item.identifier).concat(Editor.catalogIdentifiers)
    identifiers.forEach(identifier => {
      if (identifier == "search" || identifier == "insert") return
      let item = this.#catalogItem(identifier) || this.toolbarItems.item(identifier)
      if (!item || item.kind == ToolbarItemKinds.separator || item.kind == ToolbarItemKinds.flexibleSpace || !item.enabled || !item.visible) return
      if (identifier == "comment" && !this.allowAnnotations) return
      let caption = item.tooltip && item.kind != ToolbarItemKinds.menu ? item.tooltip : item.caption
      if (item.kind == ToolbarItemKinds.menu || item.kind == ToolbarItemKinds.color) {
        this.#prepareMenu(item)
        if (item.menuItems.length > 0) addMenu(item.caption, item.icon, group, item.menuItems, menuItem => this.activateToolbarItem(identifier, menuItem), identifier)
        // The color tools open their palette from the toolbar button.
        if (item.kind == ToolbarItemKinds.color && item.element && item.element.isConnected && item.element.offsetParent) {
          add(item.caption, item.icon, group, false, () => (item.element.querySelector("button") || item.element).dispatchEvent(new MouseEvent("click", {bubbles: true})), identifier)
        }
        return
      }
      add(caption, item.icon, group, false, () => this.activateToolbarItem(identifier), identifier)
    })
    return result
  }

  static #paletteIcons: {[identifier: string]: string} = {blocktype: "bi bi-paragraph", font: "bi bi-fonts", size: "bi bi-type"}

  /** Rebuilds the default toolbar, removing application items. */
  resetToolbar() {
    this.toolbarItems.removeAll()
    this.#buildDefaultToolbar()
    this.#renderToolbar()
    this.dispatchEvent(new CustomEvent("toolbarReset"))
  }

  // Toolbar customization

  #customizer: HTMLElement | null = null
  #customizerChanged: boolean = false
  #customizerDrag: {item: ToolbarItem | null, identifier: string, fromToolbar: boolean} | null = null
  #customizerIndicator: HTMLElement | null = null
  /** Application items seen on the toolbar, so the customizer can offer them again after removal. */
  #applicationItems: Map<string, ToolbarItem> = new Map()

  get isCustomizingToolbar(): boolean {
    return !!this.#customizer
  }

  /**
   * The toolbar's arrangement and display mode as JSON, for restoring with
   * loadToolbarState: item identifiers, with "separator" and "flexiblespace" for spaces.
   */
  saveToolbarState(): string {
    let items = this.toolbarItems.items().map(item => item.kind == ToolbarItemKinds.separator ? "separator" : (item.kind == ToolbarItemKinds.flexibleSpace ? "flexiblespace" : item.identifier))
    return JSON.stringify({version: 1, displayMode: this.#toolbarDisplayMode, items: items})
  }

  /** Restores an arrangement from saveToolbarState. Identifiers the editor doesn't know are skipped. Returns false for invalid state. */
  loadToolbarState(state: string | object): boolean {
    let data: any = state
    try {
      if (typeof state == "string") data = JSON.parse(state)
    } catch {
      return false
    }
    if (!data || typeof data != "object") return false
    let identifiers: Array<string> = []
    if (Array.isArray(data.items)) {
      identifiers = data.items.map(item => String(item))
    } else if (Array.isArray(data.classic) || Array.isArray(data.contextual)) {
      // A saved arrangement of sections: a separator between sections.
      ;(Array.isArray(data.classic) ? data.classic : data.contextual).forEach((section, index) => {
        if (index > 0) identifiers.push("separator")
        if (section && Array.isArray(section.items)) section.items.forEach(item => identifiers.push(String(item)))
      })
    } else {
      return false
    }
    let items: Array<ToolbarItem> = []
    identifiers.forEach(identifier => {
      let item = this.#toolbarItemFor(identifier)
      if (item && (item.kind == ToolbarItemKinds.separator || item.kind == ToolbarItemKinds.flexibleSpace || !items.some(existing => existing.identifier == item.identifier))) items.push(item)
    })
    let mode = Utilities.integer(data.displayMode, this.#toolbarDisplayMode)
    if (mode >= 0 && mode <= 2) this.#toolbarDisplayMode = mode
    this.toolbarItems.setItems(items)
    return true
  }

  /** A toolbar item for an identifier: a new space, a catalog item, or an application item seen before. */
  #toolbarItemFor(identifier: string): ToolbarItem | null {
    if (identifier == "separator" || identifier.startsWith("separator-")) return ToolbarItem.separator()
    if (identifier == "flexiblespace" || identifier.startsWith("flexiblespace-") || identifier == "space") {
      let space = ToolbarItem.flexibleSpace()
      space.identifier = `flexiblespace-${Utilities.uuid()}`
      return space
    }
    let existing = this.toolbarItems.item(identifier)
    if (existing) return existing
    let catalog = this.#catalog.get(identifier)
    if (catalog) {
      this.#catalog.delete(identifier)
      return catalog
    }
    let made = this.#catalogItem(identifier)
    if (made) {
      this.#catalog.delete(identifier)
      if (identifier == "insert" || identifier == "blocktype" || identifier == "font" || identifier == "size") made.alwaysShowCaption = true
      return made
    }
    return this.#applicationItems.get(identifier) || null
  }

  /**
   * Opens the customizer below the toolbar: drag items from it into the toolbar,
   * drag toolbar items to reorder them or off the toolbar to remove them, or drag
   * the default set to reset. Clicking an item in the customizer adds it at the end.
   */
  showToolbarCustomizer() {
    if (this.#customizer || this.#readOnly || !this.#toolbarElement || !this.#toolbarVisible) return
    Popup.closeAll()
    let strings = this.strings
    this.toolbarItems.items().forEach(item => {
      if (Editor.catalogIdentifiers.indexOf(item.identifier) < 0 && item.kind != ToolbarItemKinds.separator && item.kind != ToolbarItemKinds.flexibleSpace) this.#applicationItems.set(item.identifier, item)
    })
    this.#customizerChanged = false
    let sheet = Utilities.element("div", "scv-customizer", {role: "dialog", "aria-label": strings.TextCustomizeToolbarMenuCaption})
    let instructions = Utilities.element("div", "scv-customizer-instructions")
    instructions.textContent = strings.TextCustomizeToolbarInstructions
    sheet.append(instructions)
    let palette = Utilities.element("div", "scv-customizer-palette")
    let paletteItem = (identifier: string, caption: string, icon: string) => {
      let button = Utilities.element("button", "btn btn-sm scv-customizer-item", {type: "button", draggable: "true", title: caption}) as HTMLButtonElement
      if (icon.length > 0) button.append(Utilities.element("i", icon))
      let label = Utilities.element("span")
      label.textContent = caption
      button.append(label)
      button.addEventListener("dragstart", event => {
        this.#customizerDrag = {item: null, identifier: identifier, fromToolbar: false}
        event.dataTransfer.effectAllowed = "copy"
        event.dataTransfer.setData("text/plain", identifier)
      })
      button.addEventListener("dragend", () => this.#endCustomizerDrag())
      button.addEventListener("click", () => this.#customizerInsert(identifier, this.toolbarItems.items().length))
      palette.append(button)
    }
    Editor.catalogIdentifiers.forEach(identifier => {
      if (identifier == "comment" && !this.#allowAnnotations) return
      let item = this.#catalogItem(identifier)
      if (item) paletteItem(identifier, item.tooltip || item.caption, item.icon || Editor.#paletteIcons[identifier] || "bi bi-square")
    })
    this.#applicationItems.forEach((item, identifier) => paletteItem(identifier, item.tooltip || item.caption, item.icon))
    paletteItem("separator", strings.TextSeparatorCaption, "bi bi-distribute-horizontal")
    paletteItem("flexiblespace", strings.TextFlexibleSpaceCaption, "bi bi-arrows")
    sheet.append(palette)

    let defaults = Utilities.element("div", "scv-customizer-defaults")
    let defaultsCaption = Utilities.element("div", "scv-customizer-instructions")
    defaultsCaption.textContent = strings.TextCustomizeDefaultSetInstructions
    let defaultSet = Utilities.element("button", "btn btn-sm btn-outline-secondary scv-customizer-default-set", {type: "button", draggable: "true"})
    defaultSet.textContent = strings.TextResetCaption
    defaultSet.addEventListener("dragstart", event => {
      this.#customizerDrag = {item: null, identifier: "defaultset", fromToolbar: false}
      event.dataTransfer.effectAllowed = "copy"
      event.dataTransfer.setData("text/plain", "defaultset")
    })
    defaultSet.addEventListener("dragend", () => this.#endCustomizerDrag())
    defaultSet.addEventListener("click", () => {
      this.resetToolbar()
      this.#customizerChanged = false
    })
    let footer = Utilities.element("div", "scv-customizer-footer")
    let mode = Utilities.element("select", "form-select form-select-sm scv-customizer-mode", {"aria-label": strings.TextToolbarShowCaption}) as HTMLSelectElement
    ;[strings.TextIconOnlyCaption, strings.TextIconAndTextCaption, strings.TextTextOnlyCaption].forEach((caption, index) => {
      let option = document.createElement("option")
      option.value = String(index)
      option.textContent = caption
      option.selected = this.#toolbarDisplayMode == index
      mode.append(option)
    })
    mode.addEventListener("change", () => {
      this.toolbarDisplayMode = Number(mode.value)
      this.#customizerChanged = true
    })
    let modeLabel = Utilities.element("label", "scv-customizer-mode-label")
    modeLabel.textContent = strings.TextToolbarShowCaption
    modeLabel.append(mode)
    let done = Utilities.element("button", "btn btn-sm btn-primary", {type: "button"})
    done.textContent = strings.TextDoneCaption
    done.addEventListener("click", () => this.closeToolbarCustomizer())
    defaults.append(defaultsCaption, defaultSet)
    footer.append(defaults, modeLabel, done)
    sheet.append(footer)

    // Dropping an item dragged from the toolbar anywhere outside it removes it.
    sheet.addEventListener("dragover", event => {
      if (this.#customizerDrag && this.#customizerDrag.fromToolbar) {
        event.preventDefault()
        event.dataTransfer.dropEffect = "move"
      }
    })
    sheet.addEventListener("drop", event => {
      event.preventDefault()
      let drag = this.#customizerDrag
      if (drag && drag.fromToolbar && drag.item) this.#customizerRemove(drag.item)
      this.#endCustomizerDrag()
    })

    this.#customizer = sheet
    this.#toolbarElement.after(sheet)
    this.#element.classList.add("scv-customizing")
    this.#customizerIndicator = Utilities.element("div", "scv-customizer-indicator d-none")
    this.#toolbarElement.append(this.#customizerIndicator)
    this.#renderToolbar()
  }

  /** Closes the customizer, raising toolbarCustomized when the arrangement changed. */
  closeToolbarCustomizer() {
    if (!this.#customizer) return
    this.#customizer.remove()
    this.#customizer = null
    this.#customizerDrag = null
    this.#element.classList.remove("scv-customizing")
    this.#renderToolbar()
    if (this.#customizerChanged) this.dispatchEvent(new CustomEvent("toolbarCustomized", {detail: {state: this.saveToolbarState()}}))
    this.#customizerChanged = false
  }

  #endCustomizerDrag() {
    this.#customizerDrag = null
    if (this.#customizerIndicator) this.#customizerIndicator.classList.add("d-none")
  }

  #customizerInsert(identifier: string, index: number) {
    if (identifier == "defaultset") {
      this.resetToolbar()
      this.#customizerChanged = false
      return
    }
    let item = this.#toolbarItemFor(identifier)
    if (!item) return
    let items = this.toolbarItems.items()
    let existing = items.indexOf(item)
    if (existing >= 0) {
      items.splice(existing, 1)
      if (existing < index) index--
    }
    items.splice(Utilities.clamp(index, 0, items.length), 0, item)
    this.#customizerChanged = true
    this.toolbarItems.setItems(items)
  }

  #customizerMove(item: ToolbarItem, index: number) {
    let items = this.toolbarItems.items()
    let existing = items.indexOf(item)
    if (existing < 0) return
    items.splice(existing, 1)
    if (existing < index) index--
    items.splice(Utilities.clamp(index, 0, items.length), 0, item)
    this.#customizerChanged = true
    this.toolbarItems.setItems(items)
  }

  #customizerRemove(item: ToolbarItem) {
    let items = this.toolbarItems.items().filter(candidate => candidate !== item)
    if (Editor.catalogIdentifiers.indexOf(item.identifier) >= 0) this.#catalog.set(item.identifier, item)
    this.#customizerChanged = true
    this.toolbarItems.setItems(items)
  }

  /** The insertion index nearest the pointer among the toolbar's items. */
  #customizerDropIndex(x: number, y: number): {index: number, rect: DOMRect | null, after: boolean} {
    let items = this.toolbarItems.items()
    let best = {index: items.length, rect: null as DOMRect | null, after: true}
    let bestDistance = Infinity
    items.forEach((item, index) => {
      if (!item.element || !item.element.isConnected) return
      let rect = item.element.getBoundingClientRect()
      let rowDistance = y < rect.top ? rect.top - y : (y > rect.bottom ? y - rect.bottom : 0)
      let middle = rect.left + rect.width / 2
      let after = x > middle
      let distance = rowDistance * 1000 + Math.abs(x - (after ? rect.right : rect.left))
      if (distance < bestDistance) {
        bestDistance = distance
        best = {index: after ? index + 1 : index, rect: rect, after: after}
      }
    })
    return best
  }

  /** Makes the toolbar's items draggable while the customizer is open. */
  #prepareCustomizingToolbar(toolbar: HTMLElement) {
    if (!this.#customizer) return
    this.toolbarItems.items().forEach(item => {
      let element = item.element
      if (!element) return
      element.setAttribute("draggable", "true")
      element.classList.add("scv-customizable")
      element.addEventListener("dragstart", event => {
        this.#customizerDrag = {item: item, identifier: item.identifier, fromToolbar: true}
        event.dataTransfer.effectAllowed = "move"
        event.dataTransfer.setData("text/plain", item.identifier)
      })
      element.addEventListener("dragend", event => {
        let drag = this.#customizerDrag
        // Dropped outside the toolbar and the customizer: removed.
        if (drag && drag.fromToolbar && drag.item && event.dataTransfer.dropEffect == "none") {
          let rect = toolbar.getBoundingClientRect()
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) this.#customizerRemove(drag.item)
        }
        this.#endCustomizerDrag()
      })
      // A remove button on each item, for keyboards and pointers that don't drag.
      let remove = Utilities.element("span", "scv-customizer-remove", {role: "button", "aria-label": `${this.strings.TextRemoveCaption} ${item.tooltip || item.caption || item.identifier}`, tabindex: "0"})
      remove.append(Utilities.element("i", "bi bi-x"))
      remove.addEventListener("click", event => {
        event.stopPropagation()
        event.preventDefault()
        this.#customizerRemove(item)
      })
      remove.addEventListener("keydown", event => {
        if (event.key == "Enter" || event.key == " ") {
          event.preventDefault()
          this.#customizerRemove(item)
        }
      })
      element.append(remove)
    })
  }

  #attachCustomizerTargets(toolbar: HTMLElement) {
    toolbar.addEventListener("click", event => {
      // While customizing, toolbar items don't perform their commands.
      if (this.#customizer && !(event.target as HTMLElement).closest(".scv-customizer-remove")) {
        event.preventDefault()
        event.stopPropagation()
      }
    }, true)
    toolbar.addEventListener("dragover", event => {
      if (!this.#customizer || !this.#customizerDrag) return
      event.preventDefault()
      event.dataTransfer.dropEffect = this.#customizerDrag.fromToolbar ? "move" : "copy"
      let target = this.#customizerDropIndex(event.clientX, event.clientY)
      let indicator = this.#customizerIndicator
      if (indicator && target.rect) {
        let bar = toolbar.getBoundingClientRect()
        indicator.classList.remove("d-none")
        indicator.style.left = `${(target.after ? target.rect.right : target.rect.left) - bar.left - 1}px`
        indicator.style.top = `${target.rect.top - bar.top}px`
        indicator.style.height = `${target.rect.height}px`
      }
    })
    toolbar.addEventListener("drop", event => {
      let drag = this.#customizerDrag
      if (!this.#customizer || !drag) return
      event.preventDefault()
      let target = this.#customizerDropIndex(event.clientX, event.clientY)
      if (drag.fromToolbar && drag.item) {
        this.#customizerMove(drag.item, target.index)
      } else {
        this.#customizerInsert(drag.identifier, target.index)
      }
      this.#endCustomizerDrag()
    })
  }

  #renderToolbar() {
    let toolbar = this.#toolbarElement
    if (!toolbar) return
    toolbar.textContent = ""
    this.toolbarItems.items().forEach(item => {
      toolbar.append(ToolbarView.buildItem(item, this.#toolbarDisplayMode, this.strings, this.#element, menuItem => this.#prepareMenu(menuItem), (activated, menuItem) => this.activateToolbarItem(activated.identifier, menuItem)))
    })
    if (this.#customizer) {
      if (this.#customizerIndicator) toolbar.append(this.#customizerIndicator)
      this.#prepareCustomizingToolbar(toolbar)
    }
    this.updateToolbarState()
  }

  #prepareMenu(item: ToolbarItem) {
    let strings = this.strings
    switch (item.identifier) {
      case "blocktype": {
        let kind = this.#currentBlockKind()
        let entries = this.#blockKindEntries(false)
        item.menuItems = entries.map(([identifier, caption, icon]) => {
          let menuItem = new ToolbarMenuItem(identifier, caption, icon)
          menuItem.checked = Editor.#blockKindMatches(identifier, kind, entries)
          return menuItem
        })
        break
      }
      case "font": {
        let current = this.formatting.currentStyle().fontName
        item.menuItems = [new ToolbarMenuItem("", strings.TextDefault)].concat(this.activeFontOptions().fontNames().map(name => {
          let menuItem = new ToolbarMenuItem(name, name)
          menuItem.captionStyle = `font-family:${Utilities.fontFamilyCSS(name)}`
          return menuItem
        }))
        item.menuItems.forEach(menuItem => menuItem.checked = menuItem.identifier == current)
        break
      }
      case "size": {
        let current = this.formatting.currentStyle().fontSize
        let options = this.activeFontOptions()
        item.menuItems = [0].concat(options.sizes()).map(size => {
          let menuItem = new ToolbarMenuItem(String(size), size == 0 ? strings.TextDefault : String(size))
          menuItem.checked = size == current
          return menuItem
        })
        if (current > 0 && options.indexOfSize(current) < 0) {
          let shown = new ToolbarMenuItem(String(current), String(current))
          shown.checked = true
          item.menuItems.push(shown)
        }
        if (options.allowCustomFontSize) item.menuItems.push(ToolbarMenuItem.separator(), new ToolbarMenuItem("custom", strings.TextCustomFontSizeMenuCaption))
        break
      }
      case "inline": {
        let entries: Array<[FormattingStyles, string, string]> = [
          [FormattingStyles.code, strings.TextInlineCodeCaption, "bi bi-code"],
          [FormattingStyles.highlight, strings.TextHighlightCaption, "bi bi-highlights"],
          [FormattingStyles.keyboard, strings.TextKeyboardCaption, "bi bi-keyboard"],
          [FormattingStyles.superscript, strings.TextSuperscriptCaption, "bi bi-superscript"],
          [FormattingStyles.subscript, strings.TextSubscriptCaption, "bi bi-subscript"]
        ]
        item.menuItems = entries.map(([style, caption, icon]) => {
          let menuItem = new ToolbarMenuItem(String(style), caption, icon)
          menuItem.checked = this.formatting.isApplied(style)
          menuItem.enabled = this.formatting.canApply(style)
          return menuItem
        })
        break
      }
      case "alignment": {
        let current = this.formatting.alignment
        let entries: Array<[Alignments, string, string]> = [
          [Alignments.leading, strings.TextStartAlignmentCaption, "bi bi-text-left"],
          [Alignments.middle, strings.TextCenterAlignmentCaption, "bi bi-text-center"],
          [Alignments.trailing, strings.TextEndAlignmentCaption, "bi bi-text-right"]
        ]
        item.menuItems = entries.map(([value, caption, icon]) => {
          let menuItem = new ToolbarMenuItem(String(value), caption, icon)
          menuItem.checked = value == current
          return menuItem
        })
        break
      }
      case "insert": {
        let types = this.nodeTypes.items().filter(type => type.insertable)
        item.menuItems = types.map(type => new ToolbarMenuItem(type.identifier, type.caption, type.icon))
        // The same chooser as "/", with its search field once the list is long enough.
        item.makePopup = choose => {
          let chooser = new InsertionChooser(strings, types, type => choose(new ToolbarMenuItem(type.identifier, type.caption, type.icon)))
          chooser.hasSearchField = types.length >= this.insertMenuSearchThreshold
          return chooser
        }
        break
      }
      case "lineheight":
      case "linespacing": {
        let nodes = this.#lineMetricNodes()
        let lineHeight = item.identifier == "lineheight"
        let current = nodes.length > 0 ? (lineHeight ? nodes[0].lineHeight : nodes[0].lineSpacing) : (lineHeight ? 1 : 0)
        let values = lineHeight ? Editor.lineHeights : Editor.lineSpacings
        item.menuItems = values.map(value => {
          let menuItem = new ToolbarMenuItem(String(value), String(value))
          menuItem.checked = value == current
          return menuItem
        })
        break
      }
      case "documentbackground":
        item.menuItems = this.#backgroundItem(null).menuItems
        break
    }
  }

  async #promptFontSize() {
    let strings = this.strings
    let current = this.formatting.currentStyle().fontSize
    let values = await this.prompt(strings.TextFontSizeMenuCaption, [{name: "size", label: strings.TextCustomFontSizeFieldTooltip, value: current > 0 ? String(current) : "", type: "number", placeholder: strings.TextDefault}])
    if (!values) return
    let size = Number(values.size)
    if (isFinite(size) && size >= 1 && size <= 1000) this.formatting.setFontSize(Math.round(size * 100) / 100)
  }

  /** Line heights offered by the Line Height menu, as multiples of the font's. */
  static lineHeights: Array<number> = [1, 1.15, 1.25, 1.5, 2]
  /** Extra space between lines offered by the Line Spacing menu, in pixels. */
  static lineSpacings: Array<number> = [0, 1, 2, 4, 8, 12, 16]

  /** The nodes the line height and spacing tools change: those selected, or the one being edited. */
  #lineMetricNodes(): Array<Node> {
    if (this.#activeHost) return [this.#activeHost.node]
    return this.inDocumentOrder(this.#selected).filter(node => !node.locked)
  }

  #setLineMetric(identifier: string, value: number) {
    let nodes = this.#lineMetricNodes()
    if (nodes.length == 0 || this.#readOnly || !isFinite(value)) return
    this.history.breakCoalescing()
    this.history.checkpoint()
    this.beginUpdate()
    nodes.forEach(node => {
      if (identifier == "lineheight") {
        node.lineHeight = value
      } else {
        node.lineSpacing = value
      }
      this.refreshNode(node)
      node.changed()
    })
    this.endUpdate()
    this.history.breakCoalescing()
  }

  /** Performs a toolbar item's command, as clicking it does. */
  activateToolbarItem(identifier: string, menuItem: ToolbarMenuItem | null = null) {
    let item = this.#catalogItem(identifier)
    switch (identifier) {
      case "undo": this.history.undo(); break
      case "redo": this.history.redo(); break
      case "bold": this.formatting.toggle(FormattingStyles.bold); break
      case "italic": this.formatting.toggle(FormattingStyles.italic); break
      case "underline": this.formatting.toggle(FormattingStyles.underline); break
      case "strike": this.formatting.toggle(FormattingStyles.strikethrough); break
      case "inline": if (menuItem) this.formatting.toggle(Number(menuItem.identifier)); break
      case "textcolor": if (menuItem) this.formatting.setTextColor(menuItem.value); break
      case "background": if (menuItem) this.formatting.setBackgroundColor(menuItem.value); break
      case "link": this.formatting.editLink(); break
      case "font": if (menuItem) this.formatting.setFontName(menuItem.identifier); break
      case "size":
        if (menuItem && menuItem.identifier == "custom") {
          this.#promptFontSize()
        } else if (menuItem) {
          this.formatting.setFontSize(Number(menuItem.identifier))
        }
        break
      case "alignment": if (menuItem) this.formatting.align(Number(menuItem.identifier)); break
      case "clearformatting": this.formatting.clearFormatting(); break
      case "search": this.showCommandSearch(); break
      case "find": this.search.show(false); break
      case "replace": this.search.show(true); break
      case "print": this.print(); break
      case "code": this.formatting.toggle(FormattingStyles.code); break
      case "highlight": this.formatting.toggle(FormattingStyles.highlight); break
      case "keyboard": this.formatting.toggle(FormattingStyles.keyboard); break
      case "superscript": this.formatting.toggle(FormattingStyles.superscript); break
      case "subscript": this.formatting.toggle(FormattingStyles.subscript); break
      case "comment": this.annotations.show(null, true); break
      case "lineheight":
      case "linespacing":
        if (menuItem) this.#setLineMetric(identifier, Number(menuItem.identifier))
        break
      case "documentbackground":
        if (menuItem) this.#performBackground(null, menuItem)
        break
      case "blocktype":
        if (menuItem) {
          let [kind, value] = menuItem.identifier.split(":")
          this.setBlockType(kind, Number(value || 0))
        }
        break
      case "insert":
        if (menuItem) this.insertNodeOfType(menuItem.identifier)
        break
      case "table": {
        // The size grid's choice, or the usual size without one.
        let size = menuItem && menuItem.value ? menuItem.value : {rows: 3, columns: 3}
        if (this.nodeTypes.item("table")) this.insertNewNode(TableNode.withSize(this, size.rows, size.columns))
        break
      }
      default:
        if (!Editor.#extensions.some(extension => extension.activateToolbarItem && extension.activateToolbarItem(this, identifier, menuItem))) {
          this.dispatchEvent(new CustomEvent("toolbarItemPressed", {detail: {item: item, menuItem: menuItem}}))
        }
    }
    this.updateToolbarState()
  }

  /** Refreshes toolbar buttons for the current selection. */
  updateToolbarState() {
    if (this.#stateFrame || !this.#element) return
    this.#stateFrame = requestAnimationFrame(() => {
      this.#stateFrame = 0
      this.#applyToolbarState()
    })
  }

  #applyToolbarState() {
    let items = this.toolbarItems
    let set = (identifier: string, enabled: boolean, active: boolean = false) => {
      let item = this.#catalogItem(identifier)
      if (!item) return
      // While customizing, every item can be dragged and removed; none performs its command.
      item.enabled = (enabled && this.#enabled) || !!this.#customizer
      item.active = active
    }
    let canFormat = this.formatting.canApply()
    let node = this.#activeHost ? this.#activeHost.node : this.selectedNode
    let textNode = node instanceof TextNode && node.isTextBlock
    set("undo", this.history.canUndo && !this.#readOnly)
    set("redo", this.history.canRedo && !this.#readOnly)
    set("bold", this.formatting.canApply(FormattingStyles.bold), canFormat && this.formatting.isApplied(FormattingStyles.bold))
    set("italic", this.formatting.canApply(FormattingStyles.italic), canFormat && this.formatting.isApplied(FormattingStyles.italic))
    set("underline", this.formatting.canApply(FormattingStyles.underline), canFormat && this.formatting.isApplied(FormattingStyles.underline))
    set("strike", this.formatting.canApply(FormattingStyles.strikethrough), canFormat && this.formatting.isApplied(FormattingStyles.strikethrough))
    set("inline", canFormat)
    set("textcolor", canFormat)
    set("background", canFormat)
    set("font", canFormat)
    set("size", canFormat)
    set("clearformatting", canFormat)
    let style = canFormat ? this.formatting.currentStyle() : null
    set("link", this.formatting.canEditLink, !!style && style.linkURL.length > 0)
    set("alignment", this.formatting.canAlign)
    set("blocktype", !this.#readOnly && textNode)
    Editor.#extensions.forEach(extension => extension.updateToolbarState?.(this, set))
    set("insert", !this.#readOnly)
    set("search", !this.#readOnly)
    set("table", !this.#readOnly && !!this.nodeTypes.item("table"))
    set("find", true, this.search.visible)
    set("replace", !this.#readOnly)
    set("print", true)
    set("code", this.formatting.canApply(FormattingStyles.code), canFormat && this.formatting.isApplied(FormattingStyles.code))
    set("highlight", this.formatting.canApply(FormattingStyles.highlight), canFormat && this.formatting.isApplied(FormattingStyles.highlight))
    set("keyboard", this.formatting.canApply(FormattingStyles.keyboard), canFormat && this.formatting.isApplied(FormattingStyles.keyboard))
    set("superscript", this.formatting.canApply(FormattingStyles.superscript), canFormat && this.formatting.isApplied(FormattingStyles.superscript))
    set("subscript", this.formatting.canApply(FormattingStyles.subscript), canFormat && this.formatting.isApplied(FormattingStyles.subscript))
    let metricNodes = this.#lineMetricNodes()
    set("lineheight", !this.#readOnly && metricNodes.length > 0)
    set("linespacing", !this.#readOnly && metricNodes.length > 0)
    let lineHeight = items.item("lineheight")
    if (lineHeight) lineHeight.setTooltip(Utilities.format(this.strings.TextLineHeightTooltipFormat, {value: metricNodes.length > 0 ? metricNodes[0].lineHeight : 1}))
    let lineSpacing = items.item("linespacing")
    if (lineSpacing) lineSpacing.setTooltip(Utilities.format(this.strings.TextLineSpacingTooltipFormat, {value: metricNodes.length > 0 ? metricNodes[0].lineSpacing : 0}))
    set("comment", this.allowAnnotations && this.annotations.canAdd)
    set("documentbackground", !this.#readOnly)

    let textColor = items.item("textcolor")
    let swatch = textColor && textColor.element ? textColor.element.querySelector(".scv-toolbar-swatch") as HTMLElement : null
    if (swatch) swatch.style.backgroundColor = style && !Colors.isEmpty(style.textColor) ? Colors.toCSS(style.textColor) : ""
    let background = items.item("background")
    swatch = background && background.element ? background.element.querySelector(".scv-toolbar-swatch") as HTMLElement : null
    if (swatch) swatch.style.backgroundColor = style && style.hasBackgroundColor ? Colors.toCSS(style.backgroundColor) : ""

    let font = items.item("font")
    if (font) font.setDisplayCaption(style && style.fontName.length > 0 ? style.fontName : this.strings.TextDefault)
    let size = items.item("size")
    if (size) size.setDisplayCaption(style && style.fontSize > 0 ? String(style.fontSize) : this.strings.TextDefault)

    let blockType = items.item("blocktype")
    if (blockType) {
      let kind = this.#currentBlockKind()
      let entries = this.#blockKindEntries(false)
      let entry = entries.find(candidate => Editor.#blockKindMatches(candidate[0], kind, entries))
      let caption = entry ? entry[1] : ""
      blockType.setDisplayCaption(caption || (node ? node.typeName : this.strings.TextTextCaption))
    }

    let alignment = items.item("alignment")
    if (alignment && alignment.element) {
      let icon = alignment.element.querySelector(".scv-toolbar-icon")
      let current = this.formatting.alignment
      if (icon) icon.className = `${["bi bi-text-left", "bi bi-text-left", "bi bi-text-center", "bi bi-text-right"][current]} scv-toolbar-icon`
    }
  }

  // Node toolbar

  /** The items every node's toolbar starts with: the move grip, Duplicate and Delete. */
  #commonNodeActions(node: Node): Array<ToolbarItem> {
    let strings = this.strings
    let move = new ToolbarItem("node-move", strings.TextMoveNodeCaption, "bi bi-grip-vertical", ToolbarItemKinds.button, strings.TextMoveNodeTooltip)
    let duplicate = new ToolbarItem("node-duplicate", strings.TextDuplicateNodeCaption, "bi bi-copy")
    let remove = new ToolbarItem("node-delete", strings.TextRemoveNodeTooltip, "bi bi-trash3")
    move.enabled = duplicate.enabled = remove.enabled = !node.locked
    return [move, duplicate, remove]
  }

  /** The Background menu: a background image for the node, or the document when node is null, its fill and its repeat. */
  #backgroundItem(node: Node | null): ToolbarItem {
    let strings = this.strings
    let item = new ToolbarItem(node ? "node-background" : "documentbackground", strings.TextBackgroundToolbarCaption, "bi bi-image-alt", ToolbarItemKinds.menu, node ? strings.TextNodeBackgroundImageCaption : strings.TextBackgroundImageCaption)
    let image = node ? node.backgroundImage : this.backgroundImage
    let remove = new ToolbarMenuItem("remove", strings.TextRemoveImageCaption, "bi bi-x-lg")
    remove.enabled = !image.isEmpty
    item.menuItems.push(new ToolbarMenuItem("choose", strings.TextChooseImageMenuCaption, "bi bi-folder2-open"), new ToolbarMenuItem("source", strings.TextEnterImageSourceMenuCaption, "bi bi-link-45deg"), remove, ToolbarMenuItem.separator())
    let fills = [strings.TextActualSizeCaption, strings.TextStretchCaption, strings.TextFitCaption, strings.TextFillCaption].map((caption, index) => {
      let entry = new ToolbarMenuItem(`fill:${index}`, caption)
      entry.checked = image.fill == index
      return entry
    })
    let repeats = [strings.TextNoRepeatCaption, strings.TextRepeatHorizontallyCaption, strings.TextRepeatVerticallyCaption, strings.TextRepeatBothCaption].map((caption, index) => {
      let entry = new ToolbarMenuItem(`repeat:${index}`, caption)
      entry.checked = image.repeat == index
      return entry
    })
    let fill = ToolbarMenuItem.submenu("fill", strings.TextFillCaption, "bi bi-aspect-ratio", fills)
    let repeat = ToolbarMenuItem.submenu("repeat", strings.TextRepeatCaption, "bi bi-grid-3x3", repeats)
    // Fill and repeat only mean something once there is an image.
    fill.enabled = repeat.enabled = !image.isEmpty
    item.menuItems.push(fill, repeat)
    return item
  }

  async #performBackground(node: Node | null, menuItem: ToolbarMenuItem) {
    let identifier = menuItem.identifier
    let current = node ? node.backgroundImage : this.backgroundImage
    let apply = (change: (image: BackgroundImage) => void) => {
      this.history.checkpoint()
      let image = current.clone()
      change(image)
      if (node) {
        node.backgroundImage = image
        node.refresh()
        node.changed()
      } else {
        this.backgroundImage = image
        this.nodeChanged(null)
      }
    }
    if (identifier == "choose") {
      MediaUI.pickFile("image/*", async file => {
        let data: string
        try {
          data = await this.storeFile(file, "background", node)
        } catch {
          this.showMessage(this.strings.TextUploadFailedMessage, "danger")
          return
        }
        apply(image => image.source = data)
      })
    } else if (identifier == "source") {
      let values = await this.prompt(this.strings.TextBackgroundImageCaption, [{name: "url", label: this.strings.TextURLCaption, value: current.source.startsWith("data:") ? "" : current.source, type: "url", placeholder: "https://"}])
      if (values) apply(image => image.source = String(values.url || "").trim())
    } else if (identifier == "remove") {
      apply(image => image.clear())
    } else if (identifier.startsWith("fill:")) {
      apply(image => image.fill = Number(identifier.substring(5)))
    } else if (identifier.startsWith("repeat:")) {
      apply(image => image.repeat = Number(identifier.substring(7)))
    }
  }

  /** The Width and Height buttons of a resizable node. */
  #sizeItems(node: Node): Array<ToolbarItem> {
    let strings = this.strings
    let size = node.toolbarSize()
    let width = new ToolbarItem("node-width", Utilities.format(strings.TextWidthCaptionFormat, {value: Math.round(size.width)}), "", ToolbarItemKinds.button, strings.TextSetNodeWidthTooltip)
    let height = new ToolbarItem("node-height", Utilities.format(strings.TextHeightCaptionFormat, {value: Math.round(size.height)}), "", ToolbarItemKinds.button, strings.TextSetNodeHeightTooltip)
    width.alwaysShowCaption = height.alwaysShowCaption = true
    return node.toolbarResizesHeight ? [width, height] : [width]
  }

  async #editNodeSize(node: Node, dimension: "width" | "height") {
    let strings = this.strings
    let size = node.toolbarSize()
    let values = await this.prompt(dimension == "width" ? strings.TextWidthInspectorCaption : strings.TextHeightInspectorCaption, [{name: "value", label: dimension == "width" ? strings.TextSetNodeWidthTooltip : strings.TextSetNodeHeightTooltip, value: String(Math.round(dimension == "width" ? size.width : size.height)), type: "number", placeholder: strings.TextAutomatic}])
    if (!values) return
    let text = String(values.value || "").trim()
    let number = text.length == 0 ? 0 : Number(text)
    if (!isFinite(number) || number < 0) return
    this.history.checkpoint()
    node.setToolbarSize(dimension, Math.round(number))
    node.refresh()
    node.changed()
  }

  /** Whether the selected node's floating toolbar shows. */
  get #nodeToolbarShown(): boolean {
    let node = this.selectedNode
    return !this.#readOnly && this.#showContextualToolbars && !!node && !!node.element
  }

  #renderNodeToolbar() {
    let toolbar = this.#nodeToolbarElement
    if (!toolbar) return
    toolbar.textContent = ""
    if (!this.#nodeToolbarShown) {
      toolbar.classList.add("d-none")
      return
    }
    let node = this.selectedNode
    let items = this.#nodeToolbarItems(node)
    items.forEach(item => {
      let element = ToolbarView.buildItem(item, ToolbarDisplayModes.iconOnly, this.strings, this.#element, () => {}, (activated, menuItem) => {
        if (this.#activateNodeToolbarItem(node, activated, menuItem, activated.element)) this.#renderNodeToolbar()
      })
      if (item.identifier == "node-move") {
        element.draggable = item.enabled
        element.classList.add("scv-node-toolbar-grip")
        // Toolbar buttons cancel mousedown to keep the text selection, which would also stop a drag.
        element.addEventListener("mousedown", event => event.stopImmediatePropagation(), true)
        element.addEventListener("dragstart", event => this.#beginNodeDrag(node, event))
        element.addEventListener("dragend", () => this.#endNodeDrag())
      }
      toolbar.append(element)
    })
    toolbar.classList.remove("d-none")
    this.#positionNodeToolbar()
  }

  /** The selected node's toolbar items. With several nodes selected, the commands that apply to all of them. */
  #nodeToolbarItems(node: Node): Array<ToolbarItem> {
    let multiple = this.#selected.length > 1
    let items = this.#commonNodeActions(node)
    if (multiple) {
      items[0].enabled = this.#selected.some(item => !item.locked)
      items[1].enabled = items[2].enabled = items[0].enabled
      let count = new ToolbarItem("node-count", Utilities.format(this.strings.TextMultipleNodesFormat, {count: this.#selected.length}), "", ToolbarItemKinds.button)
      count.alwaysShowCaption = true
      count.enabled = false
      items.unshift(count, ToolbarItem.separator())
    } else {
      let actions = node.locked ? [] : node.actions()
      if (actions.length > 0) items.push(ToolbarItem.separator(), ...actions)
      if (!node.locked) items.push(ToolbarItem.separator(), this.#backgroundItem(node))
      if (node.toolbarCanResize && !node.locked) items.push(...this.#sizeItems(node))
    }
    if (this.allowAnnotations) {
      let comment = this.#catalogItem("comment")
      if (comment) {
        comment.enabled = this.annotations.canAdd
        items.push(ToolbarItem.separator(), comment)
      }
    }
    return items
  }

  /** Performs a node toolbar item. Returns true when the node toolbar should be rebuilt. */
  #activateNodeToolbarItem(node: Node, activated: ToolbarItem, menuItem: ToolbarMenuItem | null, anchor: HTMLElement | null): boolean {
    let targets = this.#selected.length > 1 ? this.inDocumentOrder(this.#selected) : [node]
    switch (activated.identifier) {
      case "node-move":
        if (anchor) this.#showNodeMenu(node, anchor)
        return false
      case "node-duplicate": this.duplicateNodes(targets); break
      case "node-delete": this.removeNodes(targets); break
      case "node-width": this.#editNodeSize(node, "width"); return false
      case "node-height": this.#editNodeSize(node, "height"); return false
      case "node-background": if (menuItem) this.#performBackground(node, menuItem); break
      case "comment": this.annotations.show(null, true); return false
      default:
        if (!node.performAction(activated, menuItem)) this.dispatchEvent(new CustomEvent("toolbarItemPressed", {detail: {item: activated, menuItem: menuItem, node: node}}))
    }
    return true
  }

  #positionNodeToolbar() {
    let toolbar = this.#nodeToolbarElement
    let node = this.selectedNode
    if (!toolbar || toolbar.classList.contains("d-none") || !node || !node.element || !node.element.isConnected) return
    let page = this.#pageElement.getBoundingClientRect()
    let rect = (node.body || node.element).getBoundingClientRect()
    let gap = 4
    // Above the node's trailing corner, but never above the visible area, so it
    // stays in reach while the node is scrolled partly out of view.
    let top = rect.top - page.top - toolbar.offsetHeight - gap
    top = Math.max(top, this.#scrollerElement.scrollTop + gap)
    toolbar.style.top = `${Math.max(0, top)}px`
    let rightToLeft = getComputedStyle(this.#documentElement).direction == "rtl"
    let left = rightToLeft ? rect.left - page.left : rect.right - page.left - toolbar.offsetWidth
    left = Math.min(left, page.width - toolbar.offsetWidth - 4)
    toolbar.style.left = `${Math.max(4, left)}px`
    // Hidden while the node is entirely out of view.
    let scroller = this.#scrollerElement.getBoundingClientRect()
    toolbar.classList.toggle("scv-node-toolbar-offscreen", rect.bottom < scroller.top || rect.top > scroller.bottom)
  }

  #showNodeMenu(node: Node, anchor: HTMLElement) {
    let strings = this.strings
    let items: Array<ToolbarMenuItem> = []
    let convertible = (this.#selected.length > 1 && this.#selected.indexOf(node) >= 0 ? this.#selected : [node]).some(item => item instanceof TextNode && item.isTextBlock)
    if (convertible && !this.#readOnly) {
      let entries = this.#blockKindEntries(true)
      let current = this.#currentBlockKind()
      let turnInto = entries.map(([identifier, caption, icon]) => {
        let entry = new ToolbarMenuItem(`turn:${identifier}`, caption, icon)
        entry.checked = Editor.#blockKindMatches(identifier, current, entries)
        return entry
      })
      items.push(ToolbarMenuItem.submenu("turninto", strings.TextTurnIntoCaption, "bi bi-arrow-left-right", turnInto), ToolbarMenuItem.separator())
    }
    // The menu acts on every selected node when node is one of several selected.
    let targets = this.#selected.length > 1 && this.#selected.indexOf(node) >= 0 ? this.inDocumentOrder(this.#selected) : [node]
    let up = new ToolbarMenuItem("moveup", strings.TextMoveUpCaption, "bi bi-arrow-up")
    up.enabled = this.canMoveNodes(targets, -1)
    let down = new ToolbarMenuItem("movedown", strings.TextMoveDownCaption, "bi bi-arrow-down")
    down.enabled = this.canMoveNodes(targets, 1)
    let duplicate = new ToolbarMenuItem("duplicate", strings.TextDuplicateNodeCaption, "bi bi-copy")
    let remove = new ToolbarMenuItem("delete", strings.TextRemoveNodeTooltip, "bi bi-trash3")
    duplicate.enabled = remove.enabled = targets.some(target => !target.locked) && !this.#readOnly
    items.push(up, down, duplicate, remove)
    let menu = new PopupMenu(items, menuItem => {
      if (menuItem.identifier.startsWith("turn:")) {
        let [kind, value] = menuItem.identifier.substring(5).split(":")
        this.selectNodes(targets)
        this.setBlockType(kind, Number(value || 0))
        return
      }
      switch (menuItem.identifier) {
        case "moveup": this.moveNodes(targets, -1); break
        case "movedown": this.moveNodes(targets, 1); break
        case "duplicate": this.duplicateNodes(targets); break
        case "delete": this.removeNodes(targets); break
      }
    })
    menu.show(anchor, this.#element)
  }

  /** Shows the searchable list of blocks. Choosing one inserts it, replacing replace when given. */
  /** What the extensions add to the insertion chooser and command search. */
  insertionChoices(): Array<InsertionChoice> {
    let result: Array<InsertionChoice> = []
    Editor.#extensions.forEach(extension => {
      if (extension.insertionChoices) result.push(...extension.insertionChoices(this))
    })
    return result
  }

  showInsertionChooser(anchor?: HTMLElement | DOMRect, replace: Node | null = null) {
    if (this.#readOnly) return
    let state = this.captureSelection()
    let prepare = (): Node | null => {
      this.restoreSelection(state)
      if (replace && replace instanceof TextNode && replace.content.text == "/") {
        replace.content.remove(0, 1)
      }
      return replace && replace instanceof TextNode && replace.content.length == 0 ? replace : null
    }
    let chooser = new InsertionChooser(this.strings, this.nodeTypes.items(), type => {
      this.insertNodeOfType(type, prepare())
    }, this.insertionChoices(), choice => choice.choose(prepare()))
    chooser.onClose = () => {
      if (!this.#documentElement.contains(document.activeElement)) this.restoreSelection(state)
    }
    let target = anchor || (this.#toolbarElement && this.toolbarItems.item("insert")?.element) || this.#documentElement
    chooser.show(target, this.#element)
  }

  // Messages and dialogs

  #messages: Array<Notification> = []

  /**
   * Shows a short notification over the editor: a Notification, or text with a
   * Bootstrap color name such as "info" or "danger" and a duration in milliseconds.
   * It disappears when clicked, or after its duration; zero keeps it until clicked.
   */
  showMessage(message: Notification | string, indicator: string = "info", duration: number = 4000) {
    let notification = message instanceof Notification ? message : new Notification(String(message), Notification.typeFor(indicator))
    if (!(message instanceof Notification)) notification.duration = duration / 1000
    if (notification.message.trim().length == 0 && notification.title.trim().length == 0) return
    let showing = new CustomEvent("messageShowing", {detail: {notification: notification, text: notification.message, indicator: notification.indicator}, cancelable: true})
    if (!this.dispatchEvent(showing) || !this.#messagesElement) return
    let element = Utilities.element("div", `alert alert-${notification.indicator} scv-message shadow-sm`, {role: notification.type == NotificationTypes.danger ? "alert" : "status"})
    let text = Utilities.element("div", "scv-message-text")
    if (notification.title.length > 0) {
      let title = Utilities.element("strong", "d-block")
      title.textContent = notification.title
      text.append(title)
    }
    text.append(document.createTextNode(notification.message))
    element.append(text)
    let close = Utilities.element("button", "btn-close", {type: "button", "aria-label": this.strings.TextDoneCaption})
    element.append(close)
    element.addEventListener("click", () => this.closeMessage(notification))
    notification.element = element
    // The newest notification is shown first.
    this.#messages.unshift(notification)
    this.#messagesElement.prepend(element)
    if (notification.duration > 0) setTimeout(() => this.closeMessage(notification), notification.duration * 1000)
  }

  /** The notifications being shown, newest first. */
  messages(): Array<Notification> {
    return this.#messages.slice()
  }

  closeMessage(notification: Notification) {
    let index = this.#messages.indexOf(notification)
    if (index >= 0) this.#messages.splice(index, 1)
    if (notification && notification.element) notification.element.remove()
    if (notification) notification.element = null
  }

  /** Shows a small form and resolves with its values, or null when cancelled. The selection is restored afterwards. */
  async prompt(title: string, fields: Array<DialogField>): Promise<{[name: string]: any} | null> {
    let state = this.captureSelection()
    let result = await Dialog.prompt(this.#element, this.strings, title, fields)
    this.restoreSelection(state)
    return result
  }

  /** Applies a locale pack and rebuilds the interface text. */
  localize(pack: string | object): number {
    let count = this.strings.apply(pack)
    this.resetToolbar()
    this.renderDocument()
    return count
  }

  // Collaboration

  #collaborationClient: CollaborationConnection | null = null
  #collaborationLocks: Map<string, string> = new Map()
  #collaborationAnnotationsAllowed: boolean = true
  #movedAnchorIDs: Set<string> = new Set()
  #applyingRemote: boolean = false
  #presenceLayer: HTMLDivElement | null = null
  #presenceFrame: number = 0

  /** The attached collaboration client, or null. */
  get collaborationClient(): CollaborationConnection | null {
    return this.#collaborationClient
  }

  /** The name of the user who holds the lock on a node, or "" when no one else does. */
  collaborationLockOwner(node: Node): string {
    return node ? this.#collaborationLocks.get(node.nodeId) || "" : ""
  }

  /** @internal */
  attachCollaborationClient(client: CollaborationConnection) {
    this.#collaborationClient = client
  }

  /** @internal */
  detachCollaborationClient(client: CollaborationConnection) {
    if (this.#collaborationClient === client) this.#collaborationClient = null
    this.#schedulePresence()
  }

  /** @internal The locks other users hold: node IDs and their owners' names. */
  collaborationLocks(): Map<string, string> {
    return new Map(this.#collaborationLocks)
  }

  /** @internal Forgets the annotation anchors local edits moved, such as when a shared document opens or closes. */
  clearMovedAnnotationAnchors() {
    this.#movedAnchorIDs.clear()
  }

  /** @internal Draws the other users' presence again on the next frame. */
  refreshPresence() {
    this.#schedulePresence()
  }

  /** @internal True while a change is still being made, such as a drag or an input-method composition. */
  get isCollaborationBusy(): boolean {
    return this.#composing || this.#dragNode !== null
  }

  /** @internal True when another user holds the lock on node, on a node containing it, or on a node it contains. */
  isLockedByCollaborator(node: Node): boolean {
    let locks = this.#collaborationLocks
    if (locks.size == 0 || !node) return false
    for (let item: Node | null = node; item; item = item.parent) if (locks.has(item.nodeId)) return true
    return node.descendants().some(child => locks.has(child.nodeId))
  }

  /** @internal The top-level node containing node, or null. */
  collaborationRootNode(node: Node): Node | null {
    let item = node
    while (item && item.parent) item = item.parent
    return item && this.#nodes.indexOf(item) >= 0 ? item : null
  }

  /** @internal The document-level settings of toJSON, without serializing nodes. */
  collaborationSettings(): any {
    let result: any = {
      alignment: this.#alignment,
      textAlignment: this.#textAlignment,
      direction: this.#direction,
      fontName: this.#fontName,
      fontSize: this.#fontSize,
      backgroundColor: Colors.toJSON(this.#backgroundColor)
    }
    if (!this.backgroundImage.isEmpty) result.backgroundImage = this.backgroundImage.toJSON()
    return result
  }

  /** @internal The text selection being edited, in code points, or null. */
  collaborationTextSelection(): {start: number, length: number} | null {
    let host = this.#activeHost
    let range = host && this.#editingNode ? host.selection() : null
    if (!range) return null
    let text = host.rich.text
    return {start: CodePoints.count(text.substring(0, range.start)), length: CodePoints.count(text.substring(range.start, range.end))}
  }

  /** @internal Comments may be added and changed; false for a collaborator with Read access. */
  get collaborationAnnotationsAllowed(): boolean {
    return this.#collaborationAnnotationsAllowed
  }

  set collaborationAnnotationsAllowed(value: boolean) {
    if (this.#collaborationAnnotationsAllowed == value) return
    this.#collaborationAnnotationsAllowed = value
    this.annotations.refreshPopover()
    this.updateToolbarState()
    this.#renderNodeToolbar()
  }

  /** Shows each node's locked state again after node.locked changes, and stops editing a node that became locked. */
  refreshLocks() {
    if (this.#editingNode && this.#editingNode.locked) this.endEditing()
    this.allNodes().forEach(node => {
      node.element?.classList.toggle("scv-locked", node.locked)
      node.hosts().forEach(host => {
        let editable = this.isEditingNode(node)
        if (host.editable != editable) host.editable = editable
      })
    })
    this.#renderNodeToolbar()
    this.updateToolbarState()
  }

  /** @internal Replaces the locks other users hold: node IDs and their owners' names. */
  setCollaborationNodeLocks(locks: Map<string, string> | null) {
    let next = new Map(locks || [])
    let same = next.size == this.#collaborationLocks.size && Array.from(next.entries()).every(([key, value]) => this.#collaborationLocks.get(key) === value)
    if (same) return
    this.#collaborationLocks = next
    this.refreshLocks()
    this.#schedulePresence()
  }

  /** @internal Loads a server snapshot, keeping the selection. Returns false when it can't be loaded. */
  loadCollaborationSnapshot(snapshot: string): boolean {
    let state = this.captureSelection()
    let focused = !!this.#documentElement && this.#documentElement.contains(document.activeElement)
    this.#applyingRemote = true
    let loaded = false
    try {
      loaded = this.fromJSON(snapshot)
    } finally {
      this.#applyingRemote = false
    }
    if (!loaded) return false
    this.#movedAnchorIDs.clear()
    this.#restoreCollaborationSelection(state, focused)
    return true
  }

  #restoreCollaborationSelection(state: SelectionState | null, focused: boolean) {
    if (!state) return
    if (focused) {
      this.restoreSelection(state)
      return
    }
    // Without focus, select quietly so another editor on the page keeps its focus.
    let identifiers = state.nodeId.length > 0 ? [state.nodeId] : state.nodeIds
    let nodes = identifiers.map(identifier => this.nodeWithID(identifier)).filter(node => node !== null)
    if (nodes.length > 0) this.#setSelection(nodes, true)
  }

  /** @internal Applies another user's document.atomic operation. Not an undo step; undo won't revert it. */
  applyCollaborationOperation(operation: any): boolean {
    if (!operation || operation.kind != "document.atomic") return false
    let state = this.captureSelection()
    let focused = !!this.#documentElement && this.#documentElement.contains(document.activeElement)
    let editing = this.#editingNode
    let caretHost = this.#activeHost
    let rerender = false
    this.#applyingRemote = true
    try {
      if (operation.settings) rerender = this.#applyCollaborationSettings(operation.settings)
      if (Array.isArray(operation.removed)) {
        operation.removed.forEach(value => {
          let index = this.#nodes.findIndex(node => node.nodeId === Utilities.string(value))
          if (index >= 0) this.#nodes.splice(index, 1)
        })
      }
      if (Array.isArray(operation.nodes)) {
        for (let change of operation.nodes) {
          let data = change && change.node
          let replacement = this.nodeFromJSON(data)
          if (!replacement) return false
          // An existing node is replaced where it is; only a new node uses the index,
          // which may predate other users' changes the server rebased this one over.
          let index = this.#nodes.findIndex(node => node.nodeId === replacement.nodeId)
          if (index >= 0) {
            this.#nodes.splice(index, 1, replacement)
          } else {
            this.#nodes.splice(Utilities.clamp(Utilities.integer(change.index, this.#nodes.length), 0, this.#nodes.length), 0, replacement)
          }
        }
      }
      if (Array.isArray(operation.order)) {
        let byID = new Map(this.#nodes.map(node => [node.nodeId, node] as [string, Node]))
        let named: Array<Node> = operation.order.map(value => byID.get(Utilities.string(value))).filter(node => !!node)
        let namedSet = new Set(named)
        let result = named.slice()
        // Local nodes the server hasn't seen yet keep their places.
        this.#nodes.forEach((node, index) => {
          if (!namedSet.has(node)) result.splice(Math.min(index, result.length), 0, node)
        })
        this.#nodes.splice(0, this.#nodes.length, ...result)
      }
      let present = new Set(this.allNodes())
      this.#selected = this.#selected.map(node => present.has(node) ? node : this.nodeWithID(node.nodeId)).filter(node => node !== null)
      let caretLost = false
      if (editing && !present.has(editing)) {
        this.#editingNode = null
        this.#activeHost = null
        this.#pending = null
        caretLost = true
      }
      if (rerender) {
        this.renderDocument()
      } else {
        this.#placeChildren(this.#nodes)
      }
      this.#applySelectionClasses()
      if (focused && state && (caretLost || (caretHost && document.activeElement !== caretHost.element && !caretHost.element.contains(document.activeElement)))) {
        this.#restoreCollaborationSelection(state, true)
      }
      this.#syncAnnotations()
      if (operation.annotationAnchors && typeof operation.annotationAnchors == "object") this.#applyAnnotationAnchors(operation.annotationAnchors)
    } catch {
      return false
    } finally {
      this.#applyingRemote = false
    }
    this.history.rebase(document => this.#collaborationClient?.applyToDocument(document, operation))
    this.#isChanged = true
    this.#renderNodeToolbar()
    this.#scheduleTableOfContents()
    this.#scheduleAnnotationMarkers()
    this.#schedulePresence()
    this.updateToolbarState()
    this.dispatchEvent(new CustomEvent("contentChanged", {detail: {node: null, remote: true}}))
    return true
  }

  /** Puts a list's nodes into its container in order, moving only those out of place, so the caret survives. */
  #placeChildren(list: Array<Node>) {
    let container = this.#listElements.get(list)
    if (!container) return
    let owner = this.#listOwners.get(list) || null
    let expected = new Set<HTMLElement>()
    list.forEach(child => {
      child.parent = owner
      child.editor = this
      if (!child.element || child.element.parentElement !== container) {
        if (child.element) child.element.remove()
        this.renderNode(child)
      }
      expected.add(child.element)
    })
    Array.from(container.children).forEach(child => {
      if (child.classList.contains("scv-node") && !expected.has(child as HTMLElement)) child.remove()
    })
    let nodes = () => Array.from(container.children).filter(child => child.classList.contains("scv-node"))
    list.forEach((child, index) => {
      let current = nodes()[index]
      if (current !== child.element) container.insertBefore(child.element, current || null)
    })
    container.classList.toggle("scv-children-empty", list.length == 0)
    if (container === this.#documentElement) this.#updateEmptyDocument()
  }

  /** Applies document settings from an operation. Returns true when the document must be rendered again. */
  #applyCollaborationSettings(settings: any): boolean {
    let previousAlignment = this.#alignment
    let previousTextAlignment = this.#textAlignment
    let alignment = Utilities.integer(settings.alignment, this.#alignment)
    if (alignment >= Alignments.leading && alignment <= Alignments.trailing) this.#alignment = alignment
    let textAlignment = Utilities.integer(settings.textAlignment, this.#textAlignment)
    if (textAlignment >= Alignments.leading && textAlignment <= Alignments.trailing) this.#textAlignment = textAlignment
    let direction = Utilities.integer(settings.direction, this.#direction)
    if (direction >= Directions.automatic && direction <= Directions.rightToLeft) this.#direction = direction
    if ("fontName" in settings) this.#fontName = Utilities.string(settings.fontName, "System") || "System"
    if ("fontSize" in settings) this.#fontSize = Utilities.number(settings.fontSize, DefaultFontSize) || DefaultFontSize
    if (settings.backgroundColor) this.#backgroundColor = Colors.fromJSON(settings.backgroundColor, this.#backgroundColor)
    this.#backgroundImage = Utilities.boolean(settings.hasBackgroundImage, false) && settings.backgroundImage ? BackgroundImage.fromJSON(settings.backgroundImage) : new BackgroundImage()
    this.#applyDocumentAppearance()
    return previousAlignment != this.#alignment || previousTextAlignment != this.#textAlignment
  }

  /** Places annotations where the user who made an edit put them. Offsets are in code points. */
  #applyAnnotationAnchors(anchors: any) {
    this.annotations.items().forEach(item => {
      let anchor = anchors[item.id]
      if (!anchor || item.coversNode) return
      let node = this.nodeWithID(item.nodeID)
      let segment = Math.max(0, Utilities.integer(anchor.segment, item.segment))
      let host = node ? node.hosts()[segment] : null
      if (!host) return
      let text = host.rich.text
      let start = Annotation.fromCodePoints(text, Math.max(0, Utilities.integer(anchor.start, 0)))
      let end = Annotation.fromCodePoints(text, Math.max(0, Utilities.integer(anchor.start, 0)) + Math.max(0, Utilities.integer(anchor.length, 0)))
      item.setAnchor(item.nodeID, segment, start, end - start, false, item.quote, text)
    })
  }

  /** @internal The anchors local edits moved since the last call, by annotation ID, in code points. */
  collaborationAnnotationAnchors(): any {
    if (this.#movedAnchorIDs.size == 0) return null
    this.#syncAnnotations()
    let result: any = {}
    this.#movedAnchorIDs.forEach(identifier => {
      let item = this.annotations.item(identifier)
      if (!item || item.coversNode) return
      let data: any = item.toJSON()
      result[identifier] = {segment: data.segment, start: data.start, length: data.length}
    })
    this.#movedAnchorIDs.clear()
    return result
  }

  /** @internal Applies the server's copy of an annotation, or its deletion. Not an undo step; undo won't revert it. */
  applyCollaborationAnnotation(message: any) {
    if (!message) return
    let identifier = Utilities.string(message.annotationId)
    let data = !Utilities.boolean(message.deleted, false) && message.annotation && typeof message.annotation == "object" ? message.annotation : null
    this.#applyingRemote = true
    try {
      this.annotations.applyRemote(identifier, data)
    } finally {
      this.#applyingRemote = false
    }
    this.history.rebase(document => {
      let items: Array<any> = Array.isArray(document.annotations) ? document.annotations : []
      let index = items.findIndex(item => item && item.id === identifier)
      if (data && index >= 0) items[index] = JSON.parse(JSON.stringify(data))
      else if (data) items.push(JSON.parse(JSON.stringify(data)))
      else if (index >= 0) items.splice(index, 1)
      if (items.length > 0) document.annotations = items
      else delete document.annotations
    })
  }

  /** @internal The server removed this user's access: the shared content and its undo history leave the editor. */
  clearCollaborationDocument() {
    this.endEditing()
    Popup.closeAll()
    this.annotations.load([])
    this.#nodes.splice(0, this.#nodes.length, new TextNode())
    this.#selected = []
    this.#activeHost = null
    this.renderDocument()
    this.history.reset()
    this.#isChanged = false
    this.dispatchEvent(new CustomEvent("contentChanged", {detail: {node: null, remote: true}}))
    this.dispatchEvent(new CustomEvent("selectionChanged", {detail: {node: null}}))
  }

  #schedulePresence() {
    if (this.#presenceFrame || !this.#element) return
    this.#presenceFrame = requestAnimationFrame(() => {
      this.#presenceFrame = 0
      this.#renderPresence()
    })
  }

  /** Draws the other users' presence over the page, through the attached collaboration client. */
  #renderPresence() {
    let layer = this.#presenceLayer
    if (!layer || !this.#pageElement) return
    layer.textContent = ""
    this.#collaborationClient?.renderPresence(layer)
  }

  // Persistence

  /** The document as an object in the JSON document format. */
  toJSONObject(): object {
    let result = {version: CurrentDocumentVersion, documentId: this.documentID}
    if (this.#alignment != Alignments.leading) result["alignment"] = this.#alignment
    if (this.#textAlignment != Alignments.leading) result["textAlignment"] = this.#textAlignment
    if (this.#direction != Directions.automatic) result["direction"] = this.#direction
    result["fontName"] = this.#fontName
    result["fontSize"] = this.#fontSize
    result["backgroundColor"] = Colors.toJSON(this.#backgroundColor)
    if (!this.backgroundImage.isEmpty) result["backgroundImage"] = this.backgroundImage.toJSON()
    result["nodes"] = this.#nodes.map(node => node.toJSON())
    this.#syncAnnotations()
    let annotations = this.annotations.items()
    if (annotations.length > 0) result["annotations"] = annotations.map(item => item.toJSON())
    return result
  }

  toJSON(): string {
    return JSON.stringify(this.toJSONObject())
  }

  /** Checks a document without loading it. */
  validateJSON(value: string | object): Array<ValidationIssue> {
    let issues: Array<ValidationIssue> = []
    let source: any = value
    if (typeof value == "string") {
      try {
        source = JSON.parse(value)
      } catch {
        return [new ValidationIssue(ValidationSeverities.error, "The document is not valid JSON.")]
      }
    }
    if (!source || typeof source != "object" || Array.isArray(source)) return [new ValidationIssue(ValidationSeverities.error, "The document must be a JSON object.")]
    if (!Array.isArray(source.nodes)) return [new ValidationIssue(ValidationSeverities.error, "The document has no nodes array.")]
    let version = Utilities.integer(source.version, 1)
    if (version > CurrentDocumentVersion) issues.push(new ValidationIssue(ValidationSeverities.error, `The document format ${version} is newer than this editor supports (${CurrentDocumentVersion}).`))
    if (version < CurrentDocumentVersion) issues.push(new ValidationIssue(ValidationSeverities.warning, `The document format ${version} will be converted to ${CurrentDocumentVersion}.`))
    let check = (nodes: Array<any>, path: string) => {
      nodes.forEach((node, index) => {
        if (!node || typeof node != "object") {
          issues.push(new ValidationIssue(ValidationSeverities.warning, `${path}[${index}] is not a node object.`))
          return
        }
        let type = Utilities.string(node.type)
        if (type.length == 0) issues.push(new ValidationIssue(ValidationSeverities.warning, `${path}[${index}] has no type.`))
        else if (!this.nodeTypes.item(type)) issues.push(new ValidationIssue(ValidationSeverities.warning, `${path}[${index}] has the unsupported type "${type}" and will be kept as it is.`))
      })
    }
    check(source.nodes, "nodes")
    return issues
  }

  /** Converts documents saved in earlier formats. */
  #migrate(source: any) {
    let version = Utilities.integer(source.version, 1)
    if (version < 4) {
      // Earlier formats saved Default text as 17 points.
      if (!("fontSize" in source)) source.fontSize = 17
      let visit = (value: any) => {
        if (Array.isArray(value)) {
          value.forEach(visit)
        } else if (value && typeof value == "object") {
          ;["styleTable", "styles", "captionStyles"].forEach(name => {
            if (Array.isArray(value[name])) value[name].forEach(style => { if (style && style.fontSize == 17) delete style.fontSize })
          })
          if (value.type && value.fontSize == 17) delete value.fontSize
          Object.keys(value).forEach(key => visit(value[key]))
        }
      }
      visit(source.nodes)
    }
    source.version = CurrentDocumentVersion
  }

  /** Loads a document. Returns false, leaving the editor unchanged, when it can't be loaded; see lastValidationIssues. */
  fromJSON(value: string | object): boolean {
    let source: any = value
    if (typeof value == "string") {
      try {
        source = JSON.parse(value)
      } catch {
        this.lastValidationIssues = [new ValidationIssue(ValidationSeverities.error, "The document is not valid JSON.")]
        return false
      }
    } else {
      source = JSON.parse(JSON.stringify(value))
    }
    this.lastValidationIssues = this.validateJSON(source)
    if (this.lastValidationIssues.some(issue => issue.severity == ValidationSeverities.error)) return false
    this.#migrate(source)
    this.#load(source)
    this.recognizeSuggestions(this.#nodes)
    this.history.reset()
    this.#isChanged = false
    this.dispatchEvent(new CustomEvent("contentChanged", {detail: {node: null}}))
    this.#collaborationClient?.editorContentChanged(null)
    this.#schedulePresence()
    return true
  }

  /** Replaces the document from JSON without validation or resetting undo. Used by undo and redo. */
  restoreDocument(value: string) {
    let source = JSON.parse(value)
    this.#restoring = true
    try {
      this.#load(source)
    } finally {
      this.#restoring = false
    }
    this.#isChanged = true
    this.dispatchEvent(new CustomEvent("contentChanged", {detail: {node: null}}))
    this.#collaborationClient?.editorContentChanged(null)
    this.#schedulePresence()
  }

  #load(source: any) {
    Popup.closeAll()
    let documentID = Utilities.string(source.documentId).trim()
    if (documentID.length > 0) this.documentID = documentID
    let alignment = Utilities.integer(source.alignment, Alignments.leading)
    this.#alignment = alignment >= 1 && alignment <= 3 ? alignment : Alignments.leading
    let textAlignment = Utilities.integer(source.textAlignment, Alignments.leading)
    this.#textAlignment = textAlignment >= 1 && textAlignment <= 3 ? textAlignment : Alignments.leading
    let direction = Utilities.integer(source.direction, Directions.automatic)
    if (direction == Directions.leftToRight || direction == Directions.rightToLeft) this.#direction = direction
    if ("fontName" in source) this.#fontName = Utilities.string(source.fontName, "System") || "System"
    if ("fontSize" in source) this.#fontSize = Utilities.number(source.fontSize, DefaultFontSize) || DefaultFontSize
    this.#backgroundColor = Colors.fromJSON(source.backgroundColor, Colors.make(255, 255, 255))
    this.backgroundImage = source.backgroundImage ? BackgroundImage.fromJSON(source.backgroundImage) : new BackgroundImage()
    let previousAnnotations = this.#restoring ? this.annotations.items().map(item => ({id: item.id, json: JSON.stringify(item.toJSON())})) : null
    let loadedAnnotations: Array<Annotation> = []
    if (Array.isArray(source.annotations)) {
      source.annotations.forEach(item => {
        let annotation = Annotation.fromJSON(item)
        if (!annotation) return
        // Undo and redo update the annotations they restore in place.
        let existing = this.#restoring ? this.annotations.item(annotation.id) : null
        if (existing) {
          existing.assign(annotation)
          annotation = existing
        }
        loadedAnnotations.push(annotation)
      })
    }
    this.annotations.load(loadedAnnotations)

    // Undo and redo keep the instances of nodes they leave unchanged.
    let kept = new Map<string, Node>()
    if (this.#restoring) this.#nodes.forEach(node => kept.set(node.nodeId, node))
    this.#nodes.splice(0, this.#nodes.length)
    if (Array.isArray(source.nodes)) {
      source.nodes.forEach(item => {
        let previous = item && kept.get(item.nodeId)
        if (previous && JSON.stringify(previous.toJSON()) == JSON.stringify(item)) {
          kept.delete(item.nodeId)
          this.#nodes.push(previous)
          return
        }
        let node = this.nodeFromJSON(item)
        if (node) this.#nodes.push(node)
      })
    }
    this.#selected = []
    this.#activeHost = null
    this.#pending = null
    this.#applyDocumentAppearance()
    this.renderDocument()
    this.#element?.classList.remove("scv-node-mode")
    this.#syncAnnotations()
    this.#scheduleAnnotationMarkers()
    if (previousAnnotations) {
      // Undo and redo raise the annotation events for what they restore.
      let current = this.annotations.items()
      current.forEach(item => {
        let before = previousAnnotations.find(entry => entry.id == item.id)
        if (!before) {
          this.dispatchEvent(new CustomEvent("annotationAdded", {detail: {annotation: item}}))
          this.#collaborationClient?.editorAnnotationChanged(item, false)
        } else if (before.json != JSON.stringify(item.toJSON())) {
          this.dispatchEvent(new CustomEvent("annotationChanged", {detail: {annotation: item}}))
          this.#collaborationClient?.editorAnnotationChanged(item, false)
        }
      })
      previousAnnotations.forEach(entry => {
        if (current.some(item => item.id == entry.id)) return
        let removed = Annotation.fromJSON(JSON.parse(entry.json))
        this.dispatchEvent(new CustomEvent("annotationRemoved", {detail: {annotation: removed}}))
        this.#collaborationClient?.editorAnnotationChanged(removed, true)
      })
    }
  }

  #restoring: boolean = false

  /** Replaces the document with HTML. */
  /** Replaces the document with HTML. HTML with nothing the editor can import leaves the document as it was. */
  fromHTML(html: string) {
    let nodes = this.importer.import(html)
    if (nodes.length == 0) return
    let style = this.importer.documentStyle(html)
    this.#loadImported(nodes, style)
  }

  /** Replaces the document with Markdown. */
  fromMarkdown(markdown: string) {
    let html = MarkdownConverter.toHTML(markdown)
    // A document background is written as one styled element around the content.
    let parsed = new DOMParser().parseFromString(html, "text/html")
    let wrapper = parsed.body.children.length == 1 && parsed.body.firstElementChild.tagName == "DIV" ? parsed.body.firstElementChild as HTMLElement : null
    let style: DocumentStyle | null = null
    if (wrapper && /background-(color|image)/.test(wrapper.getAttribute("style") || "")) {
      style = this.importer.elementDocumentStyle(wrapper)
      html = wrapper.innerHTML
    }
    this.#loadImported(this.importer.import(html), style)
  }

  #loadImported(nodes: Array<Node>, style: DocumentStyle | null = null) {
    if (style) {
      if (style.fontName.length > 0) this.#fontName = style.fontName
      if (style.fontSize > 0) this.#fontSize = style.fontSize
      if (style.backgroundColor) this.#backgroundColor = style.backgroundColor
      if (style.backgroundImage) this.backgroundImage = style.backgroundImage
      if (style.direction !== null) this.#direction = style.direction
      this.#applyDocumentAppearance()
    }
    this.#nodes.splice(0, this.#nodes.length, ...nodes)
    this.#selected = []
    this.#activeHost = null
    this.annotations.load([])
    this.renderDocument()
    this.recognizeSuggestions(this.#nodes)
    this.history.reset()
    this.#isChanged = false
    this.#scheduleTableOfContents()
    this.dispatchEvent(new CustomEvent("contentChanged", {detail: {node: null}}))
  }

  /** Inserts HTML where the user is working, or after target. */
  insertHTML(html: string, target?: Node) {
    let nodes = this.importer.import(html)
    if (target) {
      this.insertNodesAfter(target, nodes)
    } else {
      this.#insertNodesAtCaret(nodes)
    }
  }

  insertMarkdown(markdown: string, target?: Node) {
    this.insertHTML(MarkdownConverter.toHTML(markdown), target)
  }

  /** Exports with a registered format: "html", "json", "markdown" or "text", or one added to exporters. Returns "" for an unknown identifier. */
  export(identifier: string): string {
    let exporter = this.exporters.item(identifier)
    return exporter ? exporter.export(this) : ""
  }

  /** Offers an export to the user as a download. Returns false for an unknown identifier. */
  exportToFile(identifier: string, fileName: string = "document"): boolean {
    let exporter = this.exporters.item(identifier)
    return exporter ? exporter.exportToFile(this, fileName) : false
  }

  /** HTML for the document. With includeDocumentElements, a complete page with a stylesheet. */
  /** The document as HTML. includeAnnotations appends the comment threads in a section after the content. */
  toHTML(includeDocumentElements: boolean = false, includeAnnotations: boolean = false): string {
    let body = this.#nodes.filter(node => node.canExportHTML).map(node => node.toHTML()).join("\n")
    if (includeAnnotations) body += this.#annotationsHTML()
    if (!includeDocumentElements) return body
    let background = Colors.toCSS(this.#backgroundColor)
    let bodyStyle = `background-color:${background};font-family:${Utilities.fontFamilyCSS(this.#fontName).replace(/"/g, "'")};font-size:${this.#fontSize}px;`
    if (!this.backgroundImage.isEmpty) bodyStyle += this.backgroundImage.toCSS()
    let direction = this.#direction == Directions.rightToLeft ? ` dir="rtl"` : (this.#direction == Directions.leftToRight ? ` dir="ltr"` : "")
    return `<!doctype html>\n<html${direction}>\n<head>\n<meta charset="utf-8">\n<style>\n${this.exportCSS()}\n</style>\n</head>\n<body style="${Utilities.escapeAttribute(bodyStyle)}">\n${body}\n</body>\n</html>`
  }

  /** The stylesheet used by toHTML(true), as CSS text. */
  exportCSS(): string {
    return this.exportStylesheet().toString()
  }

  /**
   * The stylesheet for HTML export. Node types add their own rules with a static
   * exportStyles(stylesheet) method.
   */
  exportStylesheet(): Stylesheet {
    let sheet = new Stylesheet()
    sheet.addCSS(this.#baseExportCSS())
    sheet.addCSS(WebFonts.fontFaceCSS(WebFonts.used(this)))
    // Each node type in the document, including nested ones, adds its rules once.
    let exported = new Set<any>()
    this.allNodes().forEach(node => {
      let type = node.constructor as any
      if (exported.has(type)) return
      exported.add(type)
      if (typeof type.exportStyles == "function") type.exportStyles(sheet, this)
    })
    return sheet
  }

  #baseExportCSS(): string {
    let background = Colors.toCSS(this.#backgroundColor)
    let rules = [
      `*, *::before, *::after { box-sizing: border-box }`,
      `html { color-scheme: light; background: ${background} }`,
      `body { margin: 0; padding: 48px; background-color: ${background}; color: ${Editor.themeCSS(this, ThemeColors.text)}; line-height: 1.5; font-family: ${Utilities.fontFamilyCSS(this.#fontName)}; font-size: ${this.#fontSize}px }`,
      `body > * { margin-top: 0; margin-bottom: 22px }`
    ]
    // With Automatic direction every paragraph takes its direction from its first letter, as it does in the editor.
    if (this.#direction == Directions.automatic) rules.push(`p, li, h1, h2, h3, h4, h5, h6, blockquote, figcaption, td, th, label, legend { unicode-bidi: plaintext }`)
    // Any text, including table cells and list items, can hold links and inline formats.
    rules.push(
      `a { color: ${Editor.themeCSS(this, ThemeColors.link)}; text-decoration: underline }`,
      `code, kbd { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.875em }`,
      `:not(pre) > code, span > code { padding: 0.15em 0.35em; background: rgba(175,184,193,0.2); border-radius: 4px }`,
      `kbd { padding: 0.1em 0.4em; border: 1px solid ${Editor.themeCSS(this, ThemeColors.border)}; border-bottom-width: 2px; border-radius: 4px; background: ${Editor.themeCSS(this, ThemeColors.surface)} }`,
      `mark { background: ${Editor.themeCSS(this, ThemeColors.highlight)} }`,
      `@media print { body { padding: 0 } }`
    )
    return rules.join("\n")
  }

  #themeColors: Map<ThemeColors, DocumentColor> = new Map()

  /** The default color for a theme color. */
  static defaultThemeColor(kind: ThemeColors): DocumentColor {
    let values: {[kind: number]: string} = {
      [ThemeColors.background]: "#ffffff", [ThemeColors.primary]: "#2563eb", [ThemeColors.selection]: "#3b82f6",
      [ThemeColors.textSelection]: "rgba(147,197,253,0.47)", [ThemeColors.information]: "#2563eb", [ThemeColors.success]: "#198754",
      [ThemeColors.warning]: "#ffc107", [ThemeColors.danger]: "#c71c22", [ThemeColors.text]: "#000000",
      [ThemeColors.textMuted]: "#64748b", [ThemeColors.link]: "#0066cc", [ThemeColors.border]: "#cbd5e1",
      [ThemeColors.borderStrong]: "#94a3b8", [ThemeColors.surface]: "#f1f5f9", [ThemeColors.dark]: "#0f172a",
      [ThemeColors.light]: "#e2e8f0", [ThemeColors.highlight]: "#fef08a"
    }
    return Colors.fromCSS(values[kind] || "#000000")
  }

  /** A color exported HTML is drawn with: the one set with setThemeColor, or the default. */
  themeColor(kind: ThemeColors): DocumentColor {
    return Colors.clone(this.#themeColors.get(kind) || Editor.defaultThemeColor(kind))
  }

  /** Sets a color exported HTML is drawn with; null restores the default. */
  setThemeColor(kind: ThemeColors, value: DocumentColor | null) {
    if (value) {
      this.#themeColors.set(kind, Colors.clone(value))
    } else {
      this.#themeColors.delete(kind)
    }
  }

  /** A theme color as CSS, from an editor or the defaults. alpha replaces its transparency, where 255 is fully transparent. */
  static themeCSS(editor: Editor | null, kind: ThemeColors, alpha: number | null = null): string {
    let color = editor ? editor.themeColor(kind) : Editor.defaultThemeColor(kind)
    if (alpha !== null) color.alpha = alpha
    return Colors.toCSS(color)
  }

  toMarkdown(): string {
    let parts = this.#nodes.map(node => node.toMarkdown()).filter(value => value.length > 0)
    // A document background, which Markdown can't express, wraps the content in a styled element.
    let style = this.#documentAppearanceCSS()
    if (style.length > 0) parts = [`<div style="${Utilities.escapeAttribute(style)}">`, ...parts, "</div>"]
    return parts.join("\n\n") + "\n"
  }

  /** The background color and image CSS of a document that has either, or "". */
  #documentAppearanceCSS(): string {
    let white = Colors.make(255, 255, 255)
    if (Colors.equals(this.#backgroundColor, white) && this.backgroundImage.isEmpty) return ""
    return `background-color:${Colors.toCSS(this.#backgroundColor)};${this.backgroundImage.toCSS()}`
  }

  toPlainText(): string {
    return this.#nodes.map(node => node.toPlainText()).join("\n")
  }

  /** Prints the document. */
  print() {
    let frame = Utilities.element("iframe", "", {"aria-hidden": "true"})
    frame.style.position = "fixed"
    frame.style.width = "0"
    frame.style.height = "0"
    frame.style.border = "0"
    document.body.append(frame)
    let frameDocument = frame.contentDocument
    frameDocument.open()
    frameDocument.write(this.toHTML(true))
    frameDocument.close()
    // Web fonts load before printing, so the printout doesn't use their fallback.
    Promise.all([WebFonts.settle(frameDocument), new Promise(resolve => setTimeout(resolve, 100))]).then(() => {
      frame.contentWindow.focus()
      frame.contentWindow.print()
      setTimeout(() => frame.remove(), 1000)
    })
  }
}
