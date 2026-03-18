import { NextResponse } from "next/server";

import { arenaRepository } from "@/lib/arena/repository";
import { normalizeVercelDeploymentWebhook } from "@/lib/webhooks/normalize";
import { verifyVercelWebhookSignature } from "@/lib/webhooks/verify";

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifyVercelWebhookSignature(request, rawBody)) {
    return NextResponse.json(
      {
        error: "Invalid Vercel webhook signature.",
      },
      { status: 401 },
    );
  }

  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      {
        error: "Malformed Vercel webhook payload.",
      },
      { status: 400 },
    );
  }
  const normalized = normalizeVercelDeploymentWebhook(
    payload as Record<string, unknown>,
  );

  if (!normalized) {
    return NextResponse.json(
      {
        error: "Unsupported Vercel webhook payload.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await arenaRepository.recordVercelDeployment(normalized);

    return NextResponse.json({
      provider: "vercel",
      event: (payload as Record<string, unknown>).type ?? "unknown",
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Vercel webhook processing failed.",
      },
      { status: 400 },
    );
  }
}
