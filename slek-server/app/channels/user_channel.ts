import { BaseChannel, SocketResponseError } from '@rlanz/socket'
import type { MiddlewareContext } from '@rlanz/socket/types'
import type User from '#models/user'

export type RemovedReason = 'kicked' | 'banned' | 'revoked' | 'deleted'

type ServerEvents = {
  'invitation:new': { channelId: number }
  'channel:removed': { channelId: number; reason: RemovedReason }
}

async function ensureSelf(ctx: MiddlewareContext<User>, next: () => Promise<void>) {
  const user = ctx.socket.getUserOrFail()
  if (String(user.id) !== ctx.params.userId) {
    throw new SocketResponseError('You can only listen to your own events')
  }
  await next()
}

export default class UserChannel extends BaseChannel<User, ServerEvents> {
  static pattern = 'users/:userId'
  static middlewares = [ensureSelf]
}
