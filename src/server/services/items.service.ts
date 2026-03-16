/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  createItem,
  createItemParamAnswers,
  deleteItemById,
  findGroupById,
  findItemById,
  getEvalItemsByIdsForUser,
  getItemParamRows,
  getItemsWithGroupsForUser,
  getItemWithGroupById,
  getPriorityParamsByIdsForUser,
  replaceItemParamAnswers,
  updateItemById,
} from "@/server/repositories/items.repository";

type ServiceResult<T> = {
  status: number;
  body: T;
};

type ItemAnswerInput = {
  priorityParamId: string;
  paramEvalItemId: string;
};

function mapParamAnswerRows(rows: any[]) {
  return rows.map((row: any) => ({
    priorityParam: {
      id: row.priority_id,
      name: row.priority_name,
      description: row.priority_description,
      weight: Number(row.priority_weight),
      userId: row.priority_user_id,
      createdAt: row.priority_created_at,
      updatedAt: row.priority_updated_at,
    },
    paramEvalItem: {
      id: row.eval_id,
      name: row.eval_name,
      description: row.eval_description,
      value: Number(row.eval_value),
      userId: row.eval_user_id,
      createdAt: row.eval_created_at,
      updatedAt: row.eval_updated_at,
    },
  }));
}

function computePriorityAndValue(
  answers: ItemAnswerInput[],
  params: any[],
  evalItems: any[]
) {
  const paramsById: Record<string, number> = {};
  for (const param of params) paramsById[param.id] = Number(param.weight || 0);

  const evalById: Record<string, number> = {};
  for (const evalItem of evalItems) evalById[evalItem.id] = Number(evalItem.value || 0);

  let totalWeight = 0;
  let weightedSum = 0;
  let simpleSum = 0;
  let count = 0;

  for (const answer of answers) {
    const weight = paramsById[answer.priorityParamId] ?? 0;
    const value = evalById[answer.paramEvalItemId] ?? 0;
    if (weight > 0) {
      totalWeight += weight;
      weightedSum += value * weight;
    }
    simpleSum += value;
    count += 1;
  }

  let computedPriority;
  if (totalWeight > 0) {
    computedPriority = Math.round((weightedSum / totalWeight) * 100) / 100;
  } else {
    computedPriority = count > 0 ? Math.round((simpleSum / count) * 100) / 100 : 0;
  }

  const computedValue = count > 0 ? Math.round((simpleSum / count) * 100) / 100 : 0;

  return {
    computedPriority,
    computedValue,
  };
}

function mapParamAnswersFromInput(answers: ItemAnswerInput[], params: any[], evalItems: any[]) {
  return answers.map((answer) => {
    const param = params.find((row) => row.id === answer.priorityParamId) as any;
    const evalItem = evalItems.find((row) => row.id === answer.paramEvalItemId) as any;

    return {
      priorityParam: param
        ? {
            id: param.id,
            name: param.name,
            description: param.description,
            weight: Number(param.weight),
            userId: param.user_id,
            createdAt: param.created_at,
            updatedAt: param.updated_at,
          }
        : { id: answer.priorityParamId },
      paramEvalItem: evalItem
        ? {
            id: evalItem.id,
            name: evalItem.name,
            description: evalItem.description,
            value: Number(evalItem.value),
            userId: evalItem.user_id,
            createdAt: evalItem.created_at,
            updatedAt: evalItem.updated_at,
          }
        : { id: answer.paramEvalItemId },
    };
  });
}

