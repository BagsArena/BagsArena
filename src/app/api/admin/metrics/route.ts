import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/admin";
import { refreshHouseLeagueTokenAnalytics } from "@/lib/bags/analytics";
import { refreshHouseLeagueMetricsSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const unauthorized = requireAdminAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json();
  const parsed = refreshHouseLeagueMetricsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await refreshHouseLeagueTokenAnalytics());
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "House league metric refresh failed.",
      },
      { status: 400 },
    );
  }
}
