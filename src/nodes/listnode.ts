import {BlockShortcut, Editor, EditorExtension, HTMLImporter, InspectorDefaults, InspectorItem, InspectorSection, LineBreak, Node, ParagraphBreak, RichText, Strings, Stylesheet, TextHost, TextHostModes, TextNode, TextSelectionRange, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem, Utilities} from "../internal"

export enum ListTypes {
  unordered = 0,
  ordered = 1,
  checklist = 2
}

/** A bulleted, numbered or checklist list. Items are paragraphs of one RichText, each with a nesting level. */
export class ListNode extends TextNode {
  static exportStyles(sheet: Stylesheet, editor: Editor | null) {
    super.exportStyles(sheet, editor)
    sheet.addRule("ul.checklist", "list-style: none; padding-inline-start: 1.25em")
    sheet.addRule("ul.checklist input", "margin-inline-end: 6px")
  }

  static identifier: string = "list"
  static caption: string = "List"
  static icon: string = "bi bi-list-ul"
  static keywords: string = "bullet bulleted numbered ordered checklist todo task"
  static maximumLevel: number = 8

  static markdownShortcuts: Array<BlockShortcut> = [
    {pattern: /^[-*+] /, value: () => ListTypes.unordered},
    {pattern: /^\d+[.)] /, value: () => ListTypes.ordered},
    {pattern: /^\[[ xX]?\] /, value: () => ListTypes.checklist, finish: (node, match) => {
      if (!(node instanceof ListNode) || !/^\[[xX]\]/.test(match[0])) return
      node.content.listChecked = [true]
      node.refresh()
      node.primaryHost?.select(0)
    }}
  ]

  static blockKinds(strings: Strings, _compact: boolean): Array<[string, string, string]> {
    return [
      ["list:0", strings.TextBulletedListCaption, "bi bi-list-ul"],
      ["list:1", strings.TextNumberedListCaption, "bi bi-list-ol"],
      ["list:2", strings.TextChecklistCaption, "bi bi-ui-checks"]
    ]
  }

  static fromBlockContent(content: RichText, value: number, source: TextNode): Array<Node> {
    let list = new ListNode("", value)
    list.content = content
    list.content.text = list.content.text.replace(/\n/g, LineBreak)
    list.content.listType = value
    list.content.listLevels = [0]
    source.copyAppearanceTo(list)
    return [list]
  }

  static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined {
    if (element.tagName != "UL" && element.tagName != "OL") return undefined
    let checklist = element.classList.contains("checklist") || element.classList.contains("contains-task-list") || !!element.querySelector(":scope > li > input[type=checkbox]")
    let type = checklist ? ListTypes.checklist : (element.tagName == "OL" ? ListTypes.ordered : ListTypes.unordered)
    let node = new ListNode("", type)
    let content = new RichText()
    content.listType = type
    let levels: Array<number> = []
    let checked: Array<boolean> = []
    let addItems = (list: HTMLElement, level: number) => {
      Array.from(list.children).forEach(child => {
        if (child.tagName != "LI") return
        let item = child as HTMLElement
        let box = item.querySelector(":scope > input[type=checkbox], :scope > p > input[type=checkbox]") as HTMLInputElement
        let nested = Array.from(item.children).filter(grandchild => grandchild.tagName == "UL" || grandchild.tagName == "OL") as Array<HTMLElement>
        let inlineNodes = Array.from(item.childNodes).filter(grandchild => nested.indexOf(grandchild as HTMLElement) < 0 && grandchild !== box)
        let rich = importer.trimmed(importer.richText(inlineNodes))
        if (levels.length > 0) content.insert(content.length, ParagraphBreak)
        content.append(rich)
        levels.push(level)
        checked.push(box ? box.checked || box.hasAttribute("checked") : false)
        nested.forEach(sublist => addItems(sublist, level + 1))
      })
    }
    addItems(element, 0)
    if (levels.length == 0) levels.push(0)
    content.listLevels = levels
    content.listChecked = type == ListTypes.checklist ? checked : []
    node.content = content
    return importer.attach(node)
  }


  static create(editor: Editor): Node {
    let result = new ListNode("", ListTypes.unordered)
    result.editor = editor
    return result
  }

  constructor(text: string = "", type: ListTypes = ListTypes.unordered) {
    super(text)
    this.content.listType = type
    let count = text.split(ParagraphBreak).length
    this.content.listLevels = new Array(count).fill(0)
  }

  get blockKind(): string {
    return `list:${this.listType}`
  }

  get joinsForward(): boolean {
    return false
  }

  get becomesTextOnBackspace(): boolean {
    return false
  }

  get keepsParagraphs(): boolean {
    return true
  }

  prepareReplacementContent(replacement: RichText, paragraphs: number) {
    while (replacement.listLevels.length < paragraphs) replacement.listLevels.push(0)
    replacement.listLevels.length = paragraphs
  }

  /** Changes the list's type, or splits it into one block per item for any other kind; a list's own type turns it into paragraphs. */
  convertBlock(kind: string, value: number): Array<Node> | null {
    if (kind == "list" && this.listType != value) {
      this.listType = value
      this.content.listLevels.length = Math.min(this.content.listLevels.length, this.itemCount)
      return [this]
    }
    let result: Array<Node> = []
    this.content.paragraphs().forEach(paragraph => {
      let item = new TextNode()
      item.content = this.content.slice(paragraph.start, paragraph.end)
      if (kind == "list" || !this.editor) result.push(item)
      else result.push(...this.editor.convertTextBlock(item, kind, value))
    })
    return result
  }

  inspectorSections(): Array<InspectorSection> {
    let strings = this.strings
    let type = InspectorItem.menu("listtype", strings.TextTypeCaption, [[strings.TextBulletedListCaption, ListTypes.unordered], [strings.TextNumberedListCaption, ListTypes.ordered], [strings.TextChecklistCaption, ListTypes.checklist]], target => target.listType, (target, value) => target.listType = value)
    type.setDefaultValue(ListTypes.unordered)
    return [InspectorDefaults.section("list", strings.TextListInspectorCaption, [type])].concat(InspectorDefaults.text(this))
  }

  get listType(): ListTypes {
    return Utilities.clamp(this.content.listType, 0, 2)
  }

  set listType(value: ListTypes) {
    this.content.listType = Utilities.clamp(value, 0, 2)
    if (value != ListTypes.checklist) this.content.listChecked = []
  }

  get itemCount(): number {
    return this.content.text.split(ParagraphBreak).length
  }

  levelAt(item: number): number {
    return this.content.listLevels[item] || 0
  }

  protected get tagName(): string {
    return this.listType == ListTypes.ordered ? "ol" : "ul"
  }

  protected get hostMode(): TextHostModes {
    return TextHostModes.list
  }

  protected get placeholderText(): string {
    return this.strings.TextDefaultListItemCaption
  }

  protected build(body: HTMLElement) {
    super.build(body)
    let host = this.primaryHost
    host.element.classList.add("scv-list", `scv-list-${["unordered", "ordered", "checklist"][this.listType]}`)
  }

  #normalizeItems() {
    let count = this.itemCount
    let levels = this.content.listLevels
    while (levels.length < count) levels.push(levels.length > 0 ? levels[levels.length - 1] : 0)
    levels.length = count
    if (this.listType == ListTypes.checklist) {
      let checked = this.content.listChecked
      while (checked.length < count) checked.push(false)
      checked.length = count
    }
  }

  #rerender(start: number, end: number = start) {
    let host = this.primaryHost
    if (!host) return
    host.render()
    host.select(start, end)
    this.changed()
  }

  handleKeyDown(event: KeyboardEvent, host: TextHost | null): boolean {
    if (!host || host !== this.primaryHost || !this.editor) return false
    let selection = host.selection()
    if (!selection) return false

    if (event.key == "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
      event.preventDefault()
      this.willChange()
      this.#normalizeItems()
      if (selection.end > selection.start) this.#removeRange(selection.start, selection.end)
      let start = selection.start
      let item = this.content.paragraphIndexAt(start)
      let paragraph = this.content.paragraphs()[item]
      if (paragraph.start == paragraph.end) {
        if (this.levelAt(item) > 0) {
          this.content.listLevels[item]--
          this.#rerender(start)
        } else {
          this.#exitAt(item)
        }
        return true
      }
      let style = this.content.insertionStyleAt(start)
      this.content.insert(start, ParagraphBreak, style)
      this.content.listLevels.splice(item + 1, 0, this.levelAt(item))
      // Breaking at the very start of an item moves its text, and so its
      // checked state, down. Elsewhere the item keeps its state.
      if (this.listType == ListTypes.checklist) this.content.listChecked.splice(start == paragraph.start ? item : item + 1, 0, false)
      this.#rerender(start + 1)
      return true
    }

    if (event.key == "Tab" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault()
      this.willChange()
      this.#normalizeItems()
      this.#changeLevels(selection, event.shiftKey ? -1 : 1)
      return true
    }

    if (event.key == "Backspace" && selection.start == selection.end && !event.altKey && !event.metaKey) {
      let item = this.content.paragraphIndexAt(selection.start)
      let paragraph = this.content.paragraphs()[item]
      if (selection.start != paragraph.start) return false
      event.preventDefault()
      this.willChange()
      this.#normalizeItems()
      if (this.levelAt(item) > 0) {
        this.content.listLevels[item]--
        this.#rerender(selection.start)
      } else if (item > 0) {
        // Joining onto an empty item leaves this item's text, so it keeps its state.
        let previousEmpty = this.content.paragraphs()[item - 1].start == paragraph.start - 1
        this.content.remove(selection.start - 1, selection.start)
        this.content.listLevels.splice(item, 1)
        if (this.listType == ListTypes.checklist) this.content.listChecked.splice(previousEmpty ? item - 1 : item, 1)
        this.#rerender(selection.start - 1)
      } else {
        this.#exitAt(0)
      }
      return true
    }

    return false
  }

  #removeRange(start: number, end: number) {
    let firstItem = this.content.paragraphIndexAt(start)
    let lastItem = this.content.paragraphIndexAt(end)
    // Removing from the very start of an item leaves the last item's text, so it keeps its state.
    let atItemStart = this.content.paragraphs()[firstItem].start == start
    this.content.remove(start, end)
    if (lastItem > firstItem) {
      this.content.listLevels.splice(firstItem + 1, lastItem - firstItem)
      if (this.listType == ListTypes.checklist) this.content.listChecked.splice(atItemStart ? firstItem : firstItem + 1, lastItem - firstItem)
    }
  }

  #changeLevels(selection: TextSelectionRange, delta: number) {
    let first = this.content.paragraphIndexAt(selection.start)
    let last = this.content.paragraphIndexAt(selection.end)
    for (let item = first; item <= last; item++) {
      let maximum = item == 0 ? 0 : Math.min(ListNode.maximumLevel, this.levelAt(item - 1) + 1)
      this.content.listLevels[item] = Utilities.clamp(this.levelAt(item) + delta, 0, Math.max(maximum, delta < 0 ? 0 : this.levelAt(item)))
    }
    this.#rerender(selection.start, selection.end)
  }

  /** Indents (1) or outdents (-1) the items in the current selection. */
  changeLevel(delta: number) {
    let host = this.primaryHost
    if (!host) return
    let selection = host.selection() || {start: 0, end: 0}
    this.willChange()
    this.#normalizeItems()
    this.#changeLevels(selection, delta)
  }

  /**
   * Turns item into a paragraph: the items before it stay in this list, the
   * paragraph follows, and the items after it move to a new list.
   */
  #exitAt(item: number) {
    let editor = this.editor
    let paragraphs = this.content.paragraphs()
    let current = paragraphs[item]
    let paragraph = new TextNode()
    paragraph.content = this.content.slice(current.start, current.end)

    let after: ListNode | null = null
    if (item < paragraphs.length - 1) {
      after = new ListNode("", this.listType)
      after.content = this.content.slice(paragraphs[item + 1].start)
      after.content.listType = this.listType
      after.content.listLevels = this.content.listLevels.slice(item + 1)
      let minimum = Math.min(...after.content.listLevels)
      after.content.listLevels = after.content.listLevels.map(level => level - minimum)
      if (this.listType == ListTypes.checklist) after.content.listChecked = this.content.listChecked.slice(item + 1)
    }

    let replacements: Array<Node> = []
    if (item > 0) {
      this.content.remove(paragraphs[item - 1].end, this.content.length)
      this.content.listLevels.length = item
      if (this.listType == ListTypes.checklist) this.content.listChecked.length = item
      replacements.push(this)
    }
    replacements.push(paragraph)
    if (after) replacements.push(after)

    editor.replaceNode(this, replacements)
    editor.focusNode(paragraph, 0)
  }

  /** Whether a checklist item is checked. */
  isChecked(item: number): boolean {
    return this.listType == ListTypes.checklist && !!this.content.listChecked[item]
  }

  /** Checks or unchecks a checklist item, as one undo step. Returns whether it changed. */
  setChecked(item: number, checked: boolean): boolean {
    if (this.listType != ListTypes.checklist || item < 0 || item >= this.itemCount || this.isChecked(item) == checked) return false
    if (this.editor) {
      this.editor.history.breakCoalescing()
      this.editor.history.checkpoint()
    }
    this.willChange()
    this.#normalizeItems()
    this.content.listChecked[item] = checked
    let host = this.primaryHost
    if (host && host.element) host.render()
    this.changed()
    if (this.editor) this.editor.history.breakCoalescing()
    return true
  }

  handleClick(event: MouseEvent): boolean {
    let target = event.target as HTMLElement
    if (!(target instanceof HTMLInputElement) || !target.closest(".scv-check")) return false
    let item = target.closest("li") as HTMLElement
    let host = this.primaryHost
    if (!item || !host) return false
    if (this.editor && this.editor.readOnly) {
      event.preventDefault()
      return true
    }
    let index = Array.from(host.element.children).indexOf(item)
    this.willChange()
    this.#normalizeItems()
    this.content.listChecked[index] = target.checked
    item.dataset.checked = target.checked ? "true" : "false"
    this.changed()
    return true
  }

  actions(): Array<ToolbarItem> {
    let strings = this.strings
    let type = new ToolbarItem("listtype", strings.TextListInspectorCaption, ["bi bi-list-ul", "bi bi-list-ol", "bi bi-ui-checks"][this.listType], ToolbarItemKinds.menu)
    let captions = [strings.TextBulletedListCaption, strings.TextNumberedListCaption, strings.TextChecklistCaption]
    let icons = ["bi bi-list-ul", "bi bi-list-ol", "bi bi-ui-checks"]
    for (let value = 0; value <= 2; value++) {
      let menuItem = new ToolbarMenuItem(String(value), captions[value], icons[value])
      menuItem.checked = value == this.listType
      type.menuItems.push(menuItem)
    }
    return [
      type,
      new ToolbarItem("outdent", strings.TextOutdentCaption, "bi bi-text-indent-right"),
      new ToolbarItem("indent", strings.TextIndentCaption, "bi bi-text-indent-left")
    ]
  }

  performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean {
    switch (item.identifier) {
      case "listtype":
        if (!menuItem) return false
        this.willChange()
        this.listType = Number(menuItem.identifier)
        this.#normalizeItems()
        this.refresh()
        this.changed()
        return true
      case "indent":
        this.changeLevel(1)
        return true
      case "outdent":
        this.changeLevel(-1)
        return true
    }
    return false
  }

  toHTML(): string {
    let tag = this.listType == ListTypes.ordered ? "ol" : "ul"
    let classAttribute = this.listType == ListTypes.checklist ? ` class="checklist"` : ""
    let result = `<${tag}${classAttribute} style="${this.htmlBackgroundCSS()}${this.htmlTextAlignmentCSS()}">`
    let currentLevel = 0
    this.content.paragraphs().forEach((paragraph, item) => {
      let level = Math.max(0, this.levelAt(item))
      if (item == 0) {
        result += "<li>"
      } else if (level > currentLevel) {
        while (currentLevel < level) {
          result += `<${tag}${classAttribute}><li>`
          currentLevel++
        }
      } else {
        result += "</li>"
        while (currentLevel > level) {
          result += `</${tag}></li>`
          currentLevel--
        }
        result += "<li>"
      }
      if (this.listType == ListTypes.checklist) result += `<input type="checkbox" disabled${this.content.listChecked[item] ? " checked" : ""}> `
      result += this.content.htmlText(paragraph.start, paragraph.end)
    })
    result += "</li>"
    while (currentLevel > 0) {
      result += `</${tag}></li>`
      currentLevel--
    }
    return result + `</${tag}>`
  }

  toMarkdown(): string {
    let lines: Array<string> = []
    let counters: Array<number> = []
    this.content.paragraphs().forEach((paragraph, item) => {
      let level = Math.max(0, this.levelAt(item))
      while (counters.length <= level) counters.push(0)
      counters[level]++
      counters.length = level + 1
      let indentation = "  ".repeat(level)
      let marker = this.listType == ListTypes.ordered ? `${counters[level]}. ` : "- "
      if (this.listType == ListTypes.checklist) marker = this.content.listChecked[item] ? "- [x] " : "- [ ] "
      let content = this.content.markdownText(paragraph.start, paragraph.end).replace(/\n/g, `\n${indentation}  `)
      lines.push(indentation + marker + content)
    })
    return this.markdownWithBackground(lines.join("\n"))
  }

  /** The items' text, one per line, without markers. */
  toPlainText(): string {
    return this.content.text.replace(/\u2028/g, "\n")
  }
}

