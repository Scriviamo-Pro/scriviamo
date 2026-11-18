import { Editor, EditorPanel, HeadingNode, Node } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const OutlineStrings: {
    TextOutlineCaption: string;
    TextOutlineEmptyCaption: string;
    TextOutlineMoveHint: string;
    TextOutlineUntitledCaption: string;
    TextOutlineCollapseCaption: string;
    TextOutlineExpandCaption: string;
};
type OutlineStringsTable = typeof OutlineStrings;
declare module "scriviamo" {
    interface Strings extends OutlineStringsTable {
    }
}
/** A heading in the outline, with the headings under it. */
export interface OutlineEntry {
    heading: HeadingNode;
    level: number;
    text: string;
    /** Whether it's in the document's own list, so its section can move. */
    movable: boolean;
    children: Array<OutlineEntry>;
}
/**
 * The document's headings as a tree, beside the editor: click a heading to go to it, and drag one,
 * or press Alt+Up or Alt+Down on it, to move its whole section: the heading and everything
 * under it, up to the next heading of the same or a higher level.
 *
 *   new Outline(element, editor)
 *
 * With the inspector add-on loaded, the outline is also one of the inspector's tabs.
 */
export declare class Outline {
    #private;
    constructor(element: HTMLElement, editor?: Editor | null);
    get element(): HTMLElement;
    get editor(): Editor | null;
    set editor(value: Editor | null);
    /** Stops following the editor. */
    dispose(): void;
    /** The document's headings, nested by level. */
    static entries(editor: Editor): Array<OutlineEntry>;
    /** A heading's section in the document's list: the heading and the nodes under it. */
    static section(editor: Editor, heading: HeadingNode): Array<Node>;
    /**
     * Moves a heading's section to just before another top-level node, or to the end when before
     * is null. One undo step.
     */
    static moveSection(editor: Editor, heading: HeadingNode, before: Node | null): boolean;
    /** Moves a section past the section before or after it at the same level. */
    static moveSectionBy(editor: Editor, heading: HeadingNode, direction: -1 | 1): boolean;
    /** Redraws the outline when its headings changed. */
    render(): void;
}
/** The outline as a panel, which the inspector add-on shows as a tab. */
export declare const OutlinePanel: EditorPanel;
export {};
