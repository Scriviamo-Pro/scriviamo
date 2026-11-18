import { Editor, EditorExtension, TextHost, TextStyle } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const StatusStrings: {
    TextInsertStatusCaption: string;
    TextStatusRemoveCaption: string;
    TextStatusDraft: string;
    TextStatusInProgress: string;
    TextStatusInReview: string;
    TextStatusApproved: string;
    TextStatusBlocked: string;
    TextStatusDone: string;
};
type StatusStringsTable = typeof StatusStrings;
declare module "scriviamo" {
    interface Strings extends StatusStringsTable {
    }
}
/** The suggestion provider identifier that marks statuses in text. */
export declare const StatusPillTag = "status";
/** A status users can choose: its name, and its color as CSS, such as "#1fa774". */
export interface StatusDefinition {
    name: string;
    color: string;
}
/** A status found in text. */
export interface StatusPill {
    host: TextHost;
    start: number;
    end: number;
    id: string;
    name: string;
}
/**
 * Statuses inside text, such as "Draft" or "Approved", drawn as colored pills. A status is a tag
 * in the text, marked with the "status" provider, whose text is its name. The application
 * chooses the statuses; clicking a pill changes it.
 */
export declare class StatusPills {
    #private;
    /**
     * The statuses every editor offers, unless set for an editor with StatusPills.setStatuses. By
     * default, the six below in the editor's language.
     */
    static statuses: Array<StatusDefinition> | null;
    /** The statuses an editor offers. */
    static statusesFor(editor: Editor | null): Array<StatusDefinition>;
    /** Sets the statuses one editor offers. */
    static setStatuses(editor: Editor, statuses: Array<StatusDefinition>): void;
    /** A status's color: the one with its name, ignoring case, or gray. */
    static colorOf(name: string, editor?: Editor | null): string;
    /** A pill's CSS: a pale tint of its color behind text in the color itself. */
    static css(color: string): string;
    static style(base: TextStyle, id?: string): TextStyle;
    static untagged(style: TextStyle): TextStyle;
    static pills(host: TextHost): Array<StatusPill>;
    static at(host: TextHost, start: number, end?: number): StatusPill | null;
    static allowedIn(host: TextHost | null): boolean;
    /** Puts a status in place of start through end, or removes the range when name is "". One undo step. */
    static replace(editor: Editor, host: TextHost, start: number, end: number, name: string, id?: string): boolean;
    /** Changes the status beside the caret, or puts the first status at the caret and offers the rest. */
    static insert(editor: Editor): boolean;
    /** Shows the statuses to change a pill to. */
    static choose(editor: Editor, pill: StatusPill): void;
    /** Draws a status as a pill in its color. */
    static render(elements: Array<HTMLElement>, host: TextHost): void;
}
/** The Insert Status tool, clicking pills to change them, and Backspace and Delete over them. */
export declare const StatusPillsExtension: EditorExtension;
export {};
