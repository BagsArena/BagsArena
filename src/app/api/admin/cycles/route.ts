import { NextResponse } from "next/server";

import { runHouseLeagueCycle } from "@/lib/agents/runtime";
import { requireAdminAccess } from "@/lib/auth/admin";
import { enqueueHouseLeagueCycle } from "@/lib/queue";
import { runHouseLeagueCycleSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const unauthorized = requireAdminAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = runHouseLeagueCycleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const queuedJob = await enqueueHouseLeagueCycle();

    if (queuedJob) {
      return NextResponse.json({
        queued: true,
        queuedJobId: queuedJob.id,
        scope: parsed.data.scope,
      });
    }

    const projects = await runHouseLeagueCycle();

    return NextResponse.json({
      queued: false,
      queuedJobId: null,
      projects,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "House league cycle failed.",
      },
      { status: 400 },
    );
  }
}
