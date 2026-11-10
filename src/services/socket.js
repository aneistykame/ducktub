import { Socket } from '@rlanz/socket/client'

export const socket = new Socket({
  url: import.meta.env.API_URL,
  path: '/socket',
})

export const channelName = (channelId) => `channels/${channelId}`
