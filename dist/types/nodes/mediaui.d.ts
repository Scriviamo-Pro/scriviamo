import { Editor, Node } from "../internal";
/** Shared pieces for blocks that show media: the empty-state chooser and the resize handle. */
export declare class MediaUI {
    /** An empty-state panel with buttons to choose a file or enter an address. */
    static placeholder(node: Node, icon: string, caption: string, chooseFile: (() => void) | null, enterURL: () => void): HTMLElement;
    /** Lets the user drag handle to resize frame. ratio is height / width, or 0 to keep the height. */
    static attachResize(node: Node, handle: HTMLElement, frame: HTMLElement, ratio: () => number, done: (width: number, height: number) => void): void;
    /**
     * Makes a resize handle a slider the keyboard reaches with Tab, when the editor's keyboardControls
     * is on: the arrow keys make the block
     * 10 pixels narrower or wider (50 with Shift), Page Up and Page Down 100, Home and End the
     * narrowest and widest. Left and right follow the text's direction. Each change is one undo step.
     */
    static attachKeyboardResize(node: Node, handle: HTMLElement, frame: HTMLElement, ratio: () => number, done: (width: number, height: number) => void, minimum?: number): void;
    /** Reads a file as a data: URI. */
    static readDataURI(file: Blob): Promise<string>;
    static pickFile(accept: string, handler: (file: File) => void): void;
}
/** What a file is being stored for. */
export type FileUploadKind = "image" | "audio" | "video" | "background" | "file";
/** One file for an application's uploader to store. */
export interface FileUpload {
    file: Blob;
    /** The file's name, or "" for pasted content without one. */
    name: string;
    /** The file's MIME type, such as "image/png", or "". */
    type: string;
    kind: FileUploadKind;
    /** The node the file is for, or null for the document's background and the inspector. */
    node: Node | null;
    editor: Editor;
    /** Reports progress, from 0 to 1, for the editor to show. */
    progress(fraction: number): void;
    /** Aborted when the user cancels; pass it to fetch. */
    signal: AbortSignal;
}
/**
 * The application's uploader: stores a file and returns the address to show it from. Returning
 * null or "" embeds the file in the document as data instead; throwing or rejecting reports a
 * failed upload.
 */
export type FileUploader = (upload: FileUpload) => Promise<string | null | undefined> | string | null | undefined;
