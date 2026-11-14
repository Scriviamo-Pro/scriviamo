import {CodePoints, Node, Popup, Strings, Utilities} from "./internal"

/** One message in an annotation's thread. */
export class Comment {
  #id: string = Utilities.uuid()
  #authorID: string
  #authorName: string
  #created: Date
  #text: string

  constructor(authorID: string = "", authorName: string = "", text: string = "") {
    this.#authorID = authorID.trim()
    this.#authorName = authorName.trim()
    this.#text = text.trim()
    this.#created = new Date()
  }

  get id(): string { return this.#id }
  /** The collaborator ID of the comment's author. */
  get authorID(): string { return this.#authorID }
  get authorName(): string { return this.#authorName }
  get created(): Date { return this.#created }
  get text(): string { return this.#text }

  static fromJSON(data: any): Comment | null {
    if (!data || typeof data != "object") return null
    let result = new Comment()
    result.#id = Utilities.string(data.id, result.#id) || result.#id
    result.#authorID = Utilities.string(data.authorId)
    result.#authorName = Utilities.string(data.authorName)
    result.#text = Utilities.string(data.text)
    let seconds = Number(data.created)
    if (isFinite(seconds) && "created" in data) result.#created = new Date(seconds * 1000)
    return result
  }

  /** The comment as JSON, with its date in seconds since 1970. */
  toJSON(): object {
    let result: any = {id: this.#id}
    if (this.#authorID.length > 0) result.authorId = this.#authorID
    if (this.#authorName.length > 0) result.authorName = this.#authorName
    result.created = this.#created.getTime() / 1000
    result.text = this.#text
    return result
  }
}

/**
 * A discussion thread attached to a range of text or to a whole node. It never
 * changes the document's content: it is saved beside the nodes in the document's
 * JSON, and isn't part of HTML, Markdown or printed output.
 *
 * nodeID is the annotated node. coversNode is true for a whole node; otherwise
 * segment is the node's text run (a table cell's index, or 0 for a node with one
 * run) and start and length are offsets in it. The editor keeps the anchor on its
 * text as the document changes.
 */
export class Annotation {
  #id: string = Utilities.uuid()
  #nodeID: string = ""
  #segment: number = 0
  // Offsets in UTF-16 units of the segment's text, or in code points while
  // #codePointOffsets is set, as read from JSON before the text was seen.
  #start: number = 0
  #length: number = 0
  #codePointOffsets: boolean = false
  #coversNode: boolean = false
  #quote: string = ""
  #resolved: boolean = false
  #comments: Array<Comment> = []
  #segmentText: string = ""
  #hasBaseline: boolean = false
  #nodeMissing: boolean = false
  /** Where the annotation's marker is shown, for placing the popover. */
  markerElement: HTMLElement | null = null

  get id(): string { return this.#id }
  get nodeID(): string { return this.#nodeID }
  get segment(): number { return this.#segment }
  /** The offset of the annotated text in its text run. */
  get start(): number { return this.#start }
  /** The length of the annotated text. It is 0 when the text has been deleted. */
  get length(): number { return this.#length }
  get coversNode(): boolean { return this.#coversNode }
  /** The text the annotation was made on. */
  get quote(): string { return this.#quote }
  get resolved(): boolean { return this.#resolved }
  /** True when the annotated text was deleted, or the node is no longer in the document. */
  get orphaned(): boolean { return this.#nodeMissing || (!this.#coversNode && this.#length == 0) }
  /** When the thread's first comment was written. */
  get created(): Date | null { return this.#comments.length > 0 ? this.#comments[0].created : null }

  comments(): Array<Comment> { return this.#comments.slice() }
  commentAt(index: number): Comment | null { return this.#comments[index] || null }
  get lastCommentIndex(): number { return this.#comments.length - 1 }

  /** @internal */
  addComment(value: Comment) {
    if (value) this.#comments.push(value)
  }

  /** @internal */
  removeCommentAt(index: number) {
    if (index >= 0 && index < this.#comments.length) this.#comments.splice(index, 1)
  }

  /** @internal */
  setResolved(value: boolean) {
    this.#resolved = value
  }

  /** @internal */
  setNodeMissing(value: boolean) {
    this.#nodeMissing = value
  }

  /** @internal Sets what the annotation is attached to. */
  setAnchor(nodeID: string, segment: number, start: number, length: number, coversNode: boolean, quote: string, segmentText: string) {
    this.#nodeID = nodeID
    this.#segment = Math.max(0, segment)
    this.#start = Math.max(0, start)
    this.#length = Math.max(0, length)
    this.#coversNode = coversNode
    this.#quote = quote
    this.#segmentText = segmentText
    this.#hasBaseline = true
    this.#codePointOffsets = false
  }

  /** @internal Attaches this annotation where another one is. */
  copyAnchor(source: Annotation) {
    if (!source) return
    this.#nodeID = source.#nodeID
    this.#segment = source.#segment
    this.#start = source.#start
    this.#length = source.#length
    this.#coversNode = source.#coversNode
    this.#quote = source.#quote
    this.#segmentText = source.#segmentText
    this.#hasBaseline = source.#hasBaseline
    this.#codePointOffsets = source.#codePointOffsets
    this.markerElement = source.markerElement
  }

  /** @internal Takes every value of another annotation, keeping this object. */
  assign(source: Annotation) {
    if (!source) return
    this.copyAnchor(source)
    this.#id = source.#id
    this.#resolved = source.#resolved
    this.#comments = source.#comments.slice()
  }

  /**
   * @internal Moves the anchor to follow an edit to its text run, and returns whether
   * it moved. Text inserted before the anchor moves it, text inserted inside it grows
   * it, and deleted text shrinks it. An anchor whose text is deleted collapses where
   * the text was, and covers it again if the same text comes back there, as on undo.
   */
  adjustToText(currentText: string): boolean {
    if (this.#codePointOffsets) {
      // Offsets read from JSON are in code points; this is the first look at the text.
      let start = Annotation.fromCodePoints(currentText, this.#start)
      let end = Annotation.fromCodePoints(currentText, this.#start + this.#length)
      this.#start = start
      this.#length = end - start
      this.#codePointOffsets = false
      this.#segmentText = currentText
      this.#hasBaseline = true
      return false
    }
    if (!this.#hasBaseline || this.#coversNode) {
      this.#segmentText = currentText
      this.#hasBaseline = true
      return false
    }
    if (currentText === this.#segmentText) return false
    let previous = this.#segmentText
    let prefix = 0
    let shortest = Math.min(previous.length, currentText.length)
    while (prefix < shortest && previous[prefix] === currentText[prefix]) prefix++
    let suffix = 0
    while (suffix < shortest - prefix && previous[previous.length - 1 - suffix] === currentText[currentText.length - 1 - suffix]) suffix++
    let previousSuffix = previous.length - suffix
    let currentSuffix = currentText.length - suffix
    this.#segmentText = currentText
    let startOffset = this.#start
    let endOffset = this.#start + this.#length
    let delta = currentSuffix - previousSuffix
    if (this.#length == 0 && this.#quote.length > 0 && startOffset >= prefix && startOffset <= previousSuffix) {
      let inserted = currentText.substring(prefix, currentSuffix)
      let found = inserted.indexOf(this.#quote)
      if (found >= 0) {
        this.#start = prefix + found
        this.#length = this.#quote.length
        return true
      }
    }
    if (endOffset <= prefix) {
      return false
    } else if (startOffset >= previousSuffix) {
      this.#start = startOffset + delta
    } else if (startOffset < prefix) {
      this.#length = (endOffset > previousSuffix ? endOffset + delta : prefix) - startOffset
    } else if (endOffset > previousSuffix) {
      this.#start = currentSuffix
      this.#length = endOffset + delta - currentSuffix
    } else {
      this.#start = prefix
      this.#length = 0
    }
    this.#start = Utilities.clamp(this.#start, 0, currentText.length)
    this.#length = Utilities.clamp(this.#length, 0, currentText.length - this.#start)
    return true
  }

  static fromCodePoints(text: string, count: number): number {
    let index = 0
    let seen = 0
    while (seen < count && index < text.length) {
      let code = text.codePointAt(index) || 0
      index += code > 0xFFFF ? 2 : 1
      seen++
    }
    return index
  }

  static fromJSON(data: any): Annotation | null {
    if (!data || typeof data != "object") return null
    let result = new Annotation()
    result.#id = Utilities.string(data.id, result.#id) || result.#id
    result.#nodeID = Utilities.string(data.nodeId)
    result.#segment = Math.max(0, Utilities.integer(data.segment, 0))
    result.#start = Math.max(0, Utilities.integer(data.start, 0))
    result.#length = Math.max(0, Utilities.integer(data.length, 0))
    result.#coversNode = Utilities.boolean(data.coversNode, false)
    result.#quote = Utilities.string(data.quote)
    result.#resolved = Utilities.boolean(data.resolved, false)
    result.#codePointOffsets = !result.#coversNode
    result.#hasBaseline = false
    if (Array.isArray(data.comments)) {
      data.comments.forEach(item => {
        let comment = Comment.fromJSON(item)
        if (comment) result.#comments.push(comment)
      })
    }
    return result.#nodeID.length > 0 ? result : null
  }

  /** The annotation, its anchor and its comments as JSON. Offsets are in characters (code points). */
  toJSON(): object {
    let result: any = {id: this.#id, nodeId: this.#nodeID}
    if (this.#coversNode) {
      result.coversNode = true
    } else {
      let start = this.#start
      let length = this.#length
      if (!this.#codePointOffsets && this.#hasBaseline) {
        start = CodePoints.count(this.#segmentText.substring(0, this.#start))
        length = CodePoints.count(this.#segmentText.substring(this.#start, this.#start + this.#length))
      }
      result.segment = this.#segment
      result.start = start
      result.length = length
      result.quote = this.#quote
    }
    if (this.#resolved) result.resolved = true
    result.comments = this.#comments.map(comment => comment.toJSON())
    return result
  }
}

/** What Annotations needs from its editor. */
export interface AnnotationHandler {
  /** Anchors annotation to the selected text or node. Returns false when nothing can be annotated. */
  selectionAnchor(annotation: Annotation): boolean
  containsNode(node: Node): boolean
  /** Called before a change, for undo. */
  willChange(): void
  changed(kind: "added" | "changed" | "removed", annotation: Annotation): void
  redraw(): void
  /** Scrolls the annotation's node into view and returns where its popover should open. */
  reveal(annotation: Annotation): HTMLElement | DOMRect | null
  /** Where a new thread's popover opens: the selection, or the selected node. */
  selectionRect(): DOMRect | null
  segmentText(node: Node, segment: number): string | null
  segmentCount(node: Node): number
  get allowed(): boolean
  /** False while threads may be read but not changed, as for a collaborator with Read access. */
  get canChange(): boolean
  /** The connected collaborator, the author of new comments when Annotations has none of its own, or null. */
  identity(): {id: string, name: string} | null
  get container(): HTMLElement | null
  get strings(): Strings
}

/**
 * A document's discussion threads. Read it from Editor.annotations. Annotations
 * never change the document's content, so they can be added and answered in a
 * read-only editor. Each change is one undo step, sets isChanged, and raises the
 * editor's annotationAdded, annotationChanged or annotationRemoved event.
 */
export class Annotations {
  #owner: any
  #handler: AnnotationHandler
  #items: Array<Annotation> = []
  #grouping: boolean = false
  #selected: Annotation | null = null
  #popover: AnnotationPopover | null = null
  /** The collaborator ID recorded as the author of new comments. */
  authorID: string = ""
  /** The name recorded as the author of new comments. When both are empty, TextDefaultAuthorCaption is used. */
  authorName: string = ""

  constructor(owner: any, handler: AnnotationHandler) {
    this.#owner = owner
    this.#handler = handler
  }

  get owner(): any {
    return this.#owner
  }

  /** @internal Replaces every annotation without undo or events, as when a document is loaded. */
  load(items: Array<Annotation>) {
    this.close()
    this.#items = items.slice()
    this.#selected = null
  }

  /**
   * @internal Replaces a thread with a collaboration server's copy, adds it, or removes
   * it when data is null. Not an undo step; raises the usual annotation events.
   */
  applyRemote(identifier: string, data: any) {
    let existing = this.item(identifier)
    if (!data) {
      if (!existing) return
      this.#items.splice(this.#items.indexOf(existing), 1)
      if (this.#selected === existing) {
        this.close()
        this.#selected = null
      }
      this.#handler.changed("removed", existing)
      return
    }
    let incoming = Annotation.fromJSON(data)
    if (!incoming) return
    if (existing) {
      if (JSON.stringify(existing.toJSON()) === JSON.stringify(incoming.toJSON())) return
      existing.assign(incoming)
      this.#handler.changed("changed", existing)
    } else {
      this.#items.push(incoming)
      this.#handler.changed("added", incoming)
    }
  }

  /** Annotates the selected text while a node is being edited, or the one selected node. */
  add(text: string): Annotation | null
  /** Annotates a whole node. */
  add(node: Node, text: string): Annotation | null
  /** Annotates a range of a node's text; segment is a table cell's index, or 0. */
  add(node: Node, start: number, length: number, text: string, segment?: number): Annotation | null
  add(first: any, second?: any, third?: any, fourth?: any, fifth?: any): Annotation | null {
    if (typeof first == "string") {
      if (first.trim().length == 0) return null
      let result = new Annotation()
      if (!this.#handler.selectionAnchor(result)) return null
      return this.#addAnnotation(result, first)
    }
    let node = first as Node
    if (!node || !this.#handler.containsNode(node)) return null
    if (typeof second == "string") {
      if (second.trim().length == 0) return null
      let result = new Annotation()
      result.setAnchor(node.nodeId, 0, 0, 0, true, "", "")
      return this.#addAnnotation(result, second)
    }
    let start = Number(second)
    let length = Number(third)
    let text = String(fourth || "")
    let segment = Number(fifth || 0)
    if (text.trim().length == 0 || !(length > 0) || !(start >= 0) || !(segment >= 0) || segment >= this.#handler.segmentCount(node)) return null
    let segmentText = this.#handler.segmentText(node, segment)
    if (segmentText === null || start + length > segmentText.length) return null
    let result = new Annotation()
    result.setAnchor(node.nodeId, segment, start, length, false, segmentText.substring(start, start + length), segmentText)
    return this.#addAnnotation(result, text)
  }

  /** @internal Starts a thread on an anchor taken from the selection when the popover opened. */
  addPrepared(anchor: Annotation, text: string): Annotation | null {
    if (!anchor || text.trim().length == 0 || anchor.lastCommentIndex >= 0 || this.#items.indexOf(anchor) >= 0 || !this.canChange) return null
    return this.#addAnnotation(anchor, text)
  }

  #addAnnotation(annotation: Annotation, text: string): Annotation | null {
    if (!this.canChange) return null
    let author = this.#author()
    this.#willChange()
    annotation.addComment(new Comment(author.id, author.name, text))
    this.#items.push(annotation)
    this.#handler.changed("added", annotation)
    return annotation
  }

  #author(): {id: string, name: string} {
    let id = this.authorID.trim()
    let name = this.authorName.trim()
    if (id.length > 0 || name.length > 0) return {id: id, name: name}
    let identity = this.#handler.identity()
    if (identity && identity.name.trim().length > 0) return {id: identity.id.trim(), name: identity.name.trim()}
    return {id: "", name: this.#handler.strings.TextDefaultAuthorCaption}
  }

  #willChange() {
    if (!this.#grouping) this.#handler.willChange()
  }

  /** True when add(text) has something to annotate: selected text, or one selected node. */
  get canAdd(): boolean {
    return this.canChange && this.#handler.selectionAnchor(new Annotation())
  }

  /** True when threads can be added, answered, resolved and removed. False when comments are turned off, or may only be read. */
  get canChange(): boolean {
    return this.#handler.allowed && this.#handler.canChange
  }

  /** The annotations attached to a node, in the order they were added. */
  annotationsAt(node: Node): Array<Annotation> {
    if (!node) return []
    return this.#items.filter(item => item.nodeID == node.nodeId)
  }

  indexOf(annotation: Annotation): number {
    return this.#items.indexOf(annotation)
  }

  item(identifier: string): Annotation | null {
    return this.#items.find(item => item.id == identifier) || null
  }

  itemAt(index: number): Annotation | null {
    return this.#items[index] || null
  }

  items(): Array<Annotation> {
    return this.#items.slice()
  }

  get lastIndex(): number {
    return this.#items.length - 1
  }

  remove(annotation: Annotation | string) {
    let target = typeof annotation == "string" ? this.item(annotation) : annotation
    let index = target ? this.#items.indexOf(target) : -1
    if (index >= 0) this.removeAt(index)
  }

  removeAt(index: number) {
    if (index < 0 || index >= this.#items.length || !this.#handler.canChange) return
    let removed = this.#items[index]
    this.#willChange()
    this.#items.splice(index, 1)
    if (this.#selected === removed) this.#selected = null
    this.#handler.changed("removed", removed)
  }

  /** Removes every annotation, as one undo step. */
  removeAll() {
    if (this.#items.length == 0 || !this.#handler.canChange) return
    this.#willChange()
    this.#grouping = true
    for (let index = this.#items.length - 1; index >= 0; index--) this.removeAt(index)
    this.#grouping = false
  }

  /** Removes a comment from a thread, and the thread when it was the last one. */
  removeComment(annotation: Annotation, comment: Comment) {
    if (!annotation || !comment || this.#items.indexOf(annotation) < 0 || !this.#handler.canChange) return
    let index = annotation.comments().indexOf(comment)
    if (index < 0) return
    this.#willChange()
    this.#grouping = true
    annotation.removeCommentAt(index)
    if (annotation.lastCommentIndex < 0) {
      this.remove(annotation)
    } else {
      this.#handler.changed("changed", annotation)
    }
    this.#grouping = false
  }

  /** Adds a reply by the current author and returns it, or null when the text is empty. */
  reply(annotation: Annotation, text: string): Comment | null {
    if (!annotation || text.trim().length == 0 || this.#items.indexOf(annotation) < 0 || !this.canChange) return null
    let author = this.#author()
    let result = new Comment(author.id, author.name, text)
    this.#willChange()
    annotation.addComment(result)
    this.#handler.changed("changed", annotation)
    return result
  }

  /** Marks a discussion resolved. It stays visible, muted, and can be reopened. */
  resolve(annotation: Annotation) {
    this.#setResolved(annotation, true)
  }

  reopen(annotation: Annotation) {
    this.#setResolved(annotation, false)
  }

  #setResolved(annotation: Annotation, value: boolean) {
    if (!annotation || annotation.resolved == value || this.#items.indexOf(annotation) < 0 || !this.#handler.canChange) return
    this.#willChange()
    annotation.setResolved(value)
    this.#handler.changed("changed", annotation)
  }

  /** @internal An unsaved anchor for the selected text or node, or null. */
  prepareSelection(): Annotation | null {
    let result = new Annotation()
    return this.#handler.selectionAnchor(result) ? result : null
  }

  /** The annotation whose text is highlighted, as while its thread is open. */
  get selected(): Annotation | null {
    return this.#selected
  }

  set selected(value: Annotation | null) {
    if (value === this.#selected) return
    this.#selected = value
    this.#handler.redraw()
  }

  /** True while the comment popover is open. */
  get visible(): boolean {
    return !!this.#popover && this.#popover.isOpen
  }

  /**
   * Opens the comment popover on an annotation's thread, among the other threads on
   * its node, or on a new thread for the selection when annotation is null.
   */
  show(annotation: Annotation | null = null, focusField: boolean = true) {
    let container = this.#handler.container
    if (!this.#handler.allowed || !container) return
    if (!annotation) {
      if (!this.canChange) return
      let prepared = this.prepareSelection()
      if (!prepared) return
      let rect = this.#handler.selectionRect()
      this.#open([], 0, prepared, rect, container, focusField)
      return
    }
    if (this.#items.indexOf(annotation) < 0) return
    let anchor = this.#handler.reveal(annotation)
    let threads = this.#items.filter(item => item.nodeID == annotation.nodeID)
    this.#open(threads, threads.indexOf(annotation), null, anchor, container, focusField)
  }

  #open(threads: Array<Annotation>, index: number, prepared: Annotation | null, anchor: HTMLElement | DOMRect | null, container: HTMLElement, focusField: boolean) {
    this.close()
    let popover = new AnnotationPopover(this, this.#handler.strings, threads, index, prepared)
    popover.onClose = () => {
      if (this.#popover === popover) {
        this.#popover = null
        this.selected = null
      }
    }
    this.#popover = popover
    // Markers are rebuilt as the document changes, so the popover follows the current thread's marker.
    let fallback = anchor instanceof HTMLElement ? anchor.getBoundingClientRect() : anchor
    popover.anchorProvider = () => {
      let thread = popover.current
      let marker = thread ? thread.markerElement : null
      return marker && marker.isConnected ? marker.getBoundingClientRect() : fallback
    }
    popover.show(anchor || container, container)
    if (focusField) popover.focusField()
  }

  /** @internal The popover changed the thread it shows. */
  popoverShowing(annotation: Annotation | null) {
    this.selected = annotation
  }

  /** Closes the comment popover when it is open. */
  close() {
    if (this.#popover) this.#popover.close()
  }

  /** @internal Rebuilds the open popover after the annotations changed. */
  refreshPopover() {
    if (this.#popover && this.#popover.isOpen) this.#popover.refresh()
  }
}

/**
 * The comment popover: a thread's position among its node's threads and its status,
 * the annotated text, the comments with their authors and dates, and a field that
 * adds a reply, or starts the thread when it is new, on Return. New starts another
 * thread on the same text or node.
 */
export class AnnotationPopover extends Popup {
  #annotations: Annotations
  #strings: Strings
  #threads: Array<Annotation>
  #index: number
  #prepared: Annotation | null
  #field: HTMLTextAreaElement | null = null

  constructor(annotations: Annotations, strings: Strings, threads: Array<Annotation>, index: number, prepared: Annotation | null) {
    super("scv-annotation-popover")
    this.keepsFocus = false
    this.#annotations = annotations
    this.#strings = strings
    this.#threads = threads
    this.#index = Math.max(0, index)
    this.#prepared = prepared
    this.element.setAttribute("role", "dialog")
    this.element.setAttribute("aria-label", strings.TextCommentsCaption)
    this.#build()
  }

  get current(): Annotation | null {
    return this.#prepared ? null : (this.#threads[this.#index] || null)
  }

  focusField() {
    if (this.#field) this.#field.focus()
  }

  refresh() {
    // Threads removed elsewhere drop out; a node with none left closes the popover.
    let items = this.#annotations.items()
    this.#threads = this.#threads.filter(thread => items.indexOf(thread) >= 0)
    if (!this.#prepared && this.#threads.length == 0) {
      this.close()
      return
    }
    this.#index = Utilities.clamp(this.#index, 0, Math.max(0, this.#threads.length - 1))
    let hadFocus = !!this.#field && document.activeElement === this.#field
    let draft = this.#field ? this.#field.value : ""
    this.#build()
    if (this.#field) this.#field.value = draft
    if (hadFocus) this.focusField()
    if (this.isOpen) this.position()
  }

  #build() {
    let strings = this.#strings
    let element = this.element
    element.textContent = ""
    let thread = this.current
    this.#annotations.popoverShowing(thread || this.#prepared)

    let header = Utilities.element("div", "scv-annotation-header")
    let title = Utilities.element("span", "scv-annotation-title")
    if (thread) {
      title.textContent = Utilities.format(strings.TextCommentPositionFormat, {index: this.#index + 1, count: this.#threads.length})
      let status = Utilities.element("span", `badge ${thread.resolved ? "text-bg-secondary" : "text-bg-warning"} scv-annotation-status`)
      status.textContent = thread.resolved ? strings.TextResolvedCaption : strings.TextOpenStatusCaption
      header.append(title, status)
      let previous = this.#iconButton("bi bi-chevron-up", strings.TextPreviousCommentTooltip, () => this.#move(-1))
      let next = this.#iconButton("bi bi-chevron-down", strings.TextNextCommentTooltip, () => this.#move(1))
      previous.disabled = this.#index <= 0
      next.disabled = this.#index >= this.#threads.length - 1
      let navigation = Utilities.element("span", "scv-annotation-navigation")
      navigation.append(previous, next)
      header.append(navigation)
    } else {
      title.textContent = strings.TextNewCommentCaption
      header.append(title)
    }
    element.append(header)

    let quote = thread ? thread.quote : (this.#prepared ? this.#prepared.quote : "")
    if (quote.length > 0) {
      let blockquote = Utilities.element("blockquote", "scv-annotation-quote")
      blockquote.textContent = quote
      element.append(blockquote)
    }

    if (thread) {
      let list = Utilities.element("div", "scv-annotation-comments")
      thread.comments().forEach(comment => {
        let item = Utilities.element("div", "scv-annotation-comment")
        let meta = Utilities.element("div", "scv-annotation-meta")
        let author = Utilities.element("strong")
        author.textContent = comment.authorName.length > 0 ? comment.authorName : strings.TextDefaultAuthorCaption
        let time = Utilities.element("time", "text-body-secondary", {datetime: comment.created.toISOString()})
        time.textContent = comment.created.toLocaleString(undefined, {dateStyle: "medium", timeStyle: "short"})
        meta.append(author, time)
        let text = Utilities.element("div", "scv-annotation-text")
        text.textContent = comment.text
        item.append(meta, text)
        list.append(item)
      })
      element.append(list)
    }

    if (!this.#annotations.canChange) {
      this.#field = null
      return
    }

    let field = Utilities.element("textarea", "form-control form-control-sm scv-annotation-field", {rows: "2", placeholder: thread ? strings.TextReplyHint : strings.TextCommentHint, "aria-label": thread ? strings.TextReplyHint : strings.TextCommentHint}) as HTMLTextAreaElement
    field.addEventListener("keydown", event => {
      if (event.key == "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault()
        event.stopPropagation()
        this.#submit()
      }
    })
    this.#field = field
    element.append(field)

    if (thread) {
      let actions = Utilities.element("div", "scv-annotation-actions")
      let fresh = Utilities.element("button", "btn btn-sm btn-outline-secondary", {type: "button", title: strings.TextNewCommentThreadTooltip}) as HTMLButtonElement
      fresh.textContent = strings.TextNewCommentThreadCaption
      fresh.addEventListener("click", () => {
        let anchor = new Annotation()
        anchor.copyAnchor(thread)
        this.#prepared = anchor
        this.#build()
        this.position()
        this.focusField()
      })
      let resolve = Utilities.element("button", "btn btn-sm btn-outline-secondary", {type: "button"}) as HTMLButtonElement
      resolve.textContent = thread.resolved ? strings.TextReopenCaption : strings.TextResolveCaption
      resolve.addEventListener("click", () => {
        if (thread.resolved) {
          this.#annotations.reopen(thread)
        } else {
          this.#annotations.resolve(thread)
        }
      })
      let remove = Utilities.element("button", "btn btn-sm btn-outline-danger", {type: "button"}) as HTMLButtonElement
      remove.textContent = strings.TextDeleteCommentThreadCaption
      remove.addEventListener("click", () => this.#annotations.remove(thread))
      actions.append(fresh, resolve, remove)
      element.append(actions)
    }
  }

  #iconButton(icon: string, label: string, action: () => void): HTMLButtonElement {
    let button = Utilities.element("button", "btn btn-sm btn-link scv-annotation-nav", {type: "button", title: label, "aria-label": label}) as HTMLButtonElement
    button.append(Utilities.element("i", icon))
    button.addEventListener("click", action)
    return button
  }

  #move(delta: number) {
    let index = this.#index + delta
    if (index < 0 || index >= this.#threads.length) return
    this.#index = index
    this.#build()
    this.position()
  }

  #submit() {
    let text = this.#field ? this.#field.value : ""
    if (text.trim().length == 0) return
    if (this.#prepared) {
      let added = this.#annotations.addPrepared(this.#prepared, text)
      if (!added) return
      this.#prepared = null
      this.#threads = this.#annotations.items().filter(item => item.nodeID == added.nodeID)
      this.#index = Math.max(0, this.#threads.indexOf(added))
    } else {
      let thread = this.current
      if (!thread || !this.#annotations.reply(thread, text)) return
    }
    if (this.#field) this.#field.value = ""
    this.#build()
    this.position()
    this.focusField()
  }
}
