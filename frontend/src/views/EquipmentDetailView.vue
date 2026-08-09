<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getEquipmentById } from '../services/equipmentService'
import { getEquipmentReservations, cancelReservation } from '../services/reservationService'
import type { Equipment } from '../types/equipment'
import type { Reservation } from '../types/reservation'
import type { ApiError } from '../types/api'
import EquipmentStatusBadge from '../components/EquipmentStatusBadge.vue'
import ReservationList from '../components/ReservationList.vue'
import ReservationForm from '../components/ReservationForm.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorAlert from '../components/ErrorAlert.vue'

const { t } = useI18n()
const route = useRoute()
const id = Number(route.params.id)

const equipment = ref<Equipment | null>(null)
const reservations = ref<Reservation[]>([])
const loading = ref(true)
const resLoading = ref(true)
const error = ref<string | null>(null)
const cancelError = ref<string | null>(null)

async function loadEquipment() {
  loading.value = true; error.value = null
  try {
    const { data } = await getEquipmentById(id)
    equipment.value = data
  } catch (err) {
    const apiError = err as ApiError
    error.value = apiError.message || t('error.generic')
  } finally {
    loading.value = false
  }
}

async function loadReservations() {
  resLoading.value = true
  try {
    const { data } = await getEquipmentReservations(id)
    reservations.value = data
  } catch { reservations.value = [] }
  finally { resLoading.value = false }
}

async function handleCancel(reservationId: number) {
  if (!confirm(t('reservation.confirmCancel'))) return
  cancelError.value = null
  try { await cancelReservation(reservationId); await loadReservations() }
  catch (err) { cancelError.value = (err as ApiError).message || t('error.generic') }
}

async function handleReservationCreated() { await loadReservations() }

onMounted(() => { loadEquipment(); loadReservations() })
</script>

<template>
  <div>
    <router-link to="/" class="btn btn-outline-secondary btn-sm mb-3">
      {{ t('nav.backToDashboard') }}
    </router-link>

    <ErrorAlert v-if="error" :message="error" @retry="loadEquipment()" />
    <LoadingState v-if="loading" :message="t('equipment.loading')" />

    <div v-if="equipment && !loading" class="card shadow-sm">
      <div class="card-body">
        <h3 class="card-title mb-3">
          {{ equipment.name }}
          <EquipmentStatusBadge :status="equipment.status" />
        </h3>
        <div class="row mb-2"><div class="col-sm-4 fw-bold">{{ t('equipment.id') }}</div><div class="col-sm-8">{{ equipment.id }}</div></div>
        <div class="row mb-2"><div class="col-sm-4 fw-bold">{{ t('equipment.serialNumber') }}</div><div class="col-sm-8">{{ equipment.serialNumber }}</div></div>
        <div v-if="equipment.macAddress" class="row mb-2"><div class="col-sm-4 fw-bold">{{ t('equipment.macAddress') }}</div><div class="col-sm-8">{{ equipment.macAddress }}</div></div>
        <div class="row mb-2"><div class="col-sm-4 fw-bold">{{ t('equipment.category') }}</div><div class="col-sm-8">{{ equipment.category }}</div></div>
        <div class="row mb-2"><div class="col-sm-4 fw-bold">{{ t('equipment.statusLabel') }}</div><div class="col-sm-8"><EquipmentStatusBadge :status="equipment.status" /></div></div>
        <div class="row mb-2"><div class="col-sm-4 fw-bold">{{ t('equipment.created') }}</div><div class="col-sm-8">{{ new Date(equipment.createdAt).toLocaleString() }}</div></div>
        <div class="row mb-2"><div class="col-sm-4 fw-bold">{{ t('equipment.updated') }}</div><div class="col-sm-8">{{ new Date(equipment.updatedAt).toLocaleString() }}</div></div>
      </div>
    </div>

    <div v-if="cancelError" class="alert alert-warning alert-dismissible fade show mt-3" role="alert">
      {{ cancelError }}
      <button type="button" class="btn-close" @click="cancelError = null"></button>
    </div>

    <div class="card shadow-sm mt-4">
      <div class="card-body">
        <h5 class="card-title">{{ t('reservation.title') }}</h5>
        <ReservationList :reservations="reservations" :loading="resLoading" @cancel="handleCancel" />
      </div>
    </div>

    <ReservationForm v-if="equipment && !loading" :equipment-id="equipment.id" @created="handleReservationCreated()" />
  </div>
</template>
