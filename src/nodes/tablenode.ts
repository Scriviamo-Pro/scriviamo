import {Alignments, CellBorder, Colors, Editor, InspectorDefaults, InspectorEditors, InspectorItem, InspectorSection, Node, RichText, Stylesheet, TextHost, TextHostModes, TextNode, TextStyle, ThemeColors, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem, Utilities} from "../internal"

export enum VerticalAlignments {
  top = 0,
  middle = 1,
  bottom = 2
}

/**
 * A grid of cells. Each cell is a RichText holding the cell's text, its
 * appearance, its spans and the blocks embedded in it. Cells are stored
 * row-major: cell (row, column) is cells[row * columns + column].
 */
export class TableNode extends Node {
  static exportStyles(sheet: Stylesheet, editor: Editor | null) {
    sheet.addRule("table", "width: 100%; border-collapse: collapse; table-layout: fixed")
    sheet.addRule("th, td", "padding: 10px; vertical-align: top; overflow-wrap: anywhere")
    sheet.addRule("th", `background: ${Editor.themeCSS(editor, ThemeColors.surface)}; font-weight: 700`)
  }

  static identifier: string = "table"
  static caption: string = "Table"
  static icon: string = "bi bi-table"
  static keywords: string = "grid spreadsheet rows columns cells"

  static create(editor: Editor): Node {
    return TableNode.withSize(editor, 3, 3)
  }

  /** A new table with a header row, as the Insert menu and the table tool make them. */
  static withSize(editor: Editor, rows: number, columns: number): TableNode {
    rows = Math.max(1, Math.floor(rows))
    columns = Math.max(1, Math.floor(columns))
    let result = new TableNode(rows, columns)
    result.editor = editor
    result.hasHeader = rows > 1
    for (let column = 0; column < columns; column++) {
      let heading = result.hasHeader
      result.cell(0, column).insert(0, heading ? Utilities.format(editor.strings.TextDefaultTableHeadingFormat, {number: column + 1}) : editor.strings.TextDefaultTableCellText, heading ? TableNode.headerStyle() : new TextStyle())
    }
    for (let index = columns; index < result.cells.length; index++) result.cells[index].insert(0, editor.strings.TextDefaultTableCellText, new TextStyle())
    return result
  }

  static headerStyle(): TextStyle {
    let result = new TextStyle()
    result.bold = true
    return result
  }

  rows: number = 1
  columns: number = 1
  cells: Array<RichText> = []
  hasHeader: boolean = false
  hasFooter: boolean = false
  /** The flat index of the cell that last had the caret. */
  activeCell: number = 0
  textAlignment: Alignments = Alignments.automatic

  /** Host index → cell index, for the cells drawn in the last render. */
  protected hostCells: Array<number> = []

  constructor(rows: number = 3, columns: number = 3) {
    super()
    this.rows = Math.max(1, rows)
    this.columns = Math.max(1, columns)
    this.ensureCells()
  }

  childLists(): Array<Array<Node>> {
    return this.cells.map(cell => cell.nodes)
  }

  ensureCells() {
    let count = this.rows * this.columns
    while (this.cells.length < count) this.cells.push(new RichText())
    this.cells.length = count
  }

  protected undrawnTexts(): Array<RichText> {
    return this.cells.slice()
  }

  cell(row: number, column: number): RichText {
    return this.cells[row * this.columns + column]
  }

  /** For each cell, the index of the cell whose span covers it, or its own index. */
  coverage(): Array<number> {
    let result: Array<number> = this.cells.map((_cell, index) => index)
    for (let row = 0; row < this.rows; row++) {
      for (let column = 0; column < this.columns; column++) {
        let index = row * this.columns + column
        if (result[index] != index) continue
        let cell = this.cells[index]
        let rowSpan = Math.min(cell.rowSpan, this.rows - row)
        let columnSpan = Math.min(cell.columnSpan, this.columns - column)
        for (let r = row; r < row + rowSpan; r++) {
          for (let c = column; c < column + columnSpan; c++) {
            let covered = r * this.columns + c
            if (covered != index) result[covered] = index
          }
        }
      }
    }
    return result
  }

  /** The cell index of a host, or of the cell with the caret. */
  cellIndexOf(host: TextHost | null): number {
    if (!host || host.node !== this) return this.activeCell
    let index = this.hostCells[host.index]
    return index === undefined ? this.activeCell : index
  }

