<script setup lang="ts">
</script>

<template>
  <nav class="navbar navbar-dark bg-dark mb-4">
    <div class="container">
      <router-link to="/" class="navbar-brand mb-0 h1 text-decoration-none">
        LIS Resource Management
      </router-link>
      <router-link to="/reservations" class="btn btn-outline-light btn-sm">
        Reservations
      </router-link>
    </div>
  </nav>

  <main class="container">
    <router-view />
  </main>
</template>
