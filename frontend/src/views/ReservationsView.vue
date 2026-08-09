<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getReservations, cancelReservation } from '../services/reservationService'
import type { Reservation } from '../types/reservation'
import type { ApiError } from '../types/api'
import { ReservationStatus } from '../types/reservation'
import LoadingState from '../components/LoadingState.vue'
import EmptyState from '../components/EmptyState.vue'
import ErrorAlert from '../components/ErrorAlert.vue'

const reservations = ref<Reservation[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function loadReservations() {
  loading.value = true
  error.value = null
  try {
    const { data } = await getReservations()
    reservations.value = data
  } catch (err) {
    const apiError = err as ApiError
    error.value = apiError.message || 'Failed to load reservations.'
  } finally {
    loading.value = false
  }
}

async function handleCancel(id: number) {
  if (!confirm('Are you sure you want to cancel this reservation?')) return
  try {
    await cancelReservation(id)
    await loadReservations()
  } catch (err) {
    const apiError = err as ApiError
    error.value = apiError.message || 'Failed to cancel reservation.'
  }
}

onMounted(() => {
  loadReservations()
})
</script>

<template>
  <div>
    <router-link to="/" class="btn btn-outline-secondary btn-sm mb-3">
      ← Back to Dashboard
    </router-link>

    <h3 class="mb-3">All Reservations</h3>

    <ErrorAlert
      v-if="error"
      :message="error"
      @retry="loadReservations()"
    />

    <LoadingState v-if="loading" message="Loading reservations..." />

    <EmptyState
      v-if="!loading && !error && reservations.length === 0"
      message="No reservations found."
    />

    <div v-if="!loading && !error && reservations.length > 0" class="table-responsive">
      <table class="table table-hover">
        <thead class="table-dark">
          <tr>
            <th>ID</th>
            <th>Equipment</th>
            <th>User</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
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
            <td>
              <div>{{ r.user.name }}</div>
              <small class="text-muted">{{ r.user.email }}</small>
            </td>
            <td>{{ new Date(r.startTime).toLocaleString() }}</td>
            <td>{{ new Date(r.endTime).toLocaleString() }}</td>
            <td>
              <span
                class="badge"
                :class="r.status === ReservationStatus.ACTIVE ? 'bg-success' : 'bg-secondary'"
              >
                {{ r.status }}
              </span>
            </td>
            <td>
              <button
                v-if="r.status === ReservationStatus.ACTIVE"
                class="btn btn-outline-danger btn-sm"
                @click="handleCancel(r.id)"
              >
                Cancel
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
