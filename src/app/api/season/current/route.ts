import { NextResponse } from "next/server";

import { arenaRepository } from "@/lib/arena/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    season: await arenaRepository.getCurrentSeason(),
  });
}
