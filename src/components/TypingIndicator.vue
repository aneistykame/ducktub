<template>
  <div class="typing">
    <button class="who" @click="open = !open">
      <q-icon :name="open ? 'visibility_off' : 'visibility'" size="18px" />
      <span>{{ nick }}</span>
    </button>

    <div class="bubble" :class="{ draft: open }">
      <span v-if="!open" class="dots"><i></i><i></i><i></i></span>
      <template v-else>
        {{ draft }}<span class="caret"></span>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  nick: String,
  draft: String,
})

const open = ref(false)
</script>

<style lang="scss" scoped>
.typing {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 24px 6px;
  font-size: 13px;
}

.who {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: none;
  color: $text-light;
  font-size: 13px;
  font-weight: 700;
  opacity: 0.85;
  cursor: pointer;
}

.bubble {
  display: flex;
  align-items: center;
  min-height: 34px;
  box-sizing: border-box;
  padding: 6px 14px;
  border-radius: 22px;
  background: $bubbles-others;
  border: 1px solid rgba(255, 255, 255, 0.12);
  line-height: 1.4;
}

.bubble.draft {
  font-style: italic;
  border: 1px dashed rgba(255, 255, 255, 0.3);
}

.dots {
  display: flex;
  gap: 4px;
}

.dots i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: $primary;
  animation: bounce 1.2s infinite ease-in-out;
}

.dots i:nth-child(2) {
  animation-delay: 0.15s;
}

.dots i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes bounce {
  0%,
  60%,
  100% {
    opacity: 0.3;
  }
  30% {
    opacity: 1;
  }
}

.caret {
  width: 2px;
  height: 14px;
  margin-left: 2px;
  background: $primary;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}
</style>
