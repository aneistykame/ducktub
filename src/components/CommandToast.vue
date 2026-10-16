<template>
  <transition name="toast">
    <div v-if="feedback" :key="feedback.id" class="toast" :class="{ fail: !feedback.ok }" role="status">
      <q-icon :name="feedback.ok ? 'check_circle' : 'error_outline'" size="18px" />
      <span class="toast-text">
        {{ feedback.before }}<ChannelName v-if="feedback.channel" :name="feedback.channel" />{{ feedback.after }}
      </span>
    </div>
  </transition>
</template>

<script setup>
import ChannelName from './ChannelName.vue'

defineProps({
  feedback: Object,
})
</script>

<style lang="scss" scoped>
.toast {
  display: flex;
  align-items: center;
  gap: 8px;
  align-self: center;
  max-width: calc(100% - 48px);
  margin: 0 24px 10px;
  padding: 8px 16px;
  border-radius: $qt-radius-pill;
  background: $qt-toast-bg;
  color: $qt-toast-ink;
  font-family: $qt-font;
  font-size: 14px;
  font-weight: 800;
  box-shadow: $qt-shadow-menu;
}

.toast .q-icon {
  flex: none;
}

.toast-text {
  min-width: 0;
}

.toast.fail {
  background: $qt-fail-bg;
  color: $qt-fail-ink;
  box-shadow: inset 0 0 0 1.5px $qt-fail-ring;
}

.toast-enter-active {
  transition: transform 0.22s $qt-ease-spring, opacity 0.22s ease;
}

.toast-leave-active {
  transition: opacity 0.2s ease;
}

.toast-enter-from {
  transform: translateY(12px) scale(0.9);
  opacity: 0;
}

.toast-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
}
</style>
