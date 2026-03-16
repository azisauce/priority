import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("counterparties", (table) => {
    table
      .enu("type", ["person", "bank", "company"], {
        useNative: true,
        enumName: "counterparty_type",
      })
      .notNullable()
      .defaultTo("person");
  });

  await knex.schema.alterTable("debts", (table) => {
    table
      .enu("direction", ["i_owe", "they_owe"], {
        useNative: true,
        enumName: "debt_direction",
      })
      .notNullable()
      .defaultTo("i_owe");
  });

  await knex("debts").where({ type: "debt" }).update({ direction: "i_owe" });
  await knex("debts").where({ type: "asset" }).update({ direction: "they_owe" });

  await knex.schema.alterTable("debts", (table) => {
    table.dropColumn("type");
  });

  await knex.raw("DROP TYPE IF EXISTS financial_obligation_type");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("debts", (table) => {
    table
      .enu("type", ["debt", "asset"], {
        useNative: true,
        enumName: "financial_obligation_type",
      })
      .notNullable()
      .defaultTo("debt");
  });

  await knex("debts").where({ direction: "i_owe" }).update({ type: "debt" });
  await knex("debts").where({ direction: "they_owe" }).update({ type: "asset" });

  await knex.schema.alterTable("debts", (table) => {
    table.dropColumn("direction");
  });
  await knex.raw("DROP TYPE IF EXISTS debt_direction");

  await knex.schema.alterTable("counterparties", (table) => {
    table.dropColumn("type");
  });
  await knex.raw("DROP TYPE IF EXISTS counterparty_type");
}
