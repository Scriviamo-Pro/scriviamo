# Schema validation

A `DocumentSchema` says which node types and content an application allows in its documents. It
checks saved JSON in the browser or on a server, with no editor, and can take out what isn't
allowed. An editor given a schema offers only the node types it allows, cleans what is pasted or
dropped into it, and refuses to load a document that doesn't fit.

```js
import {DocumentSchema, Editor} from "scriviamo"

const schema = new DocumentSchema({
  nodeTypes: ["text", "heading", "list", "quote", "table", "image"],
  maxNodes: 2000
})

const editor = new Editor(element, {schema})
```

A browser can be made to send anything, so check documents on the server as well, with the same
schema, before saving them. The editor's checks keep people from adding what isn't allowed by
mistake; the server's keep out anything sent around the editor.

```js
// On the server, such as in a save endpoint.
import {DocumentSchema} from "scriviamo"
import "scriviamo/addons/callouts"     // the add-ons your documents use, so their types are known

const {valid, issues} = schema.validate(request.body)
if (!valid) return response.status(400).json(issues)
```

## Options

| Option | Meaning |
|---|---|
| `nodeTypes` | The node types allowed, by identifier, such as `["text", "heading", "list"]`. Leave it out to allow every type the page has registered. Text is always allowed. |
| `excludedNodeTypes` | Node types not allowed, such as `["rawcontent"]`, taken out of `nodeTypes` or of every registered type |
| `protocols` | The protocols links and media addresses may use. Default: `Utilities.safeProtocols`, which is `http`, `https`, `mailto` and `tel`. Relative addresses, such as `/page` and `#part`, are always allowed. |
| `dataAddresses` | Allows pictures, sound, video and PDFs kept in the document itself, as `data:` addresses. Default `true`. |
| `maxNodes` | The most nodes, nested ones included |
| `maxDepth` | How deep nodes may nest: `0` allows only top-level nodes, `1` also nodes inside them, such as a table cell's |
| `maxTextLength` | The most characters of text, in every node |
| `rules` | Rules of your own, run on every node; see below |

The node type identifiers are listed in [Node types](node-types.md) and [Packages and add-ons](packages.md).
A node type the page hasn't registered, because its add-on isn't loaded, is never allowed, so on
a server import the add-ons your documents use, as the editor in the browser does.

## Checking and cleaning

| Method | Does |
|---|---|
| `schema.validate(document)` | Checks a document, as JSON text or an object. Returns `{valid, issues}` and leaves the document as it was. |
| `schema.clean(document)` | Returns `{document, valid, issues, changed}`: a copy without the nodes the schema doesn't allow, and what's inside them, and without addresses it doesn't allow (a link keeps its text). Limits can't be cleaned, so `valid` says whether the copy fits. |
| `schema.cleanNodes(nodes)` | Cleans a list of nodes' JSON, such as nodes from your own clipboard or templates |
| `schema.allows(type)` | True when the schema allows a node type |

Each issue has a `code`, a `message`, the `path` to it in the JSON (such as `nodes[2].cells[0].nodes[1]`),
and the `nodeID` and `type` of the node it's about:

| `SchemaIssueCodes` | Meaning |
|---|---|
| `invalidDocument` | The text isn't JSON, or isn't a document |
| `unknownType` | A node of a type the page hasn't registered |
| `typeNotAllowed` | A node of a type the schema doesn't allow |
| `unsafeAddress` | A link or media address with a protocol the schema doesn't allow, such as `javascript:` |
| `tooManyNodes`, `tooDeep`, `textTooLong` | Over a limit |
| `rule` | One of your own rules |

## Your own rules

A rule gets each node's JSON, and where it is, and returns what's wrong, as a message or a list of
messages, or nothing:

```js
const schema = new DocumentSchema({
  rules: [
    (node, {depth}) => node.type == "heading" && depth > 0 ? "Headings belong at the top level." : null,
    node => node.type == "image" && !node.alt ? "Every picture needs a description." : null
  ]
})
```

A rule only reports; `clean` leaves what it finds for you to deal with.

## In the editor

With the `schema` option, or by setting `editor.schema`:

- The Insert menu, the "/" chooser and the toolbar offer only the node types the schema allows,
  and pasted or dropped HTML and Markdown make only those.
- Nodes pasted or dropped from another Scriviamo editor, and HTML inserted with `insertHTML`, lose
  what the schema doesn't allow.
- `fromJSON` refuses a document that doesn't fit, returns `false` and leaves the editor as it was;
  `lastValidationIssues` says why, with each issue's `path`.
- `editor.validate()` checks the document as it is now, as `schema.validate` does.

Setting `editor.schema = null` offers every registered node type again.

## Addresses

Whether or not there's a schema, Scriviamo never makes a link that can run script: exported HTML
and Markdown leave out a link whose address isn't safe (keeping its text), and in the editor such
a link leads nowhere. `Utilities.isSafeURL(address, protocols)` is the check both use; it allows
relative addresses and the protocols in `Utilities.safeProtocols`.

A schema checks the addresses node types save under the keys in `DocumentSchema.addressKeys`:
links, and the addresses of pictures, media, files, bookmarks and embeds. A node type of your own
that saves an address under another key adds it there, and to `DocumentSchema.mediaKeys` if it's
media that may be a `data:` address.
