<template>
  <aside class="members">
    <header class="members-header">
      <span>Members</span>
      <span class="count">{{ members.length }}</span>
      <q-btn
        v-if="closable"
        class="close"
        flat
        round
        dense
        icon="close"
        aria-label="Close members"
        @click="emit('close')"
      />
    </header>

    <ul class="list">
      <li v-for="u in members" :key="u.id" class="member" :class="{ off: u.status !== 'online' }">
        <UserAvatar :user="u" :status="u.status" small />
        <div class="info">
          <div class="name">
            {{ u.nickName }}
            <q-icon v-if="u.id === channel.adminId" name="star" color="secondary" size="16px" />
          </div>
          <div class="state">{{ statusLabel[u.status] }}</div>
        </div>
      </li>
    </ul>

    <Pond />
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { users, channels } from '../mock/data'
import UserAvatar from './UserAvatar.vue'
import Pond from './Pond.vue'

const props = defineProps({
  closable: Boolean,
  width: Number,
})
const emit = defineEmits(['close'])

const widthPx = computed(() => props.width + 'px')

const channelId = 1
const channel = computed(() => channels.find((c) => c.id === channelId))

const order = { online: 0, dnd: 1, offline: 2 }
const statusLabel = { online: 'online', dnd: 'do not disturb', offline: 'offline' }

const members = computed(() => [...users].sort((a, b) => order[a.status] - order[b.status]))
</script>

<style lang="scss" scoped>
.members {
  display: flex;
  flex-direction: column;
  width: v-bind(widthPx);
  max-width: 75vw;
  flex: none;
  height: 100vh;
  background: $dark-page;
  color: $text-light;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}

.members-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 64px;
  padding: 0 16px;
  font-size: 20px;
  font-weight: 700;
}

.close {
  margin-left: auto;
}

.count {
  font-size: 13px;
  font-weight: 600;
  background: $dark;
  border-radius: 999px;
  padding: 0 9px;
}

.list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 0 12px;
}

.member {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 14px;
}

.member:hover {
  background: rgba(255, 255, 255, 0.06);
}

.member.off {
  opacity: 0.55;
}

.name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
}

.state {
  font-size: 12px;
  opacity: 0.7;
}
</style>
