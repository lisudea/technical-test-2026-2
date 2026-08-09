<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getReservations, cancelReservation } from '../services/reservationService'
import type { Reservation } from '../types/reservation'
import type { ApiError } from '../types/api'
import { ReservationStatus } from '../types/reservation'
import LoadingState from '../components/LoadingState.vue'
import EmptyState from '../components/EmptyState.vue'
import ErrorAlert from '../components/ErrorAlert.vue'

const { t } = useI18n()
const reservations = ref<Reservation[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function loadReservations() {
  loading.value = true; error.value = null
  try {
    const { data } = await getReservations()
    reservations.value = data
  } catch (err) {
    const apiError = err as ApiError
    error.value = apiError.message || t('error.generic')
  } finally { loading.value = false }
}

async function handleCancel(id: number) {
  if (!confirm(t('reservation.confirmCancel'))) return
  try { await cancelReservation(id); await loadReservations() }
  catch (err) { error.value = (err as ApiError).message || t('error.generic') }
}

onMounted(() => loadReservations())
</script>

<template>
  <div>
    <router-link to="/" class="btn btn-outline-secondary btn-sm mb-3">
      {{ t('nav.backToDashboard') }}
    </router-link>

    <h3 class="mb-3">{{ t('reservation.allReservations') }}</h3>

    <ErrorAlert v-if="error" :message="error" @retry="loadReservations()" />
    <LoadingState v-if="loading" :message="t('reservation.loading')" />
    <EmptyState v-if="!loading && !error && reservations.length === 0" :message="t('reservation.noResults')" />

    <div v-if="!loading && !error && reservations.length > 0" class="table-responsive">
      <table class="table table-hover">
        <thead class="table-dark">
          <tr>
            <th>{{ t('equipment.id') }}</th>
            <th>{{ t('equipment.title') }}</th>
            <th>{{ t('reservation.user') }}</th>
            <th>{{ t('reservation.start') }}</th>
            <th>{{ t('reservation.end') }}</th>
            <th>{{ t('reservation.status') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in reservations" :key="r.id">
            <td>{{ r.id }}</td>
            <td>
              <router-link :to="{ name: 'equipment-detail', params: { id: r.equipment.id } }">
                {{ r.equipment.name }}
              </router-link>
            </td>
            <td><div>{{ r.user.name }}</div><small class="text-muted">{{ r.user.email }}</small></td>
            <td>{{ new Date(r.startTime).toLocaleString() }}</td>
            <td>{{ new Date(r.endTime).toLocaleString() }}</td>
            <td>
              <span class="badge" :class="r.status === ReservationStatus.ACTIVE ? 'bg-success' : 'bg-secondary'">
                {{ r.status }}
              </span>
            </td>
            <td>
              <button v-if="r.status === ReservationStatus.ACTIVE" class="btn btn-outline-danger btn-sm" @click="handleCancel(r.id)">
                {{ t('reservation.cancel') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
