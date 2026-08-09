<script setup lang="ts">
import type { Reservation } from '../types/reservation'
import { ReservationStatus } from '../types/reservation'

defineProps<{
  reservations: Reservation[]
  loading?: boolean
}>()
const emit = defineEmits<{
  cancel: [id: number]
}>()
</script>

<template>
  <div v-if="loading" class="text-muted">Loading reservations...</div>

  <div v-else-if="reservations.length === 0" class="text-muted">
    No reservations for this equipment.
  </div>

  <div v-else>
    <div class="table-responsive">
      <table class="table table-sm table-hover">
        <thead>
          <tr>
            <th>User</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in reservations" :key="r.id">
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
                @click="emit('cancel', r.id)"
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
