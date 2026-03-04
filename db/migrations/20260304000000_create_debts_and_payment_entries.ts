import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create debts table
  await knex.schema.createTable("debts", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("name", 200).notNullable();
    table.text("purpose");
    table.decimal("total_amount", 12, 2).notNullable();
    table.decimal("remaining_balance", 12, 2).notNullable();
    table.string("lender_name", 200).notNullable();
    table.date("start_date").notNullable();
    table.date("deadline");
    table
      .enu("status", ["active", "paid", "overdue"], {
        useNative: true,
        enumName: "debt_status",
      })
      .notNullable()
      .defaultTo("active");
    table
      .enu("payment_period", ["weekly", "monthly", "custom"], {
        useNative: true,
        enumName: "payment_period",
      })
      .notNullable()
      .defaultTo("monthly");
    table.decimal("fixed_installment_amount", 12, 2);
    table.text("notes");
    table.timestamps(true, true);
  });

  // Create payment_entries table
  await knex.schema.createTable("payment_entries", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("debt_id")
      .notNullable()
      .references("id")
      .inTable("debts")
      .onDelete("CASCADE");
    table.decimal("amount", 12, 2).notNullable();
    table.date("payment_date").notNullable();
    table
      .enu("status", ["scheduled", "paid", "missed"], {
        useNative: true,
        enumName: "payment_entry_status",
      })
      .notNullable()
      .defaultTo("scheduled");
    table.text("note");
    table.timestamps(true, true);
  });

  // Create indexes
  await knex.schema.alterTable("debts", (table) => {
    table.index("user_id");
    table.index("status");
  });

  await knex.schema.alterTable("payment_entries", (table) => {
    table.index("debt_id");
    table.index("status");
    table.index("payment_date");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("payment_entries");
  await knex.schema.dropTableIfExists("debts");
  // Drop the enum types
  await knex.raw("DROP TYPE IF EXISTS payment_entry_status");
  await knex.raw("DROP TYPE IF EXISTS payment_period");
  await knex.raw("DROP TYPE IF EXISTS debt_status");
}
