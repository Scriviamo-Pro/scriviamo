import { Alignments, Annotation, Annotations, Autosave, AutosaveFunction, BackgroundImage, DialogField, Directions, DocumentColor, Exporters, FileUploader, FileUploadKind, FontOptions, Formatting, HeadingNode, History, HTMLImporter, InsertionChoice, InspectorSection, Node, NodeClass, NodeSelection, NodeTypes, Notification, Search, SelectionState, Statistics, StatusBar, Strings, Stylesheet, SuggestionProviders, TextHost, TextNode, TextStyle, ThemeColors, ToolbarDisplayModes, ToolbarItem, ToolbarItems, ToolbarMenuItem } from "./internal";
export declare enum ValidationSeverities {
    warning = 0,
    error = 1
}
export declare class ValidationIssue {
    severity: ValidationSeverities;
    message: string;
    constructor(severity: ValidationSeverities, message: string);
}
export interface EditorOptions {
    /** Document JSON, as a string or object. */
    content?: string | object;
    /** HTML to load when content isn't given. */
    html?: string;
    /** Markdown to load when content and html aren't given. */
    markdown?: string;
    readOnly?: boolean;
    toolbarVisible?: boolean;
    toolbarDisplayMode?: ToolbarDisplayModes;
    showContextualToolbars?: boolean;
    isHoverInsertionEnabled?: boolean;
    markdownShortcuts?: boolean;
    /** Turns comments on or off. Threads already in the document are kept either way. */
    allowAnnotations?: boolean;
    adaptiveHeight?: boolean;
    fontName?: string;
    fontSize?: number;
    /** A locale pack, an object of localized strings, or a list of either. */
    strings?: string | object;
    /** Extra classes for the editor element. */
    class?: string;
    /** Shows the status bar under the document: word and character counts, reading time, and the autosave state. */
    statusBar?: boolean;
    /** How many block types the toolbar's Insert menu offers before it shows a search field; see insertMenuSearchThreshold. */
    insertMenuSearchThreshold?: number;
    /** Uploads files the user adds, such as pictures, and returns their addresses; see FileUploader. */
    fileUploader?: FileUploader | null;
    /** Saves the document a moment after each change: a save function, or one with settings. See Autosave. */
    autosave?: AutosaveFunction | {
        save: AutosaveFunction;
        delay?: number;
        maximumWait?: number;
        retryDelay?: number;
        warnBeforeLeaving?: boolean;
    };
}
/**
 * A block-based rich text editor. The document is an ordered list of nodes;
 * container nodes (tables, columns, collapsible sections) hold nodes of their own.
 *
 * Events (CustomEvent; detail described below):
 * - contentChanged: {node} after content or a persistent property changes; node is null for document-wide changes.
 * - selectionChanged: {node} after the primary selected node changes.
 * - keyPress: {key, event} before the editor handles a key. Call preventDefault to handle it yourself.
 * - linkPressed: {node, url, text, title} when a link is Ctrl/Command-clicked, or clicked while read-only. Call preventDefault to stop the editor opening it.
 * - toolbarItemPressed: {item, menuItem} for toolbar items the editor doesn't handle.
 * - messageShowing: {notification, text, indicator}. Call preventDefault to show it yourself.
 * - nodeDragging: {node, nodes, beforeNode, parentNode, x, y} while nodes are dragged. Call preventDefault to refuse the position.
 * - nodeDropped: {node, nodes, beforeNode, parentNode}. Call preventDefault to cancel the move.
 * - nodeKeyPress: {node, key, event} before a selected (not edited) node handles a key. Call preventDefault to handle it yourself.
 * - nodePointerEnter, nodePointerExit: {node}; nodePointerMove: {node, x, y} relative to the node.
 * - pointerEnter, pointerExit, pointerMoved: {x, y} relative to the editor.
 * - pickerOpened: {picker}; pickerClosed: {picker, committed, value} for the editor's menus and popovers.
 * - suggestionCommitted: {node, provider, suggestion} after a suggestion is chosen.
 * - annotationAdded, annotationChanged, annotationRemoved: {annotation}, including those undo and redo restore.
 * - annotationSelected: {annotation} when a comment marker is clicked. Call preventDefault to show it yourself.
 * - toolbarCustomized: {state} when the customizer closes with changes; toolbarReset after resetToolbar.
 * - scrollChanged: {x, y}; editingChanged: {node}; readOnlyChanged.
 * - heightChanged: the editor's height, while adaptiveHeight is true.
 * - autosaveStateChanged: {state, error} as autosave moves between saved, unsaved, saving and failed.
 *
 * While a collaboration client is attached (the collaboration add-on):
 * - collaborationConnected: {user} after a shared document opened; collaborationDisconnected when it closed.
 * - collaborationUserConnected, collaborationUserDisconnected: {collaborator} as other users join and leave.
 * - remoteDocumentChanged: {collaborator, revision} after another user's change was applied.
 * - remoteNodeLockChanged: {collaborator, node, nodeID, locked} when another user locks or releases a node.
 * - remotePointerMoved: {collaborator, node, x, y} with the pointer in points from the page's top-left corner; node is the user's selected node.
 * - remoteSelectionChanged: {collaborator, node} when another user selects a node; node is null when they clear the selection.
 */
