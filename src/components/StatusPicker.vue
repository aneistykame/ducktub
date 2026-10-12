<template>
  <button
    type="button"
    class="picker"
    :class="{ profile }"
    aria-haspopup="menu"
    :aria-expanded="open ? 'true' : 'false'"
    :aria-label="profile ? `${chat.me.nickName}, ${current.label}. Change status` : `Status: ${current.label}. Change status`"
  >
    <UserAvatar v-if="profile" :user="chat.me" ringed class="me-avatar" />

    <span class="text">
      <span v-if="profile" class="name">{{ chat.me.nickName }}</span>
      <span class="chip">
        <span class="dot" :class="chat.me.status"></span>
        {{ current.label }}
        <q-icon :name="open ? 'expand_less' : 'expand_more'" size="14px" />
      </span>
    </span>

    <q-menu
      v-model="open"
      class="status-menu"
      :fit="profile"
      anchor="top left"
      self="bottom left"
      :offset="[0, 8]"
      transition-show="jump-up"
      transition-hide="fade"
    >
      <q-list class="status-list" role="menu" aria-label="Set your status">
        <q-item
          v-for="s in statuses"
          :key="s"
          v-close-popup
          clickable
          role="menuitemradio"
          :aria-checked="s === chat.me.status ? 'true' : 'false'"
          :active="s === chat.me.status"
          active-class="current"
          class="status-row"
          @click="chat.setStatus(s)"
        >
          <span class="dot" :class="s"></span>
          <span class="label">{{ status[s].label }}</span>
          <span class="hint">{{ status[s].hint }}</span>
        </q-item>

        <template v-if="profile">
          <li class="divider" role="separator"></li>
          <q-item v-close-popup clickable role="menuitem" class="status-row" @click="emit('open-profile')">
            <q-icon name="person_outline" size="18px" class="row-icon" />
            <span class="label">Your profile</span>
          </q-item>
        </template>
      </q-list>
    </q-menu>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useChatStore } from '../stores/chat'
import UserAvatar from './UserAvatar.vue'

defineProps({
  profile: Boolean,
})

const emit = defineEmits(['open-profile'])

const chat = useChatStore()
const open = ref(false)

const statuses = ['online', 'dnd', 'offline']
const status = {
  online: { label: 'Floating', hint: 'Online' },
  dnd: { label: 'Do Not Splash', hint: 'Muted' },
  offline: { label: 'Drying Off', hint: 'Offline' }
}
const current = computed(() => status[chat.me.status])
</script>

<style lang="scss" scoped>
.picker {
  position: relative;
  display: inline-flex;
  align-items: center;
  border: 0;
  border-radius: $qt-radius-pill;
  background: transparent;
  color: inherit;
  font: inherit;
  font-family: $qt-font;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.15s ease;
}

.picker:focus-visible {
  outline: 3px solid $qt-duck;
  outline-offset: 2px;
}

.picker:active {
  transform: scale(0.98);
}

.picker:not(.profile) {
  padding: 0;

  &::after {
    content: '';
    position: absolute;
    inset: -10px -4px;
  }

  &:hover .chip {
    background: rgba($qt-foam, 0.24);
  }
}
.picker.profile {
  display: flex;
  gap: 12px;
  width: 100%;
  min-height: 58px;
  padding: 8px 12px 8px 8px;

  &:hover {
    background: rgba($qt-foam, 0.14);
  }
}

.me-avatar {
  --avatar-gap: #{$qt-deep-water};
  margin: 4px;
}

.text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  min-width: 0;
  line-height: 1.2;
}

.name {
  max-width: 100%;
  overflow: hidden;
  font-size: 15px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px 3px 8px;
  border-radius: $qt-radius-pill;
  background: rgba($qt-foam, 0.14);
  box-shadow: inset 0 0 0 1px rgba($qt-foam, 0.2);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  transition: background-color 0.2s ease;
}

.dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.online {
  background: $qt-status-online;
}

.dnd {
  background: $qt-status-dnd;
}

.offline {
  background: $qt-status-offline;
}

.body--dark {
  .picker.profile:hover {
    background: rgba($qt-glow, 0.1);
  }

  .me-avatar {
    --avatar-gap: #{$qt-night-tub};
  }

  .chip {
    background: rgba($qt-glow, 0.1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .picker,
  .chip {
    transition: none;
  }
}
</style>

<style lang="scss">
.status-menu {
  min-width: 248px;
  padding: 6px;
  border-radius: 26px;
  background: $qt-foam;
  color: $qt-ink;
  font-family: $qt-font;
  box-shadow: 0 16px 40px rgba($qt-deep-water, 0.22), inset 0 0 0 1px rgba($qt-ink, 0.06);

  .status-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0;
  }

  .status-row {
    gap: 12px;
    align-items: center;
    min-height: $qt-touch;
    padding: 6px 14px;
    border-radius: $qt-radius-pill;
    color: inherit;

    .q-focus-helper {
      border-radius: $qt-radius-pill;
    }
  }

  .status-row.current {
    background: rgba($qt-ink, 0.07);
    color: inherit;

    .dot {
      box-shadow: 0 0 0 3px rgba($qt-duck, 0.35);
    }
  }

  .label {
    flex: 1;
    font-size: 14px;
    font-weight: 800;
  }

  .hint {
    font-size: 12px;
    font-weight: 700;
    color: $qt-quiet-ink;
  }

  .row-icon {
    width: 12px;
    color: $qt-quiet-ink;
  }

  .divider {
    height: 1px;
    margin: 4px 14px;
    background: rgba($qt-ink, 0.08);
    list-style: none;
  }

  .dot {
    flex: 0 0 auto;
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .online {
    background: $qt-status-online;
  }

  .dnd {
    background: $qt-status-dnd;
  }

  .offline {
    background: $qt-status-offline;
  }
}

.body--dark .status-menu {
  background: $qt-night-foam;
  color: $qt-moon-ink;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba($qt-glow, 0.12);

  .status-row.current {
    background: rgba($qt-moon-ink, 0.08);
  }

  .hint,
  .row-icon {
    color: $qt-night-quiet-ink;
  }

  .divider {
    background: rgba($qt-moon-ink, 0.1);
  }
}
</style>
