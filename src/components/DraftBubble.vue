<template>
  <div class="bubble">
    <div class="scroll">
      <div class="text">{{ draft }}<span class="caret"></span></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  draft: { type: String, default: '' },
})
</script>

<style lang="scss" scoped>
.bubble {
  display: flex;
  min-width: 0;
  box-sizing: border-box;
  padding: 6px 14px;
  border-radius: 22px;
  background: $bubbles-others;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  font-style: italic;
  line-height: 1.4;
}

.scroll {
  display: flex;
  flex-direction: column-reverse;
  min-width: 0;
  max-height: 96px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.caret {
  display: inline-block;
  width: 2px;
  height: 14px;
  margin-left: 2px;
  vertical-align: text-bottom;
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

@media (prefers-reduced-motion: reduce) {
  .caret {
    animation: none;
  }
}
</style>
