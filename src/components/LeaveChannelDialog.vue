<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card v-if="channel" class="leave-dialog" role="alertdialog" aria-labelledby="leave-title" aria-describedby="leave-text">
      <span class="icon" :class="{ danger: isAdmin }" aria-hidden="true">
        <q-icon :name="isAdmin ? 'delete_outline' : 'logout'" size="24px" />
      </span>

      <h2 id="leave-title" class="title">
        {{ isAdmin ? 'Delete' : 'Leave' }}
        <span class="channel"><q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" size="18px" />{{ channel.name }}</span>?
      </h2>

      <p id="leave-text" class="text">
        {{ isAdmin ? 'This action will delete the channel, are you sure?' : 'Are you sure you want to leave?' }}
      </p>

      <div class="actions">
        <button v-autofocus type="button" class="btn ghost" @click="close">Cancel</button>
        <button
          type="button"
          class="btn"
          :class="isAdmin ? 'danger' : 'primary'"
          @click="confirm"
        >
          {{ isAdmin ? 'Delete channel' : 'Leave channel' }}
        </button>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useChatStore } from '../stores/chat'

const props = defineProps({
  modelValue: Boolean,
  channel: Object,
})
const emit = defineEmits(['update:modelValue', 'left'])

const chat = useChatStore()
const isAdmin = computed(() => props.channel?.adminId === chat.me.id)

const vAutofocus = { mounted: (el) => el.focus() }

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  const result = chat.leaveChannel(props.channel)
  close()
  emit('left', result)
}
</script>

<style lang="scss" scoped>
.leave-dialog {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  width: 400px;
  max-width: 90vw;
  padding: 28px;
  border-radius: $qt-radius-card;
  background: $qt-surface;
  color: $qt-ink;
  font-family: $qt-font;
  box-shadow: $qt-shadow-menu, $qt-surface-ring;
}

.icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 4px;
  border-radius: 50%;
  background: $qt-mention;
  color: $qt-mention-ink;
}
.icon.danger {
  background: $qt-fail-bg;
  color: $qt-fail-ink;
}

.title {
  margin: 0;
  font-size: 21px;
  font-weight: 900;
  line-height: 1.25;
}

.channel {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.text {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: $qt-ink-quiet;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

.btn {
  min-height: $qt-touch;
  padding: 0 18px;
  border: 0;
  border-radius: $qt-radius-pill;
  font-family: inherit;
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

.ghost {
  background: $qt-chip;
  color: inherit;
}

.ghost:hover {
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
  box-shadow: 0 10px 20px rgba($qt-duck-shade, 0.4), inset 0 -3px 0 rgba($qt-duck-shade, 0.9);
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
  .btn {
    transition: none;
  }

  .btn:hover,
  .btn:active {
    transform: none;
  }
}
</style>
