import { MessageSchema } from "#database/schema";
import { belongsTo, manyToMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, ManyToMany } from "@adonisjs/lucid/types/relations";
import Channel from "#models/channel";
import User from "#models/user";
import { DateTime } from "luxon";
import type { MessagePayload } from "#channels/tub_channel";

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

  static async post(channel: Channel, authorId: number, content: string) {
    const message = await this.create({ channelId: channel.id, authorId, content });

    const nicks = [...content.matchAll(/@([\w-]+)/g)].map((m) => m[1]);
    if (nicks.length) {
      const mentioned = await User.query().whereIn("nick_name", nicks).select("id");
      await message.related("mentions").sync(mentioned.map((u) => u.id));
    }

    channel.lastActivityAt = DateTime.now();
    await channel.save();

    const { default: socket } = await import("@rlanz/socket/services/main");
    socket.to(`channels/${channel.id}`).emit("message:new", message.toPayload());
    return message;
  }

  toPayload(): MessagePayload {
    return {
      id: this.id,
      channelId: Number(this.channelId),
      authorId: Number(this.authorId),
      content: this.content,
      createdAt: this.createdAt?.toISO() ?? null,
    };
  }
}
