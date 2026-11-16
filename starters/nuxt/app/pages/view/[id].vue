<script setup lang="ts">
const route = useRoute()
const id = String(route.params.id)
// Rendered on the server: no editor, and no JavaScript needed to read it.
const {data: rendered, error} = await useFetch(`/api/render/${id}`)
if (error.value) throw createError({statusCode: 404, statusMessage: "Document not found"})
useHead({style: [{innerHTML: () => rendered.value?.css ?? ""}]})
</script>

<template>
  <div class="d-flex align-items-center gap-2 mb-3">
    <NuxtLink class="btn btn-sm btn-link px-0" to="/"><i class="bi bi-arrow-left" /> Documents</NuxtLink>
    <NuxtLink class="btn btn-sm btn-outline-secondary ms-auto" :to="`/edit/${id}`">Edit</NuxtLink>
  </div>
  <article v-if="rendered" class="document" v-html="rendered.html" />
</template>
