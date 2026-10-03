<template>
  <div class="invite">
    <div class="invite-label">Invitation</div>
    <div class="invite-name">
      <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" size="20px" />
      {{ channel.name }}
    </div>
    <div class="invite-actions">
      <button class="btn-dark" @click="emit('accept')">Accept</button>
      <button class="btn-ghost" @click="emit('decline')">Decline</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  channel: Object,
})

const emit = defineEmits(['accept', 'decline'])
</script>

<style lang="scss" scoped>
.invite {
  background: $secondary;
  color: $text-dark;
  border-radius: 20px;
  padding: 12px 16px;
  margin-top: 8px;
}

.invite-label {
  font-size: 12px;
  font-weight: 600;
}

.invite-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 17px;
  font-weight: 700;
}

.invite-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn-dark {
  background: $dark;
  color: $text-light;
  border: 0;
  border-radius: 999px;
  padding: 6px 16px;
  font-weight: 700;
  cursor: pointer;
}

.btn-ghost {
  background: transparent;
  border: 0;
  padding: 6px 10px;
  font-weight: 600;
  cursor: pointer;
  color: $text-dark;
}
</style>
