<template>
  <span class="channel-name" :style="{ maxWidth: max }" :title="`#${name}`">#{{ name }}</span>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  // Longest the name may get before it is cut off with "…"
  max: { type: String, default: '16ch' },
})
</script>

<style lang="scss" scoped>
.channel-name {
  display: inline-block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>
