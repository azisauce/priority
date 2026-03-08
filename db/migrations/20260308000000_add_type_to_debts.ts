import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // Alter table debts: add column `type`, rename column `lender_name` to `counterparty`
    await knex.schema.alterTable("debts", (table) => {
        table.enu("type", ["debt", "asset"], { useNative: true, enumName: "financial_obligation_type" }).notNullable().defaultTo("debt");
        table.renameColumn("lender_name", "counterparty");
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("debts", (table) => {
        table.renameColumn("counterparty", "lender_name");
        table.dropColumn("type");
    });
    await knex.raw("DROP TYPE IF EXISTS financial_obligation_type");
}