  insertionPoint(host: TextHost): {list: Array<Node>, index: number} | null {
    let cell = this.cells[this.cellIndexOf(host)]
    return cell ? {list: cell.nodes, index: cell.nodes.length} : null
  }

  get inspectorFollowsCaret(): boolean {
    return true
  }

  noteCaretHost(host: TextHost) {
    this.activeCell = this.cellIndexOf(host)
  }

  inspectorSections(): Array<InspectorSection> {
    let strings = this.strings
    let header = new InspectorItem("hasheader", strings.TextHeaderCaption, "hasHeader", InspectorEditors.toggle)
    let footer = new InspectorItem("hasfooter", strings.TextFooterCaption, "hasFooter", InspectorEditors.toggle)
    header.setDefaultValue(false)
    footer.setDefaultValue(false)
    let alignment = InspectorItem.menu("textalignment", strings.TextTextAlignmentInspectorCaption, InspectorDefaults.alignmentChoices(strings, true), target => target.textAlignment, (target, value) => target.textAlignment = value)
    alignment.setDefaultValue(Alignments.automatic)
    return [InspectorDefaults.section("table", strings.TextTableCaption, [header, footer, alignment])].concat(InspectorDefaults.cellSections(this, strings.TextActiveCellCaption), InspectorDefaults.node(this))
  }

  currentCellIndex(): number {
    if (this.editor) {
      let host = this.editor.activeHost
      if (host && host.node === this) return this.cellIndexOf(host)
    }
    return Utilities.clamp(this.activeCell, 0, this.cells.length - 1)
  }

  protected build(body: HTMLElement) {
    this.ensureCells()
    this.hostCells = []
    let table = Utilities.element("table", "scv-table")
    table.style.textAlign = TextNode.cssAlignment(this.resolvedTextAlignment())
    let coverage = this.coverage()
    let sections: Array<[string, number, number]> = []
    let bodyStart = this.hasHeader ? 1 : 0
    let bodyEnd = this.rows - (this.hasFooter && this.rows > bodyStart ? 1 : 0)
    if (this.hasHeader) sections.push(["thead", 0, 1])
    if (bodyEnd > bodyStart) sections.push(["tbody", bodyStart, bodyEnd])
    if (this.hasFooter && this.rows > bodyStart) sections.push(["tfoot", this.rows - 1, this.rows])

    sections.forEach(([tag, start, end]) => {
      let section = document.createElement(tag)
      for (let row = start; row < end; row++) {
        let tableRow = document.createElement("tr")
        for (let column = 0; column < this.columns; column++) {
          let index = row * this.columns + column
          if (coverage[index] != index) continue
          let cell = this.cells[index]
          let element = document.createElement(tag == "thead" ? "th" : "td")
          element.dataset.cell = String(index)
          let rowSpan = Math.min(cell.rowSpan, this.rows - row)
          let columnSpan = Math.min(cell.columnSpan, this.columns - column)
          if (rowSpan > 1) element.rowSpan = rowSpan
          if (columnSpan > 1) element.colSpan = columnSpan
          this.applyCellAppearance(element, cell)
          this.buildCell(element, cell, index)
          tableRow.append(element)
        }
        section.append(tableRow)
      }
      table.append(section)
    })
    body.append(table)
  }

  protected buildCell(element: HTMLElement, cell: RichText, index: number) {
    let text = Utilities.element("div", "scv-cell-text")
    element.append(text)
    let host = this.addHost(new TextHost(this, cell, text, TextHostModes.multiline))
    this.hostCells[host.index] = index
    host.render()
    let children = Utilities.element("div", "scv-cell-children scv-children")
    element.append(children)
    if (this.editor) this.editor.mountChildren(cell.nodes, children, this)
  }

  resolvedTextAlignment(): Alignments {
    if (this.textAlignment != Alignments.automatic) return this.textAlignment
    return this.editor ? this.editor.textAlignment : Alignments.leading
  }

