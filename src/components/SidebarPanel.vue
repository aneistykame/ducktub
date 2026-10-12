<template>
  <aside class="sidebar">
    <div class="body">
      <header class="top">
        <img :src="logo" alt="QuackTub logo" class="logo" />
        QuackTub
      </header>

      <nav class="middle">
        <InvitationCard
          v-for="c in invitations"
          :key="c.id"
          :channel="c"
          @accept="chat.acceptInvite(c)"
          @decline="chat.declineInvite(c)"
        />

        <div class="label">
          <span>Your channels</span>
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="add"
            aria-label="Create channel"
            @click="createOpen = true"
          />
        </div>

        <ChannelItem
          v-for="c in myChannels"
          :key="c.id"
          :channel="c"
          :active="c.id === chat.activeId"
          @click="chat.setActive(c.id)"
          @leave="askLeave(c)"
        />
      </nav>

      <footer class="bottom">
        <StatusPicker profile @open-profile="profileOpen = true" />
      </footer>
    </div>

    <svg class="wave" aria-hidden="true">
      <defs>
        <pattern id="wave-tile" width="24" height="320" patternUnits="userSpaceOnUse">
          <path
            class="wave-fill"
            d="M0 0 L20 0 C20 80 4 80 4 160 C4 240 20 240 20 320 L0 320 Z"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wave-tile)" />
    </svg>

    <CreateChannelDialog
      v-model="createOpen"
      :existing-names="existingNames"
      @create="chat.createChannel"
    />

    <ProfileDialog v-model="profileOpen" :user="me" />

    <LeaveChannelDialog v-model="leaveOpen" :channel="leaving" />
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useChatStore } from '../stores/chat'
import ChannelItem from './ChannelItem.vue'
import InvitationCard from './InvitationCard.vue'
import CreateChannelDialog from './CreateChannelDialog.vue'
import ProfileDialog from './ProfileDialog.vue'
import LeaveChannelDialog from './LeaveChannelDialog.vue'
import StatusPicker from './StatusPicker.vue'

// Logo: Rubber duck icons created by vectorsmarket15 - Flaticon
// https://www.flaticon.com/free-icons/rubber-duck
import logo from '../assets/logo.png'

const chat = useChatStore()
const me = chat.me

const myChannels = computed(() => chat.channels.filter((c) => !c.invited))
const invitations = computed(() => chat.channels.filter((c) => c.invited))
const existingNames = computed(() => chat.channels.map((c) => c.name))
const createOpen = ref(false)
const profileOpen = ref(false)

const leaveOpen = ref(false)
const leaving = ref(null)

function askLeave(channel) {
  leaving.value = channel
  leaveOpen.value = true
}
</script>

<style lang="scss" scoped>
.sidebar {
  display: flex;
  height: 100%;
  color: $text-light;
}

.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: $dark;
}

.top {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 64px;
  padding: 0 16px;
  font-size: 24px;
  font-weight: 700;
}

.logo {
  width: 44px;
  height: 44px;
}

.middle {
  flex: 1;
  overflow-y: auto;
  padding: 0 25px 0 12px;
}

.label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 18px 10px 8px 18px;
  font-size: 13px;
  font-weight: 700;
}

.label span {
  opacity: 0.7;
}

.bottom {
  padding: 10px 12px calc(14px + env(safe-area-inset-bottom));
  border-top: 1px solid $qt-line;
}

.wave {
  width: 24px;
  flex: none;
  height: 100%;
}

.wave-fill {
  fill: $dark;
}
</style>
