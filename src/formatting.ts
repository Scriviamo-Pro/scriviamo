import {Alignments, Colors, DocumentColor, Editor, Node, TableNode, TextHost, TextHostModes, TextNode, TextStyle} from "./internal"

export enum FormattingStyles {
  bold = 0,
  italic = 1,
  underline = 2,
  strikethrough = 3,
  code = 4,
  highlight = 5,
  keyboard = 6,
  superscript = 7,
  subscript = 8
}

interface FormattingTarget {
  host: TextHost
  start: number
  end: number
}

/** Character formatting commands for the selected text, or for all the text of the selected nodes. */
export class Formatting {
  #editor: Editor

  static readonly propertyNames: Array<string> = ["bold", "italic", "underline", "strikethrough", "code", "highlight", "keyboard", "superscript", "subscript"]

  constructor(editor: Editor) {
    this.#editor = editor
  }

  get owner(): Editor {
    return this.#editor
  }

  /** The ranges a formatting command applies to. */
  #targets(): Array<FormattingTarget> {
    let host = this.#editor.activeHost
    if (host) {
      let selection = host.selection()
      if (selection) return [{host: host, start: selection.start, end: selection.end}]
    }
    let result: Array<FormattingTarget> = []
    this.#editor.selectedNodes().forEach(node => {
      node.hosts().forEach(nodeHost => {
        if (nodeHost.mode != TextHostModes.plain) result.push({host: nodeHost, start: 0, end: nodeHost.rich.length})
      })
    })
    return result
  }

  /** The style at the caret, or of the first selected character. */
  currentStyle(): TextStyle {
    let pending = this.#editor.pendingStyle()
    if (pending) return pending
    let targets = this.#targets()
    if (targets.length == 0) return new TextStyle()
    let target = targets[0]
    if (target.start == target.end) {
      let host = target.host
      if (host.rich.length == 0 && host.node instanceof TextNode) return host.node.baseStyle()
      return host.rich.insertionStyleAt(target.start)
    }
    return target.host.rich.styleAt(target.start)
  }

  canApply(style?: FormattingStyles): boolean {
    if (this.#editor.readOnly) return false
    if (style !== undefined && !this.#editor.activeFontOptions().allows(Formatting.propertyNames[style])) return false
    let targets = this.#targets()
    return targets.length > 0 && targets.every(target => target.host.mode != TextHostModes.plain)
  }

  isApplied(style: FormattingStyles): boolean {
    let name = Formatting.propertyNames[style]
    let pending = this.#editor.pendingStyle()
    if (pending) return pending[name] === true
    let targets = this.#targets()
    if (targets.length == 0) return false
    let ranged = targets.filter(target => target.end > target.start)
    if (ranged.length == 0) return this.currentStyle()[name] === true
    return ranged.every(target => target.host.rich.everyStyle(target.start, target.end, item => item[name] === true))
  }

  toggle(style: FormattingStyles) {
    if (!this.canApply(style)) return
    let name = Formatting.propertyNames[style]
    let value = !this.isApplied(style)
    this.apply(item => {
      item[name] = value
      if (value && style == FormattingStyles.superscript) item.subscript = false
      if (value && style == FormattingStyles.subscript) item.superscript = false
    })
  }

  /**
   * Calls change for the style of every character in the targets, then shows
   * the result. With only a caret, the change applies to the next typed text.
   */
  apply(change: (style: TextStyle) => void) {
    if (this.#editor.readOnly) return
    let targets = this.#targets()
    if (targets.length == 0) return
    if (targets.length == 1 && targets[0].start == targets[0].end) {
      let target = targets[0]
      let style = this.currentStyle().clone()
      change(style)
      this.#editor.setPendingStyle(target.host, target.start, style)
      this.#editor.updateToolbarState()
      return
    }
    this.#editor.history.checkpoint()
    let focused = this.#editor.activeHost
    let focusedRange = focused ? focused.selection() : null
    let changedNodes: Array<Node> = []
    targets.forEach(target => {
      target.host.rich.applyStyle(target.start, target.end, change)
      target.host.render()
      target.host.node.textChanged(target.host)
      if (changedNodes.indexOf(target.host.node) < 0) changedNodes.push(target.host.node)
    })
    if (focused && focusedRange) focused.select(focusedRange.start, focusedRange.end)
    changedNodes.forEach(node => node.changed())
    this.#editor.updateToolbarState()
  }

  setTextColor(color: DocumentColor | null) {
    this.apply(style => style.textColor = color ? Colors.clone(color) : Colors.empty)
  }

  setBackgroundColor(color: DocumentColor | null) {
    this.apply(style => {
      style.hasBackgroundColor = color !== null
      if (color) {
        style.backgroundColor = Colors.clone(color)
        style.highlight = false
      }
    })
  }

  /** Sets the font family. An empty name follows the document font. */
  setFontName(name: string) {
    this.apply(style => style.fontName = name)
  }

  /** Sets the font size in points. Zero follows the document size. */
  setFontSize(size: number) {
    this.apply(style => style.fontSize = Math.max(0, size))
  }

  get canClearFormatting(): boolean {
    return this.canApply()
  }

  /** Removes character formatting, keeping links. */
  clearFormatting() {
    this.apply(style => {
      let link = [style.linkURL, style.linkTitle, style.linkTarget]
      let suggestion = [style.suggestionProviderIdentifier, style.suggestionIdentifier]
      Object.assign(style, new TextStyle())
      ;[style.linkURL, style.linkTitle, style.linkTarget] = link
      ;[style.suggestionProviderIdentifier, style.suggestionIdentifier] = suggestion
    })
  }

  // Alignment

  get canAlign(): boolean {
    return !this.#editor.readOnly && (this.#editor.activeHost !== null || this.#editor.selectedNodes().length > 0)
  }

  /** The alignment of the text being edited, or of the selected node. */
  get alignment(): Alignments {
    let host = this.#editor.activeHost
    let node = host ? host.node : this.#editor.selectedNode
    if (!node) return this.#editor.textAlignment
    if (host && node instanceof TableNode) {
      let cell = node.cells[node.cellIndexOf(host)]
      if (cell && cell.textAlignment != Alignments.automatic) return cell.textAlignment
      return node.resolvedTextAlignment()
    }
    if (node instanceof TextNode) return node.resolvedTextAlignment()
    if (node instanceof TableNode) return node.resolvedTextAlignment()
    return node.resolvedAlignment()
  }

  /** Aligns the text being edited, or the selected nodes. Text aligns within its block; other nodes align on the page. */
  align(value: Alignments) {
    if (!this.canAlign) return
    this.#editor.history.checkpoint()
    let host = this.#editor.activeHost
    let selection = host ? host.selection() : null
    let nodes = host ? [host.node] : this.#editor.selectedNodes()
    nodes.forEach(node => {
      if (host && node instanceof TableNode) {
        let cell = node.cells[node.cellIndexOf(host)]
        if (cell) cell.textAlignment = value
      } else if (node instanceof TextNode) {
        node.textAlignment = value
      } else if (node instanceof TableNode) {
        node.textAlignment = value
      } else {
        node.alignment = value
      }
      node.refresh()
      node.changed()
    })
    if (host && selection) {
      let refreshed = host.node.hosts()[host.index]
      if (refreshed) refreshed.select(selection.start, selection.end)
    }
    this.#editor.updateToolbarState()
  }

  // Links

  get canEditLink(): boolean {
    let host = this.#linkHost()
    return !this.#editor.readOnly && host !== null && host.mode != TextHostModes.plain
  }

  /** The text being edited, or the text of the one selected node, which a link then covers whole. */
  #linkHost(): TextHost | null {
    let host = this.#editor.activeHost
    if (host) return host
    let nodes = this.#editor.selectedNodes()
    if (nodes.length != 1 || nodes[0].locked) return null
    let primary = nodes[0].primaryHost
    return primary && primary.rich.length > 0 ? primary : null
  }

  /** The extent of the link around the caret, or null. */
  #linkRange(host: TextHost, offset: number): {start: number, end: number} | null {
    let rich = host.rich
    let style = rich.styleAt(offset > 0 && (offset == rich.length || rich.styleAt(offset).linkURL.length == 0) ? offset - 1 : offset)
    if (rich.length == 0 || style.linkURL.length == 0) return null
    let url = style.linkURL
    let start = offset
    let end = offset
    while (start > 0 && rich.styleAt(start - 1).linkURL == url) start--
    while (end < rich.length && rich.styleAt(end).linkURL == url) end++
    return start < end ? {start: start, end: end} : null
  }

  /** Shows the link dialog for the selection, adding, changing or removing its link. */
  async editLink() {
    if (!this.canEditLink) return
    let host = this.#linkHost()
    let editing = host === this.#editor.activeHost
    let selection = editing ? host.selection() : {start: 0, end: host.rich.length}
    if (!selection) return
    let range = selection.start == selection.end ? this.#linkRange(host, selection.start) : selection
    let style = range ? host.rich.styleAt(range.start) : new TextStyle()
    let strings = this.#editor.strings
    let values = await this.#editor.prompt(strings.TextHyperlinkCaption, [
      {name: "url", label: strings.TextHyperlinkDialogPrompt, value: style.linkURL, type: "url", placeholder: "https://"},
      {name: "title", label: strings.TextLinkTitleCaption, value: style.linkTitle},
      {name: "newWindow", label: strings.TextLinkTargetCaption, value: style.linkTarget == "_blank", type: "checkbox"}
    ])
    if (!values) {
      if (editing) host.select(selection.start, selection.end)
      return
    }
    let url = String(values.url).trim()
    this.#editor.history.checkpoint()
    if (!range) {
      if (url.length == 0) {
        host.select(selection.start, selection.end)
        return
      }
      let insertStyle = host.rich.insertionStyleAt(selection.start)
      host.rich.insert(selection.start, url, insertStyle)
      range = {start: selection.start, end: selection.start + url.length}
    }
    host.rich.applyStyle(range.start, range.end, item => {
      item.linkURL = url
      item.linkTitle = url.length > 0 ? String(values.title) : ""
      item.linkTarget = url.length > 0 && values.newWindow ? "_blank" : ""
    })
    host.render()
    if (editing) host.select(range.end)
    host.node.textChanged(host)
    host.node.changed()
  }

  removeLink() {
    let host = this.#editor.activeHost
    if (!host) return
    let selection = host.selection()
    if (!selection) return
    let range = selection.start == selection.end ? this.#linkRange(host, selection.start) : selection
    if (!range) return
    this.#editor.history.checkpoint()
    host.rich.applyStyle(range.start, range.end, item => {
      item.linkURL = ""
      item.linkTitle = ""
      item.linkTarget = ""
    })
    host.render()
    host.select(selection.start, selection.end)
    host.node.changed()
  }
}
