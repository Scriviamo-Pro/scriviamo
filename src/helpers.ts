import {CodePoints, Editor, Node, NodeClass, Utilities} from "./internal"

/** Where the caret or node selection was, so undo and redo can put it back. */
export interface SelectionState {
  nodeId: string
  hostIndex: number
  start: number
  end: number
  nodeIds: Array<string>
}

interface HistoryState {
  document: string
  selection: SelectionState | null
}

/** Undo and redo. Each step stores the document as it was before a change. */
export class History extends EventTarget {
  #editor: Editor
  #undo: Array<HistoryState> = []
  #redo: Array<HistoryState> = []
  #lastKey: any = null
  #lastTime: number = 0
  #suspended: number = 0

  /** Most steps kept. */
  limit: number = 200
  /** Consecutive typing in one place within this many milliseconds is one step. */
  coalesceInterval: number = 1500

  constructor(editor: Editor) {
    super()
    this.#editor = editor
  }

  get owner(): Editor {
    return this.#editor
  }

  get canUndo(): boolean {
    return this.#undo.length > 0 && !this.#editor.readOnly
  }

  get canRedo(): boolean {
    return this.#redo.length > 0 && !this.#editor.readOnly
  }

  get undoCount(): number {
    return this.#undo.length
  }

  get redoCount(): number {
    return this.#redo.length
  }

  /**
   * Records the current document as an undo step. Calls with the same
   * coalesceKey in quick succession, such as typing, record only the first.
   */
  checkpoint(coalesceKey: any = null) {
    if (this.#suspended > 0) return
    let now = Date.now()
    if (coalesceKey !== null && coalesceKey === this.#lastKey && now - this.#lastTime < this.coalesceInterval) {
      this.#lastTime = now
      return
    }
    this.#undo.push(this.#capture())
    if (this.#undo.length > this.limit) this.#undo.shift()
    this.#redo = []
    this.#lastKey = coalesceKey
    this.#lastTime = now
    this.dispatchEvent(new Event("changed"))
  }

  /** Ends typing coalescing, so the next change starts a new step. */
  breakCoalescing() {
    this.#lastKey = null
  }

  undo() {
    if (!this.canUndo) return
    this.#redo.push(this.#capture())
    this.#restore(this.#undo.pop())
  }

  redo() {
    if (!this.canRedo) return
    this.#undo.push(this.#capture())
    this.#restore(this.#redo.pop())
  }

  reset() {
    this.#undo = []
    this.#redo = []
    this.#lastKey = null
    this.dispatchEvent(new Event("changed"))
  }

  /**
   * @internal Applies a change made by someone else to every undo and redo step, so
   * undoing restores this user's earlier content without reverting the change.
   */
  rebase(transform: (document: any) => void) {
    let apply = (state: HistoryState) => {
      try {
        let document = JSON.parse(state.document)
        transform(document)
        state.document = JSON.stringify(document)
      } catch {
        // A step that can't be read stays as it was.
      }
    }
    this.#undo.forEach(apply)
    this.#redo.forEach(apply)
  }

  /** Runs work without recording steps. */
  suspend(work: () => void) {
    this.#suspended++
    try {
      work()
    } finally {
      this.#suspended--
    }
  }

  #capture(): HistoryState {
    return {document: this.#editor.toJSON(), selection: this.#editor.captureSelection()}
  }

  #restore(state: HistoryState) {
    this.#lastKey = null
    this.#suspended++
    try {
      this.#editor.restoreDocument(state.document)
      this.#editor.restoreSelection(state.selection)
    } finally {
      this.#suspended--
    }
    this.dispatchEvent(new Event("changed"))
  }
}

/** The node types an editor can insert and restore. */
export class NodeTypes extends EventTarget {
  #editor: Editor
  #items: Array<NodeClass> = []

  constructor(editor: Editor) {
    super()
    this.#editor = editor
  }

  get owner(): Editor {
    return this.#editor
  }

  static normalize(identifier: string): string {
    return identifier.startsWith("node:") ? identifier.substring(5) : identifier
  }

