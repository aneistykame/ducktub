<template>
  <q-page class="page">
    <ChatArea
      class="chat-slot"
      :members-open="showMembers"
      :show-members-button="mode !== 'fixed'"
      @toggle-members="showMembers = !showMembers"
    />

    <div
      v-if="mode === 'overlay' && showMembers"
      class="backdrop"
      @click="showMembers = false"
    ></div>

    <MembersPanel
      v-if="showMembers"
      :class="{ overlay: mode === 'overlay' }"
      :closable="mode !== 'fixed'"
      :width="panelWidth"
      @close="showMembers = false"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import MembersPanel from '../components/MembersPanel.vue'
import ChatArea from '../components/ChatArea.vue'

const $q = useQuasar()

const OVERLAY_BELOW = 900
const FIXED_FROM = 1200
const WIDE_FROM = 1550
const WIDTH = 260
const WIDE_WIDTH = 320

const mode = computed(() => {
  if ($q.screen.width >= FIXED_FROM) return 'fixed'
  if ($q.screen.width < OVERLAY_BELOW) return 'overlay'
  return 'optional'
})

const panelWidth = computed(() => ($q.screen.width >= WIDE_FROM ? WIDE_WIDTH : WIDTH))

const showMembers = ref(mode.value === 'fixed')

watch(mode, (m) => {
  showMembers.value = m === 'fixed'
})
</script>

<style lang="scss" scoped>
.page {
  position: relative;
  display: flex;
}

.chat-slot {
  flex: 1;
  min-width: 0;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.55);
}

.overlay {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 101;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.4);
}
</style>
