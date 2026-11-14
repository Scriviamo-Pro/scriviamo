import { Editor, HTMLImporter, InspectorSection, Node } from "scriviamo";
/**
 * An example of a node type an application adds: an embedded YouTube video. It shows the
 * video's thumbnail with a play button; pressing play replaces it with YouTube's player. It
 * exports an iframe to HTML and Markdown, and claims YouTube iframes when HTML is imported.
 *
 *     import {YouTubeNode} from "./scriviamo.example.youtube.js"
 *
 *     editor.addNode(new YouTubeNode("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
 *
 * url accepts watch, share, Shorts, live and embed addresses, or a video ID; videoID is the
 * 11-character ID alone. The video keeps its 16:9 shape when it is resized.
 */
/** The example's interface text. A locale pack applied to an editor replaces any of it. */
declare const YouTubeStrings: {
    TextYouTubeCaption: string;
    TextYouTubeTooltip: string;
    TextYouTubeVideoCaption: string;
    TextYouTubeURLCaption: string;
    TextYouTubeURLDescription: string;
    TextYouTubeEmptyCaption: string;
    TextYouTubeVideoFormat: string;
    TextYouTubePlayCaption: string;
    TextYouTubePlayerTitle: string;
};
type YouTubeStringTable = typeof YouTubeStrings;
declare module "scriviamo" {
    interface Strings extends YouTubeStringTable {
    }
}
export declare class YouTubeNode extends Node {
    #private;
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    /** YouTube iframes are this type's, so it reads them before embeds do. */
    static importPriority: number;
    static create(editor: Editor): Node;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    /** The video ID in a YouTube address, or the value itself when it is an ID, or "". */
    static videoIDFrom(value: string): string;
    constructor(source?: string);
    get typeName(): string;
    get canResize(): boolean;
    /** The height follows the width, so the toolbar offers Width alone. */
    get toolbarResizesHeight(): boolean;
    /** The 11-character video ID, or "". Assigning an address keeps only its ID. */
    get videoID(): string;
    set videoID(value: string);
    /** The video's watch address, or "". Accepts any YouTube address or a video ID. */
    get url(): string;
    set url(value: string);
    protected build(body: HTMLElement): void;
    /** The frame carries the size and keeps the video's shape, so the node shrinks with a narrow editor. */
    protected applyAppearance(wrapper: HTMLElement, body: HTMLElement): void;
    inspectorSections(): Array<InspectorSection>;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
    toMarkdown(): string;
    toPlainText(): string;
}
export {};
