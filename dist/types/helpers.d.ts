import { Editor, Node, NodeClass } from "./internal";
/** Where the caret or node selection was, so undo and redo can put it back. */
export interface SelectionState {
    nodeId: string;
    hostIndex: number;
    start: number;
    end: number;
    nodeIds: Array<string>;
}
/** Undo and redo. Each step stores the document as it was before a change. */
export declare class History extends EventTarget {
    #private;
    /** Most steps kept. */
    limit: number;
    /** Consecutive typing in one place within this many milliseconds is one step. */
    coalesceInterval: number;
    constructor(editor: Editor);
    get owner(): Editor;
    get canUndo(): boolean;
    get canRedo(): boolean;
    get undoCount(): number;
    get redoCount(): number;
    /**
     * Records the current document as an undo step. Calls with the same
     * coalesceKey in quick succession, such as typing, record only the first.
     */
    checkpoint(coalesceKey?: any): void;
    /** Ends typing coalescing, so the next change starts a new step. */
    breakCoalescing(): void;
    undo(): void;
    redo(): void;
    reset(): void;
    /**
     * @internal Applies a change made by someone else to every undo and redo step, so
     * undoing restores this user's earlier content without reverting the change.
     */
    rebase(transform: (document: any) => void): void;
    /** Runs work without recording steps. */
    suspend(work: () => void): void;
}
/** The node types an editor can insert and restore. */
export declare class NodeTypes extends EventTarget {
    #private;
    constructor(editor: Editor);
    get owner(): Editor;
    static normalize(identifier: string): string;
    /** Adds a node class. A class with the same identifier is replaced. */
    add(item: NodeClass): void;
    addAt(index: number, item: NodeClass): void;
    indexOf(item: NodeClass | string): number;
    item(identifier: string): NodeClass | null;
    itemAt(index: number): NodeClass | null;
    items(): Array<NodeClass>;
    get lastIndex(): number;
    remove(item: NodeClass | string): void;
    removeAt(index: number): void;
    removeAll(): void;
}
/** Counts for the whole document and for the selection. */
export declare class Statistics {
    #private;
    /** Words read per minute, used by readingMinutes. */
    wordsPerMinute: number;
    constructor(editor: Editor);
    get owner(): Editor;
    static countWords(value: string): number;
    get words(): number;
    get characters(): number;
    get charactersExcludingSpaces(): number;
    get paragraphs(): number;
    get readingMinutes(): number;
    get selectedCharacters(): number;
    get selectedWords(): number;
}
/** Node selection and the clipboard commands that act on it. */
export declare class NodeSelection {
    #private;
    constructor(editor: Editor);
    get owner(): Editor;
    /** The primary selected node. */
    get node(): Node | null;
    /** The selected nodes in document order. */
    nodes(): Array<Node>;
    get lastNodeIndex(): number;
    isSelected(node: Node): boolean;
    selectNode(node: Node, addToSelection?: boolean): void;
    selectAllNodes(): void;
    /** Selects all the text being edited, or every node when no text is being edited. */
    selectAll(): void;
    deselectAll(): void;
    clear(): void;
    /** Selects text in the node being edited. Returns false when no text is being edited. */
    selectText(start: number, length: number): boolean;
    get description(): string;
    get canDelete(): boolean;
    get canDuplicate(): boolean;
    get canMoveUp(): boolean;
    get canMoveDown(): boolean;
    get canCopy(): boolean;
    get canCut(): boolean;
    get canPaste(): boolean;
    get canSelectAll(): boolean;
    get canDeselectAll(): boolean;
    /** Deletes the selected text, or the selected nodes when no text is selected. */
    delete(): void;
    deleteNodes(): void;
    duplicate(): void;
    moveUp(): void;
    moveDown(): void;
    /** Selects every node from the anchor to node in document order. */
    selectRange(from: Node, to: Node): void;
    copy(): void;
    cut(): void;
    paste(): void;
}
