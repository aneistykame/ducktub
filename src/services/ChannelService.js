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

  // public channels I could join, filtered by name
  async discover(q) {
    const response = await api.get('channels/discover', { params: { q } })
    return response.data.data.channels
  }

  // creates the channel if it doesn't exist; status is 'created' | 'joined' | 'already'
  async join({ name, type }) {
    const response = await api.post('channels/join', { name, type })
    return response.data.data
  }

  async invite(id, nickName) {
    const response = await api.post(`channels/${id}/invite`, { nickName })
    return response.data.data
  }

  async kick(id, nickName) {
    const response = await api.post(`channels/${id}/kick`, { nickName })
    return response.data.data
  }

  async revoke(id, nickName) {
    const response = await api.post(`channels/${id}/revoke`, { nickName })
    return response.data.data
  }
}

export default new ChannelService()
