import Channel from '#models/channel'
import { createChannelValidator } from '#validators/channel'
import type { HttpContext } from '@adonisjs/core/http'
import ChannelTransformer from '#transformers/channel_transformer'
import { DateTime } from 'luxon'

export default class ChannelsController {
  /**
   * Create a channel. The creator becomes its admin and first member.
   */
  async store({ request, auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    await Channel.deleteExpired()
    const { name, type } = await request.validateUsing(createChannelValidator)

    const channel = await Channel.create({
      name,
      type,
      adminId: user.id,
      lastActivityAt: DateTime.now(),
    })

    await channel.related('members').attach({
      [user.id]: { joined_at: DateTime.now().toSQL({ includeOffset: false }) },
    })

    return serialize({
      channel: ChannelTransformer.transform(channel),
    })
  }

  /**
   * Channels I am a member of, and channels I am invited to.
   */
  async index({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    await Channel.deleteExpired()

    const channels = await user
      .related('channels')
      .query()
      .orderBy('channels.last_activity_at', 'desc')

    const invitations = await user
      .related('invitations')
      .query()
      .orderBy('channel_invitations.created_at', 'desc')

    return serialize({
      channels: ChannelTransformer.transform(channels),
      invitations: ChannelTransformer.transform(invitations),
    })
  }

  /**
   * Leave a channel. When the admin leaves, the channel is deleted for everyone.
   */
  async leave({ params, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)

    const membership = await channel
      .related('members')
      .query()
      .where('users.id', user.id)
      .first()

    if (!membership) {
      return response.forbidden({ errors: [{ message: 'You are not a member of this channel' }] })
    }

    if (channel.adminId === user.id) {
      await channel.delete()
      return serialize({ deleted: true })
    }

    await channel.related('members').detach([user.id])
    return serialize({ deleted: false })
  }

  /**
   * Accept an invitation: the invitation becomes a membership.
   */
  async accept({ params, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)

    const invitation = await user
      .related('invitations')
      .query()
      .where('channels.id', channel.id)
      .first()

    if (!invitation) {
      return response.forbidden({ errors: [{ message: 'You are not invited to this channel' }] })
    }

    await user.related('invitations').detach([channel.id])
    await channel.related('members').attach({
      [user.id]: { joined_at: DateTime.now().toSQL({ includeOffset: false }) },
    })

    return serialize({
      channel: ChannelTransformer.transform(channel),
    })
  }

  /**
   * Decline an invitation: the invitation is removed.
   */
  async decline({ params, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)

    const invitation = await user
      .related('invitations')
      .query()
      .where('channels.id', channel.id)
      .first()

    if (!invitation) {
      return response.forbidden({ errors: [{ message: 'You are not invited to this channel' }] })
    }

    await user.related('invitations').detach([channel.id])

    return serialize({ declined: true })
  }
}
