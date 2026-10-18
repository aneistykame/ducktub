<template>
  <div class="search">
    <div class="field" :class="{ focused }">
      <q-icon name="search" size="18px" class="field-icon" />
      <input
        ref="inputEl"
        :value="modelValue"
        type="text"
        class="input"
        placeholder="Find a tub"
        role="combobox"
        aria-label="Search channels"
        aria-autocomplete="list"
        :aria-expanded="!!query"
        aria-controls="channel-search-results"
        :aria-activedescendant="activeOption ? `channel-search-${activeOption.key}` : undefined"
        autocomplete="off"
        spellcheck="false"
        @input="onInput"
        @focus="focused = true"
        @blur="focused = false"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="pick(activeOption)"
        @keydown.esc="clear"
      />
      <button v-if="modelValue" type="button" class="clear" aria-label="Clear search" @click="clear">
        <q-icon name="close" size="16px" />
      </button>
      <kbd v-else class="shortcut" aria-hidden="true">{{ shortcutLabel }}</kbd>
    </div>

    <div v-if="query" id="channel-search-results" class="results" role="listbox" aria-label="Search results">
      <template v-for="group in groups" :key="group.title">
        <div class="group-label" role="presentation">{{ group.title }}</div>
        <div
          v-for="o in group.options"
          :id="`channel-search-${o.key}`"
          :key="o.key"
          class="option"
          :class="{ highlighted: activeOption?.key === o.key }"
          role="option"
          :aria-selected="activeOption?.key === o.key"
          @mousedown.prevent
          @mouseenter="highlighted = options.indexOf(o)"
          @click="pick(o)"
        >
          <q-icon :name="o.icon" size="18px" class="option-icon" />
          <span class="option-name" :title="o.name">
            {{ o.parts[0] }}<mark>{{ o.parts[1] }}</mark>{{ o.parts[2] }}
          </span>
          <span v-if="o.hint" class="option-hint">{{ o.hint }}</span>
        </div>
      </template>

      <p v-if="!options.length" class="empty">No tubs match “{{ query }}”.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useChatStore } from '../stores/chat'
import { useCommands } from '../composables/useCommands'

const props = defineProps({
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'picked'])

const chat = useChatStore()
const { show } = useCommands()

const inputEl = ref(null)
const focused = ref(false)
const highlighted = ref(0)

const query = computed(() => props.modelValue.trim().replace(/^#/, ''))
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const shortcutLabel = isMac ? '⌘K' : 'Ctrl K'

function split(name) {
  const i = name.toLowerCase().indexOf(query.value.toLowerCase())
  return [name.slice(0, i), name.slice(i, i + query.value.length), name.slice(i + query.value.length)]
}

function matches(list) {
  const q = query.value.toLowerCase()
  return list
    .filter((c) => c.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(q)
      const bStarts = b.name.toLowerCase().startsWith(q)
      return aStarts === bStarts ? a.name.localeCompare(b.name) : aStarts ? -1 : 1
    })
}

const groups = computed(() => {
  if (!query.value) return []
  const myId = chat.me.id

  const mine = matches(chat.myChannels).map((c) => ({
    key: `mine-${c.id}`,
    kind: 'open',
    channel: c,
    name: c.name,
    parts: split(c.name),
    icon: c.type === 'private' ? 'lock' : 'tag',
    hint: c.id === chat.activeId ? 'Open' : '',
  }))

  const publicOthers = matches(
    chat.channels.filter(
      (c) => c.type === 'public' && !c.memberIds.includes(myId) && !c.bannedIds.includes(myId),
    ),
  ).map((c) => ({
    key: `join-${c.id}`,
    kind: 'join',
    channel: c,
    name: c.name,
    parts: split(c.name),
    icon: 'tag',
    hint: 'Join',
  }))

  const result = []
  if (mine.length) result.push({ title: 'Your channels', options: mine })
  if (publicOthers.length) result.push({ title: 'Public channels', options: publicOthers })
  return result
})

const options = computed(() => groups.value.flatMap((g) => g.options))
const activeOption = computed(() => options.value[highlighted.value] ?? null)

watch(query, () => (highlighted.value = 0))

function onInput(e) {
  emit('update:modelValue', e.target.value)
}

function move(step) {
  if (!options.value.length) return
  highlighted.value = (highlighted.value + step + options.value.length) % options.value.length
}

function clear() {
  emit('update:modelValue', '')
}

function pick(option) {
  if (!option) return
  if (option.kind === 'open') chat.setActive(option.channel.id)
  else show(chat.joinChannel(option.name))
  clear()
  inputEl.value?.blur()
  emit('picked')
}

function onShortcut(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    inputEl.value?.focus()
    inputEl.value?.select()
  }
}

onMounted(() => window.addEventListener('keydown', onShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', onShortcut))
</script>

<style lang="scss" scoped>
.search {
  font-family: $qt-font;
}

.field {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: $qt-touch;
  padding: 0 8px 0 14px;
  border-radius: $qt-radius-pill;
  background: $qt-water-chip;
  box-shadow: inset 0 0 0 1px rgba($qt-glow, 0.16);
  color: $qt-water-ink;
  transition: box-shadow 0.15s ease, background-color 0.15s ease;
}

.field:hover {
  background: $qt-water-chip-hover;
}

.field.focused {
  box-shadow: inset 0 0 0 1px rgba($qt-glow, 0.3), 0 0 0 3px rgba($qt-duck, 0.85);
}

.field-icon {
  flex: none;
  color: $qt-water-ink-quiet;
}

.input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 15px;
  font-weight: 700;
}

.input::placeholder {
  color: $qt-water-ink-quiet;
  opacity: 1;
}

.shortcut {
  flex: none;
  padding: 2px 8px;
  border-radius: $qt-radius-pill;
  background: $qt-water-chip;
  color: $qt-water-ink-quiet;
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
}

@media (hover: none) {
  .shortcut {
    display: none;
  }
}

.clear {
  display: grid;
  flex: none;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: $qt-water-ink-quiet;
  cursor: pointer;
}

.clear:hover {
  background: $qt-water-chip-hover;
  color: $qt-water-ink;
}

.clear:focus-visible {
  outline: 3px solid $qt-duck;
  outline-offset: 1px;
}

.results {
  margin-top: 8px;
}

.group-label {
  margin: 14px 10px 6px 18px;
  color: $qt-water-ink-quiet;
  font-size: 13px;
  font-weight: 700;
}

.option {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: $qt-touch;
  padding: 0 14px 0 16px;
  border-radius: $qt-radius-pill;
  color: $qt-water-ink;
  font-weight: 700;
  cursor: pointer;
}

.option.highlighted {
  background: $qt-water-chip-hover;
}

.option-icon {
  flex: none;
}

.option-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  mark {
    padding: 0;
    background: none;
    color: $qt-duck;
  }

}

.option-hint {
  flex: none;
  padding: 2px 9px;
  border-radius: $qt-radius-pill;
  background: $qt-water-chip;
  color: $qt-water-ink-quiet;
  font-size: 12px;
  font-weight: 800;
}

.empty {
  margin: 12px 10px;
  color: $qt-water-ink-quiet;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

@media (prefers-reduced-motion: reduce) {
  .field {
    transition: none;
  }
}
</style>
