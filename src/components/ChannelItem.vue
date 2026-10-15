<template>
  <div class="item" :class="{ active, 'menu-open': menuOpen }">
    <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" size="20px" />
    <span ref="nameEl" class="name">
      {{ channel.name }}
      <q-tooltip
        v-if="isTruncated"
        class="channel-tooltip"
        anchor="center right"
        self="center left"
        :offset="[8, 0]"
        :delay="300"
      >
        {{ channel.name }}
      </q-tooltip>
    </span>
    <span v-if="channel.mentionCount || channel.unread" class="badges">
      <span
        v-if="channel.mentionCount"
        class="badge mention"
        :aria-label="`${channel.mentionCount} mentions`"
        :title="`${channel.mentionCount} mentions`"
      >
        <q-icon name="alternate_email" size="12px" />{{ channel.mentionCount }}
      </span>
      <span
        v-if="channel.unread"
        class="badge"
        :aria-label="`${channel.unread} unread messages`"
        :title="`${channel.unread} unread messages`"
      >{{ channel.unread }}</span>
    </span>
    <button
      type="button"
      class="more"
      :aria-label="`Options for ${channel.name}`"
      aria-haspopup="menu"
      @click.stop
      @keydown.enter.stop
      @keydown.space.stop
    >
      <q-icon name="more_horiz" size="20px" />

      <q-menu v-model="menuOpen" class="channel-menu" anchor="bottom right" self="top right" :offset="[0, 6]">
        <q-list role="menu">
          <q-item v-close-popup clickable role="menuitem" class="channel-menu-row" :class="{ danger: isAdmin }" @click="emit('leave')">
            <q-icon :name="isAdmin ? 'delete_outline' : 'logout'" size="18px" />
            <span>{{ isAdmin ? 'Delete channel' : 'Leave channel' }}</span>
          </q-item>
        </q-list>
      </q-menu>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useChatStore } from '../stores/chat'

const props = defineProps({
  channel: Object,
  active: Boolean,
})
const emit = defineEmits(['leave'])

const chat = useChatStore()
const isAdmin = computed(() => props.channel.adminId === chat.me.id)
const menuOpen = ref(false)

const nameEl = ref(null)
const isTruncated = ref(false)
let observer = null

function checkTruncated() {
  const el = nameEl.value
  isTruncated.value = !!el && el.scrollWidth > el.clientWidth
}

onMounted(() => {
  checkTruncated()
  observer = new ResizeObserver(checkTruncated)
  observer.observe(nameEl.value)
})

onBeforeUnmount(() => observer?.disconnect())

watch(() => props.channel.name, () => nextTick(checkTruncated))
</script>

<style lang="scss" scoped>
.item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: $qt-touch;
  padding: 0 6px 0 16px;
  border-radius: $qt-radius-pill;
  cursor: pointer;
}

.name {
  flex: 1;
  min-width: 0;
  //max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.active {
  background: $primary;
  color: $text-dark;
  font-weight: 600;
}

.badges {
  display: flex;
  align-items: center;
  gap: 4px;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: rgba($text-light, 0.3);
  color: $text-dark;
  font-size: 12px;
  font-weight: 700;
}

.badge.mention {
  gap: 1px;
  background: $secondary;
  color: $dark;
  font-weight: 900;
}

.more {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, background-color 0.15s ease;
}

.item:hover .more,
.item.menu-open .more,
.more:focus-visible {
  opacity: 1;
}

@media (hover: none) {
  .more {
    opacity: 1;
  }
}

.more:hover,
.menu-open .more {
  background: $qt-water-chip-hover;
}

.active .more:hover,
.active.menu-open .more {
  background: rgba($qt-glow-ink, 0.12);
}

.more:focus-visible {
  outline: 3px solid $qt-duck;
  outline-offset: 1px;
}

@media (prefers-reduced-motion: reduce) {
  .more {
    transition: none;
  }
}
</style>

<style lang="scss">
.channel-menu {
  min-width: 200px;
  padding: 6px;
  border-radius: 26px;
  background: $qt-surface;
  color: $qt-ink;
  font-family: $qt-font;
  box-shadow: $qt-shadow-menu, $qt-surface-ring;
}

.q-list {
  padding: 0;
}

.channel-menu-row {
  gap: 12px;
  align-items: center;
  min-height: $qt-touch;
  padding: 6px 14px;
  border-radius: $qt-radius-pill;
  font-size: 14px;
  font-weight: 800;

  .q-focus-helper {
    border-radius: $qt-radius-pill;
  }
}

.channel-menu-row.danger {
  color: $qt-fail-ink;
}

.q-tooltip.channel-tooltip {
  max-width: 260px;
  padding: 8px 14px;
  border-radius: 18px;
  background: $qt-surface;
  color: $qt-ink;
  font-family: $qt-font;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.3;
  overflow-wrap: anywhere;
  box-shadow: $qt-shadow-menu, $qt-surface-ring;
}
</style>
