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
          @accept="accept(c)"
          @decline="decline(c)"
        />

        <div class="label">Your channels</div>
        <ChannelItem
          v-for="c in myChannels"
          :key="c.id"
          :channel="c"
          :active="c.id === activeId"
          @click="activeId = c.id"
        />
      </nav>

      <footer class="bottom">
        <div class="avatar">M</div>
        <div>
          <div class="me-name">pip</div>
          <div class="me-status"><span class="dot"></span> online</div>
        </div>
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
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { channels as mockChannels } from '../mock/data'
import ChannelItem from './ChannelItem.vue'
import InvitationCard from './InvitationCard.vue'

// Logo: Rubber duck icons created by vectorsmarket15 - Flaticon
// https://www.flaticon.com/free-icons/rubber-duck
import logo from '../assets/logo.png'

const channels = ref([...mockChannels])

const myChannels = computed(() => channels.value.filter((c) => !c.invited))
const invitations = computed(() => channels.value.filter((c) => c.invited))
const activeId = ref(1)

function accept(channel) {
  channel.invited = false
}

function decline(channel) {
  channels.value = channels.value.filter((c) => c.id !== channel.id)
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
  font-size: 30px;
}

.middle {
  flex: 1;
  overflow-y: auto;
  padding: 0 25px 0 12px;
}

.label {
  font-size: 13px;
  font-weight: 700;
  opacity: 0.7;
  margin: 18px 18px 8px;
}

.bottom {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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

.logo {
  width: 44px;
  height: 44px;
}
</style>
