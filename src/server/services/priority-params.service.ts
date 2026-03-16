/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  createPriorityParam,
  createPriorityParamEvalItemAssignment,
  deletePriorityParamById,
  deletePriorityParamEvalItemAssignment,
  findEvalItemById,
  findPriorityParamById,
  findPriorityParamByNameAndUser,
  findPriorityParamByNameAndUserExcludingId,
  findPriorityParamEvalItemAssignment,
  getGroupCountForPriorityParam,
  getGroupCountForPriorityParamAndUser,
  getGroupsForPriorityParam,
  getMaxPriorityParamEvalItemOrder,
  getPriorityParamAssignedEvalItems,
  getPriorityParamEvalItems,
  getPriorityParamEvalItemsFilteredByUser,
  getPriorityParamsForUserAndGeneric,
  updatePriorityParamById,
} from "@/server/repositories/priority-params.repository";

type ServiceResult<T> = {
  status: number;
  body: T;
};

function mapEvalItemWithJunction(item: any) {
  return {
    id: item.junction_id,
    paramEvalItem: {
      id: item.id,
      name: item.name,
      description: item.description,
      value: item.value,
      userId: item.user_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    },
  };
}

export async function getPriorityParamsForUser(
  userId: string
): Promise<ServiceResult<{ params: any[] }>> {
  const params = await getPriorityParamsForUserAndGeneric(userId);

  const paramsWithDetails = await Promise.all(
    params.map(async (param) => {
      const evalItems = await getPriorityParamEvalItemsFilteredByUser(param.id, userId);
      const groupCount = await getGroupCountForPriorityParamAndUser(param.id, userId);

      return {
        id: param.id,
        name: param.name,
        description: param.description,
        weight: param.weight,
        userId: param.user_id,
        createdAt: param.created_at,
        updatedAt: param.updated_at,
        evalItems: evalItems.map(mapEvalItemWithJunction),
        _count: { groups: parseInt((groupCount?.count as string) || "0") },
      };
    })
  );

  return {
    status: 200,
    body: { params: paramsWithDetails },
  };
}

export async function createPriorityParamForUser(
  userId: string,
  data: { name: string; description?: string | null; weight: number }
): Promise<ServiceResult<{ error: string } | { param: any }>> {
  const existing = await findPriorityParamByNameAndUser(data.name, userId);

  if (existing) {
    return {
      status: 409,
      body: { error: "Parameter name already exists" },
    };
  }

  const param = await createPriorityParam({
    name: data.name,
    description: data.description || null,
    weight: data.weight,
    user_id: userId,
  });

  return {
    status: 201,
    body: {
      param: {
        id: param.id,
        name: param.name,
        description: param.description,
        weight: param.weight,
        userId: param.user_id,
        createdAt: param.created_at,
        updatedAt: param.updated_at,
        evalItems: [],
        _count: { groups: 0 },
      },
    },
  };
}

export async function getPriorityParamForUserById(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { param: any }>> {
  const param = await findPriorityParamById(id);

  if (!param) {
    return { status: 404, body: { error: "Parameter not found" } };
  }

  if (param.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const evalItems = await getPriorityParamEvalItems(id);
  const groups = await getGroupsForPriorityParam(id);

  return {
    status: 200,
    body: {
      param: {
        id: param.id,
        name: param.name,
        description: param.description,
        weight: param.weight,
        userId: param.user_id,
        createdAt: param.created_at,
        updatedAt: param.updated_at,
        evalItems: evalItems.map(mapEvalItemWithJunction),
        groups: groups.map((group) => ({
          id: group.junction_id,
          group: {
            id: group.id,
            groupName: group.name,
            description: group.description,
            userId: group.user_id,
            createdAt: group.created_at,
            updatedAt: group.updated_at,
          },
        })),
      },
    },
  };
}

export async function updatePriorityParamForUser(
  userId: string,
  id: string,
  data: { name?: string; description?: string; weight?: number }
): Promise<ServiceResult<{ error: string } | { param: any }>> {
  const param = await findPriorityParamById(id);

  if (!param) {
    return { status: 404, body: { error: "Parameter not found" } };
  }

  if (param.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  if (data.name && data.name !== param.name) {
    const existing = await findPriorityParamByNameAndUserExcludingId(data.name, userId, id);
    if (existing) {
      return {
        status: 409,
        body: { error: "Parameter name already exists" },
      };
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.weight !== undefined) updateData.weight = data.weight;

  const updated = await updatePriorityParamById(id, updateData);

  const evalItems = await getPriorityParamEvalItems(id);
  const groupCount = await getGroupCountForPriorityParam(id);

  return {
    status: 200,
    body: {
      param: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        weight: updated.weight,
        userId: updated.user_id,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
        evalItems: evalItems.map(mapEvalItemWithJunction),
        _count: { groups: parseInt((groupCount?.count as string) || "0") },
      },
    },
  };
}

export async function deletePriorityParamForUser(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { message: string }>> {
  const param = await findPriorityParamById(id);

  if (!param) {
    return { status: 404, body: { error: "Parameter not found" } };
  }

  if (param.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  await deletePriorityParamById(id);

  return {
    status: 200,
    body: { message: "Parameter deleted" },
  };
}

export async function getPriorityParamEvalItemsForUser(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { evalItems: any[] }>> {
  const param = await findPriorityParamById(id);

  if (!param) {
    return { status: 404, body: { error: "Parameter not found" } };
  }

  if (param.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const evalItems = await getPriorityParamAssignedEvalItems(id);

  return {
    status: 200,
    body: {
      evalItems: evalItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        value: item.value,
        userId: item.user_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
    },
  };
}

export async function assignEvalItemToPriorityParam(
  userId: string,
  id: string,
  paramEvalItemId: string
): Promise<ServiceResult<{ error: string } | { message: string }>> {
  const param = await findPriorityParamById(id);

  if (!param) {
    return { status: 404, body: { error: "Parameter not found" } };
  }

  if (param.user_id !== userId) {
    return {
      status: 403,
      body: { error: "Forbidden - can only modify your own parameters" },
    };
  }

  const evalItem = await findEvalItemById(paramEvalItemId);

  if (!evalItem) {
    return { status: 404, body: { error: "Eval item not found" } };
  }

  if (evalItem.user_id !== null && evalItem.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const existing = await findPriorityParamEvalItemAssignment(id, paramEvalItemId);
  if (existing) {
    return { status: 409, body: { error: "Already assigned" } };
  }

  const maxOrder = await getMaxPriorityParamEvalItemOrder(id);
  const newOrder = (maxOrder?.max || 0) + 1;

  await createPriorityParamEvalItemAssignment({
    priority_item_id: id,
    judgment_item_id: paramEvalItemId,
    order: newOrder,
  });

  return {
    status: 201,
    body: { message: "Eval item assigned" },
  };
}

export async function unassignEvalItemFromPriorityParam(
  userId: string,
  id: string,
  paramEvalItemId: string
): Promise<ServiceResult<{ error: string } | { message: string }>> {
  const param = await findPriorityParamById(id);

  if (!param) {
    return { status: 404, body: { error: "Parameter not found" } };
  }

  if (param.user_id !== userId) {
    return {
      status: 403,
      body: { error: "Forbidden - can only modify your own parameters" },
    };
  }

  const deleted = await deletePriorityParamEvalItemAssignment(id, paramEvalItemId);

  if (deleted === 0) {
    return { status: 404, body: { error: "Assignment not found" } };
  }

  return {
    status: 200,
    body: { message: "Eval item unassigned" },
  };
}
