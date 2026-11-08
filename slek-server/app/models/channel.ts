import { ChannelSchema } from "#database/schema";
import { belongsTo, hasMany, manyToMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany, ManyToMany } from "@adonisjs/lucid/types/relations";
import Message from "#models/message";
import User from "#models/user";
import { DateTime } from "luxon";

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

  static async deleteExpired(days = 30) {
    const limit = DateTime.now().minus({ days }).toSQL({ includeOffset: false })!
    await this.query().where('last_activity_at', '<', limit).delete()
  }
}