export async function getItemsForUser(
  userId: string,
  filters: {
    groupId?: string | null;
    showDone: string;
    minPriority?: string | null;
    maxPriority?: string | null;
    minPrice?: string | null;
    maxPrice?: string | null;
    sortBy: string;
    sortOrder: string;
  }
): Promise<ServiceResult<{ items: any[] }>> {
  const items = await getItemsWithGroupsForUser({
    userId,
    groupId: filters.groupId,
    showDone: filters.showDone,
    minPriority: filters.minPriority,
    maxPriority: filters.maxPriority,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const formattedItems = await Promise.all(
    items.map(async (item: any) => {
      const paramRows = await getItemParamRows(item.id, userId);
      const paramAnswers = mapParamAnswerRows(paramRows);

      return {
        id: item.id,
        itemName: item.name,
        description: item.description,
        pricing: Number(item.price),
        enabledEaseOption: Boolean(item.enabled_ease_option),
        priceWithInterest:
          item.price_with_interest !== null && item.price_with_interest !== undefined
            ? Number(item.price_with_interest)
            : null,
        interestPercentage: Number(item.interest_percentage),
        easePeriod: Number(item.ease_period),
        isDone: Boolean(item.is_done),
        priority: Number(item.priority),
        value: Number(item.value),
        userId: item.user_id,
        groupId: item.group_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        group: {
          id: item.group_id,
          groupName: item.group_name,
          description: item.group_description,
          userId: item.group_user_id,
        },
        paramAnswers,
      };
    })
  );

  return {
    status: 200,
    body: { items: formattedItems },
  };
}

export async function createItemForUser(
  userId: string,
  data: {
    itemName: string;
    description?: string | null;
    groupId: string;
    pricing: number;
    enabledEaseOption?: boolean | null;
    easePeriod?: number | null;
    interestPercentage?: number | null;
    priceWithInterest?: number | null;
    priority?: number;
    value?: number;
    answers?: ItemAnswerInput[];
  }
): Promise<ServiceResult<{ error: string } | { item: any }>> {
  const { itemName, description, groupId, pricing, priority = 0, value = 0 } = data;

  let computedPriority = priority;
  let computedValue = value;
  let params: any[] = [];
  let evalItems: any[] = [];

  if (data.answers && data.answers.length > 0) {
    const answers = data.answers;
    const priorityParamIds = answers.map((answer) => answer.priorityParamId);
    const evalItemIds = answers.map((answer) => answer.paramEvalItemId);

    params = await getPriorityParamsByIdsForUser(priorityParamIds, userId);
    evalItems = await getEvalItemsByIdsForUser(evalItemIds, userId);

    const computed = computePriorityAndValue(answers, params, evalItems);
    computedPriority = computed.computedPriority;
    computedValue = computed.computedValue;
  }

  const group = await findGroupById(groupId);
  if (!group || group.user_id !== userId) {
    return {
      status: 400,
      body: { error: "Group not found or not owned by user" },
    };
  }

  const item = await createItem({
    name: itemName,
    description: description || null,
    group_id: groupId,
    price: pricing,
    enabled_ease_option: data.enabledEaseOption ?? false,
    price_with_interest: data.priceWithInterest ?? null,
    interest_percentage: data.interestPercentage ?? 0,
    ease_period: data.easePeriod ?? 0,
    priority: computedPriority,
    value: computedValue,
    user_id: userId,
  });

  let paramAnswers: any[] = [];

  if (data.answers && data.answers.length > 0) {
    await createItemParamAnswers(item.id, data.answers);
    paramAnswers = mapParamAnswersFromInput(data.answers, params, evalItems);
  }

  return {
    status: 201,
    body: {
      item: {
        id: item.id,
        itemName: item.name,
        description: item?.description,
        pricing: Number(item.price),
        priority: Number(item.priority),
        value: Number(item.value),
        userId: item.user_id,
        groupId: item.group_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        group: {
          id: group.id,
          groupName: group.name,
          description: group.description,
          userId: group.user_id,
        },
        paramAnswers,
      },
    },
  };
}

export async function getItemForUserById(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { item: any }>> {
  const item = await getItemWithGroupById(id);

  if (!item) {
    return { status: 404, body: { error: "Item not found" } };
  }

  if (item.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const paramRows = await getItemParamRows(item.id, userId);
  const paramAnswers = mapParamAnswerRows(paramRows);

  return {
    status: 200,
    body: {
      item: {
        id: item.id,
        itemName: item.name,
        description: item.description,
        pricing: Number(item.price),
        enabledEaseOption: Boolean(item.enabled_ease_option),
        priceWithInterest:
          item.price_with_interest !== null && item.price_with_interest !== undefined
            ? Number(item.price_with_interest)
            : null,
        interestPercentage: Number(item.interest_percentage),
        easePeriod: Number(item.ease_period),
        priority: Number(item.priority),
        value: Number(item.value),
        isDone: Boolean(item.is_done),
        userId: item.user_id,
        groupId: item.group_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        group: {
          id: item.group_id,
          groupName: item.group_name,
          description: item.group_description,
          userId: item.group_user_id,
        },
        paramAnswers,
      },
    },
  };
}

export async function updateItemForUser(
  userId: string,
  id: string,
  data: {
    itemName?: string;
    description?: string | null;
    groupId?: string;
    pricing?: number;
    enabledEaseOption?: boolean;
    easePeriod?: number | null;
    interestPercentage?: number | null;
    priceWithInterest?: number | null;
    priority?: number;
    value?: number;
    isDone?: boolean;
    is_done?: boolean;
    answers?: ItemAnswerInput[];
  }
): Promise<ServiceResult<{ error: string } | { item: any }>> {
  const item = await findItemById(id);

  if (!item) {
    return { status: 404, body: { error: "Item not found" } };
  }

  if (item.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const { itemName, description, groupId, pricing, priority, value } = data;
  const isDonePayload = data.isDone !== undefined ? data.isDone : data.is_done;

  if (groupId && groupId !== item.group_id) {
    const group = await findGroupById(groupId);
    if (!group || group.user_id !== userId) {
      return {
        status: 400,
        body: { error: "Group not found or not owned by user" },
      };
    }
  }

  let computedPriority = priority;
  let computedValue = value;
  let paramAnswers: any[] = [];
  let params: any[] = [];
  let evalItems: any[] = [];

  if (data.answers && data.answers.length > 0) {
    const answers = data.answers;
    const priorityParamIds = answers.map((answer) => answer.priorityParamId);
    const evalItemIds = answers.map((answer) => answer.paramEvalItemId);

    params = await getPriorityParamsByIdsForUser(priorityParamIds, userId);
    evalItems = await getEvalItemsByIdsForUser(evalItemIds, userId);

    const computed = computePriorityAndValue(answers, params, evalItems);
    computedPriority = computed.computedPriority;
    computedValue = computed.computedValue;

    await replaceItemParamAnswers(id, answers);

    paramAnswers = mapParamAnswersFromInput(answers, params, evalItems);
  }

  const updateData: Record<string, unknown> = {};
  if (itemName !== undefined) updateData.name = itemName;
  if (description !== undefined) updateData.description = description;
  if (groupId !== undefined) updateData.group_id = groupId;
  if (pricing !== undefined) updateData.price = pricing;
  if (data.enabledEaseOption !== undefined) {
    updateData.enabled_ease_option = Boolean(data.enabledEaseOption);
  }
  if (data.priceWithInterest !== undefined) updateData.price_with_interest = data.priceWithInterest;
  if (data.interestPercentage !== undefined) updateData.interest_percentage = data.interestPercentage;
  if (data.easePeriod !== undefined) updateData.ease_period = data.easePeriod;
  if (computedPriority !== undefined) updateData.priority = computedPriority;
  if (computedValue !== undefined) updateData.value = computedValue;
  if (isDonePayload !== undefined) updateData.is_done = Boolean(isDonePayload);

  const updated = await updateItemById(id, updateData);
  const group = await findGroupById(updated.group_id);

  return {
    status: 200,
    body: {
      item: {
        id: updated.id,
        itemName: updated.name,
        description: updated.description,
        pricing: Number(updated.price),
        priority: Number(updated.priority),
        isDone: Boolean(updated.is_done),
        value: Number(updated.value),
        userId: updated.user_id,
        groupId: updated.group_id,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
        group: {
          id: group?.id,
          groupName: group?.name,
          description: group?.description,
          userId: group?.user_id,
        },
        paramAnswers,
      },
    },
  };
}

export async function deleteItemForUser(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { message: string }>> {
  const item = await findItemById(id);

  if (!item) {
    return { status: 404, body: { error: "Item not found" } };
  }

  if (item.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  await deleteItemById(id);

  return {
    status: 200,
    body: { message: "Item deleted" },
  };
}
