<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Equipment } from '../types/equipment'
import EquipmentStatusBadge from './EquipmentStatusBadge.vue'

defineProps<{ equipment: Equipment }>()
const { t } = useI18n()
</script>

<template>
  <div class="card h-100 shadow-sm">
    <div class="card-body">
      <h5 class="card-title">{{ equipment.name }}</h5>
      <p class="card-text mb-1">
        <small class="text-muted">
          <strong>{{ t('equipment.serialNumber') }}:</strong> {{ equipment.serialNumber }}
        </small>
      </p>
      <p class="card-text mb-2">
        <small class="text-muted">
          <strong>{{ t('equipment.category') }}:</strong> {{ t(`equipment.categories.${equipment.category}`) }}
        </small>
      </p>
      <EquipmentStatusBadge :status="equipment.status" />
    </div>
    <div class="card-footer bg-transparent border-top-0">
      <router-link
        :to="{ name: 'equipment-detail', params: { id: equipment.id } }"
        class="btn btn-outline-primary btn-sm w-100"
      >
        {{ t('equipment.viewDetails') }}
      </router-link>
    </div>
  </div>
</template>
