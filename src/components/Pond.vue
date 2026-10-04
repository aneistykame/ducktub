<template>
  <div class="pond" aria-hidden="true">
    <span v-for="n in 6" :key="n" class="bubble" :class="'b' + n"></span>

    <div class="water"></div>

    <div class="plants">
      <template v-for="(p, i) in plants" :key="i">
        <svg
          v-if="p.type === 'reed'"
          class="plant"
          :class="p.size"
          viewBox="0 0 20 100"
          preserveAspectRatio="xMidYMax meet"
        >
          <path d="M10 100 V24" stroke="#2F8F6B" stroke-width="3" fill="none" />
          <ellipse cx="10" cy="22" rx="4.5" ry="12" fill="#B07A3E" />
        </svg>
        <svg
          v-else
          class="plant"
          :class="p.size"
          viewBox="0 0 24 100"
          preserveAspectRatio="xMidYMax meet"
        >
          <path d="M12 100 q-20 -50 0 -100 q20 50 0 100z" fill="#2FA37A" />
        </svg>
      </template>
    </div>
  </div>
</template>

<script setup>
const plants = [
  { type: 'weed', size: 'm' },
  { type: 'reed', size: 'l' },
  { type: 'weed', size: 's' },
  { type: 'weed', size: 'l' },
  { type: 'reed', size: 'm' },
  { type: 'reed', size: 'l' },
]
</script>

<style lang="scss" scoped>
.pond {
  position: relative;
  flex: none;
  height: 200px;
  overflow: hidden;
  pointer-events: none;
}

.water {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 16px;
  background: #1e5a8c;
}

.plants {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 20px;
}

.plant {
  display: block;
  flex: none;
  width: 24px;
}

.s {
  height: 56px;
}

.m {
  height: 84px;
}

.l {
  height: 116px;
}

.bubble {
  position: absolute;
  border: 1.5px solid #5ba8de;
  border-radius: 50%;
  opacity: 0.7;
}

.b1 {
  left: 18%;
  bottom: 120px;
  width: 12px;
  height: 12px;
}

.b2 {
  left: 30%;
  bottom: 150px;
  width: 8px;
  height: 8px;
}

.b3 {
  left: 52%;
  bottom: 100px;
  width: 14px;
  height: 14px;
}

.b4 {
  left: 60%;
  bottom: 140px;
  width: 8px;
  height: 8px;
}

.b5 {
  left: 78%;
  bottom: 125px;
  width: 10px;
  height: 10px;
}

.b6 {
  left: 40%;
  bottom: 170px;
  width: 6px;
  height: 6px;
}
</style>
