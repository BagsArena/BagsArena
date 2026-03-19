import { NextResponse } from "next/server";

import { triggerScheduledMetricsRefresh } from "@/lib/arena/automation";
import { requireCronAccess } from "@/lib/auth/cron";

export async function GET(request: Request) {
  const unauthorized = requireCronAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await triggerScheduledMetricsRefresh();

    if (!result.acquired) {
      return NextResponse.json(
        {
          skipped: true,
          reason: "metrics refresh already running",
        },
        { status: 202 },
      );
    }

    return NextResponse.json({
      skipped: false,
      ...result.value,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Scheduled metrics refresh failed.",
      },
      { status: 500 },
    );
  }
}
