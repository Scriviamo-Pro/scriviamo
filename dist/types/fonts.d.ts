/** One file of a font: a weight and a style. */
export interface WebFontFace {
    /** The file's address, relative to the page or absolute. */
    url: string;
    /** A weight such as 400 or "bold", or a range such as "100 900" for a variable font; 400 by default. */
    weight?: string | number;
    /** "normal" (the default) or "italic". */
    style?: string;
    /** "woff2", "woff", "truetype" or "opentype"; read from the address's extension when left out. */
    format?: string;
    /** The characters the file covers, as CSS unicode-range, such as "U+0000-00FF". */
    unicodeRange?: string;
}
export interface WebFontOptions {
    /** The family used while the font loads, or where it can't: "serif", "sans-serif", "monospace", "cursive" or another font. */
    fallback?: string;
    /** Whether EPUB, Word and OpenDocument files store the font's files. On by default; turn it off when the font's license doesn't allow it. */
    embed?: boolean;
    /** Whether editors made after this offer the font in their Font menu. On by default. */
    addToMenu?: boolean;
}
/** A font registered with WebFonts. */
export declare class WebFont {
    #private;
    readonly family: string;
    readonly faces: Array<WebFontFace>;
    readonly fallback: string;
    readonly embed: boolean;
    constructor(family: string, faces: Array<WebFontFace>, fallback: string, embed: boolean);
    /** The font as a CSS font-family value, with its fallback. */
    get css(): string;
    /** The faces whose files Word and OpenDocument can store: TrueType and OpenType. */
    get desktopFaces(): Array<WebFontFace>;
    /** Adds the font to a page's fonts, without loading it until text uses it. */
    addTo(target: Document): void;
    /** Removes the font from the page it was added to. */
    removeFromPage(): void;
    /** Loads every face in the page, and resolves whether they all loaded. */
    load(): Promise<boolean>;
}
/**
 * Fonts loaded from files, such as a brand's typeface or one from Google Fonts or Fontsource.
 * A registered font is loaded into the page, offered in the Font menu, and carried by exports:
 * HTML and PDF reference its files, and EPUB, Word and OpenDocument files store them.
 */
export declare class WebFonts {
    #private;
    /**
     * Registers a font. faces is a file's address, a face, or several, one for each weight and
     * style. Registering a family again replaces it.
     */
    static register(family: string, faces: string | WebFontFace | Array<string | WebFontFace>, options?: WebFontOptions): WebFont;
    /** Removes a registered font from the registry, the page and the Font menu of editors made after this. */
    static remove(family: string): void;
    /** A registered font by its family name, ignoring case, or null. */
    static item(family: string): WebFont | null;
    /** Every registered font, in the order registered. */
    static all(): Array<WebFont>;
    /** The registered fonts a document uses: the editor's font, and any block's or text's. */
    static used(editor: {
        fontName: string;
        toJSONObject(): any;
    }): Array<WebFont>;
    /** Loads a registered font's files in the page, and resolves whether they all loaded. */
    static load(family: string): Promise<boolean>;
    /** @font-face rules for fonts. url gives each file's address in the result; by default its absolute address. */
    static fontFaceCSS(fonts: Array<WebFont>, url?: (face: WebFontFace, font: WebFont) => string): string;
    /** The font a CSS font-family value names first, or "" for the system font and generic families. */
    static familyName(css: string): string;
    /** A face's format: its own, or read from its address. */
    static format(face: WebFontFace): string;
    /** A face's file extension, from its format. */
    static extension(face: WebFontFace): string;
    /** A face's media type, as EPUB and OpenDocument packages list it. */
    static mediaType(face: WebFontFace): string;
    /** Whether a face is bold: its weight, or the start of its range, is 600 or more. */
    static isBold(face: WebFontFace): boolean;
    /** Whether a face is italic or oblique. */
    static isItalic(face: WebFontFace): boolean;
    /** An address as an absolute one, against the page's. */
    static absoluteURL(url: string): string;
    /** A face's file, fetched once and kept. Rejects when it can't be fetched. */
    static bytes(face: WebFontFace): Promise<Uint8Array>;
    /** Loads the fonts a page's text uses, such as a printing frame's, and resolves when they're ready, or after timeout milliseconds. */
    static settle(target: Document, timeout?: number): Promise<void>;
}
