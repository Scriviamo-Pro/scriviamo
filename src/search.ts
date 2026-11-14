import {Editor, Node, TextHost, Utilities} from "./internal"

/** A match found by Search. */
export class FindResult {
  node: Node
  hostIndex: number
  start: number
  length: number

  constructor(node: Node, hostIndex: number, start: number, length: number) {
    this.node = node
    this.hostIndex = hostIndex
    this.start = start
    this.length = length
  }

  get host(): TextHost | null {
    return this.node.hosts()[this.hostIndex] || null
  }

  get text(): string {
    let host = this.host
    return host ? host.rich.text.substring(this.start, this.start + this.length) : ""
  }
}

/** Find and replace across every text in the document, with an optional search bar. */
export class Search extends EventTarget {
  #editor: Editor
  #results: Array<FindResult> = []
  #currentIndex: number = -1
  #panel: HTMLElement | null = null
  #findInput: HTMLInputElement | null = null
  #replaceInput: HTMLInputElement | null = null
  #status: HTMLElement | null = null

  query: string = ""
  replacement: string = ""
  caseSensitive: boolean = false
  wholeWord: boolean = false
  useRegEx: boolean = false
  patternError: string = ""

  constructor(editor: Editor) {
    super()
    this.#editor = editor
  }

  get owner(): Editor {
    return this.#editor
  }

  get matchCount(): number {
    return this.#results.length
  }

  get currentIndex(): number {
    return this.#currentIndex
  }

  get current(): FindResult | null {
    return this.#results[this.#currentIndex] || null
  }

  get visible(): boolean {
    return this.#panel !== null && !this.#panel.classList.contains("d-none")
  }

