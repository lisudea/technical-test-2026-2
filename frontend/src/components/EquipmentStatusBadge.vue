<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { EquipmentStatus } from '../types/equipment'
import type { EquipmentStatus as EquipmentStatusType } from '../types/equipment'

const props = defineProps<{ status: EquipmentStatusType }>()
const { t } = useI18n()

const config = computed(() => {
  switch (props.status) {
    case EquipmentStatus.AVAILABLE:
      return { text: t('equipment.status.available'), class: 'bg-success', icon: '✓' }
    case EquipmentStatus.RESERVED:
      return { text: t('equipment.status.reserved'), class: 'bg-danger', icon: '●' }
    case EquipmentStatus.MAINTENANCE:
      return { text: t('equipment.status.maintenance'), class: 'bg-secondary', icon: '⚙' }
    default:
      return { text: props.status, class: 'bg-dark', icon: '?' }
  }
})
</script>

<template>
  <span class="badge" :class="config.class">
    {{ config.icon }} {{ config.text }}
  </span>
</template>
