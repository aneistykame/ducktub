<template>
  <svg class="pond" viewBox="0 0 420 180" aria-hidden="true">
    <g fill="none" stroke="#5BA8DE" stroke-width="1.5" opacity="0.7">
      <circle cx="70" cy="110" r="6" />
      <circle cx="92" cy="78" r="4" />
      <circle cx="250" cy="120" r="7" />
      <circle cx="272" cy="86" r="4" />
      <circle cx="330" cy="100" r="5" />
      <circle cx="165" cy="60" r="3" />
    </g>

    <rect y="164" width="420" height="16" fill="#1E5A8C" />

    <g stroke="#2F8F6B" stroke-width="3">
      <path d="M300 180 V92 M318 180 V110 M338 180 V84 M370 180 V104 M392 180 V90" />
    </g>
    <g fill="#B07A3E">
      <ellipse cx="300" cy="98" rx="4.5" ry="12" />
      <ellipse cx="338" cy="90" rx="4.5" ry="12" />
      <ellipse cx="392" cy="96" rx="4.5" ry="12" />
    </g>

    <g fill="#2FA37A">
      <path d="M130 180 q-12 -30 0 -60 q12 30 0 60z" />
      <path d="M152 180 q-9 -22 0 -44 q9 24 0 44z" />
      <path d="M210 180 q-12 -34 0 -68 q12 36 0 68z" />
      <path d="M232 180 q-9 -20 0 -40 q9 22 0 40z" />
    </g>
  </svg>
</template>

<style lang="scss" scoped>
.pond {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 420px;
  height: 180px;
  pointer-events: none;
}

@media (max-width: 1200px) {
  .pond {
    display: none;
  }
}
</style>
