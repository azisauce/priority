import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // This migration:
  // - ensures pgcrypto is available
  // - adds a new uuid column `new_id` to `users`
  // - for each table that references users.user_id, adds a temporary `new_user_id` uuid column
  // - populates new_user_id by mapping the current user_id to the corresponding users.new_id
  // - swaps columns so that all references point to uuid values
  // IMPORTANT: Back up your DB before running this migration.

  await knex.raw(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  // Add a new uuid column to users
  await knex.schema.alterTable("users", (table) => {
    table.uuid("new_id").defaultTo(knex.raw("gen_random_uuid()"));
  });

  // Tables that have user_id foreign keys
  const userRefTables = ["groups", "priority_items", "judgment_items", "items"];

  for (const t of userRefTables) {
    // add temporary column
    await knex.schema.alterTable(t, (table) => {
      table.uuid("new_user_id");
    });

    // populate temporary column by joining on users.id (compare text form to be safe)
    // Use raw SQL for the update
    await knex.raw(`
      UPDATE ${t}
      SET new_user_id = u.new_id
      FROM users u
      WHERE ${t}.user_id::text = u.id::text
    `);
  }

  // Now swap the user_id columns for each referencing table
  for (const t of userRefTables) {
    // drop FK constraints referencing users(id) if any - attempt best-effort
    // Find and drop constraints dynamically
    const fks = await knex.raw(
      `SELECT conname
         FROM pg_constraint
         WHERE contype = 'f'
           AND conrelid = '${t}'::regclass
           AND confrelid = 'users'::regclass;`
    );

    for (const row of fks.rows || []) {
      await knex.raw(`ALTER TABLE ${t} DROP CONSTRAINT IF EXISTS "${row.conname}";`);
    }

    // drop old user_id column
    await knex.schema.alterTable(t, (table) => {
      table.dropColumn("user_id");
    });

    // rename new_user_id -> user_id
    await knex.schema.alterTable(t, (table) => {
      table.uuid("user_id").notNullable().defaultTo(knex.raw("'00000000-0000-0000-0000-000000000000'"));
    });

    // set values from new_user_id
    await knex.raw(`
      UPDATE ${t}
      SET user_id = new_user_id
    `);

    // drop helper column new_user_id
    await knex.schema.alterTable(t, (table) => {
      table.dropColumn("new_user_id");
    });
  }

  // Replace users.id with uuid new_id
  // Drop dependent constraints on users table primary key
  const userPks = await knex.raw(
    `SELECT conname FROM pg_constraint WHERE contype = 'p' AND conrelid = 'users'::regclass;`
  );
  for (const row of userPks.rows || []) {
    await knex.raw(`ALTER TABLE users DROP CONSTRAINT IF EXISTS "${row.conname}";`);
  }

  // rename old id -> old_id
  await knex.schema.alterTable("users", (table) => {
    table.renameColumn("id", "old_id");
  });

  // rename new_id -> id
  await knex.schema.alterTable("users", (table) => {
    table.renameColumn("new_id", "id");
  });

  // ensure id is not nullable and set primary key
  await knex.schema.alterTable("users", (table) => {
    table.uuid("id").notNullable().alter();
  });

  await knex.raw(`ALTER TABLE users ADD PRIMARY KEY (id);`);

  // Recreate foreign keys from referencing tables to users(id)
  await knex.raw(`ALTER TABLE groups ADD CONSTRAINT groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;`);
  await knex.raw(`ALTER TABLE priority_items ADD CONSTRAINT priority_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;`);
  await knex.raw(`ALTER TABLE judgment_items ADD CONSTRAINT judgment_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;`);
  await knex.raw(`ALTER TABLE items ADD CONSTRAINT items_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;`);

  // Optionally, you may want to drop the old_id column after manual verification
}

export async function down(knex: Knex): Promise<void> {
  const userRefTables = ["groups", "priority_items", "judgment_items", "items"];

  // Drop recreated FK constraints
  await knex.raw(`ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_user_id_fkey;`);
  await knex.raw(`ALTER TABLE priority_items DROP CONSTRAINT IF EXISTS priority_items_user_id_fkey;`);
  await knex.raw(`ALTER TABLE judgment_items DROP CONSTRAINT IF EXISTS judgment_items_user_id_fkey;`);
  await knex.raw(`ALTER TABLE items DROP CONSTRAINT IF EXISTS items_user_id_fkey;`);

  // Restore users.id: rename uuid id -> new_id, rename old_id -> id
  await knex.raw(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;`);
  await knex.schema.alterTable("users", (table) => {
    table.renameColumn("id", "new_id");
    table.renameColumn("old_id", "id");
  });
  await knex.raw(`ALTER TABLE users ADD PRIMARY KEY (id);`);

  // For each referencing table, restore integer user_id from users.old_id mapping
  for (const t of userRefTables) {
  await knex.schema.alterTable(t, (table) => {
    table.integer("old_user_id");
  });

  await knex.raw(`
    UPDATE ${t}
    SET old_user_id = u.old_id
    FROM users u
    WHERE ${t}.user_id::text = u.id::text
  `);

  await knex.schema.alterTable(t, (table) => {
    table.dropColumn("user_id");
  });
  await knex.schema.alterTable(t, (table) => {
    table.integer("user_id");
  });
  await knex.raw(`UPDATE ${t} SET user_id = old_user_id`);
  await knex.schema.alterTable(t, (table) => {
    table.dropColumn("old_user_id");
  });

  await knex.raw(`
    ALTER TABLE ${t} ADD CONSTRAINT ${t}_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  `);
}

  // Drop uuid helper column from users
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("new_id");
  });
}