  /** Adds a node class. A class with the same identifier is replaced. */
  add(item: NodeClass) {
    this.addAt(this.#items.length, item)
  }

  addAt(index: number, item: NodeClass) {
    let existing = this.indexOf(item.identifier)
    if (existing >= 0) {
      this.#items.splice(existing, 1)
      if (existing < index) index--
    }
    this.#items.splice(Utilities.clamp(index, 0, this.#items.length), 0, item)
    this.dispatchEvent(new Event("changed"))
  }

  indexOf(item: NodeClass | string): number {
    let identifier = typeof item == "string" ? NodeTypes.normalize(item) : item.identifier
    return this.#items.findIndex(candidate => candidate.identifier == identifier)
  }

  item(identifier: string): NodeClass | null {
    return this.#items[this.indexOf(identifier)] || null
  }

  itemAt(index: number): NodeClass | null {
    return this.#items[index] || null
  }

  items(): Array<NodeClass> {
    return this.#items.slice()
  }

  get lastIndex(): number {
    return this.#items.length - 1
  }

  remove(item: NodeClass | string) {
    let index = this.indexOf(item)
    if (index >= 0) this.removeAt(index)
  }

  removeAt(index: number) {
    if (index < 0 || index >= this.#items.length) return
    this.#items.splice(index, 1)
    this.dispatchEvent(new Event("changed"))
  }

  removeAll() {
    this.#items = []
    this.dispatchEvent(new Event("changed"))
  }
}

/** Counts for the whole document and for the selection. */
export class Statistics {
  #editor: Editor

  /** Words read per minute, used by readingMinutes. */
  wordsPerMinute: number = 200

  constructor(editor: Editor) {
    this.#editor = editor
  }

  get owner(): Editor {
    return this.#editor
  }

  static countWords(value: string): number {
    if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
      let segmenter = new (Intl as any).Segmenter(undefined, {granularity: "word"})
      let count = 0
      for (let segment of segmenter.segment(value)) if (segment.isWordLike) count++
      return count
    }
    let matches = value.match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu)
    return matches ? matches.length : 0
  }