/**
 * Adds commands to every editor, such as the toolbar items and keyboard shortcuts
 * of an optional node type. Register one with Editor.registerExtension.
 */
export interface EditorExtension {
    /** Called for each new editor once its built-in setup is done. */
    install?(editor: Editor): void;
    /** The tools this extension adds, in the order the toolbar customizer lists them. */
    toolbarIdentifiers?: Array<string>;
    /** The tools the default toolbar shows, placed after the tool named by defaultToolbarAfter, or at the end. */
    defaultToolbarIdentifiers?: Array<string>;
    defaultToolbarAfter?: string;
    /** Makes the tool for one of toolbarIdentifiers. */
    makeToolbarItem?(editor: Editor, identifier: string): ToolbarItem | null;
    /** Performs one of the extension's tools. Return true when handled. */
    activateToolbarItem?(editor: Editor, identifier: string, menuItem: ToolbarMenuItem | null): boolean;
    /** Sets the enabled and active states of the extension's tools for the current selection. */
    updateToolbarState?(editor: Editor, set: (identifier: string, enabled: boolean, active?: boolean) => void): void;
    /** Handles a key press with the command key held. Return true when handled. */
    handleCommandKey?(editor: Editor, event: KeyboardEvent): boolean;
    /** Choices the insertion chooser ("/" and Insert) and command search offer besides node types. */
    insertionChoices?(editor: Editor): Array<InsertionChoice>;
}
/**
 * A panel about the document shown beside an editor, such as the outline add-on's. Register one
 * with Editor.registerPanel; the inspector add-on shows each as a tab, and an application can
 * place one anywhere with build.
 */
export interface EditorPanel {
    identifier: string;
    /** The panel's name, as its tab shows it. */
    caption(editor: Editor): string;
    /** Fills container for an editor, and keeps it up to date until the function it returns is called. */
    build(container: HTMLElement, editor: Editor): () => void;
}
/**
 * A connection that shares the document with other users, such as the collaboration
 * add-on's client. The editor reports local changes to it and draws other users'
 * presence through it.
 */
