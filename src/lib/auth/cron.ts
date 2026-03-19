import { NextResponse } from "next/server";

import { env } from "@/lib/env";

export function requireCronAccess(request: Request) {
  if (!env.cronSecret) {
    return NextResponse.json(
      {
        error: "CRON_SECRET is not configured.",
      },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  return null;
}
