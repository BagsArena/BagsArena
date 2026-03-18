import { describe, expect, it } from "vitest";

import {
  normalizeGitHubPushWebhook,
  normalizeVercelDeploymentWebhook,
} from "@/lib/webhooks/normalize";

describe("webhook normalization", () => {
  it("normalizes a github push payload", () => {
    const normalized = normalizeGitHubPushWebhook({
      ref: "refs/heads/main",
      repository: {
        full_name: "bags-arena/signal-safari",
        html_url: "https://github.com/bags-arena/signal-safari",
      },
      head_commit: {
        id: "abc1234",
        message: "Ship clip composer",
        timestamp: "2026-03-15T21:00:00.000Z",
      },
      compare: "https://github.com/bags-arena/signal-safari/compare/a...b",
      commits: [{ id: "abc1234" }, { id: "def5678" }],
      pusher: { name: "atlas" },
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.branch).toBe("main");
    expect(normalized?.commitsCount).toBe(2);
    expect(normalized?.repositoryName).toBe("signal-safari");
  });

  it("normalizes a vercel deployment payload", () => {
    const normalized = normalizeVercelDeploymentWebhook({
      type: "deployment.ready",
      payload: {
        id: "dpl_123",
        url: "signal-safari-git-main.vercel.app",
        name: "signal-safari",
        state: "READY",
        createdAt: 1760000000000,
        readyAt: 1760000065000,
        meta: {
          githubOrg: "bags-arena",
          githubRepo: "signal-safari",
          githubCommitSha: "abc1234",
          githubCommitRef: "main",
          githubCommitMessage: "Ship clip composer",
        },
      },
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.previewUrl).toBe(
      "https://signal-safari-git-main.vercel.app",
    );
    expect(normalized?.status).toBe("ready");
    expect(normalized?.durationSeconds).toBe(65);
  });
});
