<template>
  <div class="typing">
    <div v-if="openTypers.length" class="drafts">
      <div v-for="t in openTypers" :key="t.userId" class="draft-row">
        <button
          class="who"
          type="button"
          title="Hide what they are writing"
          aria-expanded="true"
          @click="toggle(t.userId)"
        >
          <q-icon name="close" size="18px" />
          <span>{{ t.nick }}</span>
        </button>
        <DraftBubble :draft="t.draft" />
      </div>
    </div>

    <div class="line">
      <template v-for="(t, i) in shown" :key="t.userId">
        <span v-if="i > 0" class="sep">{{ separator(i) }}</span>
        <button
          class="who"
          type="button"
          :aria-expanded="isOpen(t.userId)"
          :title="isOpen(t.userId) ? 'Hide what they are writing' : 'See what they are writing'"
          @click="toggle(t.userId)"
        >
          <q-icon :name="isOpen(t.userId) ? 'visibility_off' : 'visibility'" size="18px" />
          <span>{{ t.nick }}</span>
        </button>
      </template>

      <template v-if="others.length">
        <span class="sep">{{ ' and ' }}</span>
        <button class="who" type="button" :aria-expanded="othersOpen">
          <span>{{ others.length }} others</span>

          <q-menu
            v-model="othersOpen"
            class="typing-menu"
            anchor="top left"
            self="bottom left"
            :offset="[0, 6]"
          >
            <div class="menu-list">
              <button
                v-for="t in typers"
                :key="t.userId"
                class="who"
                type="button"
                :aria-pressed="isOpen(t.userId)"
                @click="toggleFromList(t.userId)"
              >
                <q-icon :name="isOpen(t.userId) ? 'visibility_off' : 'visibility'" size="18px" />
                <span>{{ t.nick }}</span>
              </button>
            </div>
          </q-menu>
        </button>
      </template>

      <span class="sep">{{ typers.length === 1 ? ' is typing' : ' are typing' }}</span>
      <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import DraftBubble from './DraftBubble.vue'

const props = defineProps({
  typers: { type: Array, default: () => [] },
  channelId: { type: Number, default: null },
})

const MAX_NAMES = 2

const shown = computed(() =>
  props.typers.length > MAX_NAMES ? props.typers.slice(0, MAX_NAMES - 1) : props.typers,
)
const others = computed(() => props.typers.slice(shown.value.length))

const opened = ref({})
const othersOpen = ref(false)

const isOpen = (userId) => !!opened.value[userId]
const openTypers = computed(() => props.typers.filter((t) => isOpen(t.userId)))

function toggle(userId) {
  opened.value = { ...opened.value, [userId]: !opened.value[userId] }
}

function toggleFromList(userId) {
  toggle(userId)
  othersOpen.value = false
}

function separator(i) {
  const isLast = i === shown.value.length - 1
  return isLast && !others.value.length ? ' and ' : ', '
}

watch(
  () => others.value.length,
  (count) => {
    if (!count) othersOpen.value = false
  },
)

watch(
  () => props.channelId,
  () => {
    opened.value = {}
    othersOpen.value = false
  },
)
</script>

<style lang="scss" scoped>
.typing {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 24px 6px;
  font-size: 13px;
}

.drafts {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 35vh;
  overflow-y: auto;
  scrollbar-width: thin;
}

.draft-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.draft-row .who {
  flex: none;
}

.line {
  min-height: 34px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  white-space: pre;
}

.sep {
  color: $text-light;
  opacity: 0.85;
}

.who {
  display: inline-flex;
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

.who:hover,
.who:focus-visible {
  opacity: 1;
}

.dots {
  display: inline-flex;
  gap: 4px;
  margin-left: 8px;
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

@media (prefers-reduced-motion: reduce) {
  .dots i {
    animation: none;
    opacity: 0.7;
  }
}
</style>

<style lang="scss">
.typing-menu {
  max-width: min(420px, 92vw);
  background: $dark;
  color: $text-light;
}

.typing-menu .menu-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-height: 40vh;
  padding: 10px 14px;
  overflow-y: auto;
}

.typing-menu .who {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: none;
  color: $text-light;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
</style>
