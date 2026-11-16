import { CodeBlockNode, InspectorSection } from "scriviamo";
/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
declare const RawcontentStrings: {
    TextRawContentCaption: string;
    TextDefaultRawContent: string;
    TextCopyRawContentTooltip: string;
    TextRawContentToolbarTooltip: string;
};
type RawcontentStringsTable = typeof RawcontentStrings;
declare module "scriviamo" {
    interface Strings extends RawcontentStringsTable {
    }
}
/** HTML written into exported documents as it is. */
export declare class RawContentNode extends CodeBlockNode {
    static identifier: string;
    static caption: string;
    static icon: string;
    inspectorSections(): Array<InspectorSection>;
    static keywords: string;
    protected get placeholderText(): string;
    protected build(body: HTMLElement): void;
    toHTML(): string;
    toMarkdown(): string;
    toPlainText(): string;
}
export {};
