<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  totalPages: number
  first: boolean
  last: boolean
}>()
const emit = defineEmits<{
  'update:page': [page: number]
}>()

const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(0, props.page - 2)
  const end = Math.min(props.totalPages, props.page + 3)
  for (let i = start; i < end; i++) {
    pages.push(i)
  }
  return pages
})
</script>

<template>
  <nav v-if="totalPages > 1" aria-label="Equipment pagination">
    <ul class="pagination justify-content-center flex-wrap">
      <li class="page-item" :class="{ disabled: first }">
        <button class="page-link" :disabled="first" @click="emit('update:page', page - 1)">
          Previous
        </button>
      </li>
      <li class="page-item" v-if="visiblePages[0] > 0">
        <button class="page-link" @click="emit('update:page', 0)">1</button>
      </li>
      <li class="page-item disabled" v-if="visiblePages[0] > 1">
        <span class="page-link">...</span>
      </li>
      <li
        v-for="p in visiblePages"
        :key="p"
        class="page-item"
        :class="{ active: p === page }"
      >
        <button class="page-link" @click="emit('update:page', p)">
          {{ p + 1 }}
        </button>
      </li>
      <li class="page-item disabled" v-if="visiblePages[visiblePages.length - 1] < totalPages - 2">
        <span class="page-link">...</span>
      </li>
      <li class="page-item" v-if="visiblePages[visiblePages.length - 1] < totalPages - 1">
        <button class="page-link" @click="emit('update:page', totalPages - 1)">
          {{ totalPages }}
        </button>
      </li>
      <li class="page-item" :class="{ disabled: last }">
        <button class="page-link" :disabled="last" @click="emit('update:page', page + 1)">
          Next
        </button>
      </li>
    </ul>
  </nav>
</template>
