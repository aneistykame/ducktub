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
        />
      </nav>

      <footer>
        <button type="button" class="bottom" aria-label="Open your profile" @click="profileOpen = true">
          <div class="avatar">P</div>
          <div>
            <div class="me-name">pip</div>
            <div class="me-status"><span class="dot"></span> online</div>
          </div>
        </button>
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
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useChatStore } from '../stores/chat'
import ChannelItem from './ChannelItem.vue'
import InvitationCard from './InvitationCard.vue'
import CreateChannelDialog from './CreateChannelDialog.vue'
import ProfileDialog from './ProfileDialog.vue'

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
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.bottom:hover {
  background: rgba(255, 255, 255, 0.06);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: $secondary;
  color: $text-dark;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.me-name {
  font-weight: 700;
}

.me-status {
  font-size: 13px;
  opacity: 0.85;
}

.dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: $positive;
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
