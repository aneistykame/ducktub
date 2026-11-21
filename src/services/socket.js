import { Socket } from '@rlanz/socket/client'

export const socket = new Socket({
  url: import.meta.env.API_URL,
  path: '/socket',
  shouldReconnect: () => true,
})

export const channelName = (channelId) => `channels/${channelId}`
