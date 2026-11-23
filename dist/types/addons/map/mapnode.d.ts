import { Editor, HTMLImporter, InspectorSection, Node, Stylesheet, ToolbarItem } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const MapStrings: {
    TextMapCaption: string;
    TextMapToolbarTooltip: string;
    TextFindPlaceCaption: string;
    TextFindPlacePrompt: string;
    TextPlaceNotFoundMessage: string;
    TextMapLabelCaption: string;
    TextMapLatitudeCaption: string;
    TextMapLongitudeCaption: string;
    TextMapZoomCaption: string;
    TextMapHeightCaption: string;
    TextZoomInCaption: string;
    TextZoomOutCaption: string;
    TextOpenMapCaption: string;
    TextShowPinCaption: string;
    TextMapKeysHint: string;
};
type MapStringsTable = typeof MapStrings;
declare module "scriviamo" {
    interface Strings extends MapStringsTable {
    }
}
/** A place a geocoder found. */
export interface MapPlace {
    latitude: number;
    longitude: number;
    label: string;
}
/** Turns a search into a place, or null when there's none. */
export type MapGeocoder = (query: string) => Promise<MapPlace | null>;
/**
 * A map of a place, with a pin. It's drawn from map tiles placed as pictures, OpenStreetMap's by
 * default, so it needs no script or service key, and looks the same in the editor, in exported
 * HTML and in print. In the editor, drag to move it, use the buttons to zoom, or find a place;
 * with the editor's keyboardControls on, Tab to the map, then the arrow keys move it and + and − zoom.
 */
export declare class MapNode extends Node {
    #private;
    /** The tile pictures' address, with {z}, {x} and {y}. Follow the tile service's usage policy. */
    static tileURL: string;
    /** The credit the tile service asks for, as HTML. */
    static attribution: string;
    /**
     * Finds places for "Find a Place". By default it asks OpenStreetMap's Nominatim, which allows
     * light use; set your own for heavier use or another service.
     */
    static geocoder: MapGeocoder;
    static exportStyles(sheet: Stylesheet, _editor: Editor | null): void;
    static identifier: string;
    static caption: string;
    static captionString: string;
    static icon: string;
    static keywords: string;
    static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined;
    latitude: number;
    longitude: number;
    zoom: number;
    /** The text beside the pin, such as the place's name. */
    label: string;
    showPin: boolean;
    get canResize(): boolean;
    protected get defaultHeight(): number;
    get mapHeight(): number;
    /** A point's position on the whole world map at a zoom, in pixels. */
    static project(latitude: number, longitude: number, zoom: number): {
        x: number;
        y: number;
    };
    /** The point at a position on the whole world map at a zoom. */
    static unproject(x: number, y: number, zoom: number): {
        latitude: number;
        longitude: number;
    };
    /** The tiles covering a width and height around the center: each tile's address and its offset from the center. */
    tiles(width: number, height: number, centerX?: number, centerY?: number): Array<{
        url: string;
        left: number;
        top: number;
    }>;
    /** The place on openstreetmap.org. */
    get mapURL(): string;
    /** Moves the map to a place; coordinates such as "48.8584, 2.2945" are read without a search. */
    findPlace(query: string): Promise<boolean>;
    promptForPlace(): Promise<void>;
    setZoom(zoom: number): void;
    protected build(body: HTMLElement): void;
    inspectorSections(): Array<InspectorSection>;
    actions(): Array<ToolbarItem>;
    performAction(item: ToolbarItem, _menuItem: unknown): boolean;
    toJSON(): object;
    fromJSON(data: any): boolean;
    /** The map as tile pictures around its center, so it shows without a script and prints. */
    toHTML(): string;
    toMarkdown(): string;
    toPlainText(): string;
}
export {};
