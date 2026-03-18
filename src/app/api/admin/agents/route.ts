import { NextResponse } from "next/server";

import { arenaRepository } from "@/lib/arena/repository";
import { requireAdminAccess } from "@/lib/auth/admin";
import { createHouseAgentSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const unauthorized = requireAdminAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  const parsed = createHouseAgentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({
      agent: await arenaRepository.createHouseAgent(parsed.data),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Agent creation failed.",
      },
      { status: 400 },
    );
  }
}
