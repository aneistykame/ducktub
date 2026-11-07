import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements("id");
      table.string("name", 30).notNullable().unique();
      table.enu("type", ["public", "private"]).notNullable().defaultTo("public");
      table
        .bigInteger("admin_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.timestamp("last_activity_at").nullable();

      table.timestamp("created_at");
      table.timestamp("updated_at");
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
