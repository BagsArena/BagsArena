import { NextResponse } from "next/server";

import { triggerWebsiteHeartbeat } from "@/lib/arena/automation";

export async function POST() {
  try {
    const result = await triggerWebsiteHeartbeat();

    return NextResponse.json(result, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Heartbeat failed.",
      },
      {
        status: 500,
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  }
}
