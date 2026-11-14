import { Alignments, Editor, InspectorSection, Node, RichText, Stylesheet, TextHost, TextStyle, ToolbarItem, ToolbarMenuItem } from "../internal";
export declare enum VerticalAlignments {
    top = 0,
    middle = 1,
    bottom = 2
}
/**
 * A grid of cells. Each cell is a RichText holding the cell's text, its
 * appearance, its spans and the blocks embedded in it. Cells are stored
 * row-major: cell (row, column) is cells[row * columns + column].
 */
export declare class TableNode extends Node {
    #private;
    static exportStyles(sheet: Stylesheet, editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    static create(editor: Editor): Node;
    static headerStyle(): TextStyle;
    rows: number;
    columns: number;
    cells: Array<RichText>;
    hasHeader: boolean;
    hasFooter: boolean;
    /** The flat index of the cell that last had the caret. */
    activeCell: number;
    textAlignment: Alignments;
    /** Host index → cell index, for the cells drawn in the last render. */
    protected hostCells: Array<number>;
    constructor(rows?: number, columns?: number);
    childLists(): Array<Array<Node>>;
    ensureCells(): void;
    cell(row: number, column: number): RichText;
    /** For each cell, the index of the cell whose span covers it, or its own index. */
    coverage(): Array<number>;
    /** The cell index of a host, or of the cell with the caret. */
    cellIndexOf(host: TextHost | null): number;
    insertionPoint(host: TextHost): {
        list: Array<Node>;
        index: number;
    } | null;
    get inspectorFollowsCaret(): boolean;
    noteCaretHost(host: TextHost): void;
    inspectorSections(): Array<InspectorSection>;
    currentCellIndex(): number;
    protected build(body: HTMLElement): void;
    protected buildCell(element: HTMLElement, cell: RichText, index: number): void;
    resolvedTextAlignment(): Alignments;
    protected applyCellAppearance(element: HTMLElement, cell: RichText): void;
    /** Moves the caret to a cell. */
    focusCell(index: number, atEnd?: boolean): void;
    handleKeyDown(event: KeyboardEvent, host: TextHost | null): boolean;
    /** Adds a row before row at. Its cells take their formatting from the body row above it. */
    insertRow(at: number): void;
    removeRow(row: number): void;
    insertColumn(at: number): void;
    removeColumn(column: number): void;
    /** Merges a cell with the cell to its right or below, moving that cell's content into it. */
    mergeCell(index: number, down: boolean): void;
    /**
     * Merges the rectangle of cells starting at row and column into its top-left cell.
     * The other cells' content follows in reading order. Returns false when the
     * rectangle is outside the table or cuts through a merged cell.
     */
    mergeCells(row: number, column: number, rowCount: number, columnCount: number): boolean;
    splitCell(index: number): void;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean;
    toJSON(): object;
    fromJSON(data: any): boolean;
    protected cellHTMLStyle(cell: RichText): string;
    protected cellContentHTML(cell: RichText): string;
    toHTML(): string;
    toMarkdown(): string;
    toPlainText(): string;
}