/** The list buttons, indent and outdent, and their keyboard shortcuts. */
export const ListExtension: EditorExtension = {
  toolbarIdentifiers: ["list:0", "list:1", "list:2", "outdent", "indent"],
  defaultToolbarIdentifiers: ["list:0", "list:1", "list:2", "outdent", "indent"],
  defaultToolbarAfter: "linespacing",

  makeToolbarItem(editor: Editor, identifier: string): ToolbarItem | null {
    let strings = editor.strings
    switch (identifier) {
      case "list:0": return new ToolbarItem(identifier, strings.TextBulletedListCaption, "bi bi-list-ul", ToolbarItemKinds.toggle)
      case "list:1": return new ToolbarItem(identifier, strings.TextNumberedListCaption, "bi bi-list-ol", ToolbarItemKinds.toggle)
      case "list:2": return new ToolbarItem(identifier, strings.TextChecklistCaption, "bi bi-ui-checks", ToolbarItemKinds.toggle)
      case "outdent": return new ToolbarItem(identifier, strings.TextOutdentCaption, "bi bi-text-indent-right")
      case "indent": return new ToolbarItem(identifier, strings.TextIndentCaption, "bi bi-text-indent-left")
    }
    return null
  },

  activateToolbarItem(editor: Editor, identifier: string): boolean {
    if (identifier.startsWith("list:")) {
      editor.setBlockType("list", Number(identifier.substring(5)))
      return true
    }
    if (identifier == "indent" || identifier == "outdent") {
      let node = editor.activeHost ? editor.activeHost.node : editor.selectedNode
      if (node instanceof ListNode) node.changeLevel(identifier == "indent" ? 1 : -1)
      return true
    }
    return false
  },

  updateToolbarState(editor: Editor, set: (identifier: string, enabled: boolean, active?: boolean) => void) {
    let node = editor.activeHost ? editor.activeHost.node : editor.selectedNode
    let textNode = node instanceof TextNode && node.isTextBlock
    ;[0, 1, 2].forEach(type => set(`list:${type}`, !editor.readOnly && textNode, node instanceof ListNode && node.listType == type))
    set("indent", !editor.readOnly && node instanceof ListNode)
    set("outdent", !editor.readOnly && node instanceof ListNode)
  },

  handleCommandKey(editor: Editor, event: KeyboardEvent): boolean {
    if (!editor.nodeTypes.item("list")) return false
    let types: {[code: string]: ListTypes} = {Digit7: ListTypes.ordered, Digit8: ListTypes.unordered, Digit9: ListTypes.checklist}
    if (event.shiftKey && event.code in types) {
      editor.setBlockType("list", types[event.code])
      return true
    }
    let key = event.key.toLowerCase()
    if (key == "]" || key == "[") {
      let node = editor.activeHost ? editor.activeHost.node : editor.selectedNode
      if (node instanceof ListNode) {
        node.changeLevel(key == "]" ? 1 : -1)
        return true
      }
    }
    return false
  }
}
