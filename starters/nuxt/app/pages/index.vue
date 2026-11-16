<script setup lang="ts">
const {data: documents} = await useFetch("/api/documents")
const newId = crypto.randomUUID()
</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0">Documents</h1>
    <NuxtLink class="btn btn-primary" :to="`/edit/${newId}`"><i class="bi bi-plus-lg" /> New document</NuxtLink>
  </div>
  <p v-if="!documents || documents.length == 0" class="text-body-secondary">No documents yet. Start one, and it saves itself as you write.</p>
  <ul v-else class="list-group">
    <li v-for="document in documents" :key="document.id" class="list-group-item d-flex align-items-center gap-3">
      <span class="flex-grow-1">{{ document.title }}</span>
      <small class="text-body-secondary">{{ new Date(document.updated).toLocaleString() }}</small>
      <NuxtLink class="btn btn-sm btn-outline-secondary" :to="`/edit/${document.id}`">Edit</NuxtLink>
      <NuxtLink class="btn btn-sm btn-outline-primary" :to="`/view/${document.id}`">View</NuxtLink>
    </li>
  </ul>
</template>
