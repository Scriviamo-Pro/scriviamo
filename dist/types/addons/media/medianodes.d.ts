import { Editor, HTMLImporter, InspectorSection, Node, Stylesheet, ToolbarItem, ToolbarMenuItem } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const MediaStrings: {
    TextEnterMediaURLPrompt: string;
    TextChoosePreviewImageCaption: string;
    TextPreviewFromFrameCaption: string;
    TextRemovePreviewCaption: string;
    TextMediaUnavailableCaption: string;
    TextReplaceMediaCaption: string;
    TextAudioCaption: string;
    TextVideoCaption: string;
    TextAudioToolbarTooltip: string;
    TextVideoToolbarTooltip: string;
    TextChooseMediaFileDialogTitle: string;
    TextChooseVideoPreviewImageDialogTitle: string;
    TextEmbeddedMediaCaption: string;
    TextMediaPlaybackErrorMessage: string;
    TextMediaSourceCaption: string;
    TextMediaURLDialogTitle: string;
    TextNoMediaSelectedCaption: string;
    TextPreviewImageOpenErrorMessage: string;
    TextRemovePreviewImageCaption: string;
    TextVideoPreviewImageCaption: string;
};
type MediaStringsTable = typeof MediaStrings;
declare module "scriviamo" {
    interface Strings extends MediaStringsTable {
    }
}
/**
 * Audio or video from a file embedded in the document (a data: URI) or from
 * an address. The base class of AudioNode and VideoNode.
 */
export declare class MediaNode extends Node {
    /** Reads a media node's source, size and preview picture from an audio or video element. */
    static readElement(media: MediaNode, element: HTMLElement, importer: HTMLImporter): MediaNode;
    inspectorSections(): Array<InspectorSection>;
    static exportStyles(sheet: Stylesheet, editor: Editor | null): void;
    static insertable: boolean;
    /** A data: URI holding the media, kept in the document so it travels with it. */
    resourceData: string;
    /** A remote address for the media. */
    resourceURL: string;
    /** A local file path saved with the document. Kept so saving doesn't lose it; browsers can't open it. */
    resourcePath: string;
    protected get defaultWidth(): number;
    protected get defaultHeight(): number;
    protected get accept(): string;
    get canResize(): boolean;
    /** The address the media plays from. */
    get source(): string;
    get hasResource(): boolean;
    /** Sets the media from a data: URI or an address. */
    setResource(value: string): void;
    /** Embeds a media file. */
    loadFile(file: Blob): Promise<void>;
    chooseFile(): void;
    enterURL(): Promise<void>;
    /** Creates the playing element. */
    protected mediaElement(): HTMLMediaElement;
    protected build(body: HTMLElement): void;
    protected configureFrame(frame: HTMLElement, _media: HTMLMediaElement, handle: HTMLElement): void;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toPlainText(): string;
}
export declare class AudioNode extends MediaNode {
    static identifier: string;
    static caption: string;
    static captionString: string;
    static icon: string;
    static keywords: string;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    static droppedFileTypes: Array<string>;
    /** File name extensions of audio, for addresses pasted or dropped on their own. */
    static audioExtensions: Array<string>;
    /** A sound's address, pasted or dropped on its own, becomes an audio block. */
    static importDroppedText(text: string, _editor: Editor): Node | null;
    static importDroppedFile(file: File, _editor: Editor): Node | null;
    static insertable: boolean;
    protected get defaultWidth(): number;
    get toolbarResizesHeight(): boolean;
    protected get accept(): string;
    protected mediaElement(): HTMLMediaElement;
    toHTML(): string;
}
export declare class VideoNode extends MediaNode {
    #private;
    static identifier: string;
    static caption: string;
    static captionString: string;
    static icon: string;
    static keywords: string;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    static droppedFileTypes: Array<string>;
    /** File name extensions of video, for addresses pasted or dropped on their own. */
    static videoExtensions: Array<string>;
    /** A video's address, pasted or dropped on its own, becomes a video block. */
    static importDroppedText(text: string, _editor: Editor): Node | null;
    static importDroppedFile(file: File, _editor: Editor): Node | null;
    static insertable: boolean;
    /** A poster picture as base64 PNG data, without a data URI prefix. */
    previewImage: string;
    protected get accept(): string;
    protected mediaElement(): HTMLMediaElement;
    protected configureFrame(frame: HTMLElement, media: HTMLMediaElement, handle: HTMLElement): void;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
}
export {};
