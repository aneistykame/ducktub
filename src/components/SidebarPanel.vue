<template>
  <aside class="sidebar">
    <div class="body">
      <header class="top">
        <img :src="logo" alt="QuackTub logo" class="logo" />
        QuackTub
      </header>

      <nav v-if="chat.isLoggedIn" class="middle">
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

      <div v-else class="middle logged-out">
        <q-icon name="lock_outline" size="22px" />
        <p>Log in to see your channels.</p>
      </div>

      <footer v-if="chat.isLoggedIn" class="bottom">
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

    <ProfileDialog v-model="profileOpen" :user="chat.me" />

    <LeaveChannelDialog v-model="leaveOpen" :channel="leaving" @left="showFeedback" />
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
import { useCommands } from '../composables/useCommands'

// Logo: Rubber duck icons created by vectorsmarket15 - Flaticon
// https://www.flaticon.com/free-icons/rubber-duck
import logo from '../assets/logo.png'

const chat = useChatStore()
const myChannels = computed(() => chat.myChannels)
const invitations = computed(() => chat.myInvitations)
const existingNames = computed(() => chat.channels.map((c) => c.name))
const createOpen = ref(false)
const profileOpen = ref(false)

const leaveOpen = ref(false)
const leaving = ref(null)

const { show: showFeedback } = useCommands()

function askLeave(channel) {
  leaving.value = channel
  leaveOpen.value = true
}
</script>

<style lang="scss" scoped>
.sidebar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 24px;
  height: 100%;
  overflow: hidden;
  color: $text-light;
}

.body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: $dark;
}

.top {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 64px;
  padding: 0 16px;
  font-size: 24px;
  font-weight: 700;
}

.logo {
  flex: none;
  width: 44px;
  height: 44px;
}

.middle {
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
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

.logged-out {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: $qt-water-ink-quiet;
  font-family: $qt-font;
  font-size: 14px;
  font-weight: 700;
  text-align: center;

  p {
    margin: 0;
  }
}

.bottom {
  min-width: 0;
  padding: 10px 12px calc(14px + env(safe-area-inset-bottom));
  border-top: 1px solid $qt-line;
}

.wave {
  display: block;
  width: 100%;
  height: 100%;
}

.wave-fill {
  fill: $dark;
}
</style>
