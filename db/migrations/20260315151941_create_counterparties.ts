import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // 1. Create counterparties table
    await knex.schema.createTable("counterparties", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.string("name", 200).notNullable();
        table.timestamps(true, true);
        // User cannot have duplicate counterparties by name
        table.unique(["user_id", "name"]);
    });

    // 2. Add counterparty_id to debts
    await knex.schema.alterTable("debts", (table) => {
        table.uuid("counterparty_id").references("id").inTable("counterparties").onDelete("CASCADE");
    });

    // 3. Migrate data
    // Get all unique combinations of user_id and counterparty string from debts
    const uniqueCounterparties = await knex("debts").distinct("user_id", "counterparty");

    // Insert them into counterparties
    for (const cp of uniqueCounterparties) {
        if (cp.user_id && cp.counterparty) {
            // Handle case where duplicate might somehow be there, though distinct should prevent it
            const existing = await knex("counterparties").where({ user_id: cp.user_id, name: cp.counterparty }).first();
            if (!existing) {
                await knex("counterparties").insert({
                    user_id: cp.user_id,
                    name: cp.counterparty,
                    created_at: knex.fn.now(),
                    updated_at: knex.fn.now()
                });
            }
        }
    }

    // 4. Update debts with the new counterparty_id
    const counterparties = await knex("counterparties").select("id", "name", "user_id");
    for (const cp of counterparties) {
        await knex("debts")
            .where({ user_id: cp.user_id, counterparty: cp.name })
            .update({ counterparty_id: cp.id });
    }

    // 5. Make counterparty_id not nullable and drop the old column
    await knex.schema.alterTable("debts", (table) => {
        // Postgres might need us to drop the constraint or alter it.
        // Easiest is to alter column in another block
    });

    // Using raw to alter column because of knex limitations with alter()
    await knex.raw('ALTER TABLE debts ALTER COLUMN counterparty_id SET NOT NULL');

    await knex.schema.alterTable("debts", (table) => {
        table.dropColumn("counterparty");
    });
}

export async function down(knex: Knex): Promise<void> {
    // 1. Add back counterparty column
    await knex.schema.alterTable("debts", (table) => {
        table.string("counterparty", 200);
    });

    // 2. Migrate data back
    const counterparties = await knex("counterparties").select("id", "name");
    for (const cp of counterparties) {
        await knex("debts")
            .where({ counterparty_id: cp.id })
            .update({ counterparty: cp.name });
    }

    // 3. Make counterparty not nullable
    await knex.raw('ALTER TABLE debts ALTER COLUMN counterparty SET NOT NULL');

    // 4. Drop counterparty_id and counterparties table
    await knex.schema.alterTable("debts", (table) => {
        table.dropColumn("counterparty_id");
    });

    await knex.schema.dropTableIfExists("counterparties");
}
