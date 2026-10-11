<template>
  <aside class="members">
    <header class="members-header">
      <span>Members</span>
      <span class="count">{{ members.length }}</span>
      <span class="spacer"></span>
      <q-btn
        flat
        round
        dense
        icon="person_add"
        :class="{ muted: !canInvite }"
        aria-label="Invite member"
        @click="onInviteClick"
      />
      <q-btn
        v-if="closable"
        flat
        round
        dense
        icon="close"
        aria-label="Close members"
        @click="emit('close')"
      />
    </header>

    <div v-if="deniedShown" class="note">
      <q-icon name="lock" size="16px" />
      <span>Only the admin ({{ adminNick }}) can invite people to this private channel.</span>
      <q-btn flat round dense size="sm" icon="close" aria-label="Dismiss" @click="deniedShown = false" />
    </div>

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

      <li v-if="invited.length" class="divider"></li>

      <li v-for="u in invited" :key="'invited-' + u.id" class="member off">
        <UserAvatar :user="u" small />
        <div class="info">
          <div class="name">{{ u.nickName }}</div>
          <div class="state">invitation sent</div>
        </div>
      </li>
    </ul>

    <Pond />

    <InviteDialog
      v-model="inviteOpen"
      :channel-name="channel.name"
      :candidates="candidates"
      :known-ids="knownIds"
      :invited-ids="invitedIds"
      @invite="invite"
    />
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { users, channels } from '../mock/data'
import UserAvatar from './UserAvatar.vue'
import InviteDialog from './InviteDialog.vue'
import Pond from './Pond.vue'

const props = defineProps({
  closable: Boolean,
  width: Number,
})
const emit = defineEmits(['close'])

const widthPx = computed(() => props.width + 'px')

const me = users[0]
const channelId = 1
const channel = computed(() => channels.find((c) => c.id === channelId))

const memberIds = ref([1, 2, 3, 4, 5])
const invitedIds = ref([])
const inviteOpen = ref(false)

const order = { online: 0, dnd: 1, offline: 2 }
const statusLabel = { online: 'online', dnd: 'do not disturb', offline: 'offline' }

const members = computed(() =>
  users
    .filter((u) => memberIds.value.includes(u.id))
    .sort((a, b) => order[a.status] - order[b.status]),
)
const invited = computed(() => users.filter((u) => invitedIds.value.includes(u.id)))
const candidates = computed(() => users.filter((u) => !memberIds.value.includes(u.id)))

const knownIds = computed(() => {
  const ids = channels
    .filter((c) => !c.invited && (c.memberIds ?? []).includes(me.id))
    .flatMap((c) => c.memberIds)
  return [...new Set(ids)].filter((id) => id !== me.id)
})

const canInvite = computed(() => channel.value.type === 'public' || channel.value.adminId === me.id)
const adminNick = computed(() => users.find((u) => u.id === channel.value.adminId)?.nickName)

function invite(user) {
  if (!invitedIds.value.includes(user.id)) invitedIds.value.push(user.id)
}

const deniedShown = ref(false)

function onInviteClick() {
  if (canInvite.value) {
    inviteOpen.value = true
  } else {
    deniedShown.value = !deniedShown.value
  }
}
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

.spacer {
  flex: 1;
}

.count {
  font-size: 13px;
  font-weight: 600;
  background: $dark;
  border-radius: 999px;
  padding: 0 9px;
}

.note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 16px 8px;
  padding: 8px 12px;
  border-radius: 12px;
  background: $dark;
  font-size: 12px;
  line-height: 1.4;
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

.divider {
  height: 1px;
  margin: 12px 10px 8px;
  background: rgba(255, 255, 255, 0.3);
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

.muted {
  opacity: 0.5;
}
</style>
