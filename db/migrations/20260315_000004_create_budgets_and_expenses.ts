import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("budgets", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("category", 100).notNullable();
    table.date("month").notNullable();
    table.decimal("allocated_amount", 12, 2).notNullable();
    table.boolean("rollover").notNullable().defaultTo(false);
    table.decimal("rolled_over_amount", 12, 2).notNullable().defaultTo(0);
    table.timestamps(true, true);

    table.unique(["user_id", "category", "month"]);
    table.index("user_id");
    table.index("month");
  });

  await knex.raw(`
    ALTER TABLE budgets
    ADD CONSTRAINT budgets_month_first_day
    CHECK (EXTRACT(DAY FROM month) = 1)
  `);

  await knex.schema.createTable("expenses", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.uuid("budget_id").references("id").inTable("budgets").onDelete("SET NULL");
    table.decimal("amount", 12, 2).notNullable();
    table.text("note");
    table.date("date").notNullable();
    table.timestamps(true, true);

    table.index("user_id");
    table.index("budget_id");
    table.index("date");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("expenses");
  await knex.schema.dropTableIfExists("budgets");
}
