<template>
  <section class="auth" aria-labelledby="auth-title">
    <img :src="logo" alt="" class="logo" />
    <h1 id="auth-title" class="title">{{ mode === 'login' ? 'Welcome back to the tub' : 'Join the tub' }}</h1>
    <p class="subtitle">Log in or register to start chatting.</p>

    <div class="switch" role="tablist" aria-label="Log in or register">
      <button
        type="button"
        role="tab"
        class="switch-opt"
        :class="{ on: mode === 'login' }"
        :aria-selected="mode === 'login'"
        @click="setMode('login')"
      >
        Log in
      </button>
      <button
        type="button"
        role="tab"
        class="switch-opt"
        :class="{ on: mode === 'register' }"
        :aria-selected="mode === 'register'"
        @click="setMode('register')"
      >
        Register
      </button>
    </div>

    <form v-if="mode === 'login'" class="form" novalidate @submit.prevent="submitLogin">
      <label class="field">
        <span class="field-label">Email or nickname</span>
        <input v-model="loginForm.login" class="input" type="text" autocomplete="username" required />
      </label>
      <label class="field">
        <span class="field-label">Password</span>
        <input v-model="loginForm.password" class="input" type="password" autocomplete="current-password" required />
      </label>

      <p v-if="loginError" class="error" role="alert">{{ loginError }}</p>

      <button type="submit" class="submit" :disabled="!canLogin">Log in</button>
    </form>

    <form v-else class="form" novalidate @submit.prevent="submitRegister">
      <div class="pair">
        <label class="field">
          <span class="field-label">First name</span>
          <input v-model="regForm.firstName" class="input" type="text" autocomplete="given-name" required />
        </label>
        <label class="field">
          <span class="field-label">Last name</span>
          <input v-model="regForm.lastName" class="input" type="text" autocomplete="family-name" required />
        </label>
      </div>
      <label class="field">
        <span class="field-label">Nickname</span>
        <input
          v-model="regForm.nickName"
          class="input"
          :class="{ invalid: regErrors.nickName }"
          type="text"
          autocomplete="nickname"
          maxlength="20"
          required
          :aria-invalid="!!regErrors.nickName"
        />
        <span v-if="regErrors.nickName" class="field-error">{{ regErrors.nickName }}</span>
      </label>
      <label class="field">
        <span class="field-label">Email</span>
        <input
          v-model="regForm.email"
          class="input"
          :class="{ invalid: regErrors.email }"
          type="email"
          autocomplete="email"
          required
          :aria-invalid="!!regErrors.email"
        />
        <span v-if="regErrors.email" class="field-error">{{ regErrors.email }}</span>
      </label>
      <label class="field">
        <span class="field-label">Password</span>
        <input
          v-model="regForm.password"
          class="input"
          :class="{ invalid: regErrors.password }"
          type="password"
          autocomplete="new-password"
          required
          :aria-invalid="!!regErrors.password"
        />
        <span v-if="regErrors.password" class="field-error">{{ regErrors.password }}</span>
      </label>

      <button type="submit" class="submit" :disabled="!canRegister">Create account</button>
    </form>
  </section>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useChatStore, DEMO_PASSWORD } from '../stores/chat'
import logo from '../assets/logo.png'

const chat = useChatStore()

const mode = ref('login')

const loginForm = reactive({ login: '', password: '' })
const loginError = ref('')

const regForm = reactive({ firstName: '', lastName: '', nickName: '', email: '', password: '' })
const regTaken = reactive({ nickName: '', email: '' })

watch(() => regForm.nickName, () => (regTaken.nickName = ''))
watch(() => regForm.email, () => (regTaken.email = ''))

const canLogin = computed(() => !!loginForm.login.trim() && !!loginForm.password)

const regErrors = computed(() => {
  const errors = {}
  const nick = regForm.nickName.trim()
  const email = regForm.email.trim()

  if (nick && !/^[\w-]+$/.test(nick)) errors.nickName = 'Use only letters, numbers, - and _'
  else if (regTaken.nickName) errors.nickName = regTaken.nickName

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email'
  else if (regTaken.email) errors.email = regTaken.email

  if (regForm.password && regForm.password.length < 6) errors.password = 'Use at least 6 characters'
  return errors
})

const canRegister = computed(
  () =>
    !!regForm.firstName.trim() &&
    !!regForm.lastName.trim() &&
    !!regForm.nickName.trim() &&
    !!regForm.email.trim() &&
    !!regForm.password &&
    !Object.keys(regErrors.value).length,
)

