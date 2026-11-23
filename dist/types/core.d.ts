/**
 * Scriviamo
 * @license
 * (c) 2026 GraffitiSuite Solutions
 * agcyphers[at]graffitisuite[dot]com
 * https://graffitisuite.com/
 *
 * License: MIT (see LICENSE.md)
 */
/** Identifies the saved JSON document format. */
export declare const CurrentDocumentVersion: number;
/** Default document font size for documents that do not store one. */
export declare const DefaultFontSize: number;
export declare enum Alignments {
    automatic = 0,
    leading = 1,
    middle = 2,
    trailing = 3
}
export declare enum Directions {
    automatic = 0,
    leftToRight = 1,
    rightToLeft = 2
}
export declare enum ToolbarDisplayModes {
    iconOnly = 0,
    iconAndText = 1,
    textOnly = 2
}
/** Paragraph separator. Separates list items, cell paragraphs, and code lines. */
export declare const ParagraphBreak: string;
/** A font's normal line height as a multiple of its size, which CSS line heights are converted from. */
export declare const NormalLineHeightRatio: number;
/** Soft line break (U+2028), inserted with Shift+Enter. */
export declare const LineBreak: string;
/**
 * A color in the document JSON form. Channels run from 0 through 255, and
 * alpha is inverted: 0 is opaque and 255 is fully transparent.
 */
export interface DocumentColor {
    red: number;
    green: number;
    blue: number;
    alpha: number;
}
/** The colors exported HTML is drawn with, read with Editor.themeColor. */
export declare enum ThemeColors {
    background = 0,
    primary = 1,
    selection = 2,
    textSelection = 3,
    information = 4,
    success = 5,
    warning = 6,
    danger = 7,
    text = 8,
    textMuted = 9,
    link = 10,
    border = 11,
    borderStrong = 12,
    surface = 13,
    dark = 14,
    light = 15,
    highlight = 16
}
export declare class Colors {
    /** Opaque black, the default color value. */
    static get empty(): DocumentColor;
    static make(red: number, green: number, blue: number, alpha?: number): DocumentColor;
    static clone(value: DocumentColor): DocumentColor;
    static equals(a: DocumentColor, b: DocumentColor): boolean;
    static isEmpty(value: DocumentColor): boolean;
    static fromJSON(data: any, fallback: DocumentColor): DocumentColor;
    static toJSON(value: DocumentColor): object;
    private static channel;
    /** CSS rgba() color string, such as rgba(12,34,56,0.5). Converts the document alpha scale to CSS opacity. */
    static toCSS(value: DocumentColor): string;
    static toHex(value: DocumentColor): string;
    /**
     * Parses a CSS color: #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba() or a name,
     * also when it is part of a shorthand value such as "1px solid #ccc". Returns
     * null when there is no color.
     */
    static fromCSS(value: string): DocumentColor | null;
}
export declare class Utilities {
    /** The protocols isSafeURL allows by default. Addresses without one, such as /page or #part, are always allowed. */
    static safeProtocols: Array<string>;
    /**
     * True when an address can't run script when followed: a relative address, or one whose
     * protocol is in protocols. Exported HTML and the editor's links use only addresses that pass,
     * so a document that was tampered with can't carry a javascript: link.
     */
    static isSafeURL(url: string, protocols?: Array<string>): boolean;
    /** The pixel size of base64 PNG, GIF or JPEG data, read from its header, or null. */
    static imageDataSize(base64: string): {
        width: number;
        height: number;
    } | null;
    /** True when text's first strong character is written right to left, as in Hebrew or Arabic. */
    static isRightToLeftText(value: string): boolean;
    /** True for a language tag such as he-IL or ar_SA whose language is written right to left. */
    static isRightToLeftLanguage(tag: string): boolean;
    static uuid(): string;
    static escapeText(value: string): string;
    static escapeAttribute(value: string): string;
    static number(value: any, fallback: number): number;
    static integer(value: any, fallback: number): number;
    static boolean(value: any, fallback: boolean): boolean;
    static string(value: any, fallback?: string): string;
    static clamp(value: number, minimum: number, maximum: number): number;
    /** Builds a CSS font-family list from a document font name. */
    static fontFamilyCSS(fontName: string): string;
    /** Each registered web font's fallback, by its family in lowercase; WebFonts keeps it. */
    static webFontFallbacks: Map<string, string>;
    /** Converts a heading's text into a URL fragment. */
    static slug(value: string): string;
    /** Detects the MIME type of base64-encoded picture data from its leading bytes. */
    static pictureMimeType(base64: string): string;
    static element<K extends keyof HTMLElementTagNameMap>(tag: K, classes?: string, attributes?: {
        [name: string]: string;
    }): HTMLElementTagNameMap[K];
    /** Replaces %token% placeholders in a localized format string. */
    static format(value: string, tokens: {
        [name: string]: string | number;
    }): string;
}
/** Converts between JavaScript (UTF-16) string indexes and document character (code point) indexes. */
export declare class CodePoints {
    /** Number of code points in the string, the character count used by the JSON format. */
    static count(value: string): number;
    /** Returns the UTF-16 width (1 or 2) of the character starting at index. */
    static widthAt(value: string, index: number): number;
}
