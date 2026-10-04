<template>
  <div class="avatar" :class="[colorClass, { small }]">
    {{ initial }}
    <span v-if="status" class="dot" :class="status"></span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  user: Object,
  small: Boolean,
  status: String,
})

const initial = computed(() => props.user.nickName[0].toUpperCase())
const colorClass = computed(() => 'c' + (props.user.id % 6))

</script>

<style lang="scss" scoped>
$avatar-colors: #7fd3f0, #ffd84d, #f4a6bc, #b8e986, #c9a7f5, #ffb27a;

.avatar {
  position: relative;
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: 50%;
  color: $text-dark;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.avatar.small {
  width: 36px;
  height: 36px;
  font-size: 14px;
}

@for $i from 0 through 5 {
  .c#{$i} {
    background: nth($avatar-colors, $i + 1);
  }
}

.dot {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2px solid $dark-page;
}

.online {
  background: $positive;
}

.dnd {
  background: $negative;
}

.offline {
  background: #8fa0c8;
}
</style>
