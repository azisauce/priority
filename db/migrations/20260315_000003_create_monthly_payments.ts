import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("monthly_payments", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("name", 200).notNullable();
    table.string("category", 100);
    table
      .enu("type", ["income", "expense"], {
        useNative: true,
        enumName: "monthly_payment_type",
      })
      .notNullable();
    table.boolean("is_variable").notNullable().defaultTo(false);
    table.decimal("default_amount", 12, 2).notNullable();
    table.integer("day_of_month").checkBetween([1, 31]);
    table.date("start_month").notNullable();
    table.date("end_month");
    table.timestamps(true, true);

    table.index("user_id");
    table.index("type");
  });

  await knex.schema.createTable("monthly_payment_entries", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("monthly_payment_id")
      .notNullable()
      .references("id")
      .inTable("monthly_payments")
      .onDelete("CASCADE");
    table.date("month").notNullable();
    table.decimal("amount", 12, 2).notNullable();
    table.boolean("is_paid").notNullable().defaultTo(false);
    table.timestamp("paid_at", { useTz: true });
    table.timestamps(true, true);

    table.unique(["monthly_payment_id", "month"]);
    table.index("monthly_payment_id");
    table.index("month");
  });

  await knex.raw(`
    ALTER TABLE monthly_payment_entries
    ADD CONSTRAINT monthly_payment_entries_month_first_day
    CHECK (EXTRACT(DAY FROM month) = 1)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("monthly_payment_entries");
  await knex.schema.dropTableIfExists("monthly_payments");

  await knex.raw("DROP TYPE IF EXISTS monthly_payment_type");
}
