import { afterEach, describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";

import { env } from "@/lib/env";
import {
  verifyGitHubWebhookSignature,
  verifyVercelWebhookSignature,
} from "@/lib/webhooks/verify";

function sha256(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

const originalGitHubSecret = env.githubWebhookSecret;
const originalVercelSecret = env.vercelWebhookSecret;

afterEach(() => {
  env.githubWebhookSecret = originalGitHubSecret;
  env.vercelWebhookSecret = originalVercelSecret;
});

describe("webhook signature verification", () => {
  it("verifies GitHub sha256 signatures", () => {
    env.githubWebhookSecret = "github-secret";
    const payload = JSON.stringify({ ok: true });
    const request = new Request("https://example.com", {
      method: "POST",
      headers: {
        "x-hub-signature-256": `sha256=${sha256(env.githubWebhookSecret, payload)}`,
      },
    });

    expect(verifyGitHubWebhookSignature(request, payload)).toBe(true);
  });

  it("verifies Vercel signatures from x-vercel-signature", () => {
    env.vercelWebhookSecret = "vercel-secret";
    const payload = JSON.stringify({ ok: true });
    const request = new Request("https://example.com", {
      method: "POST",
      headers: {
        "x-vercel-signature": sha256(env.vercelWebhookSecret, payload),
      },
    });

    expect(verifyVercelWebhookSignature(request, payload)).toBe(true);
  });
});