  protected applyCellAppearance(element: HTMLElement, cell: RichText) {
    if (cell.textAlignment != Alignments.automatic) element.style.textAlign = TextNode.cssAlignment(cell.textAlignment)
    element.style.verticalAlign = ["top", "middle", "bottom"][Utilities.clamp(cell.verticalAlignment, 0, 2)]
    if (cell.hasCellBackgroundColor) element.style.backgroundColor = Colors.toCSS(cell.cellBackgroundColor)
    let sides: Array<[string, CellBorder]> = [["Top", cell.cellBorderTop], ["Right", cell.cellBorderRight], ["Bottom", cell.cellBorderBottom], ["Left", cell.cellBorderLeft]]
    sides.forEach(([side, border]) => {
      if (border.visible && border.size > 0) {
        element.style[`border${side}`] = `${border.size}px solid ${Colors.isEmpty(border.color) ? "var(--bs-border-color)" : Colors.toCSS(border.color)}`
        element.classList.add("scv-cell-bordered")
      }
    })
    if (!cell.backgroundImage.isEmpty) element.setAttribute("style", (element.getAttribute("style") || "") + ";" + cell.backgroundImage.toCSS())
  }

  /** Moves the caret to a cell. */
  focusCell(index: number, atEnd: boolean = false) {
    let hostIndex = this.hostCells.indexOf(index)
    let host = this.hosts()[hostIndex]
    if (host) host.focus(atEnd)
    this.activeCell = index
  }

  handleKeyDown(event: KeyboardEvent, host: TextHost | null): boolean {
    if (!host || host.node !== this) return false
    let cellIndex = this.cellIndexOf(host)
    this.activeCell = cellIndex

    if (event.key == "Tab" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault()
      let hostIndex = host.index + (event.shiftKey ? -1 : 1)
      if (hostIndex >= this.hosts().length && !event.shiftKey) {
        if (this.editor && this.editor.readOnly) return true
        this.insertRow(this.rows)
        this.focusCell((this.rows - 1) * this.columns)
        return true
      }
      let next = this.hosts()[Utilities.clamp(hostIndex, 0, this.hosts().length - 1)]
      if (next) next.select(0, next.rich.length)
      return true
    }

    if ((event.key == "ArrowUp" || event.key == "ArrowDown") && !event.shiftKey && !event.altKey && !event.metaKey && !event.ctrlKey) {
      let up = event.key == "ArrowUp"
      if (up ? !host.isCaretOnFirstLine() : !host.isCaretOnLastLine()) return false
      let row = Math.floor(cellIndex / this.columns)
      let column = cellIndex % this.columns
      let anchor = this.cells[cellIndex]
      let targetRow = up ? row - 1 : row + anchor.rowSpan
      if (targetRow < 0 || targetRow >= this.rows) return false
      event.preventDefault()
      let target = this.coverage()[targetRow * this.columns + column]
      this.focusCell(target, up)
      return true
    }
    return false
  }

  // Structure

