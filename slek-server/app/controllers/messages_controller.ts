import Channel from '#models/channel'
import Message from '#models/message'
import User from '#models/user'
import { listMessagesValidator, sendMessageValidator } from '#validators/message'
import type { HttpContext } from '@adonisjs/core/http'
import MessageTransformer from '#transformers/message_transformer'

export default class MessagesController {
  /**
   * One page of a channel's messages, oldest first. Without "before" it is
   * the newest page; with "before" it is the page just above that message.
   */
  async index({ params, request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)

    if (!(await channel.hasMember(user.id))) {
      return response.forbidden({ errors: [{ message: 'You are not a member of this channel' }] })
    }

    const { before, limit = 30 } = await request.validateUsing(listMessagesValidator)

    const query = channel.related('messages').query().orderBy('id', 'desc').limit(limit + 1)
    if (before) query.where('id', '<', before)

    const rows = await query
    const hasMore = rows.length > limit
    const messages = rows.slice(0, limit).reverse()

    return serialize({
      messages: MessageTransformer.transform(messages),
      hasMore,
    })
  }

  async store({ params, request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)

    if (!(await channel.hasMember(user.id))) {
      return response.forbidden({ errors: [{ message: 'You are not a member of this channel' }] })
    }

    const { content } = await request.validateUsing(sendMessageValidator)
    const message = await Message.post(channel, user.id, content)

    return serialize({
      message: MessageTransformer.transform(message),
    })
  }

  async simulate({ request, auth, response, serialize }: HttpContext) {
    const me = auth.getUserOrFail()
    const { activeChannelId, mention } = request.only(['activeChannelId', 'mention'])

    const channels = await me
      .related('channels')
      .query()
      .preload('members', (q) => q.whereNot('users.id', me.id))

    const candidates = channels
      .filter((c) => c.members.length)
      .sort((a, b) => Number(a.id === Number(activeChannelId)) - Number(b.id === Number(activeChannelId)))

    const channel = candidates[0]
    if (!channel) {
      return response.unprocessableEntity({
        errors: [{ message: 'No other duck shares a tub with you yet' }],
      })
    }

    const author: User = channel.members.find((u) => u.nickName === 'ed') ?? channel.members[0]
    const content = mention
      ? `Hey @${me.nickName}, are you coming to the meeting later today?`
      : 'Ducks <3'

    const message = await Message.post(channel, author.id, content)

    return serialize({
      message: MessageTransformer.transform(message),
    })
  }
}
