import {Editor, HTMLImporter, InspectorDefaults, InspectorItem, InspectorSection, Node, RichText, Strings, Stylesheet, TableNode, TextNode, ThemeColors, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem, Utilities} from "scriviamo"

/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
const StepsStrings = {
  TextStepsCaption: "Steps",
  TextTimelineCaption: "Timeline",
  TextStepsStyleCaption: "Style",
  TextAddStepCaption: "Add Step",
  TextRemoveStepCaption: "Remove Step",
  TextMoveStepUpCaption: "Move Step Up",
  TextMoveStepDownCaption: "Move Step Down",
  TextStepLabelPlaceholder: "Date or label",
  TextStepCaption: "Step"
}

type StepsStringsTable = typeof StepsStrings

declare module "scriviamo" {
  interface Strings extends StepsStringsTable {}
}

Strings.register(StepsStrings)

/** How a steps block draws: numbered steps, or a timeline with a date or label on each entry. */
export enum StepsStyles {
  numbered = 0,
  timeline = 1
}

/**
 * A numbered procedure or a timeline: a list of steps, each holding text and blocks. On a
 * timeline, each entry also has a label, such as a date. Each step is a cell of a one-column
 * table, so steps hold blocks the same way table cells and columns do.
 */
export class StepsNode extends TableNode {
  static exportStyles(sheet: Stylesheet, editor: Editor | null) {
    let accent = Editor.themeCSS(editor, ThemeColors.primary)
    let line = Editor.themeCSS(editor, ThemeColors.primary, 180)
    sheet.addRule(".steps, .timeline", "list-style: none; margin: 0; padding: 0")
    sheet.addRule(".steps", "counter-reset: step")
    sheet.addRule(".steps > .step, .timeline > .step", "position: relative; padding: 0 0 16px 48px; min-height: 32px")
    sheet.addRule(".steps > .step::before", `counter-increment: step; content: counter(step); position: absolute; left: 0; top: 0; width: 32px; height: 32px; border-radius: 50%; background: ${accent}; color: #fff; font-weight: 600; text-align: center; line-height: 32px`)
    sheet.addRule(".steps > .step:not(:last-child)::after, .timeline > .step:not(:last-child)::after", `content: ""; position: absolute; left: 15px; top: 36px; bottom: 4px; width: 2px; background: ${line}`)
    sheet.addRule(".timeline > .step::before", `content: ""; position: absolute; left: 9px; top: 6px; width: 14px; height: 14px; border-radius: 50%; border: 3px solid ${accent}; background: #fff`)
    sheet.addRule(".timeline .step-label", `margin: 0 0 4px; font-weight: 600; color: ${accent}`)
  }

  static identifier: string = "steps"
  static caption: string = "Steps"
  static icon: string = "bi bi-list-ol"
  static keywords: string = "steps procedure how-to instructions timeline history milestones roadmap"
  /** Ahead of the list node, which would otherwise read these lists as plain ones. */
  static importPriority: number = 10

  static create(editor: Editor): Node {
    let result = new StepsNode(3)
    result.editor = editor
    return result
  }

  static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined {
    if (element.tagName != "OL" || !(element.classList.contains("steps") || element.classList.contains("timeline"))) return undefined
    let items = Array.from(element.children).filter(child => child.tagName == "LI") as Array<HTMLElement>
    if (items.length == 0) return undefined
    let node = new StepsNode(items.length)
    node.stepsStyle = element.classList.contains("timeline") ? StepsStyles.timeline : StepsStyles.numbered
    importer.attach(node)
    items.forEach((item, index) => {
      let copy = item.cloneNode(true) as HTMLElement
      let label = copy.querySelector(":scope > .step-label")
      if (label) {
        node.labels[index] = (label.textContent || "").trim()
        label.remove()
      }
      let children = importer.importChildren(copy)
      let cell = node.cells[index]
      if (children.length > 0 && children[0] instanceof TextNode && children[0].constructor === TextNode) {
        cell.append((children.shift() as TextNode).content)
      }
      cell.nodes = children
    })
    return node
  }

  stepsStyle: StepsStyles = StepsStyles.numbered
  /** Each step's label, shown on a timeline, such as a date. */
  labels: Array<string> = []

  constructor(steps: number = 3) {
    super(steps, 1)
    this.ensureLabels()
  }

  /** The number of steps. */
  get count(): number {
    return this.rows
  }

  ensureLabels() {
    while (this.labels.length < this.rows) this.labels.push("")
    this.labels.length = this.rows
  }

  get typeName(): string {
    return this.stepsStyle == StepsStyles.timeline ? this.strings.TextTimelineCaption : this.strings.TextStepsCaption
  }

