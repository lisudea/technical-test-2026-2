<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getEquipment } from '../services/equipmentService'
import type { Equipment, EquipmentCategory, EquipmentStatus } from '../types/equipment'
import type { ApiError } from '../types/api'
import EquipmentCard from '../components/EquipmentCard.vue'
import EquipmentFilters from '../components/EquipmentFilters.vue'
import Pagination from '../components/Pagination.vue'
import LoadingState from '../components/LoadingState.vue'
import EmptyState from '../components/EmptyState.vue'
import ErrorAlert from '../components/ErrorAlert.vue'

const { t } = useI18n()

const equipment = ref<Equipment[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const page = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)
const first = ref(true)
const last = ref(true)
const pageSize = 8

const categoryFilter = ref<EquipmentCategory | undefined>(undefined)
const statusFilter = ref<EquipmentStatus | undefined>(undefined)

async function loadEquipment() {
  loading.value = true
  error.value = null
  try {
    const { data } = await getEquipment({
      page: page.value, size: pageSize,
      category: categoryFilter.value, status: statusFilter.value,
    })
    equipment.value = data.content
    totalPages.value = data.totalPages
    totalElements.value = data.totalElements
    first.value = data.first
    last.value = data.last
  } catch (err) {
    const apiError = err as ApiError
    error.value = apiError.message || t('error.generic')
  } finally {
    loading.value = false
  }
}

watch([categoryFilter, statusFilter], () => { page.value = 0; loadEquipment() })
watch(page, () => loadEquipment())
onMounted(() => loadEquipment())
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">{{ t('equipment.title') }}</h2>
      <span v-if="totalElements > 0" class="text-muted">
        {{ t('equipment.total', { n: totalElements }) }}
      </span>
    </div>

    <EquipmentFilters v-model:category="categoryFilter" v-model:status="statusFilter" />

    <ErrorAlert v-if="error" :message="error" @retry="loadEquipment()" />
    <LoadingState v-if="loading" :message="t('equipment.loading')" />
    <EmptyState v-if="!loading && !error && equipment.length === 0" :message="t('equipment.noResults')" />

    <div v-if="!loading && !error && equipment.length > 0" class="row g-3 mb-3">
      <div v-for="eq in equipment" :key="eq.id" class="col-12 col-sm-6 col-lg-4 col-xl-3">
        <EquipmentCard :equipment="eq" />
      </div>
    </div>

    <Pagination
      v-if="!loading && totalPages > 1"
      :page="page" :total-pages="totalPages" :first="first" :last="last"
      @update:page="(p: number) => page = p"
    />
  </div>
</template>
