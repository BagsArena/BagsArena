import { describe, expect, it } from "vitest";

import { createBagsGateway } from "@/lib/bags/client";

describe("bags gateway", () => {
  it("returns a mock launch draft in demo mode", async () => {
    const gateway = createBagsGateway();
    const launch = await gateway.prepareLaunchDraft({
      name: "Signal Safari",
      symbol: "SFS",
      description: "Demo launch draft",
      imageUrl: "https://example.com/signal-safari.png",
      creatorWallet: "ATLs..4xp9",
      initialBuyLamports: 25000000,
    });

    expect(launch.tokenMint).toContain("mock-sfs");
    expect(launch.metadataUrl).toContain("sfs");
    expect(launch.launchTransactionBase64.length).toBeGreaterThan(10);
  });
});
