import type { Knex } from "knex";
import bcrypt from "bcryptjs";

export async function seed(knex: Knex): Promise<void> {
  // Seeds will create priority params and judgment options without attaching to a specific user

  // Define priority parameters and their judgment options
  const params = [
    {
      name: "Urgency",
      description: "How soon does this need to be done?",
      weight: 5,
      options: [
        { label: "Not urgent", value: 1 },
        { label: "Can wait", value: 2 },
        { label: "Should be done soon", value: 3 },
        { label: "Important", value: 4 },
        { label: "Needs immediate action", value: 5 },
      ],
    },
    {
      name: "Impact / Value",
      description: "How much value does this task bring?",
      weight: 5,
      options: [
        { label: "Very low value", value: 1 },
        { label: "Low value", value: 2 },
        { label: "Moderate value", value: 3 },
        { label: "High value", value: 4 },
        { label: "Game-changing", value: 5 },
      ],
    },
    {
      name: "Frequency of Need",
      description: "How often does this task need to be done?",
      weight: 5,
      options: [
        { label: "Rarely", value: 1 },
        { label: "Occasionally", value: 2 },
        { label: "Regularly", value: 3 },
        { label: "Frequently", value: 4 },
        { label: "Constantly", value: 5 },
      ],
    },
    {
      name: "Strategic Importance",
      description: "How strategic is this task to overall goals?",
      weight: 5,
      options: [
        { label: "Not aligned", value: 1 },
        { label: "Slightly aligned", value: 2 },
        { label: "Moderately aligned", value: 3 },
        { label: "Strongly aligned", value: 4 },
        { label: "Critical to strategy", value: 5 },
      ],
    },
  ];

  for (const param of params) {
    // insert priority param (no user_id)
    const [insertedParam] = await knex("priority_items")
      .insert({
        name: param.name,
        description: param.description,
        weight: param.weight,
      })
      .returning("*");

    const priorityItemId = insertedParam.id;

    // insert judgment items and junction rows
    for (let i = 0; i < param.options.length; i++) {
      const opt = param.options[i];
      const [insertedEval] = await knex("judgment_items")
        .insert({
          name: opt.label,
          description: `Value: ${opt.value}`,
          value: opt.value,
        })
        .returning("*");

      await knex("priority_item_judgment_items").insert({
        priority_item_id: priorityItemId,
        judgment_item_id: insertedEval.id,
        order: i + 1,
      });
    }
  }
}
