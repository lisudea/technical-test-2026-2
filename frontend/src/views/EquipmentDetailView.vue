<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const id = route.params.id
</script>

<template>
  <div>
    <router-link to="/" class="btn btn-outline-secondary btn-sm mb-3">
      ← Back to Dashboard
    </router-link>
    <h3>Equipment Detail #{{ id }}</h3>
    <p class="text-muted">Coming soon...</p>
  </div>
</template>
