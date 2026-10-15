<template>
  <TransitionGroup name="toast" tag="div" class="toasts" aria-live="polite">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="toast"
      :class="{ mention: t.mention }"
      role="button"
      tabindex="0"
      @click="open(t)"
      @keyup.enter="open(t)"
    >
      <UserAvatar :user="t.author" />
      <div class="body">
        <div class="head">
          {{ t.author.nickName }}
          <span v-if="t.channel" class="in">in #{{ t.channel.name }} </span>
        </div>
        <div class="text">{{ t.text }}</div>
      </div>
      <q-btn
        flat
        round
        dense
        size="sm"
        icon="close"
        aria-label="Dismiss"
        @click.stop="dismissToast(t.id)"
      />
    </div>
  </TransitionGroup>
</template>

<script setup>
import { toasts, dismissToast } from '../utils/notifications'
import UserAvatar from './UserAvatar.vue'

function open(t) {
  t.onOpen?.()
  dismissToast(t.id)
}
</script>

<style lang="scss" scoped>
.toasts {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 9000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 400px;
  max-width: calc(100vw - 32px);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 12px 16px 16px;
  border-radius: 20px;
  background: $dark;
  color: $text-light;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  pointer-events: auto;
}

.toast.mention {
  background: $secondary;
  color: $dark;
}

.toast:focus-visible {
  outline: 3px solid $secondary;
  outline-offset: 2px;
}

.toast.mention:focus-visible {
  outline-color: $text-light;
}

.body {
  flex: 1;
  min-width: 0;
}

.head {
  font-size: 16px;
  font-weight: 700;
}

.in {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.7;
}

.text {
  display: -webkit-box;
  margin-top: 2px;
  overflow: hidden;
  font-size: 14px;
  line-height: 1.4;
  opacity: 0.92;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
}
</style>
