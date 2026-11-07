import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements("id");
      table.string("first_name", 60).notNullable();
      table.string("last_name", 60).notNullable();
      table.string("nick_name", 30).notNullable().unique();
      table.string("email", 255).notNullable().unique();
      table.string("password", 255).notNullable();
      table.enu("status", ["online", "dnd", "offline"]).notNullable().defaultTo("offline");
      table.boolean("notify_mentions_only").notNullable().defaultTo(false);

      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").nullable();
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
