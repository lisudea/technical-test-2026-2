<script setup lang="ts">
import { ref, reactive } from 'vue'
import { getUserByEmail, createUser } from '../services/userService'
import { createReservation } from '../services/reservationService'
import type { ApiError } from '../types/api'

const props = defineProps<{ equipmentId: number }>()
const emit = defineEmits<{ created: [] }>()

const form = reactive({
  name: '',
  email: '',
  startTime: '',
  endTime: '',
})

const submitting = ref(false)
const success = ref(false)
const error = ref<string | null>(null)
const validationErrors = ref<string[]>([])

function validate(): boolean {
  const errors: string[] = []
  if (!form.name.trim()) errors.push('Name is required.')
  if (!form.email.trim()) errors.push('Email is required.')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.push('Invalid email format.')
  if (!form.startTime) errors.push('Start time is required.')
  if (!form.endTime) errors.push('End time is required.')
  if (form.startTime && form.endTime && new Date(form.startTime) >= new Date(form.endTime)) {
    errors.push('Start time must be before end time.')
  }
  validationErrors.value = errors
  return errors.length === 0
}

function getFriendlyMessage(err: ApiError): string {
  switch (err.status) {
    case 400:
      return err.message || 'The submitted information is invalid.'
    case 404:
      return err.message || 'The requested resource could not be found.'
    case 409:
      return 'This equipment is already reserved during the selected time period. Please choose another time.'
    case 500:
      return 'An internal server error occurred. Please try again later.'
    case 0:
      return err.message
    default:
      return err.message || 'An unexpected error occurred.'
  }
}

async function submit() {
  if (!validate()) return

  submitting.value = true
  error.value = null
  success.value = false

  try {
    let userId: number
    try {
      const { data: user } = await getUserByEmail(form.email)
      userId = user.id
    } catch (e) {
      const apiErr = e as ApiError
      if (apiErr.status === 404) {
        const { data: newUser } = await createUser({ name: form.name, email: form.email })
        userId = newUser.id
      } else {
        throw e
      }
    }

    await createReservation({
      equipmentId: props.equipmentId,
      userId,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
    })

    success.value = true
    form.name = ''
    form.email = ''
    form.startTime = ''
    form.endTime = ''
    validationErrors.value = []
    emit('created')
  } catch (err) {
    error.value = getFriendlyMessage(err as ApiError)
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  success.value = false
  error.value = null
}
</script>

<template>
  <div class="card shadow-sm mt-4">
    <div class="card-body">
      <h5 class="card-title">Create Reservation</h5>

      <div v-if="success" class="alert alert-success alert-dismissible fade show" role="alert">
        Reservation created successfully!
        <button type="button" class="btn-close" @click="resetForm()"></button>
      </div>

      <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ error }}
        <button type="button" class="btn-close" @click="error = null"></button>
      </div>

      <div v-if="validationErrors.length > 0" class="alert alert-warning">
        <ul class="mb-0">
          <li v-for="e in validationErrors" :key="e">{{ e }}</li>
        </ul>
      </div>

      <form @submit.prevent="submit" novalidate>
        <div class="row g-3">
          <div class="col-md-6">
            <label for="rname" class="form-label">Your Name</label>
            <input
              id="rname"
              v-model="form.name"
              type="text"
              class="form-control"
              :disabled="submitting"
              required
            />
          </div>
          <div class="col-md-6">
            <label for="remail" class="form-label">Your Email</label>
            <input
              id="remail"
              v-model="form.email"
              type="email"
              class="form-control"
              :disabled="submitting"
              required
            />
          </div>
          <div class="col-md-6">
            <label for="rstart" class="form-label">Start Time</label>
            <input
              id="rstart"
              v-model="form.startTime"
              type="datetime-local"
              class="form-control"
              :disabled="submitting"
              required
            />
          </div>
          <div class="col-md-6">
            <label for="rend" class="form-label">End Time</label>
            <input
              id="rend"
              v-model="form.endTime"
              type="datetime-local"
              class="form-control"
              :disabled="submitting"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary mt-3"
          :disabled="submitting"
        >
          <span
            v-if="submitting"
            class="spinner-border spinner-border-sm me-1"
            role="status"
          ></span>
          {{ submitting ? 'Reserving...' : 'Reserve' }}
        </button>
      </form>
    </div>
  </div>
</template>
