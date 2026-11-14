/**
 * Application-defined text suggestions. A Provider owns one trigger, such as
 * "@" or ":", and supplies Suggestion choices for the text typed after it. A
 * chosen suggestion becomes a semantic inline tag: its characters carry the
 * provider's identifier and the suggestion's identifier, so the tag survives
 * JSON, HTML and Markdown and can be recognized again when it is loaded.
 *
 *     import {Suggestions} from "scriviamo"
 *
 *     let people = new Suggestions.Provider("people", "@")
 *     people.add("ada", "Ada Lovelace")
 *     people.add("grace", "Grace Hopper")
 *     editor.suggestionProviders.add(people)
 */
import { DocumentColor, TextHost, TextStyle } from "./internal";
export declare namespace Suggestions {
    /** Syntax recognized immediately before the caret, and the range a chosen suggestion replaces. */
    class Request {
        identifier: string;
        trigger: string;
        query: string;
        startPosition: number;
        length: number;
        constructor(identifier: string, trigger: string, query: string, startPosition: number, length: number);
    }
    /**
     * One choice in the suggestion popup. caption is shown, insertText replaces the
     * matched range, filterText is matched against the query, and identifier is the
     * stable value kept with a committed tag.
     */
    class Suggestion {
        caption: string;
        insertText: string;
        filterText: string;
        identifier: string;
        /** An icon class, such as "bi bi-person", or an image URL. */
        icon: string;
        /** Secondary text shown after the caption. */
        detail: string;
        /** Application-defined data. */
        tag: any;
        constructor(caption: string, insertText?: string, identifier?: string);
        /** Fills a popup row and returns true, or returns false to use the standard row. */
        render(element: HTMLElement, selected: boolean): boolean;
    }
    /**
     * Recognizes one text protocol and supplies choices for it. Subclass it and
     * override match for custom syntax, suggestions for a dynamic source (it may
     * return a Promise), or commitSuggestion to control insertion.
     */
    class Provider {
        #private;
        identifier: string;
        trigger: string;
        /** Default colors of committed tags. */
        textColor: DocumentColor;
        backgroundColor: DocumentColor;
        borderColor: DocumentColor;
        constructor(identifier?: string, trigger?: string);
        /**
         * Adds a choice. With a string, the popup shows caption (or value) and inserting
         * it types the trigger followed by value, so add("ada", "Ada Lovelace") inserts "@ada".
         */
        add(value: Suggestion | string, caption?: string): void;
        get lastIndex(): number;
        /** The position of a suggestion, or of the first with the caption, ignoring case. */
        indexOf(suggestion: Suggestion | string): number;
        lookup(caption: string): Suggestion | null;
        items(): Array<Suggestion>;
        removeAt(index: number): void;
        removeAll(): void;
        /** A request when the text before the caret ends with the trigger and a query with no spaces. */
        match(textBeforeCaret: string, caretPosition: number, host: TextHost | null): Request | null;
        /** Choices for a request: those whose filter text starts with the query. */
        suggestions(request: Request, maximumResults?: number): Array<Suggestion> | Promise<Array<Suggestion>>;
        /** Replaces the request's range with the suggestion as a tag, and returns the caret position after it. */
        commitSuggestion(host: TextHost, request: Request, suggestion: Suggestion, currentStyle: TextStyle | null): number;
        static isSpace(character: string): boolean;
    }
    /**
     * Inserts emoji by shortcode: typing a colon and part of a name, such as ":thu",
     * lists matching emoji, and choosing one replaces the shortcode with the emoji
     * as ordinary text. Every editor starts with one, identified as "emoji".
     */
    class EmojiProvider extends Provider {
        #private;
        constructor();
        /**
         * A request when the text before the caret is a colon that starts a word,
         * followed by at least two shortcode characters, so times such as 10:30 and
         * labels such as "Note:" don't open the popup.
         */
        match(textBeforeCaret: string, caretPosition: number, host: TextHost | null): Request | null;
        /** Shortcodes that start with the query, then those with a keyword that does, then those containing it. */
        suggestions(request: Request, maximumResults?: number): Array<Suggestion>;
        /** The emoji is ordinary text in the current style, not a tag. */
        commitSuggestion(host: TextHost, request: Request, suggestion: Suggestion, currentStyle: TextStyle | null): number;
    }
}
/**
 * The editor's suggestion providers, keyed by identifier, in the order the
 * editor asks them. A node's own suggestionProvider takes priority over these.
 */
export declare class SuggestionProviders {
    #private;
    constructor(owner: any);
    get owner(): any;
    /** Adds a provider to the end, replacing one with the same identifier in place. */
    add(item: Suggestions.Provider): void;
    /** Inserts a provider at a position, removing one with the same identifier first. */
    addAt(index: number, item: Suggestions.Provider): void;
    indexOf(item: Suggestions.Provider): number;
    item(identifier: string): Suggestions.Provider | null;
    itemAt(index: number): Suggestions.Provider | null;
    items(): Array<Suggestions.Provider>;
    get lastIndex(): number;
    remove(item: Suggestions.Provider | string): void;
    removeAt(index: number): void;
    removeAll(): void;
}
