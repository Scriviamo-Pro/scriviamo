# The web component

`scriviamo-element` makes the editor an HTML element, `<scriviamo-editor>`, for pages and apps
built with any framework, such as Svelte, Solid, Lit or Astro, or with none. It's also a form
field, so a plain form submits the document. The [package's README](../wrappers/element/README.md)
lists every attribute, property and event.

## Installing

```bash
npm install scriviamo scriviamo-element bootstrap bootstrap-icons
```

Load Bootstrap's CSS and Bootstrap Icons, which Scriviamo's interface uses, then Scriviamo's own
stylesheet and those of the add-ons you use. Then import the add-ons, and `scriviamo-element`
last: importing it defines the element, and the add-ons' node types must be there when the
first editor is made.

```js
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.min.css"
import "scriviamo/dist/scriviamo.css"
import "scriviamo/dist/addons/scriviamo.callouts.css"
import "scriviamo/addons/callouts"
import "scriviamo-element"
```

To use another tag name, import `defineScriviamoEditor` and call it with the name before anything
else defines the element.

## An editor in a form

```html
<form method="post" action="/save">
  <scriviamo-editor name="body" format="markdown" status-bar style="height: 500px">
    # Notes

    Start writing.
  </scriviamo-editor>
  <button>Save</button>
</form>
```

- The text inside the element is the document it starts with, in its `format`: Markdown, or HTML
  with `format="html"`. For JSON, the default format, set the `value` property from a script.
- The form submits the document under the element's `name`, `form.reset()` brings back the one it
  started with, and a disabled `fieldset` makes it read-only.
- Settings are attributes, in kebab case: `read-only`, `toolbar-visible`, `status-bar` and the
  others in the [wrappers README](../wrappers/README.md#settings). Each also has a property, such
  as `element.readOnly = true`.

## In a script

```js
let element = document.querySelector("scriviamo-editor")
element.addEventListener("change", event => console.log(event.detail.value))
element.value = "# Replaced"
element.autosave = {save: editor => fetch("/save", {method: "PUT", body: editor.toJSON()})}
element.editor?.print()
```

- `input` and `change` fire as the document changes, after `change-delay`, with `{value, editor}`;
  `selectionchange` and `ready` give the editor too.
- `value` reads the current document and replaces it when set.
- `autosave`, `fileUploader`, `locale` and `events` take objects and functions, so they're
  properties only. See [Autosave](undo-search-statistics.md#autosave).
- `editor` is the `Editor`, for everything else, once the element is on the page. See
  [The editor](editor.md).

The editor is made when the element joins the page and removed when it leaves; moving the
element elsewhere keeps it.

## Frameworks

In a framework, the element is used like any other. Set the settings that are objects as
properties, and listen to `change` for the document:

```svelte
<scriviamo-editor format="markdown" value={doc} onchange={event => doc = event.detail.value}></scriviamo-editor>
```

The element is defined only in the browser. On a server, such as while Astro or SvelteKit render
a page, importing `scriviamo-element` defines nothing, and the element is sent as it is, then
becomes an editor once the page loads. To render saved documents on the server, use a headless
editor; see [Server rendering](server-rendering.md).

