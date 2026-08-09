<script setup lang="ts">
</script>

<template>
  <nav class="navbar navbar-expand-md navbar-dark bg-dark mb-4">
    <div class="container">
      <router-link to="/" class="navbar-brand mb-0 h1 text-decoration-none">
        LIS Resource Management
      </router-link>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div id="navbarNav" class="collapse navbar-collapse justify-content-end">
        <ul class="navbar-nav">
          <li class="nav-item">
            <router-link to="/reservations" class="nav-link">
              Reservations
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <main class="container pb-4">
    <router-view />
  </main>
</template>
