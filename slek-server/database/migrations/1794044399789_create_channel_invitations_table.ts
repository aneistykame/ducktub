import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_invitations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements("id");
      table
        .bigInteger("channel_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("channels")
        .onDelete("CASCADE");
      table
        .bigInteger("user_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table
        .bigInteger("invited_by_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.unique(["channel_id", "user_id"]);
      table.timestamp("created_at");
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
