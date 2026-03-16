import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/server/services/auth.service";
import { registerSchema } from "@/server/validators/auth.validator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);
    const result = await registerUser(validated);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("/api/auth/register error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
