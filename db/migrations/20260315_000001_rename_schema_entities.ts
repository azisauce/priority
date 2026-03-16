import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Convert semantics before rename: paid_amount should represent money already paid.
  await knex.raw("UPDATE debts SET remaining_balance = total_amount - remaining_balance");

  await knex.raw("ALTER TABLE priority_items RENAME TO priority_params");
  await knex.raw("ALTER TABLE judgment_items RENAME TO eval_options");
  await knex.raw("ALTER TABLE group_priority_items RENAME TO group_params");
  await knex.raw("ALTER TABLE priority_item_judgment_items RENAME TO param_eval_options");
  await knex.raw("ALTER TABLE item_priority_judgment_items RENAME TO item_evaluations");
  await knex.raw("ALTER TABLE payment_entries RENAME TO debt_payments");

  await knex.raw("ALTER TABLE debts RENAME COLUMN remaining_balance TO paid_amount");
  await knex.raw("ALTER TABLE debts RENAME COLUMN fixed_installment_amount TO installment_amount");

  await knex.raw("ALTER TABLE items RENAME COLUMN enabled_ease_option TO installment_enabled");
  await knex.raw("ALTER TABLE items RENAME COLUMN price_with_interest TO total_price_with_interest");
  await knex.raw("ALTER TABLE items RENAME COLUMN ease_period TO installment_period_months");
}

export async function down(knex: Knex): Promise<void> {
  // Revert semantics before rename back: remaining_balance should represent unpaid amount.
  await knex.raw("UPDATE debts SET paid_amount = total_amount - paid_amount");

  await knex.raw("ALTER TABLE debts RENAME COLUMN paid_amount TO remaining_balance");
  await knex.raw("ALTER TABLE debts RENAME COLUMN installment_amount TO fixed_installment_amount");

  await knex.raw("ALTER TABLE items RENAME COLUMN installment_enabled TO enabled_ease_option");
  await knex.raw("ALTER TABLE items RENAME COLUMN total_price_with_interest TO price_with_interest");
  await knex.raw("ALTER TABLE items RENAME COLUMN installment_period_months TO ease_period");

  await knex.raw("ALTER TABLE debt_payments RENAME TO payment_entries");
  await knex.raw("ALTER TABLE item_evaluations RENAME TO item_priority_judgment_items");
  await knex.raw("ALTER TABLE param_eval_options RENAME TO priority_item_judgment_items");
  await knex.raw("ALTER TABLE group_params RENAME TO group_priority_items");
  await knex.raw("ALTER TABLE eval_options RENAME TO judgment_items");
  await knex.raw("ALTER TABLE priority_params RENAME TO priority_items");
}
