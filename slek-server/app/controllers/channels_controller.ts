import Channel from '#models/channel'
import User from '#models/user'
import { createChannelValidator, joinChannelValidator, nickNameValidator } from '#validators/channel'
import type { HttpContext } from '@adonisjs/core/http'
import ChannelTransformer from '#transformers/channel_transformer'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

const KICKS_TO_BAN = 3

const errors = (message: string) => ({ errors: [{ message }] })

const findByNick = (nickName: string) =>
  User.query().whereRaw('lower(nick_name) = ?', [nickName.toLowerCase()]).first()

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
    await channel.addMember(user.id)

    return serialize({
      channel: ChannelTransformer.transform(await channel.withState()),
    })
  }

  /**
   * Channels I am a member of, and channels I am invited to, with their state.
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

    await Promise.all([...channels, ...invitations].map((c) => c.withState()))

    return serialize({
      channels: ChannelTransformer.transform(channels),
      invitations: ChannelTransformer.transform(invitations),
    })
  }

  async discover({ request, auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const q = String(request.input('q', '')).trim().replace(/^#/, '').toLowerCase()

    const query = Channel.query()
      .where('type', 'public')
      .whereNotIn('id', db.from('channel_members').where('user_id', user.id).select('channel_id'))
      .whereNotIn('id', db.from('channel_bans').where('user_id', user.id).select('channel_id'))
      .orderBy('name', 'asc')
      .limit(20)
    if (q) query.whereRaw('lower(name) like ?', [`%${q}%`])

    return serialize({
      channels: ChannelTransformer.transform(await query),
    })
  }

  async join({ request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    await Channel.deleteExpired()
    const { name, type } = await request.validateUsing(joinChannelValidator)

    if (name.length > 30) {
      return response.unprocessableEntity(errors('Channel names can be at most 30 characters'))
    }

    let channel = await Channel.query().whereRaw('lower(name) = ?', [name.toLowerCase()]).first()

    if (!channel) {
      channel = await Channel.create({
        name,
        type: type ?? 'public',
        adminId: user.id,
        lastActivityAt: DateTime.now(),
      })
      await channel.addMember(user.id)
      return serialize({
        status: 'created',
        channel: ChannelTransformer.transform(await channel.withState()),
      })
    }

    if (await channel.hasMember(user.id)) {
      return serialize({
        status: 'already',
        channel: ChannelTransformer.transform(await channel.withState()),
      })
    }

    if (await channel.isBanned(user.id)) {
      return response.forbidden(errors(`You’re banned from #${channel.name}`))
    }

    if (channel.type === 'private' && !(await channel.isInvited(user.id))) {
      return response.forbidden(errors(`#${channel.name} is private. Ask the admin for an invite`))
    }

    await channel.addMember(user.id)
    await channel.broadcastState()

    return serialize({
      status: 'joined',
      channel: ChannelTransformer.transform(await channel.withState()),
    })
  }

  async invite({ params, request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)
    const { nickName } = await request.validateUsing(nickNameValidator)
    const isAdmin = channel.adminId === user.id

    if (!(await channel.hasMember(user.id))) {
      return response.forbidden(errors('You are not a member of this channel'))
    }

    const target = await findByNick(nickName)
    if (!target) return response.notFound(errors(`No duck called @${nickName}`))
    if (target.id === user.id) return response.unprocessableEntity(errors('You’re already in this tub'))

    if (await channel.hasMember(target.id)) {
      return response.conflict(errors(`@${target.nickName} is already in this tub`))
    }
    if (channel.type === 'private' && !isAdmin) {
      return response.forbidden(errors('Only the admin can invite people to this private channel'))
    }

    const wasBanned = await channel.isBanned(target.id)
    if (wasBanned && !isAdmin) {
      return response.forbidden(
        errors(`@${target.nickName} is banned here. Only the admin can let them back in`)
      )
    }
    if (wasBanned) await channel.unban(target.id)

    if (await channel.isInvited(target.id)) {
      if (!wasBanned) return response.conflict(errors(`@${target.nickName} is already invited`))
    } else {
      await channel.related('invitedUsers').attach({
        [target.id]: {
          invited_by_id: user.id,
          created_at: DateTime.now().toSQL({ includeOffset: false }),
        },
      })
    }

    await Channel.notifyUser(target.id, 'invitation:new', { channelId: channel.id })
    const state = await channel.broadcastState()

    return serialize({ liftedBan: wasBanned, state })
  }

  async kick({ params, request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)
    const { nickName } = await request.validateUsing(nickNameValidator)
    const isAdmin = channel.adminId === user.id

    if (!(await channel.hasMember(user.id))) {
      return response.forbidden(errors('You are not a member of this channel'))
    }

    const target = await findByNick(nickName)
    if (!target) return response.notFound(errors(`No duck called @${nickName}`))
    if (target.id === user.id) {
      return response.unprocessableEntity(errors('You can’t kick yourself. Try /cancel'))
    }
    if (!(await channel.hasMember(target.id))) {
      return response.unprocessableEntity(errors(`@${target.nickName} isn’t in this tub`))
    }
    if (target.id === channel.adminId) {
      return response.forbidden(errors('Nobody can kick the admin'))
    }
    if (channel.type === 'private' && !isAdmin) {
      return response.forbidden(errors('Only the admin can remove people from this private channel'))
    }

    await channel.related('members').detach([target.id])

    let action: 'removed' | 'banned' | 'kicked'
    let kicks = 0

    if (channel.type === 'private') {
      action = 'removed'
    } else if (isAdmin) {
      await channel.ban(target.id, user.id)
      action = 'banned'
    } else {
      const counted = await db
        .from('channel_kicks')
        .where({ channel_id: channel.id, kicked_user_id: target.id, kicked_by_id: user.id })
        .first()
      if (!counted) {
        await db.table('channel_kicks').insert({
          channel_id: channel.id,
          kicked_user_id: target.id,
          kicked_by_id: user.id,
          created_at: DateTime.now().toSQL({ includeOffset: false }),
        })
      }

      const [{ total }] = await db
        .from('channel_kicks')
        .where({ channel_id: channel.id, kicked_user_id: target.id })
        .count('* as total')
      kicks = Number(total)

      if (kicks >= KICKS_TO_BAN) {
        await channel.ban(target.id, user.id)
        action = 'banned'
      } else {
        action = 'kicked'
      }
    }

    await Channel.notifyUser(target.id, 'channel:removed', {
      channelId: channel.id,
      reason: action === 'removed' ? 'revoked' : action,
    })
    const state = await channel.broadcastState()

    return serialize({ action, kicks, state })
  }

  async revoke({ params, request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)
    const { nickName } = await request.validateUsing(nickNameValidator)

    if (channel.adminId !== user.id) {
      return response.forbidden(errors('Only the admin can revoke access'))
    }

    const target = await findByNick(nickName)
    if (!target) return response.notFound(errors(`No duck called @${nickName}`))
    if (target.id === user.id) {
      return response.unprocessableEntity(errors('You’re the admin. Use /quit to close the tub'))
    }

    let action: 'removed' | 'uninvited'
    if (await channel.hasMember(target.id)) {
      await channel.related('members').detach([target.id])
      action = 'removed'
    } else if (await channel.isInvited(target.id)) {
      await channel.related('invitedUsers').detach([target.id])
      action = 'uninvited'
    } else {
      return response.unprocessableEntity(
        errors(`@${target.nickName} isn’t in this tub or invited to it`)
      )
    }

    await Channel.notifyUser(target.id, 'channel:removed', { channelId: channel.id, reason: 'revoked' })
    const state = await channel.broadcastState()

    return serialize({ action, state })
  }

  /**
   * Leave a channel. When the admin leaves, the channel is deleted for everyone.
   */
  async leave({ params, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)

    if (!(await channel.hasMember(user.id))) {
      return response.forbidden(errors('You are not a member of this channel'))
    }

    if (channel.adminId === user.id) {
      const { memberIds, invitedIds } = await channel.state()
      await channel.delete()
      await Promise.all(
        [...memberIds, ...invitedIds]
          .filter((id) => id !== user.id)
          .map((id) => Channel.notifyUser(id, 'channel:removed', { channelId: channel.id, reason: 'deleted' }))
      )
      return serialize({ deleted: true })
    }

    await channel.related('members').detach([user.id])
    await channel.broadcastState()
    return serialize({ deleted: false })
  }

  /**
   * Accept an invitation: the invitation becomes a membership.
   */
  async accept({ params, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)

    if (!(await channel.isInvited(user.id))) {
      return response.forbidden(errors('You are not invited to this channel'))
    }
    if (await channel.isBanned(user.id)) {
      return response.forbidden(errors(`You’re banned from #${channel.name}`))
    }

    await channel.addMember(user.id)
    await channel.broadcastState()

    return serialize({
      channel: ChannelTransformer.transform(await channel.withState()),
    })
  }

  /**
   * Decline an invitation: the invitation is removed.
   */
  async decline({ params, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.findOrFail(params.id)

    if (!(await channel.isInvited(user.id))) {
      return response.forbidden(errors('You are not invited to this channel'))
    }

    await channel.related('invitedUsers').detach([user.id])
    await channel.broadcastState()

    return serialize({ declined: true })
  }
}
