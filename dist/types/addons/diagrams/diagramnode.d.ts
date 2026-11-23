import { BlockShortcut, CodeBlockNode, Editor, HTMLImporter, InspectorSection, Node, Stylesheet, TextHost } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const DiagramsStrings: {
    TextDiagramCaption: string;
    TextDiagramSourceCaption: string;
    TextDiagramRedrawCaption: string;
    TextDiagramPlaceholder: string;
    TextDiagramLoadingCaption: string;
    TextDiagramUnavailableMessage: string;
};
type DiagramsStringsTable = typeof DiagramsStrings;
declare module "scriviamo" {
    interface Strings extends DiagramsStringsTable {
    }
}
/**
 * Loads Mermaid, which draws the diagrams, the first time one is shown. By default it comes from
 * a CDN. An application that bundles Mermaid itself, or whose content security policy doesn't
 * allow the CDN, passes it to use() before diagrams are shown.
 *
 *     import mermaid from "mermaid"
 *     DiagramRenderer.use(mermaid)
 */
export declare class DiagramRenderer {
    #private;
    /** Where Mermaid's ES module is loaded from. */
    static moduleURL: string;
    /** Settings passed to mermaid.initialize. securityLevel "strict" keeps scripts and clicks out of diagrams. */
    static settings: {
        [name: string]: unknown;
    };
    /** The Mermaid themes for light and dark pages. A theme in settings takes precedence over both. */
    static themes: {
        light: string;
        dark: string;
    };
    /** Uses a Mermaid the application loaded itself, instead of loading it from moduleURL. */
    static use(mermaid: any): void;
    /** Mermaid, once it has loaded; null before then. */
    static get mermaid(): any;
    /** Resolves with Mermaid, loading it the first time. */
    static load(): Promise<any>;
    /** Draws a diagram, resolving with its SVG. dark picks Mermaid's dark theme. */
    static render(source: string, dark?: boolean): Promise<string>;
}
/**
 * A diagram written in Mermaid's language and drawn with Mermaid: flowcharts, sequence diagrams,
 * Gantt charts and more. The source is edited like a code block; while the block isn't selected
 * only the diagram shows. HTML exports hold the drawn SVG; Markdown exports use ```mermaid
 * fences, which GitHub and many other sites draw. Inside an element with data-bs-theme="dark" the
 * diagram uses a dark theme, and it's redrawn when that changes.
 */
export declare class DiagramNode extends CodeBlockNode {
    #private;
    static exportStyles(sheet: Stylesheet, editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static captionString: string;
    static icon: string;
    static keywords: string;
    static importPriority: number;
    static markdownShortcuts: Array<BlockShortcut>;
    static create(_editor: Editor): Node;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    /** Whether the diagram is on the page. */
    get isShown(): boolean;
    /** Whether the diagram, as drawn, uses the other theme from the one around it now. */
    get drawnForOtherTheme(): boolean;
    /** The diagram's Mermaid source. */
    get source(): string;
    set source(value: string);
    /** The drawn diagram's SVG, when it has been drawn from the current source; otherwise "". */
    get svg(): string;
    get typeName(): string;
    protected get placeholderText(): string;
    inspectorSections(): Array<InspectorSection>;
    protected build(body: HTMLElement): void;
    textChanged(host: TextHost): void;
    /** Draws the diagram now, resolving once it is shown. */
    redraw(): Promise<void>;
    fromJSON(data: any): boolean;
    toJSON(): object;
    toHTML(): string;
    toMarkdown(): string;
    toPlainText(): string;
}
export {};
