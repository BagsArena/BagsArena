import { NextResponse } from "next/server";

import { triggerScheduledHouseLeagueCycle } from "@/lib/arena/automation";
import { requireCronAccess } from "@/lib/auth/cron";

export async function GET(request: Request) {
  const unauthorized = requireCronAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await triggerScheduledHouseLeagueCycle();

    if (!result.acquired) {
      return NextResponse.json(
        {
          skipped: true,
          reason: "cycle already running",
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
          error instanceof Error ? error.message : "Scheduled cycle failed.",
      },
      { status: 500 },
    );
  }
}
