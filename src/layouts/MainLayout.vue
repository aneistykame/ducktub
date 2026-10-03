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

const isSmall = computed(() => $q.screen.width < 600)
const isLarge = computed(() => $q.screen.width >= 1124)

const drawerWidth = computed(() => {
  if (isSmall.value) return Math.min(350, $q.screen.width * 0.85)
  if ($q.screen.width < 1550) return 300
  return 350
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
