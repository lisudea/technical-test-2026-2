<script setup lang="ts">
import { computed } from 'vue'
import { EquipmentStatus } from '../types/equipment'

const props = defineProps<{ status: EquipmentStatus }>()

const config = computed(() => {
  switch (props.status) {
    case EquipmentStatus.AVAILABLE:
      return { text: 'Available', class: 'bg-success', icon: '✓' }
    case EquipmentStatus.RESERVED:
      return { text: 'Reserved', class: 'bg-danger', icon: '●' }
    case EquipmentStatus.MAINTENANCE:
      return { text: 'Maintenance', class: 'bg-secondary', icon: '⚙' }
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
