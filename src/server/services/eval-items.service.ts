/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  createEvalItem,
  deleteEvalItemById,
  findEvalItemById,
  getEvalItemsForUserAndGeneric,
  getParamCountForEvalItem,
  updateEvalItemById,
} from "@/server/repositories/eval-items.repository";

type ServiceResult<T> = {
  status: number;
  body: T;
};

function formatEvalItem(item: any, paramCount: number) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    value: item.value,
    userId: item.user_id,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    _count: { params: paramCount },
  };
}

export async function getEvalItems(
  userId: string
): Promise<ServiceResult<{ evalItems: any[] }>> {
  const evalItems = await getEvalItemsForUserAndGeneric(userId);

  const evalItemsWithCounts = await Promise.all(
    evalItems.map(async (item) => {
      const paramCount = await getParamCountForEvalItem(item.id);

      return formatEvalItem(item, parseInt((paramCount?.count as string) || "0"));
    })
  );

  return {
    status: 200,
    body: { evalItems: evalItemsWithCounts },
  };
}

export async function createEvalItemForUser(
  userId: string,
  data: { name: string; description?: string | null; value: number }
): Promise<ServiceResult<{ evalItem: any }>> {
  const evalItem = await createEvalItem({
    name: data.name,
    description: data.description || null,
    value: data.value,
    user_id: userId,
  });

  return {
    status: 201,
    body: { evalItem: formatEvalItem(evalItem, 0) },
  };
}

export async function updateEvalItemForUser(
  userId: string,
  id: string,
  data: { name?: string; description?: string; value?: number }
): Promise<ServiceResult<{ error: string } | { evalItem: any }>> {
  const evalItem = await findEvalItemById(id);
  if (!evalItem) {
    return { status: 404, body: { error: "Eval item not found" } };
  }

  if (evalItem.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.value !== undefined) updateData.value = data.value;

  const updated = await updateEvalItemById(id, updateData);

  const paramCount = await getParamCountForEvalItem(id);

  return {
    status: 200,
    body: { evalItem: formatEvalItem(updated, parseInt((paramCount?.count as string) || "0")) },
  };
}

export async function deleteEvalItemForUser(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { message: string }>> {
  const evalItem = await findEvalItemById(id);
  if (!evalItem) {
    return { status: 404, body: { error: "Eval item not found" } };
  }

  if (evalItem.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  await deleteEvalItemById(id);

  return {
    status: 200,
    body: { message: "Eval item deleted" },
  };
}
