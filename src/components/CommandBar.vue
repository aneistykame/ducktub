<template>
  <div class="command">
    <div class="command-box">
      <input
        v-model="text"
        placeholder="Say quack or type /join, /invite, /list..."
        @keydown.enter="send"
      />
      <button class="send" @click="send">
        <q-icon name="send" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit'])

const text = ref('')

function send() {
  const value = text.value.trim()
  if (!value) return
  emit('submit', value)
  text.value = ''
}
</script>

<style lang="scss" scoped>
.command {
  padding: 0 24px 16px;
}

.command-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 20px;
  border-radius: 999px;
  background: $dark;
}

.command-box input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: none;
  color: $text-light;
  font-size: 15px;
}

.send {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 0;
  background: $primary;
  color: $text-dark;
  cursor: pointer;
}
</style>
