import { NextResponse } from "next/server";

import { arenaRepository } from "@/lib/arena/repository";
import { normalizeGitHubPushWebhook } from "@/lib/webhooks/normalize";
import { verifyGitHubWebhookSignature } from "@/lib/webhooks/verify";

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifyGitHubWebhookSignature(request, rawBody)) {
    return NextResponse.json(
      {
        error: "Invalid GitHub webhook signature.",
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
        error: "Malformed GitHub webhook payload.",
      },
      { status: 400 },
    );
  }
  const normalized = normalizeGitHubPushWebhook(payload as Record<string, unknown>);

  if (!normalized) {
    return NextResponse.json(
      {
        error: "Unsupported GitHub webhook payload.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await arenaRepository.recordGitHubPush(normalized);

    return NextResponse.json({
      provider: "github",
      event: request.headers.get("x-github-event") ?? "unknown",
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "GitHub webhook processing failed.",
      },
      { status: 400 },
    );
  }
}
