import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

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
        .bigInteger("author_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.text("content").notNullable();

      table.timestamp("created_at");
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
