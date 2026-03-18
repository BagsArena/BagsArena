import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/admin";
import { approveProjectLaunch } from "@/lib/bags/launch";
import { approveLaunchSchema } from "@/lib/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = requireAdminAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json();
  const parsed = approveLaunchSchema.safeParse(body);
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
    return NextResponse.json(await approveProjectLaunch(id));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Launch approval failed.",
      },
      { status: 400 },
    );
  }
}
