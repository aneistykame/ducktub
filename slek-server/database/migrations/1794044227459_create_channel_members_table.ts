import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_members'

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
        .bigInteger("user_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.timestamp("joined_at").notNullable();
      table.timestamp("last_read_at").nullable();
      table.primary(["channel_id", "user_id"]);
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
