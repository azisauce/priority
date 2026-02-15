import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createEvalItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  value: z.number({ message: "Value is required" }),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const evalItems = await prisma.paramEvalItem.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { params: true } },
    },
    orderBy: { value: "asc" },
  });

  return NextResponse.json({ evalItems });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const parsed = createEvalItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, value } = parsed.data;

  const evalItem = await prisma.paramEvalItem.create({
    data: { name, value, userId },
    include: { _count: { select: { params: true } } },
  });

  return NextResponse.json({ evalItem }, { status: 201 });
}