function setMode(m) {
  mode.value = m
  loginError.value = ''
}

function submitLogin() {
  if (!canLogin.value) return
  loginError.value = chat.login(loginForm) ?? ''
}

function submitRegister() {
  if (!canRegister.value) return

  const error = chat.register({
    firstName: regForm.firstName.trim(),
    lastName: regForm.lastName.trim(),
    nickName: regForm.nickName.trim(),
    email: regForm.email.trim(),
    password: regForm.password,
  })
  if (error) regTaken[error.field] = error.message
}
</script>

<style lang="scss" scoped>
.auth {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 420px;
  max-width: 100%;
  padding: 32px 28px;
  border-radius: $qt-radius-panel;
  background: $qt-surface;
  color: $qt-ink;
  font-family: $qt-font;
  box-shadow: $qt-shadow-menu, $qt-surface-ring;
}

.logo {
  width: 64px;
  height: 64px;
  animation: qt-bob 3.2s ease-in-out infinite;
}

@keyframes qt-bob {
  0%,
  100% {
    transform: translateY(0) rotate(-3deg);
  }

  50% {
    transform: translateY(-5px) rotate(3deg);
  }
}

.title {
  margin: 4px 0 0;
  font-size: 30px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.01em;
  text-align: center;
}

.subtitle {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: $qt-ink-quiet;
  text-align: center;
}

.switch {
  display: flex;
  gap: 4px;
  width: 100%;
  padding: 4px;
  border-radius: $qt-radius-pill;
  background: $qt-chip;
}

.switch-opt {
  flex: 1;
  min-height: 40px;
  border: 0;
  border-radius: $qt-radius-pill;
  background: transparent;
  color: $qt-ink-quiet;
  font-family: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.switch-opt:hover {
  color: $qt-ink;
}

.switch-opt.on {
  background: $qt-glow;
  color: $qt-glow-ink;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 8px;
}

.pair {
  display: flex;
  gap: 12px;
}

.pair .field {
  flex: 1;
  min-width: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  padding-left: 16px;
  font-size: 12px;
  font-weight: 700;
  color: $qt-ink-quiet;
}

.input {
  width: 100%;
  min-height: $qt-touch;
  padding: 0 16px;
  border: 0;
  border-radius: $qt-radius-pill;
  background: $qt-input-bg;
  box-shadow: $qt-shadow-input;
  color: $qt-ink;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  outline: none;
  transition: box-shadow 0.15s ease;
}

.input:focus {
  box-shadow: $qt-shadow-input, 0 0 0 4px rgba($qt-duck, 0.85);
}

.input.invalid {
  box-shadow: inset 0 0 0 1.5px $qt-fail-ring;
}

.field-error,
.error {
  padding-left: 16px;
  font-size: 13px;
  font-weight: 700;
  color: $qt-fail-ink;
}

.error {
  margin: 0;
  padding: 10px 16px;
  border-radius: $qt-radius-bubble;
  background: $qt-fail-bg;
}

.submit {
  min-height: $qt-touch;
  margin-top: 6px;
  padding: 0 18px;
  border: 0;
  border-radius: $qt-radius-pill;
  background: $qt-duck;
  color: $qt-duck-ink;
  font-family: inherit;
  font-size: 14px;
  font-weight: 900;
  box-shadow: 0 6px 14px rgba($qt-duck-shade, 0.3), inset 0 -3px 0 rgba($qt-duck-shade, 0.9);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.submit:hover:not(:disabled) {
  transform: translateY(-2px);
  background: $qt-duck-hover;
  box-shadow: 0 10px 20px rgba($qt-duck-shade, 0.4), inset 0 -3px 0 rgba($qt-duck-shade, 0.9);
}

.submit:active:not(:disabled) {
  transform: scale(0.97);
  background: $qt-duck-pressed;
}

.submit:disabled {
  background: $qt-chip;
  color: $qt-ink-quiet;
  box-shadow: none;
  cursor: not-allowed;
}

.switch-opt:focus-visible,
.submit:focus-visible {
  outline: 3px solid $qt-duck;
  outline-offset: 3px;
}

@media (max-width: 420px) {
  .auth {
    padding: 28px 18px;
  }

  .pair {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo {
    animation: none;
  }

  .switch-opt,
  .input,
  .submit {
    transition: none;
  }

  .submit:hover:not(:disabled),
  .submit:active:not(:disabled) {
    transform: none;
  }
}
</style>
