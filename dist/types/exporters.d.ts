/**
 * CSS rules collected by selector. Adding declarations to a selector that already
 * has a rule merges them into it, and setting a property that is already set
 * replaces its value in place. toString writes one block per selector in the order
 * the selectors were first added, then any at-rules, such as @media, as written.
 */
export declare class Stylesheet {
    #private;
    /** Adds the rules in CSS text. Comments are dropped; at-rules are kept as written. */
    addCSS(css: string): void;
    /** Adds declarations such as "color: red; margin: 0" to the rule for a selector. */
    addRule(selector: string, declarations: string): void;
    hasRule(selector: string): boolean;
    /** The value of a property in a selector's rule, or "" when it isn't set. */
    propertyValue(selector: string, propertyName: string): string;
    get ruleCount(): number;
    selectorAt(index: number): string;
    /** Sets a property in a selector's rule. A property already set keeps its position. */
    setProperty(selector: string, propertyName: string, value: string): void;
    /** The rules as CSS, one declaration per line, in the order they were added, followed by at-rules. */
    toString(): string;
}
export declare enum ExportFormats {
    custom = 0,
    html = 1,
    json = 2,
    markdown = 3,
    plainText = 4
}
/**
 * A named document-output format. The built-in ones route HTML, JSON, Markdown and
 * plain text to the editor's own exporters; subclass it and override export to add
 * an application format.
 */
export declare class Exporter {
    identifier: string;
    format: ExportFormats;
    fileExtension: string;
    mimeType: string;
    constructor(identifier: string, format?: ExportFormats);
    export(editor: any): string;
    /** Offers the export to the user as a download named fileName plus the extension. */
    exportToFile(editor: any, fileName?: string): boolean;
}
/**
 * The export formats an editor offers, keyed by identifier without regard to case.
 * Each editor starts with "html", "json", "markdown" and "text". Adding an exporter
 * with an existing identifier replaces it.
 */
export declare class Exporters {
    #private;
    constructor(owner: any);
    get owner(): any;
    add(item: Exporter): void;
    addAt(index: number, item: Exporter): void;
    indexOf(item: Exporter): number;
    item(identifier: string): Exporter | null;
    itemAt(index: number): Exporter | null;
    items(): Array<Exporter>;
    get lastIndex(): number;
    remove(item: Exporter | string): void;
    removeAt(index: number): void;
    removeAll(): void;
}
export declare enum NotificationTypes {
    info = 0,
    success = 1,
    warning = 2,
    danger = 3
}
/**
 * A short message shown over the editor. It disappears when clicked, or after
 * duration seconds; a duration of zero keeps it until it is clicked.
 */
export declare class Notification {
    message: string;
    type: NotificationTypes;
    title: string;
    duration: number;
    /** @internal The element showing it, while it is shown. */
    element: HTMLElement | null;
    constructor(message: string, type?: NotificationTypes, title?: string);
    /** The Bootstrap color name for the type. */
    get indicator(): string;
    static typeFor(indicator: string): NotificationTypes;
}
