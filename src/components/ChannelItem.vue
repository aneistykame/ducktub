<template>
  <div class="item" :class="{ active, 'menu-open': menuOpen }">
    <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" size="20px" />
    <span class="name">{{ channel.name }}</span>
    <span v-if="channel.unread" class="badge">{{ channel.unread }}</span>

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
import { ref, computed } from 'vue'
import { useChatStore } from '../stores/chat'

const props = defineProps({
  channel: Object,
  active: Boolean,
})
const emit = defineEmits(['leave'])

const chat = useChatStore()
const isAdmin = computed(() => props.channel.adminId === chat.me.id)
const menuOpen = ref(false)
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.active {
  background: $primary;
  color: $text-dark;
  font-weight: 600;
}

.badge {
  background: $secondary;
  color: $text-dark;
  border-radius: 999px;
  padding: 0 8px;
  font-size: 12px;
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
}
</style>
