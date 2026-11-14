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
