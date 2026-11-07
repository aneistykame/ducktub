import { MessageSchema } from "#database/schema";
import { belongsTo, manyToMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, ManyToMany } from "@adonisjs/lucid/types/relations";
import Channel from "#models/channel";
import User from "#models/user";

export default class Message extends MessageSchema {
  @belongsTo(() => User, { foreignKey: "authorId" })
  declare author: BelongsTo<typeof User>;

  @belongsTo(() => Channel, { foreignKey: "channelId" })
  declare channel: BelongsTo<typeof Channel>;

  @manyToMany(() => User, {
    pivotTable: "message_mentions",
    pivotForeignKey: "message_id",
    pivotRelatedForeignKey: "user_id",
  })
  declare mentions: ManyToMany<typeof User>;
}
