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
/** Where an editor's autosave is. */
export declare enum AutosaveStates {
    /** Nothing to save: no changes since the document was loaded or last saved. */
    saved = "saved",
    /** Changes are waiting for the next save. */
    unsaved = "unsaved",
    /** The save function is running. */
    saving = "saving",
    /** The last save failed; it is tried again after retryDelay, or on the next change. */
    failed = "failed"
}
/** The function an application gives autosave. It may return a Promise; a rejection or exception is a failed save. */
export type AutosaveFunction = (editor: Editor) => unknown;
/**
 * Saves the document a moment after the user stops changing it. Give it a save function, and it
 * calls it delay milliseconds after the last change, and at least every maximumWait milliseconds
 * while changes keep coming. It tracks whether everything is saved, raises autosaveStateChanged
 * on the editor, and warns before the page is closed with changes unsaved.
 *
 *     editor.autosave.save = async editor => {
 *       await fetch("/documents/42", {method: "PUT", body: JSON.stringify(editor.toJSON())})
 *     }
 *
 * Only the user's own changes start a save. Loading a document doesn't, and neither do changes
 * that arrive from other people while collaborating: the person who made a change saves it.
 */
export declare class Autosave {
    #private;
    /** Milliseconds to wait after the last change before saving. */
    delay: number;
    /** The longest to wait while changes keep coming, in milliseconds, so long typing sessions are still saved. */
    maximumWait: number;
    /** Milliseconds before a failed save is tried again. */
    retryDelay: number;
    /** Asks the browser to warn before the page closes while changes aren't saved. */
    warnBeforeLeaving: boolean;
    constructor(editor: Editor);
    get owner(): Editor;
    /** The application's save function, or null to turn autosave off. */
    get save(): AutosaveFunction | null;
    set save(value: AutosaveFunction | null);
    get enabled(): boolean;
    get state(): AutosaveStates;
    /** What the last failed save threw or rejected with, or null. */
    get lastError(): unknown;
    /** When the document was last saved, or null. */
    get lastSaved(): Date | null;
    /**
     * Saves now, without waiting. Resolves true when the document is saved. While a save is
     * running, waits for it and saves again if anything changed meanwhile.
     */
    saveNow(): Promise<boolean>;
    /** Stops autosave and its listeners; the editor calls it when it is destroyed. */
    dispose(): void;
}
/**
 * The bar under the document: word and character counts, the reading time, and the autosave
 * state. Turn it on with the statusBar option or editor.statusBarVisible. While text is
 * selected, the counts show the selection's share.
 */
export declare class StatusBar {
    #private;
    showWords: boolean;
    showCharacters: boolean;
    showReadingTime: boolean;
    showSaveState: boolean;
    constructor(editor: Editor);
    get owner(): Editor;
    get element(): HTMLElement | null;
    /** Builds the bar in an element; the editor calls it as it draws itself. */
    attach(element: HTMLElement): void;
    detach(): void;
    /** Updates the bar shortly, once, however many changes arrive meanwhile. */
    scheduleUpdate(): void;
    update(): void;
}
