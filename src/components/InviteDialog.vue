<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card class="dialog">
      <header class="dialog-header">
        <span class="dialog-title">Invite to {{ channelName }}</span>
        <q-btn class="close-btn" flat round dense icon="close" aria-label="Close" @click="close" />
      </header>

      <q-input
        v-model="search"
        dense
        filled
        rounded
        placeholder="Search by name or nickname"
      />

      <div v-if="shown.length" class="section">{{ heading }}</div>

      <ul v-if="shown.length" class="list">
        <li v-for="u in shown" :key="u.id" class="user-row">
          <UserAvatar class="avatar" :user="u" :status="u.status" small />
          <div class="info">
            <div class="name">{{ u.nickName }}</div>
            <div class="real">{{ u.firstName }} {{ u.lastName }}</div>
            <div v-if="warning(u)" class="warn" :class="{ banned: isBanned(u) }">
              <q-icon :name="isBanned(u) ? 'block' : 'warning'" size="12px" />
              <span class="warn-text">{{ warning(u) }}</span>
            </div>
          </div>
          <q-btn
            class="invite-btn"
            rounded
            no-caps
            size="sm"
            :flat="btnDisabled(u)"
            :unelevated="!btnDisabled(u)"
            :color="btnDisabled(u) ? undefined : 'secondary'"
            :text-color="btnDisabled(u) ? 'white' : 'dark'"
            :icon="isInvited(u) ? 'check' : undefined"
            :label="btnLabel(u)"
            :disable="btnDisabled(u)"
            @click="emit('invite', u)"
          />
        </li>
      </ul>

      <div v-if="!shown.length" class="empty">
        {{ isSearching ? 'No one found' : 'Type a name or nickname to find people' }}
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import UserAvatar from './UserAvatar.vue'

const props = defineProps({
  modelValue: Boolean,
  channelName: String,
  candidates: Array,
  knownIds: { type: Array, default: () => [] },
  invitedIds: { type: Array, default: () => [] },
  bannedIds: { type: Array, default: () => [] },
  kickedBy: { type: Object, default: () => ({}) },
  isAdmin: Boolean,
})

const emit = defineEmits(['update:modelValue', 'invite'])

const MAX_SUGGESTED = 5
const MAX_RESULTS = 6
const order = { online: 0, dnd: 1, offline: 2 }

const search = ref('')

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const words = computed(() => norm(search.value).split(/\s+/).filter(Boolean))
const isSearching = computed(() => words.value.length > 0)

const isKnown = (u) => props.knownIds.includes(u.id)
const isBanned = (u) => props.bannedIds.includes(u.id)
const isInvited = (u) => props.invitedIds.includes(u.id)

const rank = (u) => {
  if (isBanned(u)) return 2
  return isKnown(u) ? 0 : 1
}

const matches = computed(() => {
  if (!isSearching.value) return props.candidates.filter((u) => isKnown(u) && !isBanned(u))
  return props.candidates.filter((u) => {
    const text = norm(`${u.nickName} ${u.firstName} ${u.lastName}`)
    return words.value.every((w) => text.includes(w))
  })
})

const shown = computed(() => {
  const sorted = [...matches.value].sort(
    (a, b) => rank(a) - rank(b) || order[a.status] - order[b.status],
  )
  return sorted.slice(0, isSearching.value ? MAX_RESULTS : MAX_SUGGESTED)
})

const heading = computed(() => (isSearching.value ? 'Results' : 'From your other channels'))

const kicksOf = (u) => (props.kickedBy[u.id] ?? []).length

const warning = (u) => {
  if (isBanned(u)) {
    return props.isAdmin ? 'Banned from this channel' : 'Banned, only the admin can restore access'
  }
  const kicks = kicksOf(u)
  if (!kicks) return ''
  return `Kicked out ${kicks} ${kicks === 1 ? 'time' : 'times'} before`
}

const btnLabel = (u) => {
  if (isInvited(u)) return 'Invited'
  if (isBanned(u)) return props.isAdmin ? 'Restore' : 'Banned'
  return 'Invite'
}

const btnDisabled = (u) => isInvited(u) || (isBanned(u) && !props.isAdmin)

function close() {
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) search.value = ''
  },
)
</script>

<style lang="scss" scoped>
.dialog {
  width: 380px;
  max-width: 90vw;
  padding: 16px;
  border-radius: 20px;
  background: $dark;
  color: $text-light;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: 700;
}

.dialog-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-btn,
.invite-btn,
.avatar {
  flex: none;
}

.section {
  margin: 14px 4px 0;
  font-size: 12px;
  font-weight: 700;
  opacity: 0.7;
}

.list {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 4px;
}

.info {
  flex: 1;
  min-width: 0;
}

.name,
.real,
.warn-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name {
  font-weight: 700;
}

.real {
  font-size: 12px;
  opacity: 0.7;
}

.empty {
  padding: 16px 4px;
  text-align: center;
  opacity: 0.7;
}

.warn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  color: $warning;

  .q-icon {
    flex: none;
  }
}

.warn.banned {
  color: $negative;
}
</style>
