import { Alignments, BackgroundImage, Directions, DocumentColor, Editor, FontOptions, HTMLImporter, InspectorItem, InspectorSection, RichText, Strings, Suggestions, TextHost, TextNode, ToolbarItem, ToolbarMenuItem } from "./internal";
export interface NodeBorder {
    visible: boolean;
    size: number;
    color: DocumentColor;
}
/** The class side of a node type, used to register and insert nodes. */
export interface NodeClass {
    new (): Node;
    /** The JSON "type" value. The toolbar identifier is "node:" + identifier. */
    identifier: string;
    caption: string;
    icon: string;
    /** Extra words matched by the insertion search. */
    keywords: string;
    /** False hides the type from the insertion menus while still restoring it from JSON. */
    insertable: boolean;
    /** Creates a node ready to insert, with its default content. */
    create(editor: Editor): Node;
    /** Makes nodes from an imported HTML element, or returns undefined to leave the element to other types. */
    importElement?(element: HTMLElement, importer: HTMLImporter): Node | Array<Node> | null | undefined;
    /**
     * Types with a higher priority are offered an imported element first; the default is 0 and
     * equal priorities go in registration order. Use it to claim elements another type also reads,
     * such as a video service's iframes, which embeds would otherwise take.
     */
    importPriority?: number;
    /** Markers typed at the start of a paragraph that turn it into this type. */
    markdownShortcuts?: Array<BlockShortcut>;
    /** The entries this type adds to the block type menus: [identifier, caption, icon]. */
    blockKinds?(strings: Strings, compact: boolean): Array<[string, string, string]>;
    /** Makes blocks of this type from another text block's plain content, when converting blocks. */
    fromBlockContent?(content: RichText, value: number, source: TextNode): Array<Node>;
}
/** A marker typed at the start of a paragraph that turns the paragraph into a node type. */
export interface BlockShortcut {
    pattern: RegExp;
    /** The value passed to setBlockType, such as a heading level, from the match. */
    value?: (match: RegExpMatchArray) => number;
    /** True for types without text, which are inserted before the paragraph instead of converting it. */
    insertsBlock?: boolean;
    /** Adjusts the converted node. */
    finish?: (node: Node, match: RegExpMatchArray) => void;
}
/**
 * A block in the document. Subclass it to add a content type: override
 * build to draw it, toJSON and fromJSON to save it, and toHTML and
 * toMarkdown to export it, then register the class with Editor.registerNodeType
 * (every new editor) or editor.nodeTypes (one editor).
 */
