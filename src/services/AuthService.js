import { api } from '@/boot/axios'

class AuthService {
  async me(dontTriggerLogout = false) {
    try {
      const response = await api.get('account/profile', { dontTriggerLogout })
      return response.data.data
    } catch (error) {
      if (error.response?.status === 401) return null
      throw error
    }
  }

  async register(data) {
    const response = await api.post('auth/signup', data)
    return response.data.data.user
  }

  async login(credentials) {
    const response = await api.post('auth/login', credentials)
    return response.data.data.user
  }

  async logout() {
    await api.post('account/logout')
  }
}

export default new AuthService()
