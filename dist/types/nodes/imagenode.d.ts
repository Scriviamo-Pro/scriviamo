import { Editor, InspectorSection, Node, RichText, Stylesheet, ToolbarItem, ToolbarMenuItem } from "../internal";
export declare enum ImageFillModes {
    /** object-fit: contain */
    fit = 0,
    /** object-fit: cover */
    fill = 1,
    /** object-fit: fill */
    stretch = 2
}
/** A picture with an optional caption. Pictures chosen from files are embedded in the document. */
export declare class ImageNode extends Node {
    #private;
    static exportStyles(sheet: Stylesheet, editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    static droppedFileTypes: Array<string>;
    static importDroppedFile(file: File, _editor: Editor): Node | null;
    /** Largest width given to a newly loaded picture. */
    static maximumInitialWidth: number;
    captionText: RichText;
    displayWidth: number;
    displayHeight: number;
    fillMode: ImageFillModes;
    /** Base64-encoded picture file, without a data URI prefix. */
    imageData: string;
    sourceURL: string;
    get toolbarCanResize(): boolean;
    toolbarSize(): {
        width: number;
        height: number;
    };
    setToolbarSize(dimension: "width" | "height", value: number): void;
    get canAlignBlock(): boolean;
    get caption(): string;
    set caption(value: string);
    /** The address the picture is shown from: a data URI for embedded pictures, otherwise sourceURL. */
    get source(): string;
    get hasImage(): boolean;
    /** True while a picture is uploading through the editor's fileUploader. */
    get isUploading(): boolean;
    protected build(body: HTMLElement): void;
    /** Asks for a picture file and embeds it. */
    inserted(): void;
    inspectorSections(): Array<InspectorSection>;
    chooseFile(): void;
    /**
     * Adds a picture file, such as one chosen, dropped or pasted. With the editor's fileUploader,
     * it is uploaded and shown from its address; otherwise it is embedded in the document.
     */
    loadFile(file: Blob): Promise<boolean>;
    /** Asks for a picture address. */
    enterURL(): Promise<void>;
    setURL(url: string): void;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
    toMarkdown(): string;
    toPlainText(): string;
}
