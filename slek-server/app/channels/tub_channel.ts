import { BaseChannel, SocketResponseError } from '@rlanz/socket'
import type { MiddlewareContext } from '@rlanz/socket/types'
import Channel, { type ChannelState } from '#models/channel'
import type User from '#models/user'

export type MessagePayload = {
  id: number
  channelId: number
  authorId: number
  content: string
  createdAt: string | null
}

export type StatePayload = ChannelState & {
  channelId: number
}

type ServerEvents = {
  'message:new': MessagePayload
  'channel:state': StatePayload
}

async function ensureMember(ctx: MiddlewareContext<User>, next: () => Promise<void>) {
  const user = ctx.socket.getUserOrFail()
  const channel = await Channel.find(ctx.params.channelId)
  if (!channel || !(await channel.hasMember(user.id))) {
    throw new SocketResponseError('You are not a member of this channel')
  }
  await next()
}

export default class TubChannel extends BaseChannel<User, ServerEvents> {
  static pattern = 'channels/:channelId'
  static middlewares = [ensureMember]
}