  inspectorSections(): Array<InspectorSection> {
    let strings = this.strings
    let style = InspectorItem.menu("stepsstyle", strings.TextStepsStyleCaption, [[strings.TextStepsCaption, StepsStyles.numbered], [strings.TextTimelineCaption, StepsStyles.timeline]], (target: StepsNode) => target.stepsStyle, (target: StepsNode, value) => target.stepsStyle = value == StepsStyles.timeline ? StepsStyles.timeline : StepsStyles.numbered)
    style.setDefaultValue(StepsStyles.numbered)
    return [InspectorDefaults.section("steps", this.typeName, [style])].concat(InspectorDefaults.cellSections(this, strings.TextStepCaption), InspectorDefaults.node(this))
  }

  protected build(body: HTMLElement) {
    this.ensureCells()
    this.ensureLabels()
    this.hostCells = []
    let timeline = this.stepsStyle == StepsStyles.timeline
    let list = Utilities.element("ol", `scv-steps${timeline ? " scv-steps-timeline" : ""}`)
    list.style.textAlign = TextNode.cssAlignment(this.resolvedTextAlignment())
    for (let index = 0; index < this.rows; index++) {
      let item = Utilities.element("li", "scv-step")
      item.dataset.cell = String(index)
      let marker = Utilities.element("span", "scv-step-marker", {contenteditable: "false", "aria-hidden": "true"})
      if (!timeline) marker.textContent = String(index + 1)
      item.append(marker)
      let content = Utilities.element("div", "scv-step-body")
      if (timeline) content.append(this.#labelField(index))
      this.applyCellAppearance(content, this.cells[index])
      this.buildCell(content, this.cells[index], index)
      item.append(content)
      list.append(item)
    }
    body.append(list)
  }

  /** The editable label of a timeline entry. */
  #labelField(index: number): HTMLElement {
    let wrapper = Utilities.element("div", "scv-step-label", {contenteditable: "false"})
    let input = Utilities.element("input", "scv-step-label-input", {type: "text", placeholder: this.strings.TextStepLabelPlaceholder, "aria-label": this.strings.TextStepLabelPlaceholder}) as HTMLInputElement
    input.value = this.labels[index] || ""
    input.readOnly = !!(this.editor && this.editor.readOnly)
    input.addEventListener("change", () => {
      if (input.value == this.labels[index]) return
      this.willChange()
      this.labels[index] = input.value
      this.changed()
    })
    input.addEventListener("keydown", event => {
      // Enter moves into the entry's text, as the next field to type in.
      if (event.key != "Enter") return
      event.preventDefault()
      input.dispatchEvent(new Event("change"))
      this.focusCell(index)
    })
    wrapper.append(input)
    return wrapper
  }

  /** Adds an empty step before step at. */
  insertRow(at: number) {
    at = Utilities.clamp(at, 0, this.rows)
    this.willChange()
    this.ensureLabels()
    this.cells.splice(at, 0, new RichText())
    this.labels.splice(at, 0, "")
    this.rows++
    this.refresh()
    this.changed()
  }

  /** Removes a step, with its label and blocks. The last step stays. */
  removeRow(row: number) {
    if (this.rows <= 1) return
    row = Utilities.clamp(row, 0, this.rows - 1)
    this.willChange()
    this.ensureLabels()
    this.cells.splice(row, 1)
    this.labels.splice(row, 1)
    this.rows--
    this.activeCell = Utilities.clamp(this.activeCell, 0, this.cells.length - 1)
    this.refresh()
    this.changed()
  }

  /** Moves a step up or down, with its label. */
  moveStep(index: number, by: number) {
    let target = index + by
    if (index < 0 || index >= this.rows || target < 0 || target >= this.rows) return
    this.willChange()
    this.ensureLabels()
    let [cell] = this.cells.splice(index, 1)
    this.cells.splice(target, 0, cell)
    let [label] = this.labels.splice(index, 1)
    this.labels.splice(target, 0, label)
    this.activeCell = target
    this.refresh()
    this.changed()
    this.focusCell(target)
  }

