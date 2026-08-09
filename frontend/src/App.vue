<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

function switchLang(lang: string) {
  locale.value = lang
  localStorage.setItem('locale', lang)
}
</script>

<template>
  <nav class="navbar navbar-expand-md navbar-dark bg-dark mb-4">
    <div class="container">
      <router-link to="/" class="navbar-brand mb-0 h1 text-decoration-none">
        {{ t('nav.dashboard') }}
      </router-link>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        :aria-label="t('nav.toggle')"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div id="navbarNav" class="collapse navbar-collapse justify-content-end">
        <ul class="navbar-nav align-items-md-center gap-2">
          <li class="nav-item">
            <router-link to="/reservations" class="nav-link">
              {{ t('nav.reservations') }}
            </router-link>
          </li>
          <li class="nav-item">
            <div class="btn-group btn-group-sm" role="group">
              <button
                class="btn btn-outline-light"
                :class="{ active: locale === 'en' }"
                @click="switchLang('en')"
              >
                EN
              </button>
              <button
                class="btn btn-outline-light"
                :class="{ active: locale === 'es' }"
                @click="switchLang('es')"
              >
                ES
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <main class="container pb-4">
    <router-view />
  </main>
</template>
