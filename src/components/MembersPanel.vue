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
        :class="{ muted: !chat.canInviteToActive }"
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

    <div v-if="notice" class="note">
      <q-icon name="info" size="16px" />
      <span>{{ notice }}</span>
      <q-btn flat round dense size="sm" icon="close" aria-label="Dismiss" @click="notice = ''" />
    </div>

    <ul class="list">
      <li
        v-for="u in members"
        :key="u.id"
        class="member"
        :class="{ off: u.status !== 'online' }"
        role="button"
        tabindex="0"
        @click="openProfile(u)"
        @keyup.enter="openProfile(u)"
      >
        <UserAvatar :user="u" :status="u.status" small />
        <div class="info">
          <div class="name">
            {{ u.nickName }}
            <q-icon v-if="u.id === channel.adminId" name="star" color="secondary" size="16px" />
          </div>
          <div class="state">{{ statusLabel[u.status] }}</div>
        </div>

        <span v-if="chat.activeIsPublic && kicksOf(u)" class="kicks">
          kicked {{ kicksOf(u) }}/{{ KICKS_TO_BAN }}
          <q-tooltip>{{ kicksText(u) }}</q-tooltip>
        </span>
      </li>

      <li v-if="invited.length" class="divider"></li>

      <li
        v-for="u in invited"
        :key="'invited-' + u.id"
        class="member off"
        role="button"
        tabindex="0"
        @click="openProfile(u)"
        @keyup.enter="openProfile(u)"
      >
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
      :invited-ids="channel.invitedIds"
      :banned-ids="channel.bannedIds"
      :kicked-by="channel.kickedBy"
      :is-admin="chat.activeIsAdmin"
      @invite="invite"
    />

    <ProfileDialog v-model="profileOpen" :user="profileUser" />
  </aside>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useChatStore, KICKS_TO_BAN } from '../stores/chat'
import UserAvatar from './UserAvatar.vue'
import InviteDialog from './InviteDialog.vue'
import ProfileDialog from './ProfileDialog.vue'
import Pond from './Pond.vue'

const props = defineProps({
  closable: Boolean,
  width: Number,
})
const emit = defineEmits(['close'])

const widthPx = computed(() => props.width + 'px')

const chat = useChatStore()
const channel = computed(() => chat.activeChannel)

const inviteOpen = ref(false)
const notice = ref('')

const order = { online: 0, dnd: 1, offline: 2 }
const statusLabel = { online: 'Floating', dnd: 'Do Not Splash', offline: 'Drying Off' }

const members = computed(() =>
  chat.users
    .filter((u) => channel.value.memberIds.includes(u.id))
    .sort((a, b) => order[a.status] - order[b.status]),
)
const invited = computed(() => chat.users.filter((u) => channel.value.invitedIds.includes(u.id)))
const candidates = computed(() => chat.users.filter((u) => !channel.value.memberIds.includes(u.id)))

const knownIds = computed(() => {
  const ids = chat.myChannels.flatMap((c) => c.memberIds)
  return [...new Set(ids)].filter((id) => id !== chat.me.id)
})

const adminNick = computed(() => chat.users.find((u) => u.id === channel.value.adminId)?.nickName)

const kicksOf = (u) => (channel.value.kickedBy[u.id] ?? []).length

const kicksText = (u) =>
  `${kicksOf(u)} of ${KICKS_TO_BAN} members have kicked ${u.nickName} out of this channel. At ${KICKS_TO_BAN} the ban is permanent.`

function invite(user) {
  chat.inviteToActive(user)
}

function onInviteClick() {
  if (chat.canInviteToActive) {
    inviteOpen.value = true
  } else {
    notice.value = `Only the admin (${adminNick.value}) can invite people to this private channel.`
  }
}

watch(
  () => chat.activeId,
  () => {
    notice.value = ''
  },
)

const profileOpen = ref(false)
const profileUser = ref(null)

function openProfile(user) {
  profileUser.value = user
  profileOpen.value = true
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
  align-items: center;
  gap: 8px;
  margin: 0 16px 8px;
  padding: 8px 8px 8px 12px;
  border-radius: 12px;
  background: $dark;
  font-size: 12px;
  line-height: 1.4;
}

.note span {
  flex: 1;
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
  cursor: pointer;
}

.member:hover {
  background: rgba(255, 255, 255, 0.06);
}

.member.off {
  opacity: 0.55;
}

.info {
  flex: 1;
  min-width: 0;
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

.kicks {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.muted {
  opacity: 0.5;
}
</style>
