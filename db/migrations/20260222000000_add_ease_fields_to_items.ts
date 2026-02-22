import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("items", (table) => {
    table.boolean("enabled_ease_option").notNullable().defaultTo(false);
    table.decimal("price_with_interest", 10, 2);
    table.decimal("interest_percentage", 5, 2).notNullable().defaultTo(0);
    table.integer("ease_period").notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("items", (table) => {
    table.dropColumn("enabled_ease_option");
    table.dropColumn("price_with_interest");
    table.dropColumn("interest_percentage");
    table.dropColumn("ease_period");
  });
}
