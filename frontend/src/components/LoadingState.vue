<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ message?: string }>()
const { t } = useI18n()
</script>

<template>
  <div class="text-center py-5">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">{{ t('loading.generic') }}</span>
    </div>
    <p class="mt-2 text-muted">{{ message || t('loading.generic') }}</p>
  </div>
</template>
