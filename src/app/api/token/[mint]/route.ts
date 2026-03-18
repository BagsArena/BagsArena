import { NextResponse } from "next/server";

import { arenaRepository } from "@/lib/arena/repository";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;
  const token = await arenaRepository.getTokenByMint(mint);

  if (!token) {
    return NextResponse.json({ error: "Token not found." }, { status: 404 });
  }

  return NextResponse.json({ token });
}