export declare class Node {
    #private;
    /**
     * The files this node type makes nodes from when they are dropped or pasted into
     * the editor: MIME types, which may end in "/*", or extensions such as ".csv".
     */
    static droppedFileTypes: Array<string>;
    /** Decides between node types that accept the same file: the highest wins. */
    static droppedFileImportPriority: number;
    /** Makes a node from a dropped or pasted file, or returns null to decline it. */
    static importDroppedFile(_file: File, _editor: Editor): Node | null;
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    static insertable: boolean;
    static create(_editor: Editor): Node;
    /** Makes nodes from an imported HTML element, or returns undefined to leave the element to other types. */
    static importElement(_element: HTMLElement, _importer: HTMLImporter): Node | Array<Node> | null | undefined;
    static markdownShortcuts: Array<BlockShortcut>;
    /** The entries this type adds to the block type menus: [identifier, caption, icon]. */
    static blockKinds(_strings: Strings, _compact: boolean): Array<[string, string, string]>;
    nodeId: string;
    editor: Editor | null;
    /** The container node that holds this node, or null at the document root. */
    parent: Node | null;
    lineHeight: number;
    lineSpacing: number;
    /** Supplies this node's text suggestions ahead of the editor's providers. Not saved with the document. */
    suggestionProvider: Suggestions.Provider | null;
    /** Replaces the editor's font choices and available formats while this node is formatted. Not saved with the document. */
    fontOptions: FontOptions | null;
    alignment: Alignments;
    direction: Directions;
    borderTop: NodeBorder;
    borderRight: NodeBorder;
    borderBottom: NodeBorder;
    borderLeft: NodeBorder;
    borderTopLeftRadius: number;
    borderTopRightRadius: number;
    borderBottomRightRadius: number;
    borderBottomLeftRadius: number;
    backgroundImage: BackgroundImage;
    /** Explicit width in points, or 0 to follow the natural width. Only used when canResize is true. */
    width: number;
    /** Explicit height in points, or 0 to follow the natural height. */
    height: number;
    /**
     * Locked nodes can't be edited, moved or deleted. Not saved. While collaborating, a
     * node is also locked when another user holds the lock on it, on a node containing
     * it, or on a node it contains.
     */
    get locked(): boolean;
    set locked(value: boolean);
    /** The rendered wrapper, while the node is in an editor. */
    element: HTMLElement | null;
    /** The rendered content inside the wrapper. */
    body: HTMLElement | null;
    static defaultBorder(): NodeBorder;
    get type(): string;
    get typeName(): string;
    get strings(): Strings;
    /** True when users can drag the node's resize handle. */
    get canResize(): boolean;
    /** True when the node toolbar offers Width and Height. */
    get toolbarCanResize(): boolean;
    /** False for nodes whose height follows their width, so the toolbar offers Width alone. */
    get toolbarResizesHeight(): boolean;
    /** The size the node toolbar shows: the explicit size, or the drawn size when it follows its content. */
    toolbarSize(): {
        width: number;
        height: number;
    };
    /** Sets a dimension from the node toolbar. Zero returns it to the natural size. */
    setToolbarSize(dimension: "width" | "height", value: number): void;
    /** True when the node can be narrower than its container, so it can be aligned within it. */
    get canAlignBlock(): boolean;
    /** The inspector's sections for this node. Override to add or change sections; call super to keep the built-in ones. */
    inspectorSections(): Array<InspectorSection>;
    /** True when the inspector's items depend on which of the node's hosts has the caret, such as a table's active cell. */
    get inspectorFollowsCaret(): boolean;
    /** Handles an action item that has no action of its own. Return true when handled. */
    inspectorAction(_item: InspectorItem): boolean;
    /** True for nodes whose main content is a paragraph of text that can be split, merged and converted. */
    get isTextual(): boolean;
    /** Editable text regions, in order. Set while the node builds. */
    hosts(): Array<TextHost>;
    get primaryHost(): TextHost | null;
    /** Lists of child nodes this node contains. */
    childLists(): Array<Array<Node>>;
    /** True when the child nodes are document-level blocks, which get the insertion gutter and drop targets. */
    get holdsBlocks(): boolean;
    /** Shows content that is hidden, such as a collapsed section's children, when a descendant is selected. */
    revealContent(): void;
    /** Where a node inserted while host has the caret goes, or null to insert it after this node. */
    insertionPoint(_host: TextHost): {
        list: Array<Node>;
        index: number;
    } | null;
    /** Called when one of the node's hosts gets the caret. */
    noteCaretHost(_host: TextHost): void;
    /** Called after the user inserts a new node of this type, to ask for its content. */
    inserted(): void;
    /** True for nodes that show the document's headings, which are refreshed when headings change. */
    get followsHeadings(): boolean;
    /** Reads type-specific styles from the element the node was imported from. */
    readImportedStyle(_style: CSSStyleDeclaration): void;
    /** The block kind the toolbar shows, such as "text" or "heading:2". */
    get blockKind(): string;
    /** Every descendant, depth first. */
    descendants(): Array<Node>;
    /** The node's position: its list and the index in it. */
    location(): {
        list: Array<Node>;
        index: number;
    } | null;
    protected addHost(host: TextHost): TextHost;
    /** Builds the node's DOM. The editor calls this; use refresh to rebuild an attached node. */
    render(): HTMLElement;
    /** Rebuilds the node in place, keeping the selection in its text when possible. */
    refresh(): void;
    /** Creates the node's content inside body. */
    protected build(_body: HTMLElement): void;
    /** Applies the common Node appearance: borders, corners, background image, size, alignment and direction. */
    protected applyAppearance(wrapper: HTMLElement, body: HTMLElement): void;
    get hasCornerRadius(): boolean;
    /** The block alignment, resolving Automatic to the editor's alignment. */
    resolvedAlignment(): Alignments;
    /** Called after a host read edited text from the DOM. */
    textChanged(_host: TextHost): void;
    /** Tells the editor the node's content or persistent properties changed. */
    changed(): void;
    /** Records an undo step before the node changes itself, such as from a toolbar action. */
    willChange(): void;
    /** Node-specific items for the contextual toolbar. */
    actions(): Array<ToolbarItem>;
    /** Handles one of the items returned by actions. Returns true when handled. */
    performAction(_item: ToolbarItem, _menuItem: ToolbarMenuItem | null): boolean;
    /**
     * Extra entries for the editor's context menu, after the clipboard commands and
     * the node's actions. Build them each time, so they reflect the node's state.
     */
    contextMenuItems(): Array<ToolbarMenuItem>;
    /** Handles one of the entries returned by contextMenuItems. Returns true when handled. */
    performContextMenuItem(_item: ToolbarMenuItem): boolean;
    /** Handles a key press while one of the node's hosts has focus. Return true to stop the editor's handling. */
    handleKeyDown(_event: KeyboardEvent, _host: TextHost | null): boolean;
    /** Handles a click in the node. Return true to stop the editor's handling. */
    handleClick(_event: MouseEvent): boolean;
    toJSON(): object;
    /** Restores the node. Missing names restore their defaults. Returns false when data can't be used. */
    fromJSON(data: any): boolean;
    /** Copies the common Node properties to another node, such as when converting a paragraph into a heading. */
    copyAppearanceTo(other: Node): void;
    toHTML(): string;
    toMarkdown(): string;
    toPlainText(): string;
    /** Whether the node writes anything into exported HTML. */
    get canExportHTML(): boolean;
    /** Common CSS for exported HTML: background image, borders, corners, direction and block alignment. */
    protected htmlBackgroundCSS(): string;
    protected htmlLineHeightCSS(): string;
    /** Wraps Markdown in an HTML element when the node has a background or border Markdown can't express. */
    protected markdownWithBackground(markdown: string): string;
}
