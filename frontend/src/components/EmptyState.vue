<script setup lang="ts">
defineProps<{ message?: string }>()
</script>

<template>
  <div class="text-center py-5">
    <p class="text-muted fs-5">{{ message || 'No data found.' }}</p>
  </div>
</template>
