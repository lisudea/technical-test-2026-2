<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { getUserByEmail, createUser } from '../services/userService'
import { createReservation } from '../services/reservationService'
import type { ApiError } from '../types/api'

const props = defineProps<{ equipmentId: number }>()
const emit = defineEmits<{ created: [] }>()
const { t } = useI18n()

const form = reactive({ name: '', email: '', startTime: '', endTime: '' })
const submitting = ref(false)
const success = ref(false)
const error = ref<string | null>(null)
const validationErrors = ref<string[]>([])

function validate(): boolean {
  const errors: string[] = []
  if (!form.name.trim()) errors.push(t('form.nameRequired'))
  if (!form.email.trim()) errors.push(t('form.emailRequired'))
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.push(t('form.emailInvalid'))
  if (!form.startTime) errors.push(t('form.startRequired'))
  if (!form.endTime) errors.push(t('form.endRequired'))
  if (form.startTime && form.endTime && new Date(form.startTime) >= new Date(form.endTime)) {
    errors.push(t('form.startBeforeEnd'))
  }
  validationErrors.value = errors
  return errors.length === 0
}

function getFriendlyMessage(err: ApiError): string {
  switch (err.status) {
    case 400: return err.message || t('error.badRequest')
    case 404: return err.message || t('error.notFound')
    case 409: return t('reservation.error409')
    case 500: return t('error.serverError')
    case 0: return err.message || t('error.networkError')
    default: return err.message || t('error.generic')
  }
}

async function submit() {
  if (!validate()) return
  submitting.value = true; error.value = null; success.value = false
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
      } else throw e
    }
    await createReservation({
      equipmentId: props.equipmentId, userId,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
    })
    success.value = true
    form.name = ''; form.email = ''; form.startTime = ''; form.endTime = ''
    validationErrors.value = []
    emit('created')
  } catch (err) {
    error.value = getFriendlyMessage(err as ApiError)
  } finally { submitting.value = false }
}
</script>

<template>
  <div class="card shadow-sm mt-4">
    <div class="card-body">
      <h5 class="card-title">{{ t('reservation.create') }}</h5>

      <div v-if="success" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ t('reservation.created') }}
        <button type="button" class="btn-close" @click="success = false"></button>
      </div>

      <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ error }}
        <button type="button" class="btn-close" @click="error = null"></button>
      </div>

      <div v-if="validationErrors.length > 0" class="alert alert-warning">
        <ul class="mb-0"><li v-for="e in validationErrors" :key="e">{{ e }}</li></ul>
      </div>

      <form @submit.prevent="submit" novalidate>
        <div class="row g-3">
          <div class="col-md-6">
            <label for="rname" class="form-label">{{ t('form.name') }}</label>
            <input id="rname" v-model="form.name" type="text" class="form-control" :disabled="submitting" required />
          </div>
          <div class="col-md-6">
            <label for="remail" class="form-label">{{ t('form.email') }}</label>
            <input id="remail" v-model="form.email" type="email" class="form-control" :disabled="submitting" required />
          </div>
          <div class="col-md-6">
            <label for="rstart" class="form-label">{{ t('form.startTime') }}</label>
            <input id="rstart" v-model="form.startTime" type="datetime-local" class="form-control" :disabled="submitting" required />
          </div>
          <div class="col-md-6">
            <label for="rend" class="form-label">{{ t('form.endTime') }}</label>
            <input id="rend" v-model="form.endTime" type="datetime-local" class="form-control" :disabled="submitting" required />
          </div>
        </div>
        <button type="submit" class="btn btn-primary mt-3" :disabled="submitting">
          <span v-if="submitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
          {{ submitting ? t('reservation.reserving') : t('reservation.reserve') }}
        </button>
      </form>
    </div>
  </div>
</template>
