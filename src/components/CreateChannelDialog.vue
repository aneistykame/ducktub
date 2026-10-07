<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card class="dialog">
      <header class="dialog-header">
        <span>Create channel</span>
        <q-btn flat round dense icon="close" aria-label="Close" @click="close" />
      </header>

      <q-input
        v-model="name"
        filled
        dense
        label="Channel name"
        maxlength="20"
        counter
        autofocus
        :error="!!errorMessage"
        :error-message="errorMessage"
        @keyup.enter="submit"
      >
        <template #prepend>
          <q-icon :name="type === 'private' ? 'lock' : 'tag'" size="20px" />
        </template>
      </q-input>

      <div class="type-toggle" role="radiogroup" aria-label="Channel type">
        <button
          type="button"
          class="opt"
          :class="{ on: type === 'public' }"
          role="radio"
          :aria-checked="type === 'public'"
          @click="type = 'public'"
        >
          <q-icon name="tag" size="20px" />
          Public
        </button>
        <button
          type="button"
          class="opt"
          :class="{ on: type === 'private' }"
          role="radio"
          :aria-checked="type === 'private'"
          @click="type = 'private'"
        >
          <q-icon name="lock" size="20px" />
          Private
        </button>
      </div>

      <p class="hint">{{ hint }}</p>

      <q-btn
        rounded
        unelevated
        no-caps
        color="secondary"
        text-color="dark"
        label="Create channel"
        :disable="!isValid"
        @click="submit"
      />
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  existingNames: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'create'])

const name = ref('')
const type = ref('public')

const trimmed = computed(() => name.value.trim())

const isTaken = computed(() =>
  props.existingNames.some((n) => n.toLowerCase() === trimmed.value.toLowerCase()),
)

const errorMessage = computed(() => {
  if (!trimmed.value) return ''
  if (!/^[\w-]+$/.test(trimmed.value)) return 'Use only letters, numbers, - and _'
  if (isTaken.value) return 'Name is already taken'
  return ''
})

const isValid = computed(() => !!trimmed.value && !errorMessage.value)

const hint = computed(() =>
  type.value === 'public'
    ? 'Anyone can join. Any member can invite others.'
    : 'Only the admin can invite or remove people.',
)

function close() {
  emit('update:modelValue', false)
}

function submit() {
  if (!isValid.value) return
  emit('create', { name: trimmed.value, type: type.value })
  close()
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      name.value = ''
      type.value = 'public'
    }
  },
)
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

.type-toggle {
  display: flex;
  gap: 8px;
}

.opt {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  border: 0;
  border-radius: 999px;
  background: rgba($text-light, 0.1);
  color: $text-light;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.opt:hover {
  background: rgba($text-light, 0.16);
}

.opt.on {
  background: $secondary;
  color: $text-dark;
  font-weight: 700;
}

.hint {
  margin: 0;
  font-size: 12px;
  opacity: 0.75;
}
</style>
