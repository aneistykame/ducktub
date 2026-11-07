import { defineStore } from 'pinia'
import { isAxiosError } from 'axios'
import { authService } from '@/services'

// convert an error (e.g. validation errors from the server) to a list of errors
function toErrors(error) {
  if (isAxiosError(error) && error.response?.data?.errors) {
    return error.response.data.errors
  }

  return [{ message: error instanceof Error ? error.message : 'Unknown error' }]
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    status: 'pending', // 'pending' | 'success' | 'error'
    errors: [],
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,
  },

  actions: {
    authStart() {
      this.status = 'pending'
      this.errors = []
    },
    authSuccess(user) {
      this.status = 'success'
      this.user = user
    },
    authError(error) {
      this.status = 'error'
      this.errors = toErrors(error)
    },

    async check() {
      try {
        this.authStart()
        const user = await authService.me()
        this.authSuccess(user)
        return user !== null
      } catch (err) {
        this.authError(err)
        throw err
      }
    },
    async register(form) {
      try {
        this.authStart()
        const user = await authService.register(form)
        this.authSuccess(null)
        return user
      } catch (err) {
        this.authError(err)
        throw err
      }
    },
    async login(credentials) {
      try {
        this.authStart()
        const user = await authService.login(credentials)
        this.authSuccess(user)
        return user
      } catch (err) {
        this.authError(err)
        throw err
      }
    },
    async logout() {
      try {
        this.authStart()
        await authService.logout()
        this.authSuccess(null)
      } catch (err) {
        this.authError(err)
        throw err
      }
    },
  },
})
