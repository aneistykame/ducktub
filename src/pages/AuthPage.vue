<template>
  <q-page class="page">
    <div class="empty auth-slot">
      <AuthPanel />
    </div>
  </q-page>
</template>

<script setup>
import AuthPanel from '../components/AuthPanel.vue'
</script>

<style lang="scss" scoped>
.page {
  position: relative;
  display: flex;
}

.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 100dvh;
  padding: 24px;
  background: $dark-page;
  color: $text-light;
  font-family: $qt-font;
  text-align: center;
}

.auth-slot {
  justify-content: flex-start;
  overflow-y: auto;
}

@media (max-width: 1123px) {
  .auth-slot {
    padding-top: 64px;
  }
}

@media (max-width: 599px) {
  .auth-slot {
    padding: 56px 16px 12px;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .auth-slot {
    padding: 8px 16px 8px 64px;
  }
}
</style>
