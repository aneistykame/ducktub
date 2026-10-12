<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card v-if="user" class="dialog">
      <header class="dialog-header">
        <span>{{ isMe ? 'Your profile' : 'Profile' }}</span>
        <q-btn flat round dense icon="close" aria-label="Close" @click="close" />
      </header>

      <div class="hero">
        <UserAvatar :user="user" large />
        <div>
          <div class="nick">{{ user.nickName }}</div>
          <div class="state"><span class="dot" :class="user.status"></span> {{ statusLabel[user.status] }}</div>
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
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { users } from '../mock/data'
import UserAvatar from './UserAvatar.vue'

const props = defineProps({
  modelValue: Boolean,
  user: Object,
})
const emit = defineEmits(['update:modelValue'])

const me = users[0]
const isMe = computed(() => props.user?.id === me.id)

const statusLabel = { online: 'online', dnd: 'do not disturb', offline: 'offline' }

function close() {
  emit('update:modelValue', false)
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
</style>
