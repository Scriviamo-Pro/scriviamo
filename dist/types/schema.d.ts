/** What a rule of your own is given about a node. */
export interface SchemaRuleContext {
    /** Where the node is in the document's JSON, such as "nodes[3].cells[0].nodes[1]". */
    path: string;
    /** 0 for a top-level node, 1 for a node inside it, and so on. */
    depth: number;
}
/** A rule of your own: the problems with a node's JSON, as messages, or nothing. */
export type SchemaRule = (node: any, context: SchemaRuleContext) => string | Array<string> | null | undefined | void;
export interface DocumentSchemaOptions {
    /** The node types allowed, by identifier, such as ["text", "heading", "list"]. Leave it out for every type the page has registered. */
    nodeTypes?: Array<string>;
    /** Node types not allowed, such as ["rawcontent"], taken out of nodeTypes or of every registered type. */
    excludedNodeTypes?: Array<string>;
    /** The protocols links and media addresses may use. Relative addresses are always allowed. Default: Utilities.safeProtocols (http, https, mailto, tel). */
    protocols?: Array<string>;
    /** Allows media in the document itself, as data: addresses of pictures, sound, video and PDFs. Default true. */
    dataAddresses?: boolean;
    /** The most nodes, nested ones included. */
    maxNodes?: number;
    /** How deep nodes may nest: 0 allows only top-level nodes. */
    maxDepth?: number;
    /** The most characters of text, in every node. */
    maxTextLength?: number;
    /** Your own rules, run on every node. */
    rules?: Array<SchemaRule>;
}
/** Why a document doesn't fit a schema. */
export declare enum SchemaIssueCodes {
    /** It isn't a Scriviamo document's JSON. */
    invalidDocument = "invalidDocument",
    /** A node has a type this page hasn't registered. */
    unknownType = "unknownType",
    /** A node has a type the schema doesn't allow. */
    typeNotAllowed = "typeNotAllowed",
    /** A link or media address uses a protocol the schema doesn't allow, such as javascript:. */
    unsafeAddress = "unsafeAddress",
    tooManyNodes = "tooManyNodes",
    tooDeep = "tooDeep",
    textTooLong = "textTooLong",
    /** One of your own rules. */
    rule = "rule"
}
export declare class SchemaIssue {
    code: SchemaIssueCodes;
    message: string;
    /** Where in the JSON, such as "nodes[3]" or "nodes[3].styleTable[0].linkURL". */
    path: string;
    /** The node's id and type, where the issue is about a node. */
    nodeID: string;
    type: string;
    constructor(code: SchemaIssueCodes, message: string, path?: string, nodeID?: string, type?: string);
}
export interface SchemaResult {
    /** True when the document fits the schema. */
    valid: boolean;
    issues: Array<SchemaIssue>;
}
export interface SchemaCleanResult extends SchemaResult {
    /** The document with what the schema doesn't allow taken out. */
    document: any;
    /** True when anything was taken out. */
    changed: boolean;
}
/**
 * The node types and content an application allows in its documents. It checks saved JSON in
 * the browser or on a server, with no editor, and takes out what isn't allowed. An editor given
 * one with its schema option offers only the allowed node types, cleans what is pasted into it,
 * and refuses to load a document that doesn't fit.
 *
 *     const schema = new DocumentSchema({nodeTypes: ["text", "heading", "list", "image"], maxNodes: 2000})
 *     const {valid, issues} = schema.validate(json)
 */
export declare class DocumentSchema {
    #private;
    /**
     * The keys under which node types save addresses that are followed or loaded, checked against
     * the protocols. Add your own node types' keys here.
     */
    static addressKeys: Set<string>;
    /** Of those, the ones that are media and so may be data: addresses, with dataAddresses on. */
    static mediaKeys: Set<string>;
    readonly options: DocumentSchemaOptions;
    constructor(options?: DocumentSchemaOptions);
    /** True when the schema allows a node type, by identifier. Text is always allowed. */
    allows(type: string): boolean;
    /** Checks a document, as JSON text or the object toJSONObject() returns. */
    validate(document: string | object): SchemaResult;
    /**
     * Takes out of a document what the schema doesn't allow: nodes of other types, with what's
     * inside them, and addresses with other protocols (a link keeps its text). The document given
     * isn't changed. Limits can't be cleaned, so issues lists any that remain, and valid says
     * whether the result fits.
     */
    clean(document: string | object): SchemaCleanResult;
    /** Cleans a list of nodes' JSON, such as pasted ones, the way clean cleans a document's. */
    cleanNodes(nodes: Array<any>): Array<any>;
}
