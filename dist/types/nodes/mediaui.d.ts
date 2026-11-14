import { Node } from "../internal";
/** Shared pieces for blocks that show media: the empty-state chooser and the resize handle. */
export declare class MediaUI {
    /** An empty-state panel with buttons to choose a file or enter an address. */
    static placeholder(node: Node, icon: string, caption: string, chooseFile: (() => void) | null, enterURL: () => void): HTMLElement;
    /** Lets the user drag handle to resize frame. ratio is height / width, or 0 to keep the height. */
    static attachResize(node: Node, handle: HTMLElement, frame: HTMLElement, ratio: () => number, done: (width: number, height: number) => void): void;
    /** Reads a file as a data: URI. */
    static readDataURI(file: Blob): Promise<string>;
    static pickFile(accept: string, handler: (file: File) => void): void;
}
