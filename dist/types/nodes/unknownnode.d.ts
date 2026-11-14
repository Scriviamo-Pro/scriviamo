import { InspectorSection, Node } from "../internal";
/** A node whose type this editor doesn't know. It keeps its JSON so saving loses nothing. */
export declare class UnknownNode extends Node {
    #private;
    static identifier: string;
    static caption: string;
    static icon: string;
    static insertable: boolean;
    get type(): string;
    get typeName(): string;
    protected build(body: HTMLElement): void;
    fromJSON(data: any): boolean;
    toJSON(): object;
    inspectorSections(): Array<InspectorSection>;
    get canExportHTML(): boolean;
    toPlainText(): string;
}
