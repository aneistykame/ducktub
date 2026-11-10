import { api } from '@/boot/axios'

class MessageService {
  // newest page without "before", older pages with the id of the oldest loaded message
  async list(channelId, { before, limit } = {}) {
    const response = await api.get(`channels/${channelId}/messages`, { params: { before, limit } })
    return response.data.data
  }

  async send(channelId, content) {
    const response = await api.post(`channels/${channelId}/messages`, { content })
    return response.data.data.message
  }

  // development only: another member of one of my channels writes a message
  async simulate({ activeChannelId, mention }) {
    const response = await api.post('dev/simulate', { activeChannelId, mention })
    return response.data.data.message
  }
}

export default new MessageService()
