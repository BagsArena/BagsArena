import { NextResponse } from "next/server";

import { arenaRepository } from "@/lib/arena/repository";
import { requireAdminAccess } from "@/lib/auth/admin";
import { createSeasonSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const unauthorized = requireAdminAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  const parsed = createSeasonSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    season: await arenaRepository.createSeason(parsed.data),
  });
}
