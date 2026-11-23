import {Editor, Utilities} from "./internal"

/** What a rule of your own is given about a node. */
export interface SchemaRuleContext {
  /** Where the node is in the document's JSON, such as "nodes[3].cells[0].nodes[1]". */
  path: string
  /** 0 for a top-level node, 1 for a node inside it, and so on. */
  depth: number
}

/** A rule of your own: the problems with a node's JSON, as messages, or nothing. */
export type SchemaRule = (node: any, context: SchemaRuleContext) => string | Array<string> | null | undefined | void

export interface DocumentSchemaOptions {
  /** The node types allowed, by identifier, such as ["text", "heading", "list"]. Leave it out for every type the page has registered. */
  nodeTypes?: Array<string>
  /** Node types not allowed, such as ["rawcontent"], taken out of nodeTypes or of every registered type. */
  excludedNodeTypes?: Array<string>
  /** The protocols links and media addresses may use. Relative addresses are always allowed. Default: Utilities.safeProtocols (http, https, mailto, tel). */
  protocols?: Array<string>
  /** Allows media in the document itself, as data: addresses of pictures, sound, video and PDFs. Default true. */
  dataAddresses?: boolean
  /** The most nodes, nested ones included. */
  maxNodes?: number
  /** How deep nodes may nest: 0 allows only top-level nodes. */
  maxDepth?: number
  /** The most characters of text, in every node. */
  maxTextLength?: number
  /** Your own rules, run on every node. */
  rules?: Array<SchemaRule>
}

/** Why a document doesn't fit a schema. */
export enum SchemaIssueCodes {
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

export class SchemaIssue {
  code: SchemaIssueCodes
  message: string
  /** Where in the JSON, such as "nodes[3]" or "nodes[3].styleTable[0].linkURL". */
  path: string
  /** The node's id and type, where the issue is about a node. */
  nodeID: string
  type: string

  constructor(code: SchemaIssueCodes, message: string, path: string = "", nodeID: string = "", type: string = "") {
    this.code = code
    this.message = message
    this.path = path
    this.nodeID = nodeID
    this.type = type
  }
}

export interface SchemaResult {
  /** True when the document fits the schema. */
  valid: boolean
  issues: Array<SchemaIssue>
}

export interface SchemaCleanResult extends SchemaResult {
  /** The document with what the schema doesn't allow taken out. */
  document: any
  /** True when anything was taken out. */
  changed: boolean
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
export class DocumentSchema {
  /**
   * The keys under which node types save addresses that are followed or loaded, checked against
   * the protocols. Add your own node types' keys here.
   */
  static addressKeys: Set<string> = new Set(["linkURL", "url", "sourceURL", "imageURL", "iconURL", "resourceURL", "embedSource", "source"])
  /** Of those, the ones that are media and so may be data: addresses, with dataAddresses on. */
  static mediaKeys: Set<string> = new Set(["sourceURL", "imageURL", "iconURL", "resourceURL", "source"])

  readonly options: DocumentSchemaOptions

  constructor(options: DocumentSchemaOptions = {}) {
    this.options = {...options}
  }

  /** True when the schema allows a node type, by identifier. Text is always allowed. */
  allows(type: string): boolean {
    if (type == "text") return true
    if (this.options.excludedNodeTypes?.includes(type)) return false
    if (this.options.nodeTypes) return this.options.nodeTypes.includes(type)
    return Editor.registeredNodeTypes().some(item => item.identifier == type)
  }

  /** Checks a document, as JSON text or the object toJSONObject() returns. */
  validate(document: string | object): SchemaResult {
    let {issues} = this.#walk(document, false)
    return {valid: issues.length == 0, issues}
  }

  /**
   * Takes out of a document what the schema doesn't allow: nodes of other types, with what's
   * inside them, and addresses with other protocols (a link keeps its text). The document given
   * isn't changed. Limits can't be cleaned, so issues lists any that remain, and valid says
   * whether the result fits.
   */
  clean(document: string | object): SchemaCleanResult {
    let {source, issues, changed} = this.#walk(document, true)
    let remaining = issues.filter(issue => [SchemaIssueCodes.invalidDocument, SchemaIssueCodes.tooManyNodes, SchemaIssueCodes.tooDeep, SchemaIssueCodes.textTooLong, SchemaIssueCodes.rule].includes(issue.code))
    return {document: source, valid: remaining.length == 0, issues, changed}
  }

  /** Cleans a list of nodes' JSON, such as pasted ones, the way clean cleans a document's. */
  cleanNodes(nodes: Array<any>): Array<any> {
    return this.clean({nodes}).document?.nodes ?? []
  }

  #addressAllowed(key: string, value: string): boolean {
    if (value.length == 0) return true
    let protocols = this.options.protocols ?? Utilities.safeProtocols
    if (Utilities.isSafeURL(value, protocols)) return true
    if (this.options.dataAddresses !== false && DocumentSchema.mediaKeys.has(key)) {
      return /^data:(image\/(png|jpe?g|gif|webp|avif|bmp|svg\+xml)|audio\/[a-z0-9.+-]+|video\/[a-z0-9.+-]+|application\/pdf)[;,]/i.test(value.trim())
    }
    return false
  }

