<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ message?: string }>()
const { t } = useI18n()
</script>

<template>
  <div class="text-center py-5">
    <p class="text-muted fs-5">{{ message || t('empty.generic') }}</p>
  </div>
</template>