/** A point as fractions of a top-level node's width and height, measured from its top-left corner. */
export interface PointerAnchor {
    nodeID: string;
    x: number;
    y: number;
}
export interface CollaborationConnection {
    editorContentChanged(node: Node | null): void;
    editorSelectionChanged(nodeChanged: boolean): void;
    /** The pointer moved: x and y from the page's top-left corner, and the node it is over, or the nearest one. */
    editorPointerMoved(x: number, y: number, anchor: PointerAnchor | null): void;
    editorAnnotationChanged(annotation: Annotation, removed: boolean): void;
    /** Applies a remote operation to a document object in the JSON format, so the undo history keeps it. */
    applyToDocument(document: any, operation: any): void;
    /** The local user's identity for comments, or null. */
    identity(): {
        id: string;
        name: string;
    } | null;
    /** Draws the other users' selections, carets, pointers and locks into layer, which covers the page. */
    renderPresence(layer: HTMLElement): void;
}
export declare class Editor extends EventTarget {
    #private;
    /**
     * Registers a node type for every editor created afterwards. order places it in
     * the insertion and block type menus; the built-in types use multiples of 10.
     * A type with the same identifier is replaced.
     */
    static registerNodeType(type: NodeClass, order?: number): void;
    /** The node types new editors start with, in menu order. */
    static registeredNodeTypes(): Array<NodeClass>;
    /** Registers an extension for every editor created afterwards. */
    static registerExtension(extension: EditorExtension): void;
    static extensions(): Array<EditorExtension>;
    /** Registers a panel about the document, such as an outline; one with the same identifier is replaced. */
    static registerPanel(panel: EditorPanel): void;
    /** The registered panels, in the order they were registered. */
    static panels(): Array<EditorPanel>;
    /** A static member a node type declares itself, rather than inherits from the type it extends. */
    static ownStatic(type: NodeClass, name: string): any;
    id: string;
    documentID: string;
    strings: Strings;
    nodeTypes: NodeTypes;
    toolbarItems: ToolbarItems;
    history: History;
    formatting: Formatting;
    selection: NodeSelection;
    search: Search;
    statistics: Statistics;
    importer: HTMLImporter;
    /** Text suggestion providers, asked in order while typing. Starts with an emoji provider, "emoji". */
    suggestionProviders: SuggestionProviders;
    lastValidationIssues: Array<ValidationIssue>;
    /** The export formats offered by export and exportToFile. */
    exporters: Exporters;
    /** The document's discussion threads. */
    annotations: Annotations;
    /** Saves the document after changes, through the application's save function. */
    autosave: Autosave;
    /** The bar under the document; shown while statusBarVisible is true. */
    statusBar: StatusBar;
    /**
     * The toolbar's Insert menu shows a search field once it offers at least this many block
     * types. 0 always shows it; Infinity never does.
     */
    insertMenuSearchThreshold: number;
    /**
     * Uploads files the user adds (pictures, audio, video and backgrounds) and returns the address
     * each is shown from. Without one, files are embedded in the document as data.
     */
    fileUploader: FileUploader | null;
    /** The font names and sizes the toolbar offers, and the character formats available. A node's own fontOptions replace these while it is formatted. */
    fontOptions: FontOptions;
    /** Font families offered by the Font menu. "System" is the platform's interface font. */
    get fontNames(): Array<string>;
    set fontNames(value: Array<string>);
    /** Font sizes offered by the Size menu, after Default. */
    get fontSizes(): Array<number>;
    set fontSizes(value: Array<number>);
    /** The font options in effect: those of the node being formatted, or the editor's. */
    activeFontOptions(): FontOptions;
    /** Shows the add and drag buttons beside the block under the pointer. */
    isHoverInsertionEnabled: boolean;
    /** Turns Markdown typed while editing into the formatting or block it describes. False types the characters as they are. */
    markdownShortcuts: boolean;
    /**
     * Creates an editor in element. With null instead of an element, the editor is headless: it
     * draws nothing and needs no browser, but loads, changes and exports documents, such as for
     * rendering saved documents to HTML on a server.
     */
    constructor(element: HTMLElement | null, options?: EditorOptions);
    /**
     * Stores a file the user added and returns the address to show it from: the fileUploader's
     * result, or a data: URI when there's no uploader or it returns null. Rejects when the upload
     * fails or is aborted.
     */
    storeFile(file: Blob, kind: FileUploadKind, node?: Node | null, progress?: (fraction: number) => void, signal?: AbortSignal): Promise<string>;
    /**
     * A saved document (JSON, as a string or object) as HTML, without a page or a visible editor,
     * such as on a server. includeDocumentElements makes a whole page with its stylesheet. Import
     * the add-ons the document uses first.
     */
    static renderHTML(content: string | object, includeDocumentElements?: boolean, includeAnnotations?: boolean): string;
    /** A saved document as Markdown, without a page or a visible editor. */
    static renderMarkdown(content: string | object): string;
    /** A saved document as plain text, without a page or a visible editor. */
    static renderPlainText(content: string | object): string;
    /** Sets up autosave from a save function, a save function with settings, or null to turn it off. */
    updateAutosave(value: EditorOptions["autosave"] | null): void;
    updateOptions(options?: EditorOptions): void;
    get element(): HTMLElement | null;
    /** The element the search bar is placed in. */
    get searchContainer(): HTMLElement;
    get enabled(): boolean;
    set enabled(value: boolean);
    get readOnly(): boolean;
    set readOnly(value: boolean);
    get class(): string;
    /** Shows the bar under the document, with word and character counts and the autosave state. */
    get statusBarVisible(): boolean;
    set statusBarVisible(value: boolean);
    set class(value: string);
    get adaptiveHeight(): boolean;
    set adaptiveHeight(value: boolean);
    get toolbarVisible(): boolean;
    set toolbarVisible(value: boolean);
    get toolbarDisplayMode(): ToolbarDisplayModes;
    set toolbarDisplayMode(value: ToolbarDisplayModes);
    get showContextualToolbars(): boolean;
    set showContextualToolbars(value: boolean);
    /** The document font. "System" uses the platform's interface font. */
    get fontName(): string;
    set fontName(value: string);
    /** The document font size. Text whose size is Default (zero) uses it. */
    get fontSize(): number;
    set fontSize(value: number);
    /** The picture drawn behind the document. */
    get backgroundImage(): BackgroundImage;
    set backgroundImage(value: BackgroundImage);
    /** The inspector's sections for the document, shown when no node is selected. */
    inspectorSections(): Array<InspectorSection>;
    get backgroundColor(): DocumentColor;
    set backgroundColor(value: DocumentColor);
    /** Where nodes narrower than the page sit when their alignment is Automatic. */
    get alignment(): Alignments;
    set alignment(value: Alignments);
    /** The alignment of text whose alignment is Automatic. */
    get textAlignment(): Alignments;
    set textAlignment(value: Alignments);
    get direction(): Directions;
    set direction(value: Directions);
    /** True when the document changed since it was loaded or isChanged was cleared. */
    get isChanged(): boolean;
    set isChanged(value: boolean);
    get isEditingText(): boolean;
    /** The text being edited, if any. */
    get activeHost(): TextHost | null;
    /** The primary selected node. */
    get selectedNode(): Node | null;
    selectedNodes(): Array<Node>;
    render(): void;
    /** Removes the editor from the page and releases its listeners. */
    destroy(): void;
    /** Rebuilds every node's DOM. */
    renderDocument(): void;
    /** Renders a list of nodes into a container element. Container nodes call this for their children. */
    mountChildren(list: Array<Node>, container: HTMLElement, owner: Node | null): void;
    /** Builds a node's DOM for this editor. */
    renderNode(node: Node): HTMLElement;
    /** Rebuilds one node in place, keeping the caret in its text. */
    refreshNode(node: Node): void;
    /** The root nodes. */
    nodes(): Array<Node>;
    nodeAt(index: number): Node | null;
    get lastNodeIndex(): number;
    /** Every node, including those inside containers, in document order. */
    allNodes(): Array<Node>;
    nodeWithID(identifier: string): Node | null;
    /** The list that holds node: the root list or a container's list. */
    listContaining(node: Node): Array<Node> | null;
    addNode(node: Node): void;
    insertNode(index: number, node: Node): void;
    removeNodeAt(index: number): void;
    removeNode(node: Node): void;
    removeAllNodes(): void;
    /** Inserts nodes into a list at index. */
    insertNodes(list: Array<Node>, index: number, nodes: Array<Node>, owner?: Node | null): void;
    insertNodesAfter(reference: Node, nodes: Array<Node>): void;
    insertNodesBefore(reference: Node, nodes: Array<Node>): void;
    /** Replaces a node with other nodes. Passing the node itself among them keeps it. */
    replaceNode(node: Node, replacements: Array<Node>): void;
    /** Removes nodes. selectNext selects the node that takes their place. */
    removeNodes(nodes: Array<Node>, selectNext?: boolean): void;
    /** Moves a node up (negative) or down (positive) within its list. */
    moveNode(node: Node, delta: number): void;
    /**
     * Moves nodes up (negative) or down (positive) one place within their lists,
     * keeping their order. A group already at the edge of its list stays put. One undo step.
     */
    moveNodes(nodes: Array<Node>, delta: number): void;
    /** Moves a node to a list position, such as after a drag. */
    moveNodeTo(node: Node, list: Array<Node>, index: number): void;
    /** Moves nodes, in document order, to a list position. One undo step. */
    moveNodesTo(nodes: Array<Node>, list: Array<Node>, index: number): void;
    /** Copies nodes, placing each copy after its original, and selects the copies. One undo step. */
    duplicateNodes(nodes: Array<Node>): void;
    /** Whether moveNodes would move any of nodes. */
    canMoveNodes(nodes: Array<Node>, delta: number): boolean;
    /** nodes sorted into the order they appear in the document. */
    inDocumentOrder(nodes: Array<Node>): Array<Node>;
    /** Selects every node from one node to another in document order, keeping from as the anchor. */
    selectRange(from: Node, to: Node): void;
    /** Copies a node, giving it and its descendants new IDs. */
    cloneNode(node: Node): Node | null;
    static renewIDs(data: any): any;
    /** Builds a node from its JSON using the registered types. Unknown types are kept as they are. */
    nodeFromJSON(data: any): Node | null;
    /** Inserts a node of a registered type where the user is working, and starts editing it. */
    insertNodeOfType(type: NodeClass | string, replace?: Node | null): Node | null;
    /**
     * Inserts a node made for this editor where the user is working, as insertNodeOfType does:
     * at the caret, in place of an empty paragraph, or after the selected node. One undo step.
     */
    insertNewNode(node: Node, replace?: Node | null): Node | null;
    /**
     * Turns text blocks into another kind: "text", "heading" (with level),
     * "quote", "alert" (with alert type), "codeblock", or "list" (with list type).
     * Selecting a list's own type turns it back into paragraphs.
     */
    setBlockType(kind: string, value?: number, target?: TextHost | null): void;
    /**
     * The blocks a text block becomes for setBlockType: the block itself when it
     * handles the conversion, or a block of the registered type named by kind made
     * from its plain content. Unregistered kinds convert nothing.
     */
    convertTextBlock(node: TextNode, kind: string, value: number): Array<Node>;
    /** Starts editing a node's text at offset (the end when omitted), or selects the node when it has no text. */
    focusNode(node: Node, offset?: number, hostIndex?: number): void;
    /** The node whose text is being edited, or null when nodes are only selected. */
    get editingNode(): Node | null;
    /** True when node's text can be edited right now: it is the node being edited. */
    isEditingNode(node: Node): boolean;
    /**
     * Starts editing a node's text, with the caret at offset (the end when omitted).
     * Selecting a node doesn't make it editable; double-click, Return or this does.
     */
    beginEditing(node?: Node | null, offset?: number, hostIndex?: number): void;
    /** Stops editing text, leaving the node selected. */
    endEditing(): void;
    /** Selects a node as a whole, ending text editing. */
    selectNode(node: Node, addToSelection?: boolean): void;
    selectNodes(nodes: Array<Node>): void;
    /** Opens collapsed sections that contain node. */
    revealNode(node: Node): void;
    scrollToNode(node: Node): void;
    scrollTo(x: number, y: number): void;
    /** The selection, as IDs and offsets that survive re-rendering. */
    captureSelection(): SelectionState | null;
    restoreSelection(state: SelectionState | null): void;
    /** The selected text, or the plain text of the selected nodes. */
    selectedText(): string;
    /** Records the text being edited right away, before the browser reports the selection change. */
    hostActivated(host: TextHost): void;
    pendingStyle(): TextStyle | null;
    /** Sets the style the next typed text at offset receives. */
    setPendingStyle(host: TextHost, offset: number, style: TextStyle): void;
    /** Called by nodes after their content or persistent properties change. */
    nodeChanged(node: Node | null): void;
    /** Starts a batch of changes. Events wait until the matching endUpdate. Batches may be nested. */
    beginUpdate(): void;
    endUpdate(): void;
    /** A unique fragment identifier for a heading, from its text. */
    anchorFor(heading: HeadingNode): string;
    /** Inserts text at the caret, replacing the selection. Returns false when no text is being edited. */
    insertText(value: string): boolean;
    /** Replaces text in the node being edited. */
    replaceText(start: number, length: number, value: string, style?: TextStyle): boolean;
    deleteText(host: TextHost, start: number, end: number): void;
    /** The DOM position under a point, or null. */
    static caretFromPoint(x: number, y: number): {
        node: globalThis.Node;
        offset: number;
    } | null;
    static get isMac(): boolean;
    /** True while the editor shows its own context menu. Holding Shift shows the browser's, with its spelling suggestions. */
    contextMenuEnabled: boolean;
    /** Turns comments on or off: the margin markers, Add Comment and the popover. Threads in the document are kept. */
    get allowAnnotations(): boolean;
    set allowAnnotations(value: boolean);
    /** True while the suggestion popup is showing. */
    get suggestionsVisible(): boolean;
    /**
     * Turns plain trigger text that exactly matches a provider's suggestion into a
     * committed tag, as when the text was loaded or pasted. Called for nodes as they
     * are added or loaded.
     */
    recognizeSuggestions(nodes: Array<Node>): void;
    /** Nodes made from files, by the node types that accept them. Files no type accepts are skipped. */
    nodesForFiles(files: Array<File>): Array<Node>;
    /** Copies (or cuts) the selection, as the Copy and Cut commands do. */
    copyToClipboard(cut: boolean): void;
    /** Pastes from the system clipboard, when the browser allows reading it. */
    pasteFromClipboard(): Promise<void>;
    /** The identifiers of every built-in tool, in the order the customizer lists them. */
    static get catalogIdentifiers(): Array<string>;
    /**
     * Opens command search: a searchable list of every enabled tool, the selected
     * node's tools first. Node types to insert, and the choices inside menus, are
     * listed once something is typed. Choosing one performs it as the toolbar would.
     * Shift-Command-P (Shift-Control-P elsewhere) opens it too.
     */
    showCommandSearch(anchor?: HTMLElement | DOMRect): void;
    /** Rebuilds the default toolbar, removing application items. */
    resetToolbar(): void;
    get isCustomizingToolbar(): boolean;
    /**
     * The toolbar's arrangement and display mode as JSON, for restoring with
     * loadToolbarState: item identifiers, with "separator" and "flexiblespace" for spaces.
     */
    saveToolbarState(): string;
    /** Restores an arrangement from saveToolbarState. Identifiers the editor doesn't know are skipped. Returns false for invalid state. */
    loadToolbarState(state: string | object): boolean;
    /**
     * Opens the customizer below the toolbar: drag items from it into the toolbar,
     * drag toolbar items to reorder them or off the toolbar to remove them, or drag
     * the default set to reset. Clicking an item in the customizer adds it at the end.
     */
    showToolbarCustomizer(): void;
    /** Closes the customizer, raising toolbarCustomized when the arrangement changed. */
    closeToolbarCustomizer(): void;
    /** Line heights offered by the Line Height menu, as multiples of the font's. */
    static lineHeights: Array<number>;
    /** Extra space between lines offered by the Line Spacing menu, in pixels. */
    static lineSpacings: Array<number>;
    /** Performs a toolbar item's command, as clicking it does. */
    activateToolbarItem(identifier: string, menuItem?: ToolbarMenuItem | null): void;
    /** Refreshes toolbar buttons for the current selection. */
    updateToolbarState(): void;
    /** Shows the searchable list of blocks. Choosing one inserts it, replacing replace when given. */
    /** What the extensions add to the insertion chooser and command search. */
    insertionChoices(): Array<InsertionChoice>;
    showInsertionChooser(anchor?: HTMLElement | DOMRect, replace?: Node | null): void;
    /**
     * Shows a short notification over the editor: a Notification, or text with a
     * Bootstrap color name such as "info" or "danger" and a duration in milliseconds.
     * It disappears when clicked, or after its duration; zero keeps it until clicked.
     */
    showMessage(message: Notification | string, indicator?: string, duration?: number): void;
    /** The notifications being shown, newest first. */
    messages(): Array<Notification>;
    closeMessage(notification: Notification): void;
    /** Shows a small form and resolves with its values, or null when cancelled. The selection is restored afterwards. */
    prompt(title: string, fields: Array<DialogField>): Promise<{
        [name: string]: any;
    } | null>;
    /** Applies a locale pack and rebuilds the interface text. */
    localize(pack: string | object): number;
    /** The attached collaboration client, or null. */
    get collaborationClient(): CollaborationConnection | null;
    /** The name of the user who holds the lock on a node, or "" when no one else does. */
    collaborationLockOwner(node: Node): string;
    /** @internal */
    attachCollaborationClient(client: CollaborationConnection): void;
    /** @internal */
    detachCollaborationClient(client: CollaborationConnection): void;
    /** @internal The locks other users hold: node IDs and their owners' names. */
    collaborationLocks(): Map<string, string>;
    /** @internal Forgets the annotation anchors local edits moved, such as when a shared document opens or closes. */
    clearMovedAnnotationAnchors(): void;
    /** @internal Draws the other users' presence again on the next frame. */
    refreshPresence(): void;
    /** @internal True while a change is still being made, such as a drag or an input-method composition. */
    get isCollaborationBusy(): boolean;
    /** @internal True when another user holds the lock on node, on a node containing it, or on a node it contains. */
    isLockedByCollaborator(node: Node): boolean;
    /** @internal The top-level node containing node, or null. */
    collaborationRootNode(node: Node): Node | null;
    /** @internal The document-level settings of toJSON, without serializing nodes. */
    collaborationSettings(): any;
    /** @internal The text selection being edited, in code points, or null. */
    collaborationTextSelection(): {
        start: number;
        length: number;
    } | null;
    /** @internal Comments may be added and changed; false for a collaborator with Read access. */
    get collaborationAnnotationsAllowed(): boolean;
    set collaborationAnnotationsAllowed(value: boolean);
    /** Shows each node's locked state again after node.locked changes, and stops editing a node that became locked. */
    refreshLocks(): void;
    /** @internal Replaces the locks other users hold: node IDs and their owners' names. */
    setCollaborationNodeLocks(locks: Map<string, string> | null): void;
    /** @internal Loads a server snapshot, keeping the selection. Returns false when it can't be loaded. */
    loadCollaborationSnapshot(snapshot: string): boolean;
    /** @internal Applies another user's document.atomic operation. Not an undo step; undo won't revert it. */
    applyCollaborationOperation(operation: any): boolean;
    /** @internal The anchors local edits moved since the last call, by annotation ID, in code points. */
    collaborationAnnotationAnchors(): any;
    /** @internal Applies the server's copy of an annotation, or its deletion. Not an undo step; undo won't revert it. */
    applyCollaborationAnnotation(message: any): void;
    /** @internal The server removed this user's access: the shared content and its undo history leave the editor. */
    clearCollaborationDocument(): void;
    /** The document as an object in the JSON document format. */
    toJSONObject(): object;
    toJSON(): string;
    /** Checks a document without loading it. */
    validateJSON(value: string | object): Array<ValidationIssue>;
    /** Loads a document. Returns false, leaving the editor unchanged, when it can't be loaded; see lastValidationIssues. */
    fromJSON(value: string | object): boolean;
    /** Replaces the document from JSON without validation or resetting undo. Used by undo and redo. */
    restoreDocument(value: string): void;
    /** Replaces the document with HTML. */
    /** Replaces the document with HTML. HTML with nothing the editor can import leaves the document as it was. */
    fromHTML(html: string): void;
    /** Replaces the document with Markdown. */
    fromMarkdown(markdown: string): void;
    /** Inserts HTML where the user is working, or after target. */
    insertHTML(html: string, target?: Node): void;
    insertMarkdown(markdown: string, target?: Node): void;
    /** Exports with a registered format: "html", "json", "markdown" or "text", or one added to exporters. Returns "" for an unknown identifier. */
    export(identifier: string): string;
    /** Offers an export to the user as a download. Returns false for an unknown identifier. */
    exportToFile(identifier: string, fileName?: string): boolean;
    /** HTML for the document. With includeDocumentElements, a complete page with a stylesheet. */
    /** The document as HTML. includeAnnotations appends the comment threads in a section after the content. */
    toHTML(includeDocumentElements?: boolean, includeAnnotations?: boolean): string;
    /** The stylesheet used by toHTML(true), as CSS text. */
    exportCSS(): string;
    /**
     * The stylesheet for HTML export. Node types add their own rules with a static
     * exportStyles(stylesheet) method.
     */
    exportStylesheet(): Stylesheet;
    /** The default color for a theme color. */
    static defaultThemeColor(kind: ThemeColors): DocumentColor;
    /** A color exported HTML is drawn with: the one set with setThemeColor, or the default. */
    themeColor(kind: ThemeColors): DocumentColor;
    /** Sets a color exported HTML is drawn with; null restores the default. */
    setThemeColor(kind: ThemeColors, value: DocumentColor | null): void;
    /** A theme color as CSS, from an editor or the defaults. alpha replaces its transparency, where 255 is fully transparent. */
    static themeCSS(editor: Editor | null, kind: ThemeColors, alpha?: number | null): string;
    toMarkdown(): string;
    toPlainText(): string;
    /** Prints the document. */
    print(): void;
}
