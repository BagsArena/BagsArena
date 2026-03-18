import { NextResponse } from "next/server";

import { arenaRepository } from "@/lib/arena/repository";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return NextResponse.json({
    feed: await arenaRepository.getProjectFeed(slug),
  });
}
