import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Make user_id nullable on priority_items and judgment_items
  await knex.schema.alterTable("priority_items", (table) => {
    table.uuid("user_id").nullable().alter();
  });

  await knex.schema.alterTable("judgment_items", (table) => {
    table.uuid("user_id").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Revert nullable change (make not nullable)
  await knex.schema.alterTable("priority_items", (table) => {
    table.uuid("user_id").notNullable().alter();
  });

  await knex.schema.alterTable("judgment_items", (table) => {
    table.uuid("user_id").notNullable().alter();
  });
}
