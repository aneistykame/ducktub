import { ChannelSchema } from "#database/schema";
import { belongsTo, hasMany, manyToMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany, ManyToMany } from "@adonisjs/lucid/types/relations";
import Message from "#models/message";
import User from "#models/user";
import { DateTime } from "luxon";
import db from "@adonisjs/lucid/services/db";

export type ChannelState = {
  memberIds: number[];
  invitedIds: number[];
  bannedIds: number[];
  kickedBy: Record<number, number[]>;
};

export default class Channel extends ChannelSchema {
  @belongsTo(() => User, { foreignKey: "adminId" })
  declare admin: BelongsTo<typeof User>;

  @hasMany(() => Message, { foreignKey: "channelId" })
  declare messages: HasMany<typeof Message>;

  @manyToMany(() => User, {
    pivotTable: "channel_members",
    pivotForeignKey: "channel_id",
    pivotRelatedForeignKey: "user_id",
    pivotColumns: ["joined_at", "last_read_at"],
  })
  declare members: ManyToMany<typeof User>;

  @manyToMany(() => User, {
    pivotTable: "channel_invitations",
    pivotForeignKey: "channel_id",
    pivotRelatedForeignKey: "user_id",
    pivotColumns: ["invited_by_id"],
  })
  declare invitedUsers: ManyToMany<typeof User>;

  @manyToMany(() => User, {
    pivotTable: "channel_bans",
    pivotForeignKey: "channel_id",
    pivotRelatedForeignKey: "user_id",
    pivotColumns: ["banned_by_id"],
  })
  declare bannedUsers: ManyToMany<typeof User>;

  async hasMember(this: Channel, userId: number) {
    const member = await this.related('members').query().where('users.id', userId).first()
    return !!member
  }

  async isBanned(this: Channel, userId: number) {
    const ban = await db.from('channel_bans').where({ channel_id: this.id, user_id: userId }).first()
    return !!ban
  }

  async isInvited(this: Channel, userId: number) {
    const invitation = await db
      .from('channel_invitations')
      .where({ channel_id: this.id, user_id: userId })
      .first()
    return !!invitation
  }

  /**
   * Members, pending invitations, bans and kick votes (kicked user id -> kicker ids).
   */
  async state(this: Channel): Promise<ChannelState> {
    const [members, invited, banned, kicks] = await Promise.all([
      db.from('channel_members').where('channel_id', this.id).select('user_id'),
      db.from('channel_invitations').where('channel_id', this.id).select('user_id'),
      db.from('channel_bans').where('channel_id', this.id).select('user_id'),
      db.from('channel_kicks').where('channel_id', this.id).select('kicked_user_id', 'kicked_by_id'),
    ])

    const kickedBy: Record<number, number[]> = {}
    for (const k of kicks) (kickedBy[k.kicked_user_id] ??= []).push(k.kicked_by_id)

    return {
      memberIds: members.map((r) => r.user_id),
      invitedIds: invited.map((r) => r.user_id),
      bannedIds: banned.map((r) => r.user_id),
      kickedBy,
    }
  }

  async withState(this: Channel) {
    this.$extras.state = await this.state()
    return this
  }

  async addMember(this: Channel, userId: number) {
    await db.from('channel_invitations').where({ channel_id: this.id, user_id: userId }).delete()
    await this.related('members').attach({
      [userId]: { joined_at: DateTime.now().toSQL({ includeOffset: false }) },
    })
  }

  async ban(this: Channel, userId: number, bannedById: number) {
    if (await this.isBanned(userId)) return
    await db.table('channel_bans').insert({
      channel_id: this.id,
      user_id: userId,
      banned_by_id: bannedById,
      created_at: DateTime.now().toSQL({ includeOffset: false }),
    })
  }

  async unban(this: Channel, userId: number) {
    await db.from('channel_bans').where({ channel_id: this.id, user_id: userId }).delete()
    await db.from('channel_kicks').where({ channel_id: this.id, kicked_user_id: userId }).delete()
  }

  /**
   * Push the current state to everyone who has the channel open.
   */
  async broadcastState(this: Channel) {
    const state = await this.state()
    const { default: socket } = await import('@rlanz/socket/services/main')
    socket.to(`channels/${this.id}`).emit('channel:state', { channelId: this.id, ...state })
    return state
  }

  static async notifyUser(userId: number, event: string, data: Record<string, unknown>) {
    const { default: socket } = await import('@rlanz/socket/services/main')
    socket.to(`users/${userId}`).emit(event, data)
  }

  static async deleteExpired(days = 30) {
    const limit = DateTime.now().minus({ days }).toSQL({ includeOffset: false })!
    await this.query().where('last_activity_at', '<', limit).delete()
  }
}
