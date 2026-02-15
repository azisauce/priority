import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createGroupSchema = z.object({
  groupName: z.string().min(1, "Group name is required").max(100),
  priorityParamIds: z.array(z.string()).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const groups = await prisma.group.findMany({
    where: { userId },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ groups });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { groupName, priorityParamIds } = parsed.data;

  const existing = await prisma.group.findUnique({
    where: { groupName_userId: { groupName, userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Group name already exists" }, { status: 409 });
  }

  const group = await prisma.group.create({
    data: {
      groupName,
      userId,
      ...(priorityParamIds && priorityParamIds.length > 0
        ? {
            priorityParams: {
              create: priorityParamIds.map((id) => ({
                priorityParamId: id,
              })),
            },
          }
        : {}),
    },
    include: {
      _count: { select: { items: true } },
      priorityParams: { include: { priorityParam: true } },
    },
  });

  return NextResponse.json({ group }, { status: 201 });
}
