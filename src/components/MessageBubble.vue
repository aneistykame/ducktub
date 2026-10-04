<template>
  <div class="msg" :class="{ mine, grouped: !showMeta }">
    <template v-if="!mine">
      <div v-if="showAvatar" class="avatar" :class="colorClass">{{ initial }}</div>
      <div v-else class="avatar-space"></div>
    </template>

    <div class="content">
      <div v-if="showMeta" class="meta">
        <template v-if="mine">
          <span>{{ message.time }}</span>
          <b>You</b>
        </template>
        <template v-else>
          <b>{{ author.nickName }}</b>
          <span>{{ message.time }}</span>
        </template>
      </div>

      <div class="bubble" :class="{ mine, mention }">
        <div class="text">
          <template v-for="(p, i) in parts" :key="i">
            <span v-if="p.tag" class="tag">{{ p.text }}</span>
            <template v-else>{{ p.text }}</template>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: Object,
  author: Object,
  mine: Boolean,
  mention: Boolean,
  showMeta: Boolean,
  showAvatar: Boolean,
})

const initial = computed(() => props.author.nickName[0].toUpperCase())
const colorClass = computed(() => 'c' + (props.author.id % 6))

const parts = computed(() =>
  props.message.text
    .split(/(@\w+)/)
    .filter(Boolean)
    .map((t) => ({ text: t, tag: t.startsWith('@') })),
)
</script>

<style lang="scss" scoped>
$avatar-colors: #7fd3f0, #ffd84d, #f4a6bc, #b8e986, #c9a7f5, #ffb27a;

.msg {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-top: 3px;
}

.msg:not(.grouped) {
  margin-top: 14px;
}

.msg.mine {
  justify-content: flex-end;
}

.avatar,
.avatar-space {
  width: 40px;
  height: 40px;
  flex: none;
}

.avatar {
  border-radius: 50%;
  color: $text-dark;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

@for $i from 0 through 5 {
  .c#{$i} {
    background: nth($avatar-colors, $i + 1);
  }
}

.content {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.mine .content {
  align-items: flex-end;
}

.meta {
  font-size: 12px;
  margin: 0 0 4px 14px;
  opacity: 0.85;
}

.meta span {
  margin: 0 6px;
  opacity: 0.7;
}

.mine .meta {
  margin: 0 14px 4px 0;
}

.bubble {
  box-sizing: border-box;
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 8px 18px;
  border-radius: 22px;
  background: $bubbles-others;
  border: 1px solid rgba(255, 255, 255, 0.12);
  line-height: 1.4;
}

.bubble.mine {
  background: $bubbles-mine;
  color: $text-dark;
  border-color: transparent;
}

.bubble.mention {
  background: $bubbles-mention;
  border-color: $secondary;
}

.tag {
  background: $secondary;
  color: $text-dark;
  font-weight: 700;
  border-radius: 999px;
  padding: 0 8px;
}
</style>
