<script setup lang="ts">
const route = useRoute()
const id = String(route.params.id)
// A new document isn't stored yet, so a 404 here just means "start empty".
const {data: document} = await useFetch(`/api/documents/${id}`, {ignoreResponseError: true})
</script>

<template>
  <div class="d-flex align-items-center gap-2 mb-3">
    <NuxtLink class="btn btn-sm btn-link px-0" to="/"><i class="bi bi-arrow-left" /> Documents</NuxtLink>
    <NuxtLink class="btn btn-sm btn-outline-primary ms-auto" :to="`/view/${id}`">View</NuxtLink>
  </div>
  <!-- The editor works in the browser; the server renders this page's frame. -->
  <ClientOnly>
    <DocumentEditor :id="id" :initial="document && document.content ? document.content : null" />
    <template #fallback><div class="editor-frame border rounded" /></template>
  </ClientOnly>
</template>
