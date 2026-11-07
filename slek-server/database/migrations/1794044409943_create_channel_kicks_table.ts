import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_kicks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .bigInteger("channel_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("channels")
        .onDelete("CASCADE");
      table
        .bigInteger("kicked_user_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table
        .bigInteger("kicked_by_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.primary(["channel_id", "kicked_user_id", "kicked_by_id"]);
      table.timestamp("created_at");
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
