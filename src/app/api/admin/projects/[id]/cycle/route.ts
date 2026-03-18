import { NextResponse } from "next/server";

import { runProjectCycle } from "@/lib/agents/runtime";
import { requireAdminAccess } from "@/lib/auth/admin";
import { enqueueProjectCycle } from "@/lib/queue";
import { runProjectCycleSchema } from "@/lib/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = requireAdminAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json();
  const parsed = runProjectCycleSchema.safeParse(body);
  const { id } = await params;

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  if (parsed.data.projectId !== id) {
    return NextResponse.json(
      {
        error: "Project id mismatch.",
      },
      { status: 400 },
    );
  }

  try {
    const queuedJob = await enqueueProjectCycle(id);

    if (queuedJob) {
      return NextResponse.json({
        queued: true,
        queuedJobId: queuedJob.id,
        projectId: id,
      });
    }

    const project = await runProjectCycle(id);

    return NextResponse.json({
      queued: false,
      queuedJobId: null,
      project,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Project cycle failed.",
      },
      { status: 400 },
    );
  }
}
