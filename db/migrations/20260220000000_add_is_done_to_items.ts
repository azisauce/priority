import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("items", (table) => {
    table.boolean("is_done").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("items", (table) => {
    table.dropColumn("is_done");
  });
}
