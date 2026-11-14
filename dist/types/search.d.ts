import { Editor, Node, TextHost } from "./internal";
/** A match found by Search. */
export declare class FindResult {
    node: Node;
    hostIndex: number;
    start: number;
    length: number;
    constructor(node: Node, hostIndex: number, start: number, length: number);
    get host(): TextHost | null;
    get text(): string;
}
/** Find and replace across every text in the document, with an optional search bar. */
export declare class Search extends EventTarget {
    #private;
    query: string;
    replacement: string;
    caseSensitive: boolean;
    wholeWord: boolean;
    useRegEx: boolean;
    patternError: string;
    constructor(editor: Editor);
    get owner(): Editor;
    get matchCount(): number;
    get currentIndex(): number;
    get current(): FindResult | null;
    get visible(): boolean;
    /** Finds every match of query, or of the current query. */
    findAll(query?: string): Array<FindResult>;
    /** Finds the first match at or after the caret and selects it. */
    find(query: string): FindResult | null;
    findNext(): FindResult | null;
    findPrevious(): FindResult | null;
    selectResult(result: FindResult): void;
    /** Replaces a match, or the current match. Returns true when it replaced text. */
    replace(resultOrReplacement?: FindResult | string, replacement?: string): boolean;
    /** Replaces every match. Returns the number replaced. */
    replaceAll(queryOrReplacement?: string, replacement?: string): number;
    /** Shows the search bar. */
    show(replace?: boolean): void;
    close(): void;
}
