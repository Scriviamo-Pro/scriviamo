import { Editor, HTMLImporter, InspectorSection, Node, Stylesheet, ToolbarItem, ToolbarMenuItem } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const GalleryStrings: {
    TextGalleryCaption: string;
    TextGalleryToolbarTooltip: string;
    TextGalleryLayoutCaption: string;
    TextGalleryGridCaption: string;
    TextGalleryCarouselCaption: string;
    TextGalleryColumnsCaption: string;
    TextAddImagesCaption: string;
    TextAddImageAddressCaption: string;
    TextRemoveImageCaption: string;
    TextMoveImageBackCaption: string;
    TextMoveImageForwardCaption: string;
    TextImageCaptionPlaceholder: string;
    TextImageDescriptionCaption: string;
    TextSelectedImageCaption: string;
    TextViewImageCaption: string;
    TextPreviousImageCaption: string;
    TextNextImageCaption: string;
    TextCloseViewerCaption: string;
    TextImageAddressPrompt: string;
    TextGalleryEmptyCaption: string;
};
type GalleryStringsTable = typeof GalleryStrings;
declare module "scriviamo" {
    interface Strings extends GalleryStringsTable {
    }
}
export declare enum GalleryLayouts {
    grid = 0,
    carousel = 1
}
/** One picture in a gallery. */
export declare class GalleryImage {
    /** A data: URI or an address. */
    source: string;
    caption: string;
    /** The description screen readers read, and that shows when the picture can't. */
    alt: string;
    constructor(source?: string, caption?: string, alt?: string);
    toJSON(): object;
    static fromJSON(data: any): GalleryImage;
}
/**
 * A set of pictures, as a grid or as a carousel that shows one at a time, each with an optional
 * caption. Clicking a picture opens it full size, with arrows to move through the rest.
 */
export declare class GalleryNode extends Node {
    #private;
    static exportStyles(sheet: Stylesheet, _editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static icon: string;
    static keywords: string;
    static create(editor: Editor): Node;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    images: Array<GalleryImage>;
    layout: GalleryLayouts;
    /** The grid's number of columns. */
    columns: number;
    /** The picture the toolbar and inspector work on, and the carousel shows. Not saved. */
    selectedImage: number;
    get typeName(): string;
    /** Adds pictures from files, uploaded through the editor or embedded. */
    addFiles(files: Array<File>): Promise<void>;
    addImage(image: GalleryImage): void;
    removeImage(index: number): void;
    moveImage(index: number, by: number): void;
    chooseFiles(): void;
    enterURL(): Promise<void>;
    protected build(body: HTMLElement): void;
    /** Shows a picture full size over the page, with arrows to the others. */
    openViewer(index: number): void;
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
