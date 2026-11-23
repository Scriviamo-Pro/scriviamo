# Vue and Nuxt

`scriviamo-vue` puts the editor in a Vue app as a component that works with `v-model`. This page
walks through setting it up, keeping and saving the document, and rendering documents on the
server with Nuxt. The [package's README](../wrappers/vue/README.md) lists every prop and event.

## Installing

```bash
npm install scriviamo scriviamo-vue bootstrap bootstrap-icons
```

Vue 3.3 or later. Load the stylesheets once, such as in your entry module: Bootstrap's CSS and
Bootstrap Icons, which Scriviamo's interface uses, then Scriviamo's own and those of the add-ons
you use.

```ts
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.min.css"
import "scriviamo/dist/scriviamo.css"
import "scriviamo/dist/addons/scriviamo.callouts.css"
```

Add-ons register their node types when they're imported. Import them in one module, and import
that module wherever documents are edited or rendered, so every editor knows every node type:

```ts
// scriviamo.ts
import "scriviamo/addons/callouts"
import "scriviamo/addons/math"
export {Editor} from "scriviamo"
```

## An editor

```vue
<script setup lang="ts">
import {ref} from "vue"
import {ScriviamoEditor} from "scriviamo-vue"
import "./scriviamo"

const doc = ref("# Notes\n\nStart writing.")
</script>

<template>
  <ScriviamoEditor v-model="doc" format="markdown" status-bar style="height: 500px" />
</template>
```

Give the editor a height, or set `adaptive-height` to let it grow with the document. To register
the component for the whole app instead of importing it, `app.use(ScriviamoPlugin)`.

- `v-model` keeps the document in your state, in `format`: `"json"` (the default, which keeps
  everything), `"html"` or `"markdown"`. Changing it from outside replaces the document; the
  editor's own changes coming back don't reload anything.
- Leave `v-model` out for an editor that keeps its own document, and read it from the editor when
  you need it.
- `change-delay` reports changes only once typing pauses, for large documents.
- Every other prop is an editor setting, applied as it changes: `read-only`, `toolbar-visible`,
  `locale` and the others in the [wrappers README](../wrappers/README.md#settings).

## Saving

`autosave` saves the document a moment after each change, and the status bar shows whether it
has:

```vue
<script setup lang="ts">
import type {Editor} from "scriviamo"

const props = defineProps<{id: string, initial: string}>()
const autosave = {
  save: async (editor: Editor) => {
    let response = await fetch(`/api/documents/${props.id}`, {method: "PUT", headers: {"Content-Type": "application/json"}, body: editor.toJSON()})
    if (!response.ok) throw new Error(`Saving failed: ${response.status}`)
  },
  warnBeforeLeaving: true
}
</script>

<template>
  <ScriviamoEditor :model-value="initial" :autosave="autosave" status-bar />
</template>
```

See [Autosave](undo-search-statistics.md#autosave) for its settings.

## The editor itself

For anything the props don't cover, use the `Editor`: the `ready` event gives it, and a template
ref exposes it as `editor`. Keep it in a `shallowRef`, never a `ref`, so Vue doesn't make the
editor's internals reactive.

```vue
<script setup lang="ts">
import {shallowRef} from "vue"
import type {Editor} from "scriviamo"
const editor = shallowRef<Editor | null>(null)
</script>

<template>
  <ScriviamoEditor @ready="editor = $event" />
  <button @click="editor?.print()">Print</button>
</template>
```

`events` listens to the editor's events by name, such as `{linkPressed: event => …}`. See
[The editor](editor.md) for what it offers.

## Nuxt

The editor works in the browser. The component creates it when it mounts, which happens only in
the browser, so on the server it renders the empty element the editor fills. Wrapping it in
`<ClientOnly>` leaves even that out, with a placeholder of your own meanwhile.

Documents render on the server without the editor's interface: a headless editor, made with
`new Editor(null)`, loads the saved JSON and returns its HTML and the stylesheet it needs, in a
server route. With a [schema](schema.md), it also checks a document before saving it, whatever the browser sent:

```ts
// server/api/render/[id].get.ts
import {Editor} from "../../utils/scriviamo"

export default defineEventHandler(async event => {
  let document = await loadDocument(getRouterParam(event, "id")!)
  let editor = new Editor(null, {content: document.content})
  return {html: editor.toHTML(), css: editor.exportCSS()}
})
```

See [Server rendering](server-rendering.md) for what a headless editor can do. The
[Nuxt starter](../starters/nuxt/README.md) is a complete app with all of this: a list of
documents, an editor page with autosave, a save endpoint, and server-rendered pages.