  actions(): Array<ToolbarItem> {
    let strings = this.strings
    let style = new ToolbarItem("stepsstyle", this.typeName, this.stepsStyle == StepsStyles.timeline ? "bi bi-clock-history" : "bi bi-list-ol", ToolbarItemKinds.menu, strings.TextStepsStyleCaption)
    style.alwaysShowCaption = true
    let numbered = new ToolbarMenuItem(String(StepsStyles.numbered), strings.TextStepsCaption, "bi bi-list-ol")
    numbered.checked = this.stepsStyle == StepsStyles.numbered
    let timeline = new ToolbarMenuItem(String(StepsStyles.timeline), strings.TextTimelineCaption, "bi bi-clock-history")
    timeline.checked = this.stepsStyle == StepsStyles.timeline
    style.menuItems.push(numbered, timeline)
    let current = this.currentCellIndex()
    let add = new ToolbarItem("addstep", strings.TextAddStepCaption, "bi bi-plus-square")
    let remove = new ToolbarItem("removestep", strings.TextRemoveStepCaption, "bi bi-dash-square")
    remove.enabled = this.rows > 1
    let up = new ToolbarItem("moveup", strings.TextMoveStepUpCaption, "bi bi-arrow-up")
    up.enabled = current > 0
    let down = new ToolbarItem("movedown", strings.TextMoveStepDownCaption, "bi bi-arrow-down")
    down.enabled = current < this.rows - 1
    let fill = new ToolbarItem("cellcolor", strings.TextBackgroundColorCaption, "bi bi-paint-bucket", ToolbarItemKinds.color)
    return [style, add, remove, up, down, fill]
  }

  performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean {
    let current = this.currentCellIndex()
    switch (item.identifier) {
      case "stepsstyle":
        if (!menuItem) return true
        this.willChange()
        this.stepsStyle = Number(menuItem.identifier) == StepsStyles.timeline ? StepsStyles.timeline : StepsStyles.numbered
        this.refresh()
        this.changed()
        return true
      case "addstep":
        this.insertRow(current + 1)
        this.focusCell(current + 1)
        return true
      case "removestep":
        this.removeRow(current)
        this.focusCell(Math.min(current, this.rows - 1))
        return true
      case "moveup":
        this.moveStep(current, -1)
        return true
      case "movedown":
        this.moveStep(current, 1)
        return true
      case "cellcolor":
        return super.performAction(item, menuItem)
    }
    return false
  }

  toJSON(): object {
    this.ensureLabels()
    let result = super.toJSON()
    result["stepsStyle"] = this.stepsStyle
    if (this.labels.some(label => label.length > 0)) result["labels"] = this.labels.slice()
    return result
  }

  fromJSON(data: any): boolean {
    if (!super.fromJSON(data)) return false
    this.columns = 1
    this.ensureCells()
    this.stepsStyle = Utilities.integer(data.stepsStyle, 0) == StepsStyles.timeline ? StepsStyles.timeline : StepsStyles.numbered
    this.labels = Array.isArray(data.labels) ? data.labels.map(label => Utilities.string(label)) : []
    this.ensureLabels()
    return true
  }

  toHTML(): string {
    this.ensureLabels()
    let timeline = this.stepsStyle == StepsStyles.timeline
    let result = `<ol class="${timeline ? "timeline" : "steps"}" style="${this.htmlBackgroundCSS()}text-align:${TextNode.cssAlignment(this.resolvedTextAlignment())}">`
    for (let index = 0; index < this.rows; index++) {
      let cell = this.cells[index]
      let label = timeline && this.labels[index].length > 0 ? `<p class="step-label">${Utilities.escapeText(this.labels[index])}</p>` : ""
      result += `<li class="step" style="${Utilities.escapeAttribute(this.cellHTMLStyle(cell))}">${label}${this.cellContentHTML(cell)}</li>`
    }
    return result + "</ol>"
  }

  /** A numbered list, with each step's blocks indented under it; a timeline's labels lead in bold. */
  toMarkdown(): string {
    this.ensureLabels()
    let timeline = this.stepsStyle == StepsStyles.timeline
    return this.cells.map((cell, index) => {
      let marker = timeline ? "- " : `${index + 1}. `
      let indent = " ".repeat(marker.length)
      let parts: Array<string> = []
      if (timeline && this.labels[index].length > 0) parts.push(`**${this.labels[index]}**`)
      let text = cell.markdownText()
      if (text.length > 0) parts.push(text)
      cell.nodes.forEach(child => {
        let markdown = child.toMarkdown()
        if (markdown.length > 0) parts.push(markdown)
      })
      let body = parts.join("\n\n").split("\n").map((line, lineIndex) => lineIndex == 0 || line.length == 0 ? line : indent + line).join("\n")
      return marker + body
    }).join("\n")
  }

  toPlainText(): string {
    this.ensureLabels()
    let timeline = this.stepsStyle == StepsStyles.timeline
    return this.cells.map((cell, index) => {
      let parts = [cell.text.replace(/\u2028/g, "\n")]
      cell.nodes.forEach(child => parts.push(child.toPlainText()))
      let body = parts.filter(part => part.length > 0).join("\n")
      let lead = timeline ? (this.labels[index].length > 0 ? `${this.labels[index]}: ` : "") : `${index + 1}. `
      return lead + body
    }).join("\n")
  }
}

Editor.registerNodeType(StepsNode, 85)

