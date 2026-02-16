import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create users table
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("username", 50).notNullable().unique();
    table.string("password", 255).notNullable();
    table.string("image_url", 500);
    table.timestamps(true, true);
  });

  // Create groups table
  await knex.schema.createTable("groups", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("name", 100).notNullable();
    table.text("description");
    table.timestamps(true, true);
  });

  // Create priority_items table
  await knex.schema.createTable("priority_items", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("name", 100).notNullable();
    table.text("description");
    table.integer("weight").notNullable().checkBetween([1, 10]);
    table.timestamps(true, true);
  });

  // Create judgment_items table
  await knex.schema.createTable("judgment_items", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("name", 100).notNullable();
    table.text("description");
    table.integer("value").notNullable().checkBetween([1, 5]);
    table.timestamps(true, true);
  });

  // Create items table
  await knex.schema.createTable("items", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("name", 200).notNullable();
    table.text("description");
    table.uuid("group_id").notNullable().references("id").inTable("groups").onDelete("CASCADE");
    table.decimal("price", 10, 2).notNullable();
    table.decimal("priority", 10, 2);
    table.decimal("value", 10, 2);
    table.timestamps(true, true);
  });

  // Create group_priority_items junction table
  await knex.schema.createTable("group_priority_items", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.integer("order").notNullable();
    table.uuid("group_id").notNullable().references("id").inTable("groups").onDelete("CASCADE");
    table.uuid("priority_item_id").notNullable().references("id").inTable("priority_items").onDelete("CASCADE");
    table.timestamps(true, true);
    table.unique(["group_id", "priority_item_id"]);
  });

  // Create priority_item_judgment_items junction table
  await knex.schema.createTable("priority_item_judgment_items", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.integer("order").notNullable();
    table.uuid("priority_item_id").notNullable().references("id").inTable("priority_items").onDelete("CASCADE");
    table.uuid("judgment_item_id").notNullable().references("id").inTable("judgment_items").onDelete("CASCADE");
    table.timestamps(true, true);
    table.unique(["priority_item_id", "judgment_item_id"]);
  });

  // Create indexes for better query performance
  await knex.schema.alterTable("groups", (table) => {
    table.index("user_id");
  });

  await knex.schema.alterTable("priority_items", (table) => {
    table.index("user_id");
  });

  await knex.schema.alterTable("judgment_items", (table) => {
    table.index("user_id");
  });

  await knex.schema.alterTable("items", (table) => {
    table.index("user_id");
    table.index("group_id");
  });

  await knex.schema.alterTable("group_priority_items", (table) => {
    table.index("group_id");
    table.index("priority_item_id");
  });

  await knex.schema.alterTable("priority_item_judgment_items", (table) => {
    table.index("priority_item_id");
    table.index("judgment_item_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("priority_item_judgment_items");
  await knex.schema.dropTableIfExists("group_priority_items");
  await knex.schema.dropTableIfExists("items");
  await knex.schema.dropTableIfExists("judgment_items");
  await knex.schema.dropTableIfExists("priority_items");
  await knex.schema.dropTableIfExists("groups");
  await knex.schema.dropTableIfExists("users");
}
