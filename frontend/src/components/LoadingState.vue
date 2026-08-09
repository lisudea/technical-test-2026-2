<script setup lang="ts">
defineProps<{ message?: string }>()
</script>

<template>
  <div class="text-center py-5">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <p class="mt-2 text-muted">{{ message || 'Loading...' }}</p>
  </div>
</template>
