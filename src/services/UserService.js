import { api } from '@/boot/axios'

class UserService {
  async list() {
    const response = await api.get('users')
    return response.data.data.users
  }
}

export default new UserService()
