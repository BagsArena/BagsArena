import { describe, expect, it } from "vitest";

import { createMockArenaSnapshot } from "@/lib/arena/mock-data";
import type { ArenaRepository } from "@/lib/arena/repository";
import type { Project, UpdateProjectTokenAnalyticsInput } from "@/lib/arena/types";
import type { BagsGateway } from "@/lib/bags/client";
import { refreshProjectTokenAnalytics } from "@/lib/bags/analytics";

function createRepository(project: Project) {
  let currentProject = structuredClone(project);

  return {
    async getSnapshot() {
      const snapshot = createMockArenaSnapshot();
      snapshot.projects = [structuredClone(currentProject)];
      return snapshot;
    },
    async updateProjectTokenAnalytics(
      projectId: string,
      input: UpdateProjectTokenAnalyticsInput,
    ) {
      expect(projectId).toBe(currentProject.id);
      currentProject = {
        ...currentProject,
        token: {
          ...currentProject.token,
          performance: {
            ...currentProject.token.performance,
            ...input.performance,
            claimCount: input.claims?.length ?? currentProject.token.performance.claimCount,
          },
          creators: input.creators ?? currentProject.token.creators,
          claims: input.claims ?? currentProject.token.claims,
        },
      };

      return structuredClone(currentProject);
    },
  } as ArenaRepository;
}

function createGateway(wallet: string): BagsGateway {
  return {
    async getTokenLifetimeFees() {
      return 31234.5;
    },
    async getTokenClaimStats() {
      return [
        {
          wallet,
          username: "atlas_loop",
          totalClaimed: 19422.1,
          royaltyBps: 7500,
        },
      ];
    },
    async getTokenCreators() {
      return [
        {
          wallet,
          username: "atlas_loop",
          totalClaimed: 0,
          royaltyBps: 7500,
        },
      ];
    },
    async getTokenClaimEvents() {
      return [
        {
          id: "",
          wallet,
          amount: 1288.44,
          signature: "sig-1",
          timestamp: new Date("2026-03-16T12:00:00.000Z").toISOString(),
        },
      ];
    },
    async getTokenMarketStats() {
      return {
        priceUsd: 0.091,
        marketCap: 1204000,
        volume24h: 244000,
        priceChange24h: 21.4,
        holders: 1822,
      };
    },
    async getPartnerClaimStats() {
      return {
        claimedFees: 4500,
        unclaimedFees: 880,
      };
    },
    async prepareLaunchDraft() {
      throw new Error("not used");
    },
  };
}

describe("bags analytics refresh", () => {
  it("merges Bags metrics into project token state", async () => {
    const snapshot = createMockArenaSnapshot();
    const project = snapshot.projects.find((candidate) => candidate.id === "project-signal-safari");

    expect(project).toBeDefined();
    project!.launchStatus = "live";
    project!.token.status = "live";

    const result = await refreshProjectTokenAnalytics(project!.id, {
      repository: createRepository(project!),
      gateway: createGateway(project!.token.creatorWallet),
    });

    expect(result.source).toBe("demo");
    expect(result.project.token.performance.marketCap).toBe(1204000);
    expect(result.project.token.performance.volume24h).toBe(244000);
    expect(result.project.token.performance.lifetimeFees).toBe(31234.5);
    expect(result.project.token.performance.partnerClaimedFees).toBe(4500);
    expect(result.project.token.performance.partnerUnclaimedFees).toBe(880);
    expect(result.project.token.creators[0]?.totalClaimed).toBe(19422.1);
    expect(result.project.token.claims[0]?.id).toBe("sig-1-0");
  });

  it("skips live Bags calls for projects that are still building", async () => {
    const snapshot = createMockArenaSnapshot();
    const project = snapshot.projects.find((candidate) => candidate.id === "project-signal-safari");

    expect(project).toBeDefined();

    const result = await refreshProjectTokenAnalytics(project!.id, {
      repository: createRepository(project!),
      gateway: createGateway(project!.token.creatorWallet),
    });

    expect(result.project.token.performance.marketCap).toBe(0);
    expect(result.project.token.claims).toHaveLength(0);
  });
});
