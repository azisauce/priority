import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("item_priority_judgment_items", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("item_id").notNullable().references("id").inTable("items").onDelete("CASCADE");
    table.uuid("priority_item_id").notNullable().references("id").inTable("priority_items").onDelete("CASCADE");
    table.uuid("judgment_item_id").notNullable().references("id").inTable("judgment_items").onDelete("CASCADE");
    table.timestamps(true, true);
    table.unique(["item_id", "priority_item_id"]);
  });

  await knex.schema.alterTable("item_priority_judgment_items", (table) => {
    table.index("item_id");
    table.index("priority_item_id");
    table.index("judgment_item_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("item_priority_judgment_items");
}