  /**
   * A new cell with a template cell's text style, alignment, fill and borders.
   * Links and suggestion tags are not copied.
   */
  #cellLike(value: string, template: RichText | null, bold: boolean): RichText {
    let result = new RichText()
    let style = template && template.styles.length > 0 ? template.styles[0].clone() : new TextStyle()
    style.linkURL = ""
    style.linkTitle = ""
    style.linkTarget = ""
    style.hasLinkColor = false
    style.suggestionIdentifier = ""
    style.suggestionProviderIdentifier = ""
    if (bold) style.bold = true
    if (template) {
      result.copyStateFrom(template)
      result.rowSpan = 1
      result.columnSpan = 1
    }
    result.insert(0, value, style)
    return result
  }

  /** Adds a row before row at. Its cells take their formatting from the body row above it. */
  insertRow(at: number) {
    at = Utilities.clamp(at, 0, this.rows)
    this.willChange()
    let coverage = this.coverage()
    let templateRow = at - 1
    let usesTemplate = templateRow >= 0 && !(this.hasHeader && templateRow == 0)
    let added: Array<RichText> = []
    for (let column = 0; column < this.columns; column++) {
      let template = usesTemplate ? this.cells[coverage[templateRow * this.columns + column]] : null
      added.push(this.#cellLike(this.strings.TextDefaultTableCellText, template, false))
    }
    // A span crossing the new row grows to cover it.
    if (at > 0 && at < this.rows) {
      for (let column = 0; column < this.columns; column++) {
        let above = coverage[at * this.columns + column]
        let anchorRow = Math.floor(above / this.columns)
        if (above != at * this.columns + column && anchorRow < at) {
          let anchor = this.cells[above]
          if (above % this.columns == column) anchor.rowSpan++
        }
      }
    }
    this.cells.splice(at * this.columns, 0, ...added)
    this.rows++
    this.refresh()
    this.changed()
  }

  removeRow(row: number) {
    if (this.rows <= 1) return
    row = Utilities.clamp(row, 0, this.rows - 1)
    this.willChange()
    let coverage = this.coverage()
    for (let column = 0; column < this.columns; column++) {
      let index = row * this.columns + column
      let anchorIndex = coverage[index]
      let anchor = this.cells[anchorIndex]
      if (anchorIndex % this.columns != column) continue
      if (anchorIndex == index && anchor.rowSpan > 1 && row + 1 < this.rows) {
        // The cell below takes over the span and the content.
        let below = this.cells[index + this.columns]
        below.copyStateFrom(anchor)
        below.text = anchor.text
        below.styles = anchor.styles
        below.nodes = anchor.nodes
        below.rowSpan = anchor.rowSpan - 1
      } else if (anchorIndex != index && Math.floor(anchorIndex / this.columns) < row) {
        anchor.rowSpan = Math.max(1, anchor.rowSpan - 1)
      }
    }
    this.cells.splice(row * this.columns, this.columns)
    this.rows--
    this.activeCell = Utilities.clamp(this.activeCell, 0, this.cells.length - 1)
    this.refresh()
    this.changed()
  }

  insertColumn(at: number) {
    at = Utilities.clamp(at, 0, this.columns)
    this.willChange()
    let coverage = this.coverage()
    let result: Array<RichText> = []
    for (let row = 0; row < this.rows; row++) {
      for (let column = 0; column <= this.columns; column++) {
        if (column == at) {
          // Each new cell takes its formatting from the cell before it in the same row,
          // so header and footer cells match the rest of their row.
          let header = this.hasHeader && row == 0
          let neighbour = at > 0 ? coverage[row * this.columns + at - 1] : (this.columns > 0 ? coverage[row * this.columns] : -1)
          let template = neighbour >= 0 ? this.cells[neighbour] : null
          let value = header ? Utilities.format(this.strings.TextDefaultTableHeadingFormat, {number: at + 1}) : this.strings.TextDefaultTableCellText
          result.push(this.#cellLike(value, template, header))
        }
        if (column < this.columns) result.push(this.cells[row * this.columns + column])
      }
      if (at > 0 && at < this.columns) {
        let left = coverage[row * this.columns + at]
        if (left != row * this.columns + at && Math.floor(left / this.columns) == row && left % this.columns < at) this.cells[left].columnSpan++
      }
    }
    this.cells = result
    this.columns++
    this.refresh()
    this.changed()
  }

  removeColumn(column: number) {
    if (this.columns <= 1) return
    column = Utilities.clamp(column, 0, this.columns - 1)
    this.willChange()
    let coverage = this.coverage()
    for (let row = 0; row < this.rows; row++) {
      let index = row * this.columns + column
      let anchorIndex = coverage[index]
      let anchor = this.cells[anchorIndex]
      if (Math.floor(anchorIndex / this.columns) != row) continue
      if (anchorIndex == index && anchor.columnSpan > 1 && column + 1 < this.columns) {
        let right = this.cells[index + 1]
        right.copyStateFrom(anchor)
        right.text = anchor.text
        right.styles = anchor.styles
        right.nodes = anchor.nodes
        right.columnSpan = anchor.columnSpan - 1
      } else if (anchorIndex != index && anchorIndex % this.columns < column) {
        anchor.columnSpan = Math.max(1, anchor.columnSpan - 1)
      }
    }
    let result: Array<RichText> = []
    this.cells.forEach((cell, index) => { if (index % this.columns != column) result.push(cell) })
    this.cells = result
    this.columns--
    this.activeCell = Utilities.clamp(this.activeCell, 0, this.cells.length - 1)
    this.refresh()
    this.changed()
  }

  /** Merges a cell with the cell to its right or below, moving that cell's content into it. */
  mergeCell(index: number, down: boolean) {
    let coverage = this.coverage()
    let cell = this.cells[index]
    let row = Math.floor(index / this.columns)
    let column = index % this.columns
    let targetRow = down ? row + cell.rowSpan : row
    let targetColumn = down ? column : column + cell.columnSpan
    if (targetRow >= this.rows || targetColumn >= this.columns) return
    let target = this.cells[targetRow * this.columns + targetColumn]
    let targetIndex = targetRow * this.columns + targetColumn
    if (coverage[targetIndex] != targetIndex) return
    if (down ? target.columnSpan != cell.columnSpan : target.rowSpan != cell.rowSpan) return
    this.willChange()
    TableNode.#appendCellContent(cell, target)
    if (down) {
      cell.rowSpan += target.rowSpan
    } else {
      cell.columnSpan += target.columnSpan
    }
    let replacement = new RichText()
    this.cells[targetIndex] = replacement
    this.refresh()
    this.changed()
  }

  /** Merged text follows the target's, separated by a space that takes the target's last style without its link. */
  static #appendCellContent(target: RichText, source: RichText) {
    if (source.text.length > 0) {
      if (target.text.length > 0) {
        let separator = target.styles.length > 0 ? target.styles[target.styles.length - 1].clone() : new TextStyle()
        separator.linkURL = ""
        separator.linkTitle = ""
        separator.linkTarget = ""
        target.insert(target.length, " ", separator)
      }
      target.append(source)
    }
    target.nodes.push(...source.nodes)
    source.nodes = []
  }

  /**
   * Merges the rectangle of cells starting at row and column into its top-left cell.
   * The other cells' content follows in reading order. Returns false when the
   * rectangle is outside the table or cuts through a merged cell.
   */
  mergeCells(row: number, column: number, rowCount: number, columnCount: number): boolean {
    if (rowCount < 1 || columnCount < 1 || row < 0 || column < 0 || row + rowCount > this.rows || column + columnCount > this.columns) return false
    if (rowCount == 1 && columnCount == 1) return false
    let coverage = this.coverage()
    let inside = (index: number) => {
      let r = Math.floor(index / this.columns)
      let c = index % this.columns
      return r >= row && r < row + rowCount && c >= column && c < column + columnCount
    }
    for (let r = row; r < row + rowCount; r++) {
      for (let c = column; c < column + columnCount; c++) {
        let owner = coverage[r * this.columns + c]
        if (!inside(owner)) return false
        let cell = this.cells[owner]
        if (!inside(owner + (cell.rowSpan - 1) * this.columns + cell.columnSpan - 1) || (owner % this.columns) + cell.columnSpan > column + columnCount) return false
      }
    }
    this.willChange()
    let mergedIndex = row * this.columns + column
    let merged = this.cells[mergedIndex]
    for (let r = row; r < row + rowCount; r++) {
      for (let c = column; c < column + columnCount; c++) {
        let index = r * this.columns + c
        if (index == mergedIndex || coverage[index] != index) continue
        TableNode.#appendCellContent(merged, this.cells[index])
        this.cells[index] = new RichText()
      }
    }
    merged.rowSpan = rowCount
    merged.columnSpan = columnCount
    this.activeCell = mergedIndex
    this.refresh()
    this.changed()
    return true
  }

  splitCell(index: number) {
    let cell = this.cells[index]
    if (cell.rowSpan == 1 && cell.columnSpan == 1) return
    this.willChange()
    cell.rowSpan = 1
    cell.columnSpan = 1
    this.refresh()
    this.changed()
  }

  actions(): Array<ToolbarItem> {
    let strings = this.strings
    let index = this.currentCellIndex()
    let cell = this.cells[index] || new RichText()
    let row = new ToolbarItem("row", strings.TextAddRowCaption, "bi bi-distribute-vertical", ToolbarItemKinds.menu)
    row.menuItems.push(new ToolbarMenuItem("above", strings.TextInsertRowAboveCaption, "bi bi-arrow-bar-up"))
    row.menuItems.push(new ToolbarMenuItem("below", strings.TextInsertRowBelowCaption, "bi bi-arrow-bar-down"))
    row.menuItems.push(ToolbarMenuItem.separator())
    let removeRow = new ToolbarMenuItem("remove", strings.TextRemoveRowCaption, "bi bi-trash")
    removeRow.enabled = this.rows > 1
    row.menuItems.push(removeRow)

    let column = new ToolbarItem("column", strings.TextAddColumnCaption, "bi bi-distribute-horizontal", ToolbarItemKinds.menu)
    column.menuItems.push(new ToolbarMenuItem("before", strings.TextInsertColumnBeforeCaption, "bi bi-arrow-bar-left"))
    column.menuItems.push(new ToolbarMenuItem("after", strings.TextInsertColumnAfterCaption, "bi bi-arrow-bar-right"))
    column.menuItems.push(ToolbarMenuItem.separator())
    let removeColumn = new ToolbarMenuItem("remove", strings.TextRemoveColumnCaption, "bi bi-trash")
    removeColumn.enabled = this.columns > 1
    column.menuItems.push(removeColumn)

    let merge = new ToolbarItem("merge", strings.TextMergeCellsCaption, "bi bi-union", ToolbarItemKinds.menu)
    merge.menuItems.push(new ToolbarMenuItem("right", `${strings.TextMergeCellsCaption} →`, "bi bi-arrow-right"))
    merge.menuItems.push(new ToolbarMenuItem("down", `${strings.TextMergeCellsCaption} ↓`, "bi bi-arrow-down"))
    let split = new ToolbarMenuItem("split", strings.TextSplitCellCaption, "bi bi-layout-split")
    split.enabled = cell.rowSpan > 1 || cell.columnSpan > 1
    merge.menuItems.push(split)

    let header = new ToolbarItem("header", strings.TextHeaderCaption, "bi bi-layout-text-window", ToolbarItemKinds.toggle)
    header.active = this.hasHeader
    let footer = new ToolbarItem("footer", strings.TextFooterCaption, "bi bi-layout-text-window-reverse", ToolbarItemKinds.toggle)
    footer.active = this.hasFooter

    let fill = new ToolbarItem("cellcolor", strings.TextBackgroundColorCaption, "bi bi-paint-bucket", ToolbarItemKinds.color)
    return [row, column, merge, header, footer, fill]
  }

  performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean {
    let index = this.currentCellIndex()
    let row = Math.floor(index / this.columns)
    let column = index % this.columns
    let cell = this.cells[index]
    switch (item.identifier) {
      case "row":
        if (!menuItem) return false
        if (menuItem.identifier == "above") this.insertRow(row)
        if (menuItem.identifier == "below") this.insertRow(row + cell.rowSpan)
        if (menuItem.identifier == "remove") this.removeRow(row)
        return true
      case "column":
        if (!menuItem) return false
        if (menuItem.identifier == "before") this.insertColumn(column)
        if (menuItem.identifier == "after") this.insertColumn(column + cell.columnSpan)
        if (menuItem.identifier == "remove") this.removeColumn(column)
        return true
      case "merge":
        if (!menuItem) return false
        if (menuItem.identifier == "right") this.mergeCell(index, false)
        if (menuItem.identifier == "down") this.mergeCell(index, true)
        if (menuItem.identifier == "split") this.splitCell(index)
        return true
      case "header":
        this.willChange()
        this.hasHeader = !this.hasHeader
        this.refresh()
        this.changed()
        return true
      case "footer":
        this.willChange()
        this.hasFooter = !this.hasFooter
        this.refresh()
        this.changed()
        return true
      case "cellcolor":
        if (!menuItem) return false
        this.willChange()
        cell.hasCellBackgroundColor = menuItem.value != null
        if (menuItem.value) cell.cellBackgroundColor = Colors.clone(menuItem.value)
        this.refresh()
        this.changed()
        return true
    }
    return false
  }

  // Persistence

  toJSON(): object {
    this.ensureCells()
    let result = super.toJSON()
    if (this.activeCell != 0) result["activeCell"] = this.activeCell
    result["columns"] = this.columns
    if (this.hasFooter) result["hasFooter"] = true
    if (this.hasHeader) result["hasHeader"] = true
    result["rows"] = this.rows
    if (this.textAlignment != Alignments.automatic) result["textAlignment"] = this.textAlignment
    result["cells"] = this.cells.map(cell => cell.toJSON())
    return result
  }

  fromJSON(data: any): boolean {
    if (!super.fromJSON(data)) return false
    this.rows = Math.max(1, Utilities.integer(data.rows, 1))
    this.columns = Math.max(1, Utilities.integer(data.columns, 1))
    this.hasHeader = Utilities.boolean(data.hasHeader, false)
    this.hasFooter = Utilities.boolean(data.hasFooter, false)
    this.activeCell = Math.max(0, Utilities.integer(data.activeCell, 0))
    let alignment = Utilities.integer(data.textAlignment, 0)
    this.textAlignment = alignment >= 0 && alignment <= 3 ? alignment : Alignments.automatic
    this.cells = []
    if (Array.isArray(data.cells)) {
      data.cells.forEach(item => this.cells.push(RichText.fromJSON(item, child => this.editor ? this.editor.nodeFromJSON(child) : null)))
    }
    this.ensureCells()
    this.activeCell = Utilities.clamp(this.activeCell, 0, this.cells.length - 1)
    return true
  }

  // Export

  protected cellHTMLStyle(cell: RichText): string {
    let result = ""
    if (cell.textAlignment != Alignments.automatic) result += `text-align:${TextNode.cssAlignment(cell.textAlignment)};`
    result += `vertical-align:${["top", "middle", "bottom"][Utilities.clamp(cell.verticalAlignment, 0, 2)]};`
    if (cell.hasCellBackgroundColor) result += `background-color:${Colors.toCSS(cell.cellBackgroundColor)};`
    let sides: Array<[string, CellBorder]> = [["top", cell.cellBorderTop], ["right", cell.cellBorderRight], ["bottom", cell.cellBorderBottom], ["left", cell.cellBorderLeft]]
    sides.forEach(([side, border]) => {
      if (border.visible && border.size > 0) result += `border-${side}:${border.size}px solid ${Colors.toCSS(border.color)};`
    })
    if (!cell.backgroundImage.isEmpty) result += cell.backgroundImage.toCSS() + ";"
    return result
  }

  protected cellContentHTML(cell: RichText): string {
    let result = cell.htmlText()
    cell.nodes.forEach(child => { if (child.canExportHTML) result += child.toHTML() })
    return result
  }

  #rowHTML(row: number, coverage: Array<number>, tag: string): string {
    let result = "<tr>"
    for (let column = 0; column < this.columns; column++) {
      let index = row * this.columns + column
      if (coverage[index] != index) continue
      let cell = this.cells[index]
      let spans = ""
      let rowSpan = Math.min(cell.rowSpan, this.rows - row)
      let columnSpan = Math.min(cell.columnSpan, this.columns - column)
      if (rowSpan > 1) spans += ` rowspan="${rowSpan}"`
      if (columnSpan > 1) spans += ` colspan="${columnSpan}"`
      result += `<${tag}${spans} style="${Utilities.escapeAttribute(this.cellHTMLStyle(cell))}">${this.cellContentHTML(cell)}</${tag}>`
    }
    return result + "</tr>"
  }

  toHTML(): string {
    this.ensureCells()
    let coverage = this.coverage()
    let alignment = `text-align:${TextNode.cssAlignment(this.resolvedTextAlignment())};`
    let result = `<table style="${this.htmlBackgroundCSS()}${alignment}">`
    let bodyStart = this.hasHeader ? 1 : 0
    let bodyEnd = this.rows - (this.hasFooter ? 1 : 0)
    if (this.hasHeader) result += `<thead>${this.#rowHTML(0, coverage, "th")}</thead>`
    result += "<tbody>"
    for (let row = bodyStart; row < bodyEnd; row++) result += this.#rowHTML(row, coverage, "td")
    result += "</tbody>"
    if (this.hasFooter && this.rows > bodyStart) result += `<tfoot>${this.#rowHTML(this.rows - 1, coverage, "td")}</tfoot>`
    return result + "</table>"
  }

  #cellMarkdown(row: number, column: number): string {
    let cell = this.cell(row, column)
    return cell.markdownText().replace(/\|/g, "\\|").replace(/\n/g, "<br>").trim() || " "
  }

  toMarkdown(): string {
    this.ensureCells()
    let lines: Array<string> = []
    let header: Array<string> = []
    for (let column = 0; column < this.columns; column++) header.push(this.hasHeader ? this.#cellMarkdown(0, column) : " ")
    lines.push(`| ${header.join(" | ")} |`)
    lines.push(`| ${new Array(this.columns).fill("---").join(" | ")} |`)
    for (let row = this.hasHeader ? 1 : 0; row < this.rows; row++) {
      let cells: Array<string> = []
      for (let column = 0; column < this.columns; column++) cells.push(this.#cellMarkdown(row, column))
      lines.push(`| ${cells.join(" | ")} |`)
    }
    return this.markdownWithBackground(lines.join("\n"))
  }

  toPlainText(): string {
    let lines: Array<string> = []
    for (let row = 0; row < this.rows; row++) {
      let cells: Array<string> = []
      for (let column = 0; column < this.columns; column++) cells.push(this.cell(row, column).text.replace(/[\n\u2028]/g, " "))
      lines.push(cells.join("\t"))
    }
    return lines.join("\n")
  }
}
