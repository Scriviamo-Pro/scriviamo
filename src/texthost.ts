import {Colors, LineBreak, Node, ParagraphBreak, RichText, TextStyle, Utilities} from "./internal"

export enum TextHostModes {
  /** One paragraph. Shift+Enter adds line breaks. Paragraphs, headings, quotes, captions. */
  inline = 0,
  /** Several paragraphs separated by ParagraphBreak. Table cells and columns. */
  multiline = 1,
  /** One list item per paragraph, with listLevels and listChecked. */
  list = 2,
  /** Unstyled text such as code. */
  plain = 3
}

export interface TextSelectionRange {
  start: number
  end: number
}

interface TextSegment {
  node: globalThis.Node
  text: string
  style: TextStyle | null
  isBreak: boolean
}

/**
 * Binds a RichText to a contenteditable element. The element shows the text,
 * the browser edits it, and sync reads the edited DOM back into the RichText.
 */
export class TextHost {
  node: Node
  rich: RichText
  element: HTMLElement
  mode: TextHostModes
  placeholder: string = ""
  /** Position of this host among its node's hosts. Used to restore selections. */
  index: number = 0

  #renderedStyles: Array<TextStyle> = []

  constructor(node: Node, rich: RichText, element: HTMLElement, mode: TextHostModes = TextHostModes.inline) {
    this.node = node
    this.rich = rich
    this.element = element
    this.mode = mode
    element.classList.add("scv-text")
    element.setAttribute("spellcheck", mode == TextHostModes.plain ? "false" : "true")
    ;(element as any).scvHost = this
  }

  static from(target: globalThis.Node | null, root?: HTMLElement): TextHost | null {
    let current: globalThis.Node | null = target
    while (current && current !== root) {
      if ((current as any).scvHost) return (current as any).scvHost
      current = current.parentNode
    }
    return null
  }

  set editable(value: boolean) {
    this.element.contentEditable = value ? "true" : "false"
  }

  get editable(): boolean {
    return this.element.isContentEditable
  }

  // Rendering

  render() {
    let element = this.element
    element.textContent = ""
    this.#renderedStyles = []

    if (this.mode == TextHostModes.plain) {
      element.append(document.createTextNode(this.rich.text))
      if (this.rich.text.length == 0 || this.rich.text.endsWith(ParagraphBreak)) element.append(document.createElement("br"))
    } else if (this.mode == TextHostModes.list) {
      let paragraphs = this.rich.paragraphs()
      paragraphs.forEach((paragraph, itemIndex) => {
        let item = document.createElement("li")
        item.dataset.level = String(this.rich.listLevels[itemIndex] || 0)
        if (this.rich.listType == 2) {
          let checked = this.rich.listChecked[itemIndex] === true
          item.dataset.checked = checked ? "true" : "false"
          let widget = Utilities.element("span", "scv-widget scv-check", {contenteditable: "false"})
          let box = Utilities.element("input", "form-check-input", {type: "checkbox", tabindex: "-1"})
          box.checked = checked
          widget.append(box)
          item.append(widget)
        }
        this.#appendRuns(item, paragraph.start, paragraph.end)
        element.append(item)
      })
      this.refreshMarkers()
    } else {
      this.#appendRuns(element, 0, this.rich.text.length)
    }

    this.updateEmptyState()
  }

  #appendRuns(target: HTMLElement, start: number, end: number) {
    let runs = this.rich.runs(start, end)
    runs.forEach(run => {
      let parts = run.text.split(/([\n\u2028])/)
      parts.forEach(part => {
        if (part == ParagraphBreak) {
          let br = document.createElement("br")
          br.dataset.p = "1"
          target.append(br)
        } else if (part == LineBreak) {
          target.append(document.createElement("br"))
        } else if (part.length > 0) {
          target.append(this.#runElement(part, run.style))
        }
      })
    })
    let last = end > start ? this.rich.text[end - 1] : ""
    if (end == start || last == LineBreak || last == ParagraphBreak) target.append(document.createElement("br"))
  }

