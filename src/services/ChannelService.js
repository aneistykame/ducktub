import { api } from '@/boot/axios'

class ChannelService {
  async list() {
    const response = await api.get('channels')
    return response.data.data
  }

  async create({ name, type }) {
    const response = await api.post('channels', { name, type })
    return response.data.data.channel
  }

  async leave(id) {
    const response = await api.post(`channels/${id}/leave`)
    return response.data.data
  }

  async accept(id) {
    const response = await api.post(`channels/${id}/accept`)
    return response.data.data.channel
  }

  async decline(id) {
    await api.post(`channels/${id}/decline`)
  }
}

export default new ChannelService()
