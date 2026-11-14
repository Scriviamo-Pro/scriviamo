import { Node, Popup, Strings } from "./internal";
/** One message in an annotation's thread. */
export declare class Comment {
    #private;
    constructor(authorID?: string, authorName?: string, text?: string);
    get id(): string;
    /** The collaborator ID of the comment's author. */
    get authorID(): string;
    get authorName(): string;
    get created(): Date;
    get text(): string;
    static fromJSON(data: any): Comment | null;
    /** The comment as JSON, with its date in seconds since 1970. */
    toJSON(): object;
}
/**
 * A discussion thread attached to a range of text or to a whole node. It never
 * changes the document's content: it is saved beside the nodes in the document's
 * JSON, and isn't part of HTML, Markdown or printed output.
 *
 * nodeID is the annotated node. coversNode is true for a whole node; otherwise
 * segment is the node's text run (a table cell's index, or 0 for a node with one
 * run) and start and length are offsets in it. The editor keeps the anchor on its
 * text as the document changes.
 */
export declare class Annotation {
    #private;
    /** Where the annotation's marker is shown, for placing the popover. */
    markerElement: HTMLElement | null;
    get id(): string;
    get nodeID(): string;
    get segment(): number;
    /** The offset of the annotated text in its text run. */
    get start(): number;
    /** The length of the annotated text. It is 0 when the text has been deleted. */
    get length(): number;
    get coversNode(): boolean;
    /** The text the annotation was made on. */
    get quote(): string;
    get resolved(): boolean;
    /** True when the annotated text was deleted, or the node is no longer in the document. */
    get orphaned(): boolean;
    /** When the thread's first comment was written. */
    get created(): Date | null;
    comments(): Array<Comment>;
    commentAt(index: number): Comment | null;
    get lastCommentIndex(): number;
    /** @internal */
    addComment(value: Comment): void;
    /** @internal */
    removeCommentAt(index: number): void;
    /** @internal */
    setResolved(value: boolean): void;
    /** @internal */
    setNodeMissing(value: boolean): void;
    /** @internal Sets what the annotation is attached to. */
    setAnchor(nodeID: string, segment: number, start: number, length: number, coversNode: boolean, quote: string, segmentText: string): void;
    /** @internal Attaches this annotation where another one is. */
    copyAnchor(source: Annotation): void;
    /** @internal Takes every value of another annotation, keeping this object. */
    assign(source: Annotation): void;
    /**
     * @internal Moves the anchor to follow an edit to its text run, and returns whether
     * it moved. Text inserted before the anchor moves it, text inserted inside it grows
     * it, and deleted text shrinks it. An anchor whose text is deleted collapses where
     * the text was, and covers it again if the same text comes back there, as on undo.
     */
    adjustToText(currentText: string): boolean;
    static fromCodePoints(text: string, count: number): number;
    static fromJSON(data: any): Annotation | null;
    /** The annotation, its anchor and its comments as JSON. Offsets are in characters (code points). */
    toJSON(): object;
}
/** What Annotations needs from its editor. */
export interface AnnotationHandler {
    /** Anchors annotation to the selected text or node. Returns false when nothing can be annotated. */
    selectionAnchor(annotation: Annotation): boolean;
    containsNode(node: Node): boolean;
    /** Called before a change, for undo. */
    willChange(): void;
    changed(kind: "added" | "changed" | "removed", annotation: Annotation): void;
    redraw(): void;
    /** Scrolls the annotation's node into view and returns where its popover should open. */
    reveal(annotation: Annotation): HTMLElement | DOMRect | null;
    /** Where a new thread's popover opens: the selection, or the selected node. */
    selectionRect(): DOMRect | null;
    segmentText(node: Node, segment: number): string | null;
    segmentCount(node: Node): number;
    get allowed(): boolean;
    /** False while threads may be read but not changed, as for a collaborator with Read access. */
    get canChange(): boolean;
    /** The connected collaborator, the author of new comments when Annotations has none of its own, or null. */
    identity(): {
        id: string;
        name: string;
    } | null;
    get container(): HTMLElement | null;
    get strings(): Strings;
}
/**
 * A document's discussion threads. Read it from Editor.annotations. Annotations
 * never change the document's content, so they can be added and answered in a
 * read-only editor. Each change is one undo step, sets isChanged, and raises the
 * editor's annotationAdded, annotationChanged or annotationRemoved event.
 */
