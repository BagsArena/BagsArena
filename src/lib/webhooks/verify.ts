import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

function constantTimeMatch(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function computeSha256(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyGitHubWebhookSignature(request: Request, rawBody: string) {
  if (!env.githubWebhookSecret) {
    return true;
  }

  const signature = request.headers.get("x-hub-signature-256");
  if (!signature?.startsWith("sha256=")) {
    return false;
  }

  const expected = `sha256=${computeSha256(env.githubWebhookSecret, rawBody)}`;
  return constantTimeMatch(expected, signature);
}

export function verifyVercelWebhookSignature(request: Request, rawBody: string) {
  if (!env.vercelWebhookSecret) {
    return true;
  }

  const signature =
    request.headers.get("x-vercel-signature") ??
    request.headers.get("svix-signature");

  if (!signature) {
    return false;
  }

  const expected = computeSha256(env.vercelWebhookSecret, rawBody);

  const candidates = signature
    .split(",")
    .map((part) => part.trim())
    .flatMap((part) => {
      if (part.includes("=")) {
        return [part.split("=").at(-1) ?? ""];
      }

      return [part];
    })
    .filter(Boolean);

  return candidates.some((candidate) => constantTimeMatch(expected, candidate));
}
