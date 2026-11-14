# Packages and add-ons

Scriviamo is split into a base package and add-ons. The base package is a complete editor on
its own. Each add-on is a separate module that adds node types or features to it.

## The base package

`dist/scriviamo.js` and `dist/scriviamo.css`, imported as
`scriviamo`.

It contains the editor, import and export, localization, the settings node types show in the
inspector, and these node types:

| Node type | JSON type | Class |
|---|---|---|
| Text (paragraph) | `text` | `TextNode` |
| Heading | `heading` | `HeadingNode` |
| List (bulleted, numbered, checklist) | `list` | `ListNode` |
| Quote | `quote` | `QuoteNode` |
| Code | `codeblock` | `CodeBlockNode` |
| Table | `table` | `TableNode` |
| Image | `image` | `ImageNode` |
| Divider | `divider` | `DividerNode` |

It also keeps content it can't read. A node whose type isn't registered loads as an
`UnknownNode`, which shows a placeholder and saves the node's JSON back unchanged, so a
document made with more add-ons survives being opened without them.

## Add-ons

Each add-on is `dist/addons/scriviamo.<name>.js`, plus a `.css` file when it
has one.

| Add-on | Edition | Adds | JSON types | Stylesheet |
|---|---|---|---|---|
| `callouts` | Free | Alerts (info, success, warning, danger) | `alert` | Yes |
| `rawcontent` | Free | HTML written into exports unchanged | `rawcontent` | No |
| `media` | Free | Audio and video | `audio`, `video` | Yes |
| `forms` | Free | Forms and form controls | `form`, `label`, `textfield`, `textarea`, `checkbox`, `radiogroup`, `select`, `datalist`, `button` | Yes |

The base package and these add-ons are MIT licensed. Premium add-ons, such as columns, data
tables, an inspector panel and real-time collaboration, are available separately; see
[scriviamo.dev](https://scriviamo.dev/).

Load an add-on by importing it after the base package and before creating editors:

```ts
import {Editor} from "scriviamo"
import "./dist/addons/scriviamo.media.js"
import {AlertNode, AlertTypes} from "./dist/addons/scriviamo.callouts.js"
```

An add-on registers its node types with `Editor.registerNodeType` when it is imported. Each
type has an order number, which places it in the insertion menu and the block type menu: the
built-in types use multiples of 10 below 300, mixed so related types sit together. Importing
add-ons in a different order doesn't change the menus.

Add-ons also bring their own interface text, which a locale pack can translate like the base
package's. See [Localization](localization.md).

## Examples

`src/examples/` holds node types that show how an application adds its own. They aren't part
of the base package or the add-ons, and build to `dist/examples/`.

| Example | JSON type | Shows |
|---|---|---|
| `examplenode` | `example` | A text block with an accent bar, toolbar and context-menu commands, a key command, and inspector items |
| `youtube` | `youtube` | An embedded YouTube video, with HTML import that takes priority over embeds |

The demo page loads both. See [Writing node types](custom-node-types.md).

## Source layout

```
src/
  index.ts                 the base package's entry module
  internal.ts              loads the base modules in order; base modules import from it
  *.ts, nodes/*.ts         the base package
  addons/<name>/           one entry module per add-on, its stylesheet, and anything it ships
  examples/<name>/         one entry module per example
  build.mjs                the build
test/
  suites/base/             tests for the base package
  suites/<add-on>/         tests for one add-on
  suites/integration/      tests that need several add-ons
```

An add-on folder holds exactly one TypeScript module.
