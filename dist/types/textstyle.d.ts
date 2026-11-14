import { DocumentColor } from "./internal";
/**
 * The font names and sizes the toolbar offers, whether a custom size may be typed,
 * and which character formats are available. The editor has one; a node may set
 * its own, which replaces those choices while that node is being formatted.
 */
export declare class FontOptions {
    #private;
    allowBold: boolean;
    allowItalic: boolean;
    allowUnderline: boolean;
    allowStrikethrough: boolean;
    allowCode: boolean;
    allowHighlight: boolean;
    allowKeyboard: boolean;
    allowSuperscript: boolean;
    allowSubscript: boolean;
    /** Adds Custom… to the size menu, for typing any size from 1 to 1000. */
    allowCustomFontSize: boolean;
    static readonly defaultFontNames: Array<string>;
    static readonly defaultSizes: Array<number>;
    constructor(includeSystemFonts?: boolean, includeDefaultSizes?: boolean);
    fontNames(): Array<string>;
    sizes(): Array<number>;
    fontNameAt(index: number): string;
    sizeAt(index: number): number;
    get lastFontNameIndex(): number;
    get lastSizeIndex(): number;
    indexOfFontName(value: string): number;
    indexOfSize(value: number): number;
    addFontName(value: string): void;
    addFontNameAt(index: number, value: string): void;
    addSize(value: number): void;
    addSizeAt(index: number, value: number): void;
    removeFontName(value: string): void;
    removeFontNameAt(index: number): void;
    removeAllFontNames(): void;
    removeSize(value: number): void;
    removeSizeAt(index: number): void;
    removeAllSizes(): void;
    /** Replaces the font names. */
    setFontNames(values: Array<string>): void;
    /** Replaces the sizes. Zero, which stands for Default, is ignored. */
    setSizes(values: Array<number>): void;
    /** Whether a character format is available, by its property name such as "bold". */
    allows(name: string): boolean;
}
/**
 * Character formatting. Each character of a RichText has its own TextStyle,
 * Field names match the JSON names.
 */
export declare class TextStyle {
    #private;
    backgroundColor: DocumentColor;
    bold: boolean;
    code: boolean;
    fontName: string;
    fontSize: number;
    hasBackgroundColor: boolean;
    hasLinkColor: boolean;
    highlight: boolean;
    italic: boolean;
    keyboard: boolean;
    linkColor: DocumentColor;
    linkTarget: string;
    linkTitle: string;
    linkURL: string;
    strikethrough: boolean;
    subscript: boolean;
    superscript: boolean;
    suggestionBackgroundColor: DocumentColor;
    suggestionBorderColor: DocumentColor;
    suggestionIdentifier: string;
    suggestionProviderIdentifier: string;
    suggestionTextColor: DocumentColor;
    textColor: DocumentColor;
    underline: boolean;
    static get defaults(): TextStyle;
    static fromJSON(data: any): TextStyle;
    /** Applies the names present in data, keeping current values for missing names. */
    applyJSON(data: any): void;
    clone(): TextStyle;
    equals(other: TextStyle): boolean;
    isDefault(): boolean;
    /** Every attribute. */
    toJSON(): object;
    /** Only the attributes that differ from a new TextStyle, as written into a style table. */
    toCompactJSON(): object;
    /** Stable key used to group runs and build style tables. */
    key(): string;
    /** True when the inline formats that change the element (code, kbd, sup, sub, mark) match. */
    sameInlineFormat(other: TextStyle): boolean;
    /** CSS used while editing. Default colors are left out so the theme applies. */
    editorCSS(): string;
    /** CSS written into exported HTML. */
    htmlCSS(): string;
}
