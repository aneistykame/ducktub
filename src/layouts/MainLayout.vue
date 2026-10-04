<template>
  <q-layout view="lHh Lpr lFf">
    <q-btn
      v-if="!isLarge && !drawer"
      class="menu-btn"
      flat
      round
      icon="menu"
      @click="drawer = true"
    />

    <q-drawer v-model="drawer" :behavior="isSmall ? 'mobile' : 'desktop'" :width="drawerWidth">
      <q-btn v-if="!isLarge" class="close-btn" flat round icon="close" @click="drawer = false" />
      <SidebarPanel />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import SidebarPanel from '../components/SidebarPanel.vue'

const $q = useQuasar()

const OVERLAY_BELOW = 600
const FIXED_FROM = 1124
const WIDE_FROM = 1550
const WIDTH = 300
const WIDE_WIDTH = 350

const isSmall = computed(() => $q.screen.width < OVERLAY_BELOW)
const isLarge = computed(() => $q.screen.width >= FIXED_FROM)

const drawerWidth = computed(() => {
  if (isSmall.value) return Math.min(WIDE_WIDTH, $q.screen.width * 0.85)
  if ($q.screen.width < WIDE_FROM) return WIDTH
  return WIDE_WIDTH
})

const drawer = ref(!isSmall.value)

watch(isSmall, (small) => {
  if (small) drawer.value = false
})
watch(isLarge, (large) => {
  if (large) drawer.value = true
})
</script>

<style lang="scss" scoped>
.menu-btn {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 10;
}
.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

:deep(.q-drawer--left) {
  background: transparent;
  box-shadow: none;
}

</style>
