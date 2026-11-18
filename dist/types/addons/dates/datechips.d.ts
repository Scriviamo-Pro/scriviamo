import { Editor, EditorExtension, TextHost, TextStyle } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const DatesStrings: {
    TextInsertDateCaption: string;
    TextDateChipCaption: string;
    TextDateTodayCaption: string;
    TextDateTomorrowCaption: string;
    TextDateRemoveCaption: string;
};
type DatesStringsTable = typeof DatesStrings;
declare module "scriviamo" {
    interface Strings extends DatesStringsTable {
    }
}
/** The suggestion provider identifier that marks dates in text. */
export declare const DateChipTag = "date";
/** A date found in text: where it is, and its ISO date, such as 2026-11-17. */
export interface DateChip {
    host: TextHost;
    start: number;
    end: number;
    id: string;
    date: string;
}
/**
 * Dates inside text, shown as chips in the reader's language, such as "Nov 17, 2026" or
 * "17 nov. 2026". A date is a tag in the text, marked with the "date" provider, whose text is the
 * ISO date. Clicking one changes it with a date picker. HTML exports hold a <time> element.
 */
export declare class DateChips {
    /** How dates read, as options for Intl.DateTimeFormat. */
    static format: Intl.DateTimeFormatOptions;
    static isValid(date: string): boolean;
    /** An ISO date for a Date, in local time. */
    static iso(value: Date): string;
    static today(): string;
    /** A date as it reads in a language, or the ISO date when it can't be read. */
    static display(date: string, language?: string): string;
    /** The page's language, for dates in an editor. */
    static language(editor: Editor | null): string | undefined;
    static style(base: TextStyle, id?: string): TextStyle;
    static untagged(style: TextStyle): TextStyle;
    /** The dates in one text, in order. */
    static dates(host: TextHost): Array<DateChip>;
    static at(host: TextHost, start: number, end?: number): DateChip | null;
    static allowedIn(host: TextHost | null): boolean;
    /** Puts a date in place of start through end, or removes the range when date is "". One undo step. */
    static replace(editor: Editor, host: TextHost, start: number, end: number, date: string, id?: string): boolean;
    /** Changes the date beside the caret, or puts today's date at the caret. */
    static insert(editor: Editor): boolean;
    /** Shows the date picker for a date in the text. */
    static edit(editor: Editor, chip: DateChip): void;
    /** Draws a date: its ISO text stays as hidden text, and the chip shows it in the reader's language. */
    static render(elements: Array<HTMLElement>, host: TextHost): void;
}
/** The Insert Date tool, clicking dates to change them, and Backspace and Delete over them. */
export declare const DateChipsExtension: EditorExtension;
export {};
