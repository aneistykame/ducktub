<template>
  <q-page class="page">
    <div v-if="!chat.isLoggedIn" class="empty auth-slot">
      <AuthPanel />
    </div>

    <div v-else-if="!chat.activeChannel" class="empty no-tubs">
      <div class="empty-body">
        <h2 class="empty-title">No tubs yet</h2>
        <p class="empty-text">
          Create a channel, accept an invite, or type <code>/join channelName</code> to start quacking.
        </p>
      </div>

      <CommandToast :feedback="feedback" />
      <CommandBar @submit="onEmptySubmit" />
    </div>

    <template v-else>
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
    </template>
  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import MembersPanel from '../components/MembersPanel.vue'
import ChatArea from '../components/ChatArea.vue'
import AuthPanel from '../components/AuthPanel.vue'
import CommandBar from '../components/CommandBar.vue'
import CommandToast from '../components/CommandToast.vue'
import { useCommands } from '../composables/useCommands'
import { useChatStore } from '../stores/chat'

const $q = useQuasar()
const chat = useChatStore()

const { feedback, run, say } = useCommands()

function onEmptySubmit(text) {
  if (!run(text)) say(false, 'Join a tub first. Try /join channelName')
}

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

.no-tubs {
  align-items: stretch;
  padding: 0;
}

.empty-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
}

.empty-text code {
  padding: 1px 8px;
  border-radius: $qt-radius-pill;
  background: $qt-chip;
  color: $qt-ink;
  font-family: inherit;
  font-weight: 800;
  white-space: nowrap;
}

.empty-title {
  margin: 0;
  font-size: 30px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.empty-text {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: $qt-ink-quiet;
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
