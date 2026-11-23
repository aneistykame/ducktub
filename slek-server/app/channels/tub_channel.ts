import { BaseChannel, SocketResponseError } from '@rlanz/socket'
import { onMessage } from '@rlanz/socket/decorators'
import type { AuthenticatedSocket, MiddlewareContext } from '@rlanz/socket/types'
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

export type TypingPayload = {
  channelId: number
  userId: number
  draft: string
}

type ServerEvents = {
  'message:new': MessagePayload
  'channel:state': StatePayload
  'typing:update': TypingPayload
}

const DRAFT_MAX_LENGTH = 2000

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

  @onMessage('typing:update')
  async typing(socket: AuthenticatedSocket<User>, payload: { draft?: unknown }) {
    const draft = typeof payload?.draft === 'string' ? payload.draft.slice(0, DRAFT_MAX_LENGTH) : ''
    this.relayTyping(socket, draft)
  }

  async onLeave(socket: AuthenticatedSocket<User>) {
    this.relayTyping(socket, '')
  }

  private relayTyping(socket: AuthenticatedSocket<User>, draft: string) {
    this.broadcastExcept(socket.id, 'typing:update', {
      channelId: Number(this.params.channelId),
      userId: socket.getUserOrFail().id,
      draft,
    })
  }
}
