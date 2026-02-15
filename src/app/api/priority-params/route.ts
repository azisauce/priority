import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createParamSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  weight: z.number().positive("Weight must be positive"),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await prisma.priorityParam.findMany({
    where: { userId: session.user.id },
    include: {
      evalItems: {
        include: { paramEvalItem: true },
      },
      _count: { select: { groups: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ params });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const parsed = createParamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, weight } = parsed.data;

  const existing = await prisma.priorityParam.findUnique({
    where: { name_userId: { name, userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Parameter name already exists" }, { status: 409 });
  }

  const param = await prisma.priorityParam.create({
    data: { name, weight, userId },
    include: {
      evalItems: { include: { paramEvalItem: true } },
      _count: { select: { groups: true } },
    },
  });

  return NextResponse.json({ param }, { status: 201 });
}
