<script setup lang="ts">
import type {Editor} from "scriviamo"
import {ScriviamoEditor} from "scriviamo-vue"
import "~/scriviamo"

const props = defineProps<{id: string, initial: string | null}>()

const Welcome = "# A new document\n\nStart writing. Type / to add a block: a list, a table, a formula, a diagram and more."

/** Saves the document a moment after each change. */
const autosave = {
  warnBeforeLeaving: true,
  async save(editor: Editor) {
    await $fetch(`/api/documents/${props.id}`, {method: "PUT", body: editor.toJSON(), headers: {"Content-Type": "application/json"}})
  }
}
</script>

<template>
  <ScriviamoEditor
    class="editor-frame"
    :model-value="initial ?? Welcome"
    :format="initial ? 'json' : 'markdown'"
    status-bar
    :autosave="autosave"
  />
</template>