export declare class Annotations {
    #private;
    /** The collaborator ID recorded as the author of new comments. */
    authorID: string;
    /** The name recorded as the author of new comments. When both are empty, TextDefaultAuthorCaption is used. */
    authorName: string;
    constructor(owner: any, handler: AnnotationHandler);
    get owner(): any;
    /** @internal Replaces every annotation without undo or events, as when a document is loaded. */
    load(items: Array<Annotation>): void;
    /**
     * @internal Replaces a thread with a collaboration server's copy, adds it, or removes
     * it when data is null. Not an undo step; raises the usual annotation events.
     */
    applyRemote(identifier: string, data: any): void;
    /** Annotates the selected text while a node is being edited, or the one selected node. */
    add(text: string): Annotation | null;
    /** Annotates a whole node. */
    add(node: Node, text: string): Annotation | null;
    /** Annotates a range of a node's text; segment is a table cell's index, or 0. */
    add(node: Node, start: number, length: number, text: string, segment?: number): Annotation | null;
    /** @internal Starts a thread on an anchor taken from the selection when the popover opened. */
    addPrepared(anchor: Annotation, text: string): Annotation | null;
    /** True when add(text) has something to annotate: selected text, or one selected node. */
    get canAdd(): boolean;
    /** True when threads can be added, answered, resolved and removed. False when comments are turned off, or may only be read. */
    get canChange(): boolean;
    /** The annotations attached to a node, in the order they were added. */
    annotationsAt(node: Node): Array<Annotation>;
    indexOf(annotation: Annotation): number;
    item(identifier: string): Annotation | null;
    itemAt(index: number): Annotation | null;
    items(): Array<Annotation>;
    get lastIndex(): number;
    remove(annotation: Annotation | string): void;
    removeAt(index: number): void;
    /** Removes every annotation, as one undo step. */
    removeAll(): void;
    /** Removes a comment from a thread, and the thread when it was the last one. */
    removeComment(annotation: Annotation, comment: Comment): void;
    /** Adds a reply by the current author and returns it, or null when the text is empty. */
    reply(annotation: Annotation, text: string): Comment | null;
    /** Marks a discussion resolved. It stays visible, muted, and can be reopened. */
    resolve(annotation: Annotation): void;
    reopen(annotation: Annotation): void;
    /** @internal An unsaved anchor for the selected text or node, or null. */
    prepareSelection(): Annotation | null;
    /** The annotation whose text is highlighted, as while its thread is open. */
    get selected(): Annotation | null;
    set selected(value: Annotation | null);
    /** True while the comment popover is open. */
    get visible(): boolean;
    /**
     * Opens the comment popover on an annotation's thread, among the other threads on
     * its node, or on a new thread for the selection when annotation is null.
     */
    show(annotation?: Annotation | null, focusField?: boolean): void;
    /** @internal The popover changed the thread it shows. */
    popoverShowing(annotation: Annotation | null): void;
    /** Closes the comment popover when it is open. */
    close(): void;
    /** @internal Rebuilds the open popover after the annotations changed. */
    refreshPopover(): void;
}
/**
 * The comment popover: a thread's position among its node's threads and its status,
 * the annotated text, the comments with their authors and dates, and a field that
 * adds a reply, or starts the thread when it is new, on Return. New starts another
 * thread on the same text or node.
 */
export declare class AnnotationPopover extends Popup {
    #private;
    constructor(annotations: Annotations, strings: Strings, threads: Array<Annotation>, index: number, prepared: Annotation | null);
    get current(): Annotation | null;
    focusField(): void;
    refresh(): void;
}
