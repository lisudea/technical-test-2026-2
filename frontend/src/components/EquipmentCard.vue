<script setup lang="ts">
import type { Equipment } from '../types/equipment'
import EquipmentStatusBadge from './EquipmentStatusBadge.vue'

defineProps<{ equipment: Equipment }>()
</script>

<template>
  <div class="card h-100 shadow-sm">
    <div class="card-body">
      <h5 class="card-title">{{ equipment.name }}</h5>
      <p class="card-text mb-1">
        <small class="text-muted">
          <strong>SN:</strong> {{ equipment.serialNumber }}
        </small>
      </p>
      <p class="card-text mb-2">
        <small class="text-muted">
          <strong>Category:</strong> {{ equipment.category }}
        </small>
      </p>
      <EquipmentStatusBadge :status="equipment.status" />
    </div>
    <div class="card-footer bg-transparent border-top-0">
      <router-link
        :to="{ name: 'equipment-detail', params: { id: equipment.id } }"
        class="btn btn-outline-primary btn-sm w-100"
      >
        View Details
      </router-link>
    </div>
  </div>
</template>
