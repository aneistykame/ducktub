<template>
  <div class="item" :class="{ active }">
    <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" size="20px" />
    <span class="name">{{ channel.name }}</span>
    <span v-if="channel.unread" class="badge">{{ channel.unread }}</span>
  </div>
</template>

<script setup>
defineProps({
  channel: Object,
  active: Boolean,
})
</script>

<style lang="scss" scoped>
.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 999px;
  cursor: pointer;
}

.name {
  flex: 1;
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
</style>
