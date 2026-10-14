<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card v-if="user" class="dialog">
      <header class="dialog-header">
        <span>{{ isMe ? 'Your profile' : 'Profile' }}</span>
        <q-btn flat round dense icon="close" aria-label="Close" @click="close" />
      </header>

      <div class="hero">
        <UserAvatar :user="user" large ringed />
        <div>
          <div class="nick">{{ user.nickName }}</div>
          <StatusPicker v-if="isMe" />
          <div v-else class="state"><span class="dot" :class="user.status"></span> {{ statusLabel[user.status] }}</div>
        </div>
      </div>

      <dl class="details">
        <div class="row">
          <dt>First name</dt>
          <dd>{{ user.firstName }}</dd>
        </div>
        <div class="row">
          <dt>Last name</dt>
          <dd>{{ user.lastName }}</dd>
        </div>
        <div class="row">
          <dt>Nickname</dt>
          <dd>{{ user.nickName }}</dd>
        </div>
        <div class="row">
          <dt>Email</dt>
          <dd>{{ user.email }}</dd>
        </div>
      </dl>

      <section v-if="showChannelBox" class="channel-box" aria-label="Channel actions">
        <div class="box-title">
          <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" size="16px" />
          {{ channel.name }}
        </div>

        <p v-if="isMember && isChannelAdmin" class="note">
          <q-icon name="star" color="secondary" size="16px" />
          <span>Admin of this channel. The admin can't be removed.</span>
        </p>

        <template v-else-if="isMember">
          <p v-if="kicks" class="note">
            <q-icon name="info" size="16px" />
            <span>
              Kicked {{ kicks }} of {{ KICKS_TO_BAN }} times. At {{ KICKS_TO_BAN }} kicks from
              different members the ban is permanent.
            </span>
          </p>

          <template v-if="canKick">
            <button
              v-if="!confirming"
              type="button"
              class="action-btn"
              @click="confirming = true"
            >
              <q-icon name="person_remove" size="18px" />
              {{ triggerLabel }}
            </button>

            <div v-else class="confirm" role="group" :aria-label="copy.title">
              <p class="confirm-title">{{ copy.title }}</p>
              <p class="confirm-text">{{ copy.text }}</p>
              <div class="confirm-actions">
                <button v-autofocus type="button" class="btn ghost" @click="confirming = false">
                  Cancel
                </button>
                <button type="button" class="btn danger" @click="doKick">{{ copy.label }}</button>
              </div>
            </div>
          </template>

          <p v-else class="note muted">
            <q-icon name="lock" size="16px" />
            <span>Only the admin ({{ adminNick }}) can remove people from this private channel.</span>
          </p>
        </template>

        <template v-else-if="isBanned">
          <p class="note">
            <q-icon name="block" size="16px" />
            <span>Banned from this channel.</span>
          </p>

          <button v-if="chat.activeIsAdmin" type="button" class="btn primary" @click="restore">
            Restore access
          </button>
          <p v-else class="note muted">
            <q-icon name="lock" size="16px" />
            <span>Only the admin ({{ adminNick }}) can restore access.</span>
          </p>
        </template>
      </section>

      <button v-if="isMe" type="button" class="action-btn" @click="logout">
        <q-icon name="logout" size="18px" />
        Log out
      </button>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useChatStore, KICKS_TO_BAN } from '../stores/chat'
import UserAvatar from './UserAvatar.vue'
import StatusPicker from './StatusPicker.vue'

const props = defineProps({
  modelValue: Boolean,
  user: Object,
})
const emit = defineEmits(['update:modelValue'])

const chat = useChatStore()
const isMe = computed(() => !!chat.me && props.user?.id === chat.me.id)

const statusLabel = { online: 'Floating', dnd: 'Do Not Splash', offline: 'Drying Off' }

const confirming = ref(false)
const vAutofocus = { mounted: (el) => el.focus() }

const channel = computed(() => chat.activeChannel)
const isMember = computed(() => !isMe.value && !!channel.value?.memberIds.includes(props.user?.id))
const isBanned = computed(() => !isMe.value && !!channel.value?.bannedIds.includes(props.user?.id))
const isChannelAdmin = computed(() => channel.value?.adminId === props.user?.id)
const showChannelBox = computed(() => isMember.value || isBanned.value)

const adminNick = computed(() => chat.users.find((u) => u.id === channel.value?.adminId)?.nickName)
const kicks = computed(() => (chat.activeIsPublic ? (channel.value?.kickedBy[props.user?.id] ?? []).length : 0))

const canKick = computed(() => !!props.user && chat.canKick(props.user.id))
const preview = computed(() => (canKick.value ? chat.kickPreview(props.user.id) : null))