  get words(): number {
    return Statistics.countWords(this.#editor.toPlainText())
  }

  get characters(): number {
    return CodePoints.count(this.#editor.toPlainText().replace(/\n/g, ""))
  }

  get charactersExcludingSpaces(): number {
    return CodePoints.count(this.#editor.toPlainText().replace(/\s/g, ""))
  }

  get paragraphs(): number {
    return this.#editor.toPlainText().split(/\n/).filter(line => line.trim().length > 0).length
  }

  get readingMinutes(): number {
    let words = this.words
    return words == 0 ? 0 : Math.max(1, Math.ceil(words / this.wordsPerMinute))
  }

  get selectedCharacters(): number {
    return CodePoints.count(this.#editor.selectedText().replace(/\n/g, ""))
  }

  get selectedWords(): number {
    return Statistics.countWords(this.#editor.selectedText())
  }
}

/** Node selection and the clipboard commands that act on it. */
export class NodeSelection {
  #editor: Editor

  constructor(editor: Editor) {
    this.#editor = editor
  }

  get owner(): Editor {
    return this.#editor
  }

  /** The primary selected node. */
  get node(): Node | null {
    return this.#editor.selectedNode
  }

  /** The selected nodes in document order. */
  nodes(): Array<Node> {
    return this.#editor.inDocumentOrder(this.#editor.selectedNodes())
  }

  get lastNodeIndex(): number {
    return this.nodes().length - 1
  }

  isSelected(node: Node): boolean {
    return this.nodes().indexOf(node) >= 0
  }

  selectNode(node: Node, addToSelection: boolean = false) {
    this.#editor.selectNode(node, addToSelection)
  }

  selectAllNodes() {
    this.#editor.selectNodes(this.#editor.nodes())
  }

  /** Selects all the text being edited, or every node when no text is being edited. */
  selectAll() {
    let host = this.#editor.activeHost
    if (host) {
      host.select(0, host.rich.length)
    } else {
      this.selectAllNodes()
    }
  }

  deselectAll() {
    this.#editor.selectNodes([])
  }

  clear() {
    this.deselectAll()
  }

  /** Selects text in the node being edited. Returns false when no text is being edited. */
  selectText(start: number, length: number): boolean {
    let host = this.#editor.activeHost || (this.node ? this.node.primaryHost : null)
    if (!host) return false
    host.select(start, start + length)
    return true
  }

  get description(): string {
    let nodes = this.nodes()
    if (nodes.length == 0) return this.#editor.strings.TextNoSelectionCaption
    return `${nodes.length} selected: ${nodes.map(node => node.typeName).join(", ")}`
  }

  get canDelete(): boolean {
    return !this.#editor.readOnly && this.nodes().some(node => !node.locked)
  }

  get canDuplicate(): boolean {
    return this.canDelete
  }

  get canMoveUp(): boolean {
    return this.#editor.canMoveNodes(this.nodes(), -1)
  }

  get canMoveDown(): boolean {
    return this.#editor.canMoveNodes(this.nodes(), 1)
  }

  get canCopy(): boolean {
    return this.nodes().length > 0 || this.#editor.selectedText().length > 0
  }

  get canCut(): boolean {
    return this.canCopy && !this.#editor.readOnly
  }

  get canPaste(): boolean {
    return !this.#editor.readOnly
  }

  get canSelectAll(): boolean {
    return this.#editor.nodes().length > 0
  }

  get canDeselectAll(): boolean {
    return this.nodes().length > 0
  }

  /** Deletes the selected text, or the selected nodes when no text is selected. */
  delete() {
    let host = this.#editor.activeHost
    let range = host ? host.selection() : null
    if (host && range && range.end > range.start) {
      this.#editor.deleteText(host, range.start, range.end)
    } else {
      this.deleteNodes()
    }
  }

  deleteNodes() {
    this.#editor.removeNodes(this.nodes(), false)
  }

  duplicate() {
    this.#editor.duplicateNodes(this.nodes())
  }

  moveUp() {
    this.#editor.moveNodes(this.nodes(), -1)
  }

  moveDown() {
    this.#editor.moveNodes(this.nodes(), 1)
  }

  /** Selects every node from the anchor to node in document order. */
  selectRange(from: Node, to: Node) {
    this.#editor.selectRange(from, to)
  }

  copy() {
    this.#editor.copyToClipboard(false)
  }

  cut() {
    this.#editor.copyToClipboard(true)
  }

  paste() {
    this.#editor.pasteFromClipboard()
  }
}

/** Where an editor's autosave is. */
export enum AutosaveStates {
  /** Nothing to save: no changes since the document was loaded or last saved. */
  saved = "saved",
  /** Changes are waiting for the next save. */
  unsaved = "unsaved",
  /** The save function is running. */
  saving = "saving",
  /** The last save failed; it is tried again after retryDelay, or on the next change. */
  failed = "failed"
}

/** The function an application gives autosave. It may return a Promise; a rejection or exception is a failed save. */
export type AutosaveFunction = (editor: Editor) => unknown

/**
 * Saves the document a moment after the user stops changing it. Give it a save function, and it
 * calls it delay milliseconds after the last change, and at least every maximumWait milliseconds
 * while changes keep coming. It tracks whether everything is saved, raises autosaveStateChanged
 * on the editor, and warns before the page is closed with changes unsaved.
 *
 *     editor.autosave.save = async editor => {
 *       await fetch("/documents/42", {method: "PUT", body: JSON.stringify(editor.toJSON())})
 *     }
 *
 * Only the user's own changes start a save. Loading a document doesn't, and neither do changes
 * that arrive from other people while collaborating: the person who made a change saves it.
 */
export class Autosave {
  #editor: Editor
  #save: AutosaveFunction | null = null
  #state: AutosaveStates = AutosaveStates.saved
  #lastError: unknown = null
  #lastSaved: Date | null = null
  #timer: ReturnType<typeof setTimeout> | null = null
  #firstChange: number = 0
  #running: Promise<boolean> | null = null
  #again: boolean = false
  #generation: number = 0
  #listening: boolean = false

  /** Milliseconds to wait after the last change before saving. */
  delay: number = 1500
  /** The longest to wait while changes keep coming, in milliseconds, so long typing sessions are still saved. */
  maximumWait: number = 10000
  /** Milliseconds before a failed save is tried again. */
  retryDelay: number = 10000
  /** Asks the browser to warn before the page closes while changes aren't saved. */
  warnBeforeLeaving: boolean = true

  constructor(editor: Editor) {
    this.#editor = editor
    editor.addEventListener("contentChanged", (event: CustomEvent) => {
      if (event.detail && event.detail.remote) return
      if (editor.isChanged) this.#changed()
      else this.#loaded()
    })
  }

  get owner(): Editor {
    return this.#editor
  }

  /** The application's save function, or null to turn autosave off. */
  get save(): AutosaveFunction | null {
    return this.#save
  }

  set save(value: AutosaveFunction | null) {
    this.#save = typeof value == "function" ? value : null
    if (!this.#save) {
      this.#clearTimer()
      this.#setState(AutosaveStates.saved)
    } else if (this.#editor.isChanged && this.#state == AutosaveStates.saved) {
      this.#changed()
    }
  }

  get enabled(): boolean {
    return this.#save !== null
  }

  get state(): AutosaveStates {
    return this.#state
  }

  /** What the last failed save threw or rejected with, or null. */
  get lastError(): unknown {
    return this.#lastError
  }

  /** When the document was last saved, or null. */
  get lastSaved(): Date | null {
    return this.#lastSaved
  }

  /**
   * Saves now, without waiting. Resolves true when the document is saved. While a save is
   * running, waits for it and saves again if anything changed meanwhile.
   */
  async saveNow(): Promise<boolean> {
    this.#clearTimer()
    if (!this.#save) return false
    if (this.#running) {
      this.#again = true
      await this.#running
      return this.#state == AutosaveStates.saved
    }
    this.#running = this.#run()
    try {
      return await this.#running
    } finally {
      this.#running = null
      if (this.#again) {
        this.#again = false
        if (this.#state == AutosaveStates.unsaved) this.#schedule(0)
      }
    }
  }

  /** Stops autosave and its listeners; the editor calls it when it is destroyed. */
  dispose() {
    this.#clearTimer()
    this.#listen(false)
    this.#save = null
  }

  async #run(): Promise<boolean> {
    let generation = this.#generation
    this.#setState(AutosaveStates.saving)
    try {
      await this.#save!(this.#editor)
    } catch (error) {
      this.#lastError = error
      this.#setState(AutosaveStates.failed)
      this.#schedule(this.retryDelay)
      return false
    }
    this.#lastError = null
    this.#lastSaved = new Date()
    if (generation == this.#generation) {
      this.#editor.isChanged = false
      this.#setState(AutosaveStates.saved)
      return true
    }
    // Changed while saving: those changes still need a save.
    this.#setState(AutosaveStates.unsaved)
    this.#schedule(this.delay)
    return true
  }

  #changed() {
    this.#generation++
    if (!this.#save) return
    if (this.#state != AutosaveStates.saving) this.#setState(AutosaveStates.unsaved)
    if (this.#running) {
      this.#again = true
      return
    }
    if (this.#firstChange == 0) this.#firstChange = Date.now()
    let waited = Date.now() - this.#firstChange
    this.#schedule(Math.max(0, Math.min(this.delay, this.maximumWait - waited)))
  }

  #loaded() {
    this.#generation++
    this.#clearTimer()
    if (!this.#running) this.#setState(AutosaveStates.saved)
  }

  #schedule(milliseconds: number) {
    if (this.#timer !== null) clearTimeout(this.#timer)
    this.#timer = setTimeout(() => {
      this.#timer = null
      this.saveNow()
    }, Math.max(0, milliseconds))
  }

  #clearTimer() {
    if (this.#timer !== null) clearTimeout(this.#timer)
    this.#timer = null
    this.#firstChange = 0
  }

  #setState(state: AutosaveStates) {
    if (state != AutosaveStates.unsaved && state != AutosaveStates.saving) this.#firstChange = 0
    this.#listen(state != AutosaveStates.saved && this.#save !== null)
    if (state == this.#state) return
    this.#state = state
    this.#editor.dispatchEvent(new CustomEvent("autosaveStateChanged", {detail: {state, error: state == AutosaveStates.failed ? this.#lastError : null}}))
  }

  // The page listeners are added only while something is unsaved: a beforeunload listener keeps
  // some browsers from caching the page for the back button.
  #listen(value: boolean) {
    if (typeof window == "undefined" || value == this.#listening) return
    this.#listening = value
    if (value) {
      window.addEventListener("beforeunload", this.#beforeUnload)
      document.addEventListener("visibilitychange", this.#visibilityChange)
    } else {
      window.removeEventListener("beforeunload", this.#beforeUnload)
      document.removeEventListener("visibilitychange", this.#visibilityChange)
    }
  }

  #beforeUnload = (event: BeforeUnloadEvent) => {
    if (!this.warnBeforeLeaving || this.#state == AutosaveStates.saved) return
    event.preventDefault()
    event.returnValue = ""
  }

  // Saves straight away when the page is hidden, as when the user switches tabs or closes it on a phone.
  #visibilityChange = () => {
    if (document.visibilityState == "hidden" && this.#state == AutosaveStates.unsaved) this.saveNow()
  }
}

/**
 * The bar under the document: word and character counts, the reading time, and the autosave
 * state. Turn it on with the statusBar option or editor.statusBarVisible. While text is
 * selected, the counts show the selection's share.
 */
export class StatusBar {
  #editor: Editor
  #element: HTMLElement | null = null
  #counts: HTMLElement | null = null
  #save: HTMLElement | null = null
  #timer: ReturnType<typeof setTimeout> | null = null

  showWords: boolean = true
  showCharacters: boolean = true
  showReadingTime: boolean = true
  showSaveState: boolean = true

  constructor(editor: Editor) {
    this.#editor = editor
    let schedule = () => this.scheduleUpdate()
    for (let name of ["contentChanged", "selectionChanged", "editingChanged", "autosaveStateChanged"]) editor.addEventListener(name, schedule)
  }

  get owner(): Editor {
    return this.#editor
  }

  get element(): HTMLElement | null {
    return this.#element
  }

  /** Builds the bar in an element; the editor calls it as it draws itself. */
  attach(element: HTMLElement) {
    document.addEventListener("selectionchange", this.#selectionChange)
    this.#element = element
    element.replaceChildren()
    this.#counts = Utilities.element("span", "scv-status-counts")
    this.#save = Utilities.element("span", "scv-status-save")
    element.append(this.#counts, this.#save)
    this.update()
  }

  detach() {
    document.removeEventListener("selectionchange", this.#selectionChange)
    if (this.#timer !== null) clearTimeout(this.#timer)
    this.#timer = null
    this.#element = null
    this.#counts = null
    this.#save = null
  }

  // Selecting text inside a block raises no editor event.
  #selectionChange = () => {
    if (this.#editor.isEditingText && this.#editor.statusBarVisible) this.scheduleUpdate()
  }

  /** Updates the bar shortly, once, however many changes arrive meanwhile. */
  scheduleUpdate() {
    if (this.#timer !== null || !this.#element) return
    this.#timer = setTimeout(() => {
      this.#timer = null
      this.update()
    }, 150)
  }

  update() {
    let editor = this.#editor
    if (!this.#element || !this.#counts || !this.#save || !editor.statusBarVisible) return
    let strings = editor.strings
    let statistics = editor.statistics
    let number = (value: number) => value.toLocaleString()
    let parts: Array<string> = []
    let text = editor.toPlainText()
    let words = Statistics.countWords(text)
    let selected = editor.isEditingText ? editor.selectedText() : ""
    if (this.showWords) {
      if (selected.length > 0) parts.push(Utilities.format(strings.TextSelectedWordsFormat, {selected: number(Statistics.countWords(selected)), count: number(words)}))
      else parts.push(words == 1 ? strings.TextOneWordCaption : Utilities.format(strings.TextWordsCountFormat, {count: number(words)}))
    }
    if (this.showCharacters) {
      let characters = CodePoints.count(text.replace(/\n/g, ""))
      if (selected.length > 0) parts.push(Utilities.format(strings.TextSelectedCharactersFormat, {selected: number(CodePoints.count(selected.replace(/\n/g, ""))), count: number(characters)}))
      else parts.push(characters == 1 ? strings.TextOneCharacterCaption : Utilities.format(strings.TextCharactersCountFormat, {count: number(characters)}))
    }
    if (this.showReadingTime && words > 0) parts.push(Utilities.format(strings.TextReadingTimeFormat, {count: number(Math.max(1, Math.ceil(words / statistics.wordsPerMinute)))}))
    this.#counts.textContent = parts.join(" · ")

    let autosave = editor.autosave
    this.#save.replaceChildren()
    this.#save.className = "scv-status-save"
    if (!this.showSaveState || !autosave.enabled) return
    let state = autosave.state
    this.#save.classList.add(`scv-status-${state}`)
    let icons: {[state: string]: string} = {saved: "bi bi-check2", unsaved: "bi bi-circle-fill", saving: "bi bi-arrow-repeat", failed: "bi bi-exclamation-triangle-fill"}
    let captions: {[state: string]: string} = {saved: strings.TextSavedCaption, unsaved: strings.TextUnsavedCaption, saving: strings.TextSavingCaption, failed: strings.TextSaveFailedCaption}
    this.#save.append(Utilities.element("i", icons[state], {"aria-hidden": "true"}), document.createTextNode(` ${captions[state]}`))
    if (state == AutosaveStates.failed) {
      let retry = Utilities.element("button", "btn btn-link btn-sm scv-status-retry", {type: "button"})
      retry.textContent = strings.TextTryAgainCaption
      retry.addEventListener("click", () => autosave.saveNow())
      this.#save.append(retry)
    }
  }
}
