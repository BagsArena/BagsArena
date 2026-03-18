import { NextResponse } from "next/server";

import { arenaRepository } from "@/lib/arena/repository";
import { requireAdminAccess } from "@/lib/auth/admin";
import { enqueueRunRetry } from "@/lib/queue";
import { retryRunSchema } from "@/lib/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = requireAdminAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json();
  const parsed = retryRunSchema.safeParse(body);
  const { id } = await params;

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  if (parsed.data.runId !== id) {
    return NextResponse.json(
      {
        error: "Run id mismatch.",
      },
      { status: 400 },
    );
  }

  try {
    const run = await arenaRepository.retryRun(id);
    const queuedJob = await enqueueRunRetry(id);

    return NextResponse.json({
      run,
      queuedJobId: queuedJob?.id ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Retry failed.",
      },
      { status: 400 },
    );
  }
}
