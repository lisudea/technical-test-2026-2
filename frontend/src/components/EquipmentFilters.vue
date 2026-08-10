<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { EquipmentCategory, EquipmentStatus } from '../types/equipment'
import type { EquipmentCategory as EquipmentCategoryType, EquipmentStatus as EquipmentStatusType } from '../types/equipment'

const category = defineModel<EquipmentCategoryType | undefined>('category')
const status = defineModel<EquipmentStatusType | undefined>('status')
const { t } = useI18n()

const categoryOptions = Object.values(EquipmentCategory).map(cat => ({
  value: cat,
  label: t(`equipment.categories.${cat}`),
}))

const statusOptions = Object.values(EquipmentStatus).map(st => ({
  value: st,
  label: t(`equipment.statuses.${st}`),
}))
</script>

<template>
  <div class="row g-2 mb-3">
    <div class="col-12 col-md-5">
      <select v-model="category" class="form-select" aria-label="Filter by category">
        <option :value="undefined">{{ t('equipment.filters.allCategories') }}</option>
        <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>
    <div class="col-12 col-md-5">
      <select v-model="status" class="form-select" aria-label="Filter by status">
        <option :value="undefined">{{ t('equipment.filters.allStatuses') }}</option>
        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>
    <div class="col-6 col-md-2">
      <button class="btn btn-outline-secondary w-100" @click="category = undefined; status = undefined">
        {{ t('equipment.filters.clear') }}
      </button>
    </div>
  </div>
</template>
