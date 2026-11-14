import {BlockShortcut, Colors, DocumentColor, Editor, HTMLImporter, InspectorDefaults, InspectorEditors, InspectorItem, InspectorSection, Node, Stylesheet, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem, Utilities} from "../internal"

/** A horizontal rule. */
export class DividerNode extends Node {
  static exportStyles(sheet: Stylesheet, _editor: Editor | null) {
    sheet.addRule("hr", "border: none")
  }

  static identifier: string = "divider"
  static caption: string = "Divider"
  static icon: string = "bi bi-hr"
  static keywords: string = "rule line separator hr"
  static markdownShortcuts: Array<BlockShortcut> = [{pattern: /^---$/, insertsBlock: true}]

  static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined {
    return element.tagName == "HR" ? importer.attach(new DividerNode()) : undefined
  }

  readImportedStyle(style: CSSStyleDeclaration) {
    // Exported dividers draw the line with height and background-color. Other
    // sources often use border-top, which was read as a node border, so take it
    // back as the line.
    let height = style.height.trim().toLowerCase()
    if (height.length > 0) {
      let thickness = height.indexOf("%") < 0 ? parseFloat(height) : 0
      if (thickness > 0) this.lineThickness = thickness
      let color = Colors.fromCSS(style.backgroundColor) || Colors.fromCSS(style.color)
      if (color) this.lineColor = Colors.equals(color, Colors.fromCSS(DividerNode.defaultLineCSS)) ? Colors.empty : color
    } else if (this.borderTop.visible) {
      this.lineThickness = this.borderTop.size
      this.lineColor = Colors.clone(this.borderTop.color)
      this.borderTop = Node.defaultBorder()
    }
  }

  inspectorSections(): Array<InspectorSection> {
    let strings = this.strings
    let thickness = InspectorItem.number("linethickness", strings.TextLineThicknessCaption, target => target.lineThickness, (target, value) => target.lineThickness = value, 0, 100, 1)
    thickness.setDefaultValue(1)
    let color = new InspectorItem("linecolor", strings.TextLineColorCaption, "lineColor", InspectorEditors.color)
    color.setDefaultValue(Colors.empty)
    return [InspectorDefaults.section("divider", strings.TextDividerCaption, [thickness, color])].concat(InspectorDefaults.node(this))
  }

  lineThickness: number = 1
  /** The line color. The empty color uses the theme's border color. */
  lineColor: DocumentColor = Colors.empty

  protected build(body: HTMLElement) {
    let line = Utilities.element("div", "scv-divider", {role: "separator"})
    line.style.height = `${Math.max(1, this.lineThickness)}px`
    if (!Colors.isEmpty(this.lineColor)) line.style.backgroundColor = Colors.toCSS(this.lineColor)
    body.append(line)
  }

  actions(): Array<ToolbarItem> {
    let item = new ToolbarItem("thickness", `${this.lineThickness}px`, "bi bi-border-width", ToolbarItemKinds.menu)
    item.alwaysShowCaption = true
    ;[1, 2, 3, 4, 6, 8].forEach(value => {
      let menuItem = new ToolbarMenuItem(String(value), `${value}px`)
      menuItem.checked = value == this.lineThickness
      item.menuItems.push(menuItem)
    })
    let color = new ToolbarItem("linecolor", this.strings.TextTextColorCaption, "bi bi-palette", ToolbarItemKinds.color)
    return [item, color]
  }

  performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean {
    if (item.identifier == "thickness" && menuItem) {
      this.willChange()
      this.lineThickness = Number(menuItem.identifier)
    } else if (item.identifier == "linecolor" && menuItem) {
      this.willChange()
      this.lineColor = menuItem.value ? Colors.clone(menuItem.value) : Colors.empty
    } else {
      return false
    }
    this.refresh()
    this.changed()
    return true
  }

  toJSON(): object {
    let result = super.toJSON()
    if (this.lineThickness != 1) result["lineThickness"] = this.lineThickness
    if (!Colors.isEmpty(this.lineColor)) result["lineColor"] = Colors.toJSON(this.lineColor)
    return result
  }

  fromJSON(data: any): boolean {
    if (!super.fromJSON(data)) return false
    this.lineThickness = Math.max(0, Utilities.number(data.lineThickness, 1))
    this.lineColor = Colors.fromJSON(data.lineColor, Colors.empty)
    return true
  }

  /** The line color exported for a divider without its own color. */
  static defaultLineCSS: string = "#d0d7de"

  toHTML(): string {
    let color = Colors.isEmpty(this.lineColor) ? DividerNode.defaultLineCSS : Colors.toCSS(this.lineColor)
    return `<hr style="border:none;height:${this.lineThickness}px;background-color:${color};${this.htmlBackgroundCSS()}">`
  }

  toMarkdown(): string {
    if (this.lineThickness == 1 && Colors.isEmpty(this.lineColor) && this.backgroundImage.isEmpty && !(this.borderTop.visible || this.borderRight.visible || this.borderBottom.visible || this.borderLeft.visible)) return "---"
    return this.toHTML()
  }

  toPlainText(): string {
    return "---"
  }
}
