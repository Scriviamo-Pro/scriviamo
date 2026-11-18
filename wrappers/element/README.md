# Scriviamo web component

`<scriviamo-editor>`: the Scriviamo editor as an HTML element, for pages and apps with any
framework, such as Svelte, Solid, Lit or Astro, or with none.

```html
<script type="module">
  import "scriviamo"
  import "scriviamo/dist/addons/scriviamo.callouts.js"
  import "scriviamo-element"
</script>

<form method="post" action="/save">
  <scriviamo-editor name="body" format="markdown" status-bar style="height: 500px">
    # Notes

    Start writing.
  </scriviamo-editor>
  <button>Save</button>
</form>
```

Load Bootstrap 5's CSS and Bootstrap Icons, which Scriviamo's interface uses, then Scriviamo's
stylesheet, `dist/scriviamo.css`, and those of any add-ons, as you load other CSS. Bootstrap's
JavaScript isn't needed.

Importing `scriviamo-element` defines the element. Import the add-ons you use before it, so their
node types are there when the first editor is made. To use another tag name, import
`defineScriviamoEditor` and call it with the name before anything else defines the element.

## The starting document

The text inside the element is the document it starts with, in its `format`: Markdown, or HTML
with `format="html"`. The indent every line shares is removed, so it can sit indented in the
page. A `value` attribute takes its place, and for JSON, the default format, set the `value`
property from a script instead.

## Attributes

Each takes the setting of the same name in the [wrappers README](../README.md#settings):

| Attribute | Setting |
|---|---|
| `format` | `json`, `html` or `markdown` |
| `value` | The document, in `format` |
| `read-only`, `toolbar-visible`, `show-contextual-toolbars`, `hover-insertion`, `markdown-shortcuts`, `allow-annotations`, `adaptive-height`, `status-bar` | On when present; off when set to `"false"` |
| `toolbar-display-mode`, `font-size`, `change-delay` | Numbers |
| `font-name`, `editor-class` | Text |
| `name` | The name it's submitted under in a form |

Each also has a property, such as `element.readOnly = true`, which sets the attribute.

## Properties

| Property | Meaning |
|---|---|
| `value` | The document, in `format`. Setting it replaces the document; reading it gives the editor's current document. |
| `editor` | The `Editor`, for everything else, or null until the element is on the page |
| `autosave`, `fileUploader`, `locale`, `events` | The settings that can't be attributes |
| `settings` | All the settings set as properties, as one object |

## Events

| Event | `detail` |
|---|---|
| `input`, `change` | `{value, editor}`, as the document changes, after `change-delay` |
| `selectionchange` | `{node, editor}`, when the primary selected node changes |
| `ready` | `{editor}`, once the editor is made |

## In forms

The element is a form field: a form submits its document under its `name`, `FormData` includes
it, `form.reset()` brings back the document it started with, and a disabled `fieldset` makes it
read-only.

## Lifetime

The editor is made when the element joins the page and removed when it leaves. Moving the
element elsewhere on the page keeps its editor.


## Building

```bash
npm install
npm run build
```

The build writes `dist/index.js` and its declarations. Scriviamo stays external, as a peer
dependency.
