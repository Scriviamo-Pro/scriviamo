# Scriviamo for Vue

Vue 3 components for the Scriviamo editor: `ScriviamoEditor`.

```vue
<script setup lang="ts">
import {ref, shallowRef} from "vue"
import type {Editor} from "scriviamo"
import {ScriviamoEditor} from "scriviamo-vue"

const doc = ref("# Notes\n\nStart writing.")
const editor = shallowRef<Editor | null>(null)
</script>

<template>
  <div style="display: flex; gap: 8px">
    <ScriviamoEditor v-model="doc" format="markdown" style="flex: 1; height: 500px" @ready="editor = $event" />
  </div>
</template>
```

Load Scriviamo's stylesheet, `dist/scriviamo.css`, and those of any add-ons, as you load other CSS.

Keep the editor in a `shallowRef`, not a `ref`: Vue mustn't make the editor's internals
reactive.

To register both components for the whole app:

```ts
import {ScriviamoPlugin} from "scriviamo-vue"
app.use(ScriviamoPlugin)
```

## ScriviamoEditor

Takes every setting in the [wrappers README](../README.md#settings), with the document as
`modelValue`, so `v-model` works. Settings are written in kebab case in templates, such as
`:read-only="locked"`.

| Event | Arguments | When |
|---|---|---|
| `update:modelValue` | `value` | The document changed, in `format` |
| `change` | `value`, `editor` | The same, with the editor |
| `selection-change` | `node`, `editor` | The primary selected node changed |
| `ready` | `editor` | The editor was created |

A template ref exposes the editor as `editor`:

```vue
<ScriviamoEditor ref="doc" />
<!-- this.$refs.doc.editor -->
```

The editor is created when the component mounts and destroyed when it unmounts. Props are
applied as they change; only `modelValue` changing from outside reloads the document.


## Building

```bash
npm install
npm run build
```

The build writes `dist/index.js` and its declarations. Vue and Scriviamo stay external, as peer
dependencies.