  #walk(document: string | object, cleaning: boolean): {source: any, issues: Array<SchemaIssue>, changed: boolean} {
    let issues: Array<SchemaIssue> = []
    let source: any = document
    if (typeof document == "string") {
      try {
        source = JSON.parse(document)
      } catch {
        return {source: null, issues: [new SchemaIssue(SchemaIssueCodes.invalidDocument, "The document is not valid JSON.")], changed: false}
      }
    } else if (cleaning) {
      source = JSON.parse(JSON.stringify(document))
    }
    if (!source || typeof source != "object" || Array.isArray(source) || !Array.isArray(source.nodes)) {
      return {source, issues: [new SchemaIssue(SchemaIssueCodes.invalidDocument, "The document must be a JSON object with a nodes array.")], changed: false}
    }
    let options = this.options
    let known = new Set(Editor.registeredNodeTypes().map(item => item.identifier))
    let count = 0
    let textLength = 0
    let changed = false

    // Addresses and text anywhere inside a node, but not inside the nodes it holds.
    let inspect = (value: any, path: string, node: any) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => inspect(item, `${path}[${index}]`, node))
        return
      }
      if (!value || typeof value != "object") return
      for (let key of Object.keys(value)) {
        let item = value[key]
        let itemPath = path.length > 0 ? `${path}.${key}` : key
        if (key == "nodes" && Array.isArray(item)) {
          continue
        } else if (typeof item == "string") {
          if (key == "text") textLength += item.length
          if (DocumentSchema.addressKeys.has(key) && !this.#addressAllowed(key, item)) {
            issues.push(new SchemaIssue(SchemaIssueCodes.unsafeAddress, `${itemPath} has an address the schema doesn't allow: ${item.slice(0, 80)}`, itemPath, Utilities.string(node?.nodeId ?? node?.id), Utilities.string(node?.type)))
            if (cleaning) {
              delete value[key]
              changed = true
            }
          }
        } else if (item && typeof item == "object") {
          inspect(item, itemPath, node)
        }
      }
    }

    // Node lists: the document's, and those inside nodes, such as table cells' and columns'.
    let visit = (nodes: Array<any>, path: string, depth: number): Array<any> => {
      let kept: Array<any> = []
      nodes.forEach((node, index) => {
        let nodePath = `${path}[${index}]`
        if (!node || typeof node != "object" || Array.isArray(node)) {
          issues.push(new SchemaIssue(SchemaIssueCodes.invalidDocument, `${nodePath} is not a node object.`, nodePath))
          if (cleaning) changed = true
          else kept.push(node)
          return
        }
        let type = Utilities.string(node.type)
        let id = Utilities.string(node.nodeId ?? node.id)
        if (!known.has(type) && type != "text") {
          issues.push(new SchemaIssue(SchemaIssueCodes.unknownType, `${nodePath} has the type "${type}", which isn't registered.`, nodePath, id, type))
          if (cleaning) {
            changed = true
            return
          }
        } else if (!this.allows(type)) {
          issues.push(new SchemaIssue(SchemaIssueCodes.typeNotAllowed, `${nodePath} is a "${type}" node, which the schema doesn't allow.`, nodePath, id, type))
          if (cleaning) {
            changed = true
            return
          }
        }
        count++
        if (options.maxDepth !== undefined && depth > options.maxDepth) {
          issues.push(new SchemaIssue(SchemaIssueCodes.tooDeep, `${nodePath} is nested ${depth} deep; the schema allows ${options.maxDepth}.`, nodePath, id, type))
        }
        for (let rule of options.rules ?? []) {
          let found = rule(node, {path: nodePath, depth})
          for (let message of Array.isArray(found) ? found : found ? [found] : []) {
            issues.push(new SchemaIssue(SchemaIssueCodes.rule, message, nodePath, id, type))
          }
        }
        inspect(node, nodePath, node)
        // Nested node lists, wherever the node keeps them.
        let nested = (value: any, valuePath: string) => {
          if (Array.isArray(value)) {
            value.forEach((item, itemIndex) => nested(item, `${valuePath}[${itemIndex}]`))
          } else if (value && typeof value == "object") {
            for (let key of Object.keys(value)) {
              let item = value[key]
              let itemPath = `${valuePath}.${key}`
              if (key == "nodes" && Array.isArray(item)) {
                let kept = visit(item, itemPath, depth + 1)
                // Checking leaves the document as it was given.
                if (cleaning) value[key] = kept
              }
              else if (item && typeof item == "object") nested(item, itemPath)
            }
          }
        }
        nested(node, nodePath)
        kept.push(node)
      })
      return kept
    }

    let kept = visit(source.nodes, "nodes", 0)
    if (cleaning) source.nodes = kept
    if (options.maxNodes !== undefined && count > options.maxNodes) {
      issues.push(new SchemaIssue(SchemaIssueCodes.tooManyNodes, `The document has ${count} nodes; the schema allows ${options.maxNodes}.`))
    }
    if (options.maxTextLength !== undefined && textLength > options.maxTextLength) {
      issues.push(new SchemaIssue(SchemaIssueCodes.textTooLong, `The document has ${textLength} characters of text; the schema allows ${options.maxTextLength}.`))
    }
    return {source, issues, changed}
  }
}
