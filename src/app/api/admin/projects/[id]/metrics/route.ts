import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/admin";
import { refreshProjectTokenAnalytics } from "@/lib/bags/analytics";
import { refreshProjectMetricsSchema } from "@/lib/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = requireAdminAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json();
  const parsed = refreshProjectMetricsSchema.safeParse(body);
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
    const result = await refreshProjectTokenAnalytics(id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Metric refresh failed.",
      },
      { status: 400 },
    );
  }
}
