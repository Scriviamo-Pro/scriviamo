import { Editor, HTMLImporter, InspectorSection, Node, Stylesheet, ToolbarItem, ToolbarMenuItem } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const AttachmentsStrings: {
    TextAttachmentCaption: string;
    TextAttachmentToolbarTooltip: string;
    TextAttachmentNameCaption: string;
    TextDownloadAttachmentCaption: string;
    TextReplaceAttachmentCaption: string;
    TextAttachmentAddressPrompt: string;
    TextAttachmentUploadingCaption: string;
    TextAttachmentUnavailableCaption: string;
};
type AttachmentsStringsTable = typeof AttachmentsStrings;
declare module "scriviamo" {
    interface Strings extends AttachmentsStringsTable {
    }
}
/**
 * A file attached to the document, shown as a card with its name, size and a download button.
 * The file is uploaded through the editor's file uploader when it has one, or kept in the
 * document as a data: URI.
 */
export declare class AttachmentNode extends Node {
    static exportStyles(sheet: Stylesheet, editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static captionString: string;
    static icon: string;
    static keywords: string;
    /** Any file no other type takes. */
    static droppedFileTypes: Array<string>;
    static droppedFileImportPriority: number;
    static importDroppedFile(file: File, _editor: Editor): Node | null;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    /** The file's name, as shown and as it downloads. */
    fileName: string;
    /** The file's size in bytes, or 0 when unknown. */
    fileSize: number;
    mimeType: string;
    /** A data: URI holding the file, kept in the document so it travels with it. */
    resourceData: string;
    /** A remote address for the file. */
    resourceURL: string;
    /** While the file uploads, how far along it is, from 0 to 1; -1 otherwise. Not saved. */
    uploadProgress: number;
    get source(): string;
    get hasResource(): boolean;
    /** The name to show: the file's name, or the last part of its address. */
    get displayName(): string;
    /** The Bootstrap Icons class for the file's kind. */
    get fileIcon(): string;
    /** A size such as "1.2 MB", or "" when unknown. */
    static formatSize(bytes: number): string;
    /** The file's kind and size, such as "PDF · 1.2 MB". */
    get details(): string;
    /** Points the attachment at a data: URI or an address, without recording a change. */
    setSource(value: string): void;
    /** Attaches a file: uploads it through the editor, or embeds it. */
    loadFile(file: Blob): Promise<void>;
    chooseFile(): void;
    enterURL(): Promise<void>;
    /** Saves the file through the browser. */
    download(): void;
    protected build(body: HTMLElement): void;
    inspectorSections(): Array<InspectorSection>;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean;
    toJSON(): object;
    fromJSON(data: any): boolean;
    toHTML(): string;
    toMarkdown(): string;
    toPlainText(): string;
}
export {};
