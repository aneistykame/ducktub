import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { hasMany, manyToMany } from "@adonisjs/lucid/orm";
import type { HasMany, ManyToMany } from "@adonisjs/lucid/types/relations";
import Channel from "#models/channel";
import Message from "#models/message";

export default class User extends compose(
  UserSchema,
  withAuthFinder(() => hash.use(), {
    uids: ["email", "nickName"],
  })
) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  get initials() {
    if (this.firstName && this.lastName) {
      return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase()
    }
    return this.nickName.slice(0, 2).toUpperCase()
  }

  @hasMany(() => Message, { foreignKey: "authorId" })
  declare sentMessages: HasMany<typeof Message>;

  @manyToMany(() => Channel, {
    pivotTable: "channel_members",
    pivotForeignKey: "user_id",
    pivotRelatedForeignKey: "channel_id",
    pivotColumns: ["joined_at", "last_read_at"],
  })
  declare channels: ManyToMany<typeof Channel>;

  @manyToMany(() => Channel, {
    pivotTable: "channel_invitations",
    pivotForeignKey: "user_id",
    pivotRelatedForeignKey: "channel_id",
    pivotColumns: ["invited_by_id"],
  })
  declare invitations: ManyToMany<typeof Channel>;
}
