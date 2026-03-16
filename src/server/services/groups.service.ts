/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  createGroup,
  createGroupPriorityAssignment,
  createGroupPriorityAssignments,
  deleteGroupById,
  deleteGroupPriorityAssignment,
  deleteItemsByGroupId,
  findGroupById,
  findGroupByNameAndUserId,
  findGroupByNameAndUserIdExcludingId,
  findGroupPriorityAssignment,
  findPriorityParamById,
  getGroupPriorityItems,
  getGroupPriorityParams,
  getGroupPriorityParamsWithJunction,
  getGroupsByUserId,
  getItemCountForGroup,
  getItemsByGroupId,
  getJudgmentItemsForPriorityParam,
  getMaxGroupPriorityOrder,
  getPriorityParamEvalItemsFilteredByUser,
  updateGroupById,
} from "@/server/repositories/groups.repository";

type ServiceResult<T> = {
  status: number;
  body: T;
};

export async function getGroupsForUser(userId: string): Promise<ServiceResult<{ groups: any[] }>> {
  const groups = await getGroupsByUserId(userId);

  const groupsWithCounts = await Promise.all(
    groups.map(async (group) => {
      const itemCount = await getItemCountForGroup(group.id);

      return {
        id: group.id,
        groupName: group.name,
        description: group.description,
        userId: group.user_id,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
        _count: { items: parseInt((itemCount?.count as string) || "0") },
      };
    })
  );

  return {
    status: 200,
    body: { groups: groupsWithCounts },
  };
}

export async function createGroupForUser(
  userId: string,
  data: {
    groupName: string;
    description?: string | null;
    priorityItemIds?: string[] | null;
  }
): Promise<ServiceResult<{ error: string } | { group: any }>> {
  const existing = await findGroupByNameAndUserId(data.groupName, userId);

  if (existing) {
    return {
      status: 409,
      body: { error: "Group name already exists" },
    };
  }

  const group = await createGroup({
    name: data.groupName,
    description: data.description || null,
    user_id: userId,
  });

  if (data.priorityItemIds && data.priorityItemIds.length > 0) {
    await createGroupPriorityAssignments(
      data.priorityItemIds.map((id, index) => ({
        group_id: group.id,
        priority_item_id: id,
        order: index + 1,
      }))
    );
  }

  const priorityItems = data.priorityItemIds && data.priorityItemIds.length > 0
    ? await getGroupPriorityItems(group.id)
    : [];

  return {
    status: 201,
    body: {
      group: {
        id: group.id,
        groupName: group.name,
        description: group.description,
        userId: group.user_id,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
        _count: { items: 0 },
        priorityParams: priorityItems.map((item) => ({
          id: item.id,
          name: item.name,
          weight: item.weight,
          order: item.order,
        })),
      },
    },
  };
}