  #runElement(text: string, style: TextStyle): HTMLElement {
    let styleIndex = this.#renderedStyles.indexOf(style)
    if (styleIndex < 0) {
      this.#renderedStyles.push(style)
      styleIndex = this.#renderedStyles.length - 1
    }

    let span = document.createElement("span")
    span.dataset.s = String(styleIndex)
    let css = style.editorCSS()
    if (css.length > 0) span.setAttribute("style", css)
    let inner: HTMLElement = span
    let wrap = (tag: string) => {
      let element = document.createElement(tag)
      inner.append(element)
      inner = element
    }
    if (style.highlight) wrap("mark")
    if (style.subscript) wrap("sub")
    if (style.superscript) wrap("sup")
    if (style.keyboard) wrap("kbd")
    if (style.code) wrap("code")
    inner.append(document.createTextNode(text))

    if (style.linkURL.length > 0) {
      let link = document.createElement("a")
      link.href = style.linkURL
      if (style.linkTitle.length > 0) link.title = style.linkTitle
      link.append(span)
      return link
    }
    return span
  }

  /** Updates ordered and bulleted list markers after items were added, removed or re-leveled. */
  refreshMarkers() {
    if (this.mode != TextHostModes.list) return
    let counters: Array<number> = []
    let bullets = ["•", "◦", "▪"]
    Array.from(this.element.children).forEach((child: HTMLElement) => {
      if (child.tagName != "LI") return
      let level = Utilities.integer(child.dataset.level, 0)
      child.style.setProperty("--scv-level", String(level))
      while (counters.length <= level) counters.push(0)
      counters[level]++
      counters.length = level + 1
      if (this.rich.listType == 1) {
        let number = counters[level]
        let marker = String(number)
        if (level % 3 == 1) marker = TextHost.alphabetic(number)
        if (level % 3 == 2) marker = TextHost.roman(number)
        child.dataset.marker = `${marker}.`
      } else if (this.rich.listType == 0) {
        child.dataset.marker = bullets[level % bullets.length]
      } else {
        delete child.dataset.marker
      }
    })
  }

  static alphabetic(value: number): string {
    let result = ""
    while (value > 0) {
      value--
      result = String.fromCharCode(97 + (value % 26)) + result
      value = Math.floor(value / 26)
    }
    return result
  }

  static roman(value: number): string {
    let numerals: Array<[number, string]> = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]]
    let result = ""
    numerals.forEach(([amount, numeral]) => {
      while (value >= amount) {
        result += numeral
        value -= amount
      }
    })
    return result
  }

  updateEmptyState() {
    let empty = this.rich.text.length == 0
    this.element.classList.toggle("scv-empty", empty)
    if (this.placeholder.length > 0) {
      this.element.dataset.placeholder = this.placeholder
    } else {
      delete this.element.dataset.placeholder
    }
  }

  // Reading the DOM

  /** Reads the edited DOM into the RichText. Returns true when the text or styles changed. */
  sync(): boolean {
    let segments = this.#segments(this.element, false)
    let text = ""
    let styles: Array<TextStyle> = []
    segments.forEach(segment => {
      text += segment.text
      for (let index = 0; index < segment.text.length; index++) {
        styles.push(segment.style ? segment.style.clone() : new TextStyle())
      }
    })

    let changed = text != this.rich.text || styles.length != this.rich.styles.length || styles.some((style, index) => !style.equals(this.rich.styles[index]))

    if (this.mode == TextHostModes.list) {
      let items = Array.from(this.element.children).filter(child => child.tagName == "LI") as Array<HTMLElement>
      let levels = items.map(item => Utilities.integer(item.dataset.level, 0))
      let checked = items.map(item => item.dataset.checked == "true")
      let itemCount = text.split(ParagraphBreak).length
      while (levels.length < itemCount) levels.push(levels.length > 0 ? levels[levels.length - 1] : 0)
      while (checked.length < itemCount) checked.push(false)
      levels.length = itemCount
      checked.length = itemCount
      let previousItems = this.rich.text.split(ParagraphBreak)
      let itemTexts = text.split(ParagraphBreak)
      if (this.rich.listType == 2 && itemTexts.length == previousItems.length + 1) {
        // The browser copies a split item's checkbox to both halves. Breaking at the
        // very start of an item moves its state down with its text; elsewhere the
        // first half keeps it and the new item is unchecked.
        let split = 0
        while (split < previousItems.length && previousItems[split] == itemTexts[split]) split++
        if (split < previousItems.length) {
          let state = this.rich.listChecked[split] === true
          checked[split] = itemTexts[split].length == 0 ? false : state
          checked[split + 1] = itemTexts[split].length == 0 ? state : false
        } else {
          checked[split] = false
        }
        items.forEach((item, index) => {
          item.dataset.checked = checked[index] ? "true" : "false"
          let box = item.querySelector(".scv-check input") as HTMLInputElement | null
          if (box) box.checked = checked[index]
        })
      }
      if (levels.join(",") != this.rich.listLevels.join(",") || checked.join(",") != this.rich.listChecked.join(",")) changed = true
      this.rich.listLevels = levels
      this.rich.listChecked = this.rich.listType == 2 ? checked : []
    }

    if (this.mode == TextHostModes.plain) styles = styles.map(() => new TextStyle())

    this.rich.text = text
    this.rich.styles = styles

    // The browser may leave the list without items or put text outside them.
    if (this.mode == TextHostModes.list && Array.from(this.element.childNodes).some(child => !(child instanceof HTMLElement && child.tagName == "LI"))) {
      let selection = this.selection()
      this.render()
      if (selection) this.select(selection.start, selection.end)
    } else if (this.mode == TextHostModes.list) {
      this.refreshMarkers()
    }

    this.updateEmptyState()
    return changed
  }

  #segments(root: globalThis.Node, measuring: boolean): Array<TextSegment> {
    let result: Array<TextSegment> = []
    let styleFor = (node: globalThis.Node): TextStyle | null => this.#styleFor(node)
    let plain = this.mode == TextHostModes.plain
    let breakCharacter = this.mode == TextHostModes.inline ? LineBreak : ParagraphBreak

    let walk = (parent: globalThis.Node, scopeStart: number) => {
      parent.childNodes.forEach(child => {
        if (child.nodeType == 3) {
          // Browsers type non-breaking spaces where a plain space would collapse.
          let value = (child.nodeValue || "").replace(/\r\n?/g, "\n").replace(/ /g, " ")
          if (!plain) value = value.replace(/\n/g, breakCharacter)
          if (value.length > 0) result.push({node: child, text: value, style: plain ? null : styleFor(child), isBreak: false})
          return
        }
        if (!(child instanceof HTMLElement)) return
        if (child.classList.contains("scv-widget")) return
        if (child.tagName == "BR") {
          let character = plain ? ParagraphBreak : (child.dataset.p == "1" ? ParagraphBreak : (this.mode == TextHostModes.multiline ? ParagraphBreak : LineBreak))
          if (this.mode == TextHostModes.list) character = LineBreak
          result.push({node: child, text: character, style: plain ? null : styleFor(child.parentNode), isBreak: true})
          return
        }
        let isBlock = /^(DIV|P|LI|H[1-6]|BLOCKQUOTE|PRE)$/.test(child.tagName)
        if (isBlock && result.length > scopeStart && !result[result.length - 1].isBreak) {
          result.push({node: child, text: plain ? ParagraphBreak : breakCharacter, style: plain ? null : styleFor(child), isBreak: true})
        }
        walk(child, scopeStart)
      })
    }

    let dropPlaceholder = (scopeStart: number) => {
      if (measuring || result.length <= scopeStart) return
      let last = result[result.length - 1]
      if (last.isBreak && last.node instanceof HTMLElement && last.node.tagName == "BR") result.pop()
    }

    if (this.mode == TextHostModes.list) {
      let itemIndex = 0
      root.childNodes.forEach(child => {
        if (child instanceof HTMLElement && child.tagName == "LI") {
          if (itemIndex > 0) result.push({node: child, text: ParagraphBreak, style: null, isBreak: false})
          let scopeStart = result.length
          walk(child, scopeStart)
          dropPlaceholder(scopeStart)
          itemIndex++
        } else if (child.nodeType == 3 || child instanceof HTMLElement) {
          // Content the browser put outside an item joins the last item.
          let holder = document.createElement("div")
          holder.append(child.cloneNode(true))
          let before = result.length
          walk(holder, before)
          for (let index = before; index < result.length; index++) result[index].node = child
        }
      })
    } else {
      walk(root, 0)
      dropPlaceholder(0)
    }

    return result
  }

  #styleFor(node: globalThis.Node | null): TextStyle | null {
    let current = node
    let semantic = new TextStyle()
    let hasSemantic = false
    while (current && current !== this.element) {
      if (current instanceof HTMLElement) {
        if (current.dataset.s !== undefined) {
          let rendered = this.#renderedStyles[Utilities.integer(current.dataset.s, -1)]
          if (rendered) {
            if (!hasSemantic) return rendered
            let combined = rendered.clone()
            TextHost.mergeSemantic(combined, semantic)
            return combined
          }
        }
        if (TextHost.applyElementStyle(current, semantic)) hasSemantic = true
      }
      current = current.parentNode
    }
    return semantic
  }

  static mergeSemantic(target: TextStyle, source: TextStyle) {
    let names = ["bold", "italic", "underline", "strikethrough", "code", "keyboard", "highlight", "superscript", "subscript"]
    names.forEach(name => { if (source[name]) target[name] = true })
    if (source.linkURL.length > 0 && target.linkURL.length == 0) target.linkURL = source.linkURL
    if (source.suggestionProviderIdentifier.length > 0 && target.suggestionProviderIdentifier.length == 0) {
      target.suggestionProviderIdentifier = source.suggestionProviderIdentifier
      target.suggestionIdentifier = source.suggestionIdentifier
      target.suggestionTextColor = Colors.clone(source.suggestionTextColor)
      target.suggestionBackgroundColor = Colors.clone(source.suggestionBackgroundColor)
      target.suggestionBorderColor = Colors.clone(source.suggestionBorderColor)
    }
  }

  /** Adds the formatting an HTML element implies to style. Returns true when it added any. */
  static applyElementStyle(element: HTMLElement, style: TextStyle): boolean {
    let applied = false
    // A suggestion tag keeps its identity and colors, not ordinary text formatting.
    let provider = element.getAttribute("data-scriviamo-suggestion-provider")
    let isTag = !!provider && provider.length > 0
    if (isTag && style.suggestionProviderIdentifier.length == 0) {
      style.suggestionProviderIdentifier = provider
      style.suggestionIdentifier = element.getAttribute("data-scriviamo-suggestion-id") || ""
      let tagCSS = element.style
      let textColor = tagCSS && tagCSS.color ? Colors.fromCSS(tagCSS.color) : null
      let backgroundColor = tagCSS && tagCSS.backgroundColor ? Colors.fromCSS(tagCSS.backgroundColor) : null
      let borderColor = tagCSS && tagCSS.borderTopColor ? Colors.fromCSS(tagCSS.borderTopColor) : null
      if (textColor) style.suggestionTextColor = textColor
      if (backgroundColor) style.suggestionBackgroundColor = backgroundColor
      if (borderColor) style.suggestionBorderColor = borderColor
      applied = true
    }
    switch (element.tagName) {
      case "B": case "STRONG": style.bold = true; applied = true; break
      case "I": case "EM": case "CITE": case "DFN": case "VAR": style.italic = true; applied = true; break
      case "U": case "INS": style.underline = true; applied = true; break
      case "S": case "STRIKE": case "DEL": style.strikethrough = true; applied = true; break
      case "CODE": case "TT": case "SAMP": style.code = true; applied = true; break
      case "KBD": style.keyboard = true; applied = true; break
      case "MARK": style.highlight = true; applied = true; break
      case "SUP": style.superscript = true; applied = true; break
      case "SUB": style.subscript = true; applied = true; break
      case "A": {
        let href = element.getAttribute("href") || ""
        if (href.length > 0 && style.linkURL.length == 0) {
          style.linkURL = href
          style.linkTitle = element.getAttribute("title") || ""
          style.linkTarget = element.getAttribute("target") || ""
          applied = true
        }
        break
      }
    }

    let css = element.style
    if (!css) return applied
    let weight = css.fontWeight
    if (weight == "bold" || weight == "bolder" || Number(weight) >= 600) { style.bold = true; applied = true }
    if (css.fontStyle == "italic" || css.fontStyle == "oblique") { style.italic = true; applied = true }
    let decoration = `${css.textDecoration} ${css.textDecorationLine}`
    if (decoration.indexOf("underline") >= 0) { style.underline = true; applied = true }
    if (decoration.indexOf("line-through") >= 0) { style.strikethrough = true; applied = true }
    if (css.verticalAlign == "super") { style.superscript = true; applied = true }
    if (css.verticalAlign == "sub") { style.subscript = true; applied = true }
    if (css.color && Colors.isEmpty(style.textColor) && !isTag) {
      let color = Colors.fromCSS(css.color)
      if (color && color.alpha < 255) { style.textColor = color; applied = true }
    }
    if (css.backgroundColor && !style.hasBackgroundColor && !isTag) {
      let color = Colors.fromCSS(css.backgroundColor)
      if (color && color.alpha < 255) {
        style.hasBackgroundColor = true
        style.backgroundColor = color
        applied = true
      }
    }
    if (css.fontSize && style.fontSize == 0) {
      let size = parseFloat(css.fontSize)
      if (css.fontSize.endsWith("px") && size > 0) { style.fontSize = size; applied = true }
      if (css.fontSize.endsWith("pt") && size > 0) { style.fontSize = Math.round(size * 4 / 3); applied = true }
    }
    if (css.fontFamily && style.fontName.length == 0) {
      let family = css.fontFamily.split(",")[0].trim().replace(/^['"]|['"]$/g, "")
      if (family.length > 0 && !/^(system-ui|sans-serif|serif|-apple-system|inherit|initial)$/i.test(family)) {
        style.fontName = family
        applied = true
      }
    }
    return applied
  }

  // Selections

  /** The selection inside this host as model offsets, or null when it is elsewhere. */
  selection(): TextSelectionRange | null {
    let selection = window.getSelection()
    if (!selection || selection.rangeCount == 0) return null
    let range = selection.getRangeAt(0)
    if (!this.element.contains(range.startContainer) || !this.element.contains(range.endContainer)) return null
    let start = this.offsetOf(range.startContainer, range.startOffset)
    let end = range.collapsed ? start : this.offsetOf(range.endContainer, range.endOffset)
    return {start: Math.min(start, end), end: Math.max(start, end)}
  }

  /** Converts a DOM position inside the element to a model offset. */
  offsetOf(container: globalThis.Node, offset: number): number {
    let range = document.createRange()
    range.setStart(this.element, 0)
    try {
      range.setEnd(container, offset)
    } catch {
      return this.rich.text.length
    }
    let fragment = range.cloneContents()
    let segments = this.#segments(fragment, true)
    let total = 0
    segments.forEach(segment => total += segment.text.length)
    return Math.min(total, this.rich.text.length)
  }

  /** Converts a model offset to a DOM position inside the element. */
  positionOf(offset: number): {node: globalThis.Node, offset: number} {
    let segments = this.#segments(this.element, true)
    let position = 0
    for (let index = 0; index < segments.length; index++) {
      let segment = segments[index]
      let length = segment.text.length
      if (!segment.isBreak && segment.node.nodeType == 3) {
        if (offset <= position + length) return {node: segment.node, offset: offset - position}
      } else if (segment.node instanceof HTMLElement && segment.node.tagName == "LI") {
        // The separator before an item: offset just after it is the item's start.
        if (offset == position + length) return this.#startOf(segment.node)
      } else if (offset == position + length || offset == position) {
        let element = segment.node
        let parent = element.parentNode
        let childIndex = Array.prototype.indexOf.call(parent.childNodes, element)
        if (offset == position) return {node: parent, offset: childIndex}
        // After a break, prefer the start of following text.
        let next = segments[index + 1]
        if (next && !next.isBreak && next.node.nodeType == 3 && next.node.parentNode) return {node: next.node, offset: 0}
        return {node: parent, offset: childIndex + 1}
      }
      position += length
    }
    // Past the end.
    if (this.mode == TextHostModes.list) {
      let items = this.element.querySelectorAll(":scope > li")
      let lastItem = items[items.length - 1]
      if (lastItem) return this.#endOf(lastItem as HTMLElement)
    }
    return this.#endOf(this.element)
  }

  #startOf(element: HTMLElement): {node: globalThis.Node, offset: number} {
    let walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let first = walker.nextNode()
    if (first && !(first.parentElement && first.parentElement.closest(".scv-widget"))) return {node: first, offset: 0}
    let widgets = element.querySelectorAll(":scope > .scv-widget").length
    return {node: element, offset: widgets}
  }

  #endOf(element: HTMLElement): {node: globalThis.Node, offset: number} {
    let walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let last: globalThis.Node | null = null
    let current = walker.nextNode()
    while (current) {
      if (!(current.parentElement && current.parentElement.closest(".scv-widget"))) last = current
      current = walker.nextNode()
    }
    // A trailing break is the empty last line; the caret goes before it.
    let lastChild = element.lastChild
    if (lastChild instanceof HTMLElement && lastChild.tagName == "BR") {
      return {node: element, offset: element.childNodes.length - 1}
    }
    if (last) return {node: last, offset: (last.nodeValue || "").length}
    return {node: element, offset: element.childNodes.length}
  }

  select(start: number, end: number = start) {
    start = Utilities.clamp(start, 0, this.rich.text.length)
    end = Utilities.clamp(end, 0, this.rich.text.length)
    // Selecting text starts editing its node, which makes the text editable.
    if (this.node.editor) this.node.editor.hostActivated(this)
    if (document.activeElement !== this.element) this.element.focus({preventScroll: true})
    let selection = window.getSelection()
    if (!selection) return
    let startPosition = this.positionOf(start)
    let endPosition = end == start ? startPosition : this.positionOf(end)
    let range = document.createRange()
    try {
      range.setStart(startPosition.node, startPosition.offset)
      range.setEnd(endPosition.node, endPosition.offset)
    } catch {
      range.selectNodeContents(this.element)
      range.collapse(false)
    }
    selection.removeAllRanges()
    selection.addRange(range)
  }

  focus(atEnd: boolean = false) {
    this.select(atEnd ? this.rich.text.length : 0)
  }

  /** Bounds of the caret, used to decide whether arrow keys leave the host. */
  caretRect(): DOMRect | null {
    let selection = window.getSelection()
    if (!selection || selection.rangeCount == 0) return null
    let range = selection.getRangeAt(0).cloneRange()
    range.collapse(true)
    let rects = range.getClientRects()
    if (rects.length > 0) return rects[0]
    // Collapsed ranges in empty lines have no rectangles; measure a marker.
    let marker = document.createElement("span")
    marker.textContent = "​"
    range.insertNode(marker)
    let rect = marker.getBoundingClientRect()
    let parent = marker.parentNode
    marker.remove()
    if (parent) parent.normalize()
    return rect
  }

  isCaretOnFirstLine(): boolean {
    let caret = this.caretRect()
    if (!caret) return true
    let first = this.#lineRect(true)
    return !first || caret.top < first.top + Math.max(4, first.height / 2)
  }

  isCaretOnLastLine(): boolean {
    let caret = this.caretRect()
    if (!caret) return true
    let last = this.#lineRect(false)
    return !last || caret.bottom > last.bottom - Math.max(4, last.height / 2)
  }

  #lineRect(first: boolean): DOMRect | null {
    let range = document.createRange()
    range.selectNodeContents(this.element)
    let rects = Array.from(range.getClientRects()).filter(rect => rect.height > 0)
    if (rects.length == 0) return this.element.getBoundingClientRect()
    return first ? rects[0] : rects[rects.length - 1]
  }
}
