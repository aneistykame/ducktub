<template>
  <aside class="sidebar">
    Sidebar


    <svg class="wave" aria-hidden="true">
      <defs>
        <pattern id="wave-tile" width="24" height="320" patternUnits="userSpaceOnUse">
          <path
            class="wave-fill"
            d="M20 0 C20 80 4 80 4 160 C4 240 20 240 20 320 L24 320 L24 0 Z"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wave-tile)" />
    </svg>
  </aside>
</template>

<style lang="scss" scoped>
.sidebar {
  position: relative;
  height: 100%;
  color: $text-light;
  padding: 16px 40px 16px 16px;
}

.wave {
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 100%;
}

.wave-fill {
  fill: $dark-page;
}
</style>