export async function getGroupForUserById(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { group: any }>> {
  const group = await findGroupById(id);

  if (!group) {
    return { status: 404, body: { error: "Group not found" } };
  }

  if (group.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const items = await getItemsByGroupId(id);
  const priorityParams = await getGroupPriorityParamsWithJunction(id);

  const priorityParamsWithJudgments = await Promise.all(
    priorityParams.map(async (param) => {
      const judgmentItems = await getJudgmentItemsForPriorityParam(param.id);

      return {
        id: param.junction_id,
        priorityParam: {
          id: param.id,
          name: param.name,
          description: param.description,
          weight: param.weight,
          userId: param.user_id,
          createdAt: param.created_at,
          updatedAt: param.updated_at,
          evalItems: judgmentItems.map((item) => ({
            paramEvalItem: {
              id: item.id,
              name: item.name,
              description: item.description,
              value: item.value,
              userId: item.user_id,
              createdAt: item.created_at,
              updatedAt: item.updated_at,
            },
          })),
        },
      };
    })
  );

  return {
    status: 200,
    body: {
      group: {
        id: group.id,
        groupName: group.name,
        description: group.description,
        userId: group.user_id,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
        items: items.map((item) => ({
          id: item.id,
          itemName: item.name,
          description: item.description,
          pricing: item.price,
          priority: item.priority,
          value: item.value,
          groupId: item.group_id,
          userId: item.user_id,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          paramAnswers: [],
        })),
        priorityParams: priorityParamsWithJudgments,
      },
    },
  };
}

export async function updateGroupForUser(
  userId: string,
  id: string,
  data: { groupName?: string; description?: string | null }
): Promise<ServiceResult<{ error: string } | { group: any }>> {
  const group = await findGroupById(id);

  if (!group) {
    return { status: 404, body: { error: "Group not found" } };
  }

  if (group.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  if (data.groupName) {
    const existing = await findGroupByNameAndUserIdExcludingId(data.groupName, userId, id);
    if (existing) {
      return {
        status: 409,
        body: { error: "Group name already exists" },
      };
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.groupName !== undefined) updateData.name = data.groupName;
  if (data.description !== undefined) updateData.description = data.description;

  const updated = await updateGroupById(id, updateData);

  return {
    status: 200,
    body: {
      group: {
        id: updated.id,
        groupName: updated.name,
        description: updated.description,
        userId: updated.user_id,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    },
  };
}

export async function deleteGroupForUser(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { message: string }>> {
  const group = await findGroupById(id);

  if (!group) {
    return { status: 404, body: { error: "Group not found" } };
  }

  if (group.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  await deleteItemsByGroupId(id);
  await deleteGroupById(id);

  return {
    status: 200,
    body: { message: "Group deleted" },
  };
}

export async function getGroupPriorityParamsForUser(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { params: any[] }>> {
  const group = await findGroupById(id);

  if (!group) {
    return { status: 404, body: { error: "Group not found" } };
  }

  if (group.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const priorityParams = await getGroupPriorityParams(id);

  const paramsWithEvalItems = await Promise.all(
    priorityParams.map(async (param) => {
      const evalItems = await getPriorityParamEvalItemsFilteredByUser(param.id, userId);

      return {
        id: param.id,
        name: param.name,
        description: param.description,
        weight: param.weight,
        userId: param.user_id,
        createdAt: param.created_at,
        updatedAt: param.updated_at,
        evalItems: evalItems.map((item) => ({
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
        })),
      };
    })
  );

  return {
    status: 200,
    body: { params: paramsWithEvalItems },
  };
}

export async function assignPriorityParamToGroup(
  userId: string,
  id: string,
  priorityParamId: string
): Promise<ServiceResult<{ error: string } | { message: string }>> {
  const group = await findGroupById(id);

  if (!group || group.user_id != userId) {
    return { status: 404, body: { error: "Group not found" } };
  }

  const param = await findPriorityParamById(priorityParamId);

  if (!param || (param.user_id && param.user_id != userId)) {
    return { status: 404, body: { error: "Priority param not found" } };
  }

  const existing = await findGroupPriorityAssignment(id, priorityParamId);
  if (existing) {
    return { status: 409, body: { error: "Already assigned" } };
  }

  const maxOrder = await getMaxGroupPriorityOrder(id);
  const newOrder = (maxOrder?.max || 0) + 1;

  await createGroupPriorityAssignment({
    group_id: id,
    priority_item_id: priorityParamId,
    order: newOrder,
  });

  return {
    status: 201,
    body: { message: "Param assigned to group" },
  };
}

export async function unassignPriorityParamFromGroup(
  userId: string,
  id: string,
  priorityParamId: string
): Promise<ServiceResult<{ error: string } | { message: string }>> {
  const group = await findGroupById(id);

  if (!group || group.user_id !== userId) {
    return { status: 404, body: { error: "Group not found" } };
  }

  const deleted = await deleteGroupPriorityAssignment(id, priorityParamId);

  if (deleted === 0) {
    return { status: 404, body: { error: "Assignment not found" } };
  }

  return {
    status: 200,
    body: { message: "Param unassigned from group" },
  };
}