const triggerLabel = computed(() => {
  const name = `#${channel.value.name}`
  if (preview.value.action === 'ban') return `Ban from ${name}`
  if (preview.value.action === 'remove') return `Remove from ${name}`
  return `Kick out of ${name}`
})

const copy = computed(() => {
  const p = preview.value
  const nick = props.user.nickName
  const name = `#${channel.value.name}`

  if (p.action === 'remove') {
    return {
      title: `Remove ${nick}?`,
      text: `${nick} will lose access to ${name}. You can invite them again later.`,
      label: 'Remove',
    }
  }

  if (p.action === 'ban') {
    return {
      title: `Ban ${nick}?`,
      text: `${nick} will be removed and permanently banned from ${name}. Only you, as the admin, can restore their access.`,
      label: 'Ban',
    }
  }

  let extra
  if (p.bans) {
    extra = `With this kick ${KICKS_TO_BAN} different members will have kicked ${nick}, so the ban becomes permanent and only the admin can restore access.`
  } else if (p.counted) {
    extra = `Your kick is already counted (${p.kicks} of ${KICKS_TO_BAN}).`
  } else {
    extra = `This will be kick ${p.next} of ${KICKS_TO_BAN}. At ${KICKS_TO_BAN} kicks from different members, ${nick} is banned permanently.`
  }

  return {
    title: `Kick ${nick} out?`,
    text: `${nick} will be removed from ${name} but can be invited back. ${extra}`,
    label: p.bans ? 'Kick out and ban' : `Kick out (${p.next} of ${KICKS_TO_BAN})`,
  }
})

watch(
  () => [props.modelValue, props.user?.id],
  () => {
    confirming.value = false
  },
)

function close() {
  emit('update:modelValue', false)
}

function doKick() {
  chat.kickFromActive(props.user.id)
  close()
}

function restore() {
  chat.inviteToActive(props.user)
  close()
}

function logout() {
  close()
  chat.logout()
}
</script>

<style lang="scss" scoped>
.dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
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
  font-size: 18px;
  font-weight: 700;
}

.hero {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nick {
  font-size: 22px;
  font-weight: 700;
}

.state {
  font-size: 13px;
  opacity: 0.85;
}

.dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.online {
  background: $positive;
}

.dnd {
  background: $negative;
}

.offline {
  background: #8fa0c8;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  border-radius: 14px;
  overflow: hidden;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: rgba($text-light, 0.08);
}

dt {
  font-size: 13px;
  opacity: 0.7;
}

dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
  overflow-wrap: anywhere;
}

.channel-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba($text-light, 0.08);
}

.box-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 700;
  opacity: 0.7;
}

.note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
}

.note.muted {
  opacity: 0.75;
}

.confirm {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.confirm-title {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
}

.confirm-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
  opacity: 0.9;
}

.confirm-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: $qt-touch;
  padding: 0 18px;
  border: 0;
  border-radius: $qt-radius-pill;
  background: $qt-chip;
  color: $qt-fail-ink;
  font-family: $qt-font;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.action-btn:hover {
  background: $qt-fail-bg;
}

.action-btn:active {
  transform: scale(0.97);
}

.action-btn:focus-visible {
  outline: 3px solid $qt-duck;
  outline-offset: 3px;
}

.btn {
  min-height: $qt-touch;
  padding: 0 18px;
  border: 0;
  border-radius: $qt-radius-pill;
  font-family: $qt-font;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.btn:focus-visible {
  outline: 3px solid $qt-duck;
  outline-offset: 3px;
}

.btn:active {
  transform: scale(0.97);
}

.btn.ghost {
  background: $qt-chip;
  color: inherit;
}

.btn.ghost:hover {
  background: rgba($qt-ink, 0.14);
}

.btn.primary {
  background: $qt-duck;
  color: $qt-duck-ink;
  box-shadow: 0 6px 14px rgba($qt-duck-shade, 0.3), inset 0 -3px 0 rgba($qt-duck-shade, 0.9);
}

.btn.primary:hover {
  transform: translateY(-2px);
  background: $qt-duck-hover;
}

.btn.danger {
  background: $qt-fail-ink;
  color: $qt-glow-ink;
  box-shadow: 0 0 0 1px $qt-fail-ring, inset 0 -3px 0 rgba($qt-blush, 0.9);
}

.btn.danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 18px rgba($qt-fail-ink, 0.35), inset 0 -3px 0 rgba($qt-blush, 0.9);
}

@media (prefers-reduced-motion: reduce) {
  .action-btn,
  .btn {
    transition: none;
  }

  .action-btn:active,
  .btn:active,
  .btn:hover {
    transform: none;
  }
}
</style>
