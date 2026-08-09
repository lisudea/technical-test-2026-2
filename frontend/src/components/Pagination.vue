<script setup lang="ts">
defineProps<{
  page: number
  totalPages: number
  first: boolean
  last: boolean
}>()
const emit = defineEmits<{
  'update:page': [page: number]
}>()
</script>

<template>
  <nav v-if="totalPages > 1" aria-label="Equipment pagination">
    <ul class="pagination justify-content-center">
      <li class="page-item" :class="{ disabled: first }">
        <button class="page-link" :disabled="first" @click="emit('update:page', page - 1)">
          Previous
        </button>
      </li>
      <li class="page-item" v-for="p in totalPages" :key="p" :class="{ active: p - 1 === page }">
        <button class="page-link" @click="emit('update:page', p - 1)">
          {{ p }}
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
