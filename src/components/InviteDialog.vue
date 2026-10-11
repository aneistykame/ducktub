<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card class="dialog">
      <header class="dialog-header">
        <span>Invite to {{ channelName }}</span>
        <q-btn flat round dense icon="close" aria-label="Close" @click="close" />
      </header>

      <q-input
        v-model="search"
        dense
        filled
        rounded
        placeholder="Search by name or nickname"
      />

      <div v-if="shown.length" class="section">Results</div>

      <ul v-if="shown.length" class="list">
        <li v-for="u in shown" :key="u.id" class="row">
          <UserAvatar :user="u" :status="u.status" small />
          <div class="info">
            <div class="name">{{ u.nickName }}</div>
            <div class="real">{{ u.firstName }} {{ u.lastName }}</div>
          </div>
          <q-btn
            rounded
            no-caps
            size="sm"
            :flat="isInvited(u)"
            :unelevated="!isInvited(u)"
            :color="isInvited(u) ? undefined : 'secondary'"
            :text-color="isInvited(u) ? 'white' : 'dark'"
            :icon="isInvited(u) ? 'check' : undefined"
            :label="isInvited(u) ? 'Invited' : 'Invite'"
            :disable="isInvited(u)"
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
  invitedIds: Array,
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
const rank = (u) => (isKnown(u) ? 0 : 1)

const matches = computed(() => {
  if (!isSearching.value) return props.candidates.filter(isKnown)
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

const isInvited = (u) => props.invitedIds.includes(u.id)

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
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: 700;
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

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 4px;
}

.info {
  flex: 1;
}

.name {
  font-weight: 700;
}

.real {
  font-size: 12px;
  opacity: 0.7;
}

.more {
  padding: 4px 4px 0;
  font-size: 12px;
  opacity: 0.7;
}

.empty {
  padding: 16px 4px;
  text-align: center;
  opacity: 0.7;
}
</style>
