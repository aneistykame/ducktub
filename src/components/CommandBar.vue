<template>
  <div class="command">
    <div class="command-box">
      <textarea
        ref="inputEl"
        v-model="text"
        rows="1"
        placeholder="Say quack or type /join, /invite, /list..."
        @input="resize"
        @keydown.enter.exact="onEnter"
      />
      <button class="send" type="button" aria-label="Send" @click="send">
        <q-icon name="send" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const emit = defineEmits(['submit'])

const text = ref('')
const inputEl = ref(null)

function resize() {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function onEnter(e) {
  if (e.isComposing) return
  e.preventDefault()
  send()
}

function send() {
  const value = text.value.trim()
  if (!value) return
  emit('submit', value)
  text.value = ''
  nextTick(resize)
}
</script>

<style lang="scss" scoped>
.command {
  padding: 0 24px 16px;
}

.command-box {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 6px 6px 6px 20px;
  border-radius: 26px;
  background: $dark;
}

.command-box textarea {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  padding: 9px 0;
  max-height: 150px;
  background: transparent;
  border: 0;
  outline: none;
  resize: none;
  overflow-y: auto;
  scrollbar-width: thin;
  color: $text-light;
  font-family: inherit;
  font-size: 15px;
  line-height: 22px;
}

.send {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 0;
  background: $primary;
  color: $text-dark;
  cursor: pointer;
}
</style>