  #pattern(query: string): RegExp | null {
    this.patternError = ""
    if (query.length == 0) return null
    let source = this.useRegEx ? query : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    if (this.wholeWord) source = `(?<![\\p{L}\\p{N}_])(?:${source})(?![\\p{L}\\p{N}_])`
    try {
      return new RegExp(source, this.caseSensitive ? "gu" : "giu")
    } catch (error) {
      this.patternError = String(error && error.message ? error.message : error)
      return null
    }
  }

  /** Finds every match of query, or of the current query. */
  findAll(query?: string): Array<FindResult> {
    if (query !== undefined) this.query = query
    this.#results = []
    let pattern = this.#pattern(this.query)
    if (pattern) {
      this.#editor.allNodes().forEach(node => {
        node.hosts().forEach(host => {
          pattern.lastIndex = 0
          let text = host.rich.text
          let match: RegExpExecArray | null
          while ((match = pattern.exec(text)) !== null) {
            if (match[0].length == 0) {
              pattern.lastIndex++
              continue
            }
            this.#results.push(new FindResult(node, host.index, match.index, match[0].length))
          }
        })
      })
    }
    this.#currentIndex = Math.min(this.#currentIndex, this.#results.length - 1)
    this.#highlight()
    this.#updateStatus()
    return this.#results.slice()
  }

  /** Finds the first match at or after the caret and selects it. */
  find(query: string): FindResult | null {
    this.findAll(query)
    if (this.#results.length == 0) return null
    let order = this.#editor.allNodes()
    let host = this.#editor.activeHost
    let caretNode = host ? order.indexOf(host.node) : -1
    let caretOffset = host && host.selection() ? host.selection().start : 0
    let index = this.#results.findIndex(result => {
      let nodeIndex = order.indexOf(result.node)
      if (nodeIndex != caretNode) return nodeIndex > caretNode
      if (result.hostIndex != host.index) return result.hostIndex > host.index
      return result.start >= caretOffset
    })
    this.#currentIndex = index < 0 ? 0 : index
    this.selectResult(this.#results[this.#currentIndex])
    return this.current
  }

  findNext(): FindResult | null {
    if (this.#results.length == 0) this.findAll()
    if (this.#results.length == 0) return null
    this.#currentIndex = (this.#currentIndex + 1) % this.#results.length
    this.selectResult(this.#results[this.#currentIndex])
    return this.current
  }

  findPrevious(): FindResult | null {
    if (this.#results.length == 0) this.findAll()
    if (this.#results.length == 0) return null
    this.#currentIndex = this.#currentIndex <= 0 ? this.#results.length - 1 : this.#currentIndex - 1
    this.selectResult(this.#results[this.#currentIndex])
    return this.current
  }

  selectResult(result: FindResult) {
    if (!result) return
    let index = this.#results.indexOf(result)
    if (index >= 0) this.#currentIndex = index
    let host = result.host
    if (!host) return
    this.#editor.revealNode(result.node)
    if (this.visible) {
      // Keep typing in the search field: show the match without focusing it.
      this.#highlight()
      let position = host.positionOf(result.start)
      let range = document.createRange()
      range.setStart(position.node, position.offset)
      let rect = range.getBoundingClientRect()
      let element = position.node instanceof HTMLElement ? position.node : position.node.parentElement
      if (element) element.scrollIntoView({block: rect.height > 0 ? "nearest" : "center"})
    } else {
      host.select(result.start, result.start + result.length)
      host.element.scrollIntoView({block: "nearest"})
    }
    this.#updateStatus()
  }

  #replacementFor(result: FindResult, replacement: string): string {
    if (!this.useRegEx) return replacement
    let pattern = this.#pattern(this.query)
    if (!pattern) return replacement
    return result.text.replace(new RegExp(pattern.source, pattern.flags.replace("g", "")), replacement)
  }

  /** Replaces a match, or the current match. Returns true when it replaced text. */
  replace(resultOrReplacement?: FindResult | string, replacement?: string): boolean {
    let result = resultOrReplacement instanceof FindResult ? resultOrReplacement : this.current
    let value = typeof resultOrReplacement == "string" ? resultOrReplacement : (replacement !== undefined ? replacement : this.replacement)
    if (!result || this.#editor.readOnly) return false
    let host = result.host
    if (!host) return false
    this.#editor.history.checkpoint()
    let text = this.#replacementFor(result, value)
    this.#replaceIn(host, result, text)
    host.render()
    host.node.textChanged(host)
    host.node.changed()
    let index = this.#currentIndex
    let end = result.start + text.length
    this.findAll()
    let results = this.#results
    if (results.length > 0) {
      // Move to the first match after the replaced text, wrapping to the start.
      let next = -1
      let seenHost = false
      for (let position = 0; position < results.length && next < 0; position++) {
        if (results[position].host === host) {
          seenHost = true
          if (results[position].start >= end) next = position
        } else if (seenHost) {
          next = position
        }
      }
      if (next < 0) next = seenHost || index >= results.length ? 0 : index
      this.#currentIndex = next
      this.selectResult(results[next])
    }
    return true
  }

  #replaceIn(host: TextHost, result: FindResult, value: string) {
    let style = host.rich.styleAt(result.start).clone()
    host.rich.remove(result.start, result.start + result.length)
    host.rich.insert(result.start, value, style)
  }

  /** Replaces every match. Returns the number replaced. */
  replaceAll(queryOrReplacement?: string, replacement?: string): number {
    if (replacement !== undefined) {
      this.query = queryOrReplacement
    } else if (queryOrReplacement !== undefined) {
      replacement = queryOrReplacement
    }
    let value = replacement !== undefined ? replacement : this.replacement
    let results = this.findAll()
    if (results.length == 0 || this.#editor.readOnly) return 0
    this.#editor.history.checkpoint()
    let changed: Array<TextHost> = []
    // Work backwards so earlier offsets stay valid.
    for (let index = results.length - 1; index >= 0; index--) {
      let result = results[index]
      let host = result.host
      if (!host) continue
      this.#replaceIn(host, result, this.#replacementFor(result, value))
      if (changed.indexOf(host) < 0) changed.push(host)
    }
    changed.forEach(host => {
      host.render()
      host.node.textChanged(host)
      host.node.changed()
    })
    this.findAll()
    return results.length
  }

  #highlight() {
    let registry = typeof CSS !== "undefined" ? (CSS as any).highlights : null
    if (!registry || typeof (window as any).Highlight === "undefined") return
    let all: Array<Range> = []
    let current: Array<Range> = []
    if (this.visible) {
      this.#results.forEach((result, index) => {
        let host = result.host
        if (!host || !host.element.isConnected) return
        let start = host.positionOf(result.start)
        let end = host.positionOf(result.start + result.length)
        let range = document.createRange()
        try {
          range.setStart(start.node, start.offset)
          range.setEnd(end.node, end.offset)
        } catch {
          return
        }
        ;(index == this.#currentIndex ? current : all).push(range)
      })
    }
    registry.set("scv-search", new (window as any).Highlight(...all))
    registry.set("scv-search-current", new (window as any).Highlight(...current))
  }

  /** Shows the search bar. */
  show(replace: boolean = false) {
    if (!this.#panel) this.#buildPanel()
    this.#panel.classList.remove("d-none")
    this.#panel.classList.toggle("scv-search-replacing", replace || this.#panel.classList.contains("scv-search-replacing"))
    let selected = this.#editor.selectedText()
    if (selected.length > 0 && selected.indexOf("\n") < 0) {
      this.#findInput.value = selected
      this.query = selected
    }
    this.#findInput.focus()
    this.#findInput.select()
    this.findAll()
  }

  close() {
    if (!this.#panel) return
    this.#panel.classList.add("d-none")
    this.#highlight()
    let current = this.current
    if (current && current.host) {
      current.host.select(current.start, current.start + current.length)
    }
  }

  #buildPanel() {
    let strings = this.#editor.strings
    let panel = Utilities.element("div", "scv-search d-none")
    let row = Utilities.element("div", "scv-search-row")
    let toggle = Utilities.element("button", "btn btn-sm btn-link scv-search-toggle", {type: "button", title: strings.TextReplaceCaption})
    toggle.innerHTML = `<i class="bi bi-chevron-right"></i>`
    toggle.addEventListener("click", () => panel.classList.toggle("scv-search-replacing"))
    row.append(toggle)

    let find = Utilities.element("input", "form-control form-control-sm", {type: "search", placeholder: strings.TextFindHint, "aria-label": strings.TextFindHint})
    find.addEventListener("input", () => {
      this.query = find.value
      this.#currentIndex = -1
      this.findAll()
      if (this.#results.length > 0) this.findNext()
    })
    find.addEventListener("keydown", event => {
      if (event.key == "Enter") {
        event.preventDefault()
        event.shiftKey ? this.findPrevious() : this.findNext()
      } else if (event.key == "Escape") {
        event.preventDefault()
        this.close()
      }
    })
    row.append(find)
    this.#findInput = find

    let option = (icon: string, title: string, read: () => boolean, write: (value: boolean) => void) => {
      let button = Utilities.element("button", "btn btn-sm scv-search-option", {type: "button", title: title, "aria-pressed": "false"})
      button.innerHTML = icon
      button.addEventListener("click", () => {
        write(!read())
        button.classList.toggle("active", read())
        button.setAttribute("aria-pressed", read() ? "true" : "false")
        this.findAll()
      })
      return button
    }
    row.append(option("Aa", strings.TextMatchCaseCaption, () => this.caseSensitive, value => this.caseSensitive = value))
    row.append(option(`<span class="text-decoration-underline">ab</span>`, strings.TextWholeWordCaption, () => this.wholeWord, value => this.wholeWord = value))
    row.append(option(".*", strings.TextRegularExpressionCaption, () => this.useRegEx, value => this.useRegEx = value))

    this.#status = Utilities.element("span", "scv-search-status small text-body-secondary")
    row.append(this.#status)

    let previous = Utilities.element("button", "btn btn-sm", {type: "button", title: strings.TextFindPreviousCaption})
    previous.innerHTML = `<i class="bi bi-arrow-up"></i>`
    previous.addEventListener("click", () => this.findPrevious())
    let next = Utilities.element("button", "btn btn-sm", {type: "button", title: strings.TextFindNextCaption})
    next.innerHTML = `<i class="bi bi-arrow-down"></i>`
    next.addEventListener("click", () => this.findNext())
    let close = Utilities.element("button", "btn-close btn-sm ms-1", {type: "button", "aria-label": strings.TextDoneCaption})
    close.addEventListener("click", () => this.close())
    row.append(previous, next, close)
    panel.append(row)

    let replaceRow = Utilities.element("div", "scv-search-row scv-search-replace")
    let replace = Utilities.element("input", "form-control form-control-sm", {type: "text", placeholder: strings.TextReplaceHint, "aria-label": strings.TextReplaceHint})
    replace.addEventListener("input", () => this.replacement = replace.value)
    replace.addEventListener("keydown", event => {
      if (event.key == "Enter") {
        event.preventDefault()
        this.replace()
      } else if (event.key == "Escape") {
        event.preventDefault()
        this.close()
      }
    })
    this.#replaceInput = replace
    let replaceOne = Utilities.element("button", "btn btn-sm btn-outline-secondary", {type: "button"})
    replaceOne.textContent = strings.TextReplaceCaption
    replaceOne.addEventListener("click", () => this.replace())
    let replaceAll = Utilities.element("button", "btn btn-sm btn-outline-secondary", {type: "button"})
    replaceAll.textContent = strings.TextReplaceAllCaption
    replaceAll.addEventListener("click", () => this.replaceAll())
    replaceRow.append(replace, replaceOne, replaceAll)
    panel.append(replaceRow)

    this.#panel = panel
    this.#editor.searchContainer.append(panel)
  }

  #updateStatus() {
    if (!this.#status) return
    let strings = this.#editor.strings
    if (this.patternError.length > 0) {
      this.#status.textContent = strings.TextNoMatchesCaption
      this.#status.title = this.patternError
    } else if (this.query.length == 0) {
      this.#status.textContent = ""
    } else if (this.#results.length == 0) {
      this.#status.textContent = strings.TextNoMatchesCaption
    } else if (this.#currentIndex >= 0) {
      this.#status.textContent = Utilities.format(strings.TextMatchPositionFormat, {index: this.#currentIndex + 1, count: this.#results.length})
    } else {
      this.#status.textContent = Utilities.format(strings.TextMatchCountFormat, {count: this.#results.length})
    }
    this.dispatchEvent(new Event("changed"))
    if (this.#replaceInput) this.#replaceInput.value = this.replacement
  }
}
