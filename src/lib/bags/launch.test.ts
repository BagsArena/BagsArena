import { describe, expect, it } from "vitest";

import { createMockArenaSnapshot } from "@/lib/arena/mock-data";
import type { ArenaRepository } from "@/lib/arena/repository";
import type { ApproveLaunchInput, Project } from "@/lib/arena/types";
import type { BagsGateway } from "@/lib/bags/client";
import { approveProjectLaunch } from "@/lib/bags/launch";

function createRepository(project: Project) {
  let currentProject = structuredClone(project);
  let capturedInput: ApproveLaunchInput | undefined;

  return {
    repository: {
      async getSnapshot() {
        const snapshot = createMockArenaSnapshot();
        snapshot.projects = [structuredClone(currentProject)];
        snapshot.agents = snapshot.agents.filter(
          (candidate) => candidate.id === currentProject.agentId,
        );
        return snapshot;
      },
      async approveLaunch(projectId: string, input?: ApproveLaunchInput) {
        expect(projectId).toBe(currentProject.id);
        capturedInput = input;
        currentProject = {
          ...currentProject,
          launchStatus: "live",
          token: {
            ...currentProject.token,
            mint: input?.mint ?? currentProject.token.mint,
            metadataUrl: input?.metadataUrl ?? currentProject.token.metadataUrl,
            configKey: input?.configKey ?? currentProject.token.configKey,
            bagsUrl: input?.bagsUrl ?? currentProject.token.bagsUrl,
            creatorWallet: input?.creatorWallet ?? currentProject.token.creatorWallet,
            launchSignature:
              input?.launchSignature ?? currentProject.token.launchSignature,
            status: "live",
          },
        };

        return structuredClone(currentProject);
      },
    } as ArenaRepository,
    readCapturedInput() {
      return capturedInput;
    },
  };
}

function createGateway(): BagsGateway {
  return {
    async getTokenLifetimeFees() {
      return 0;
    },
    async getTokenClaimStats() {
      return [];
    },
    async getTokenCreators() {
      return [];
    },
    async getTokenClaimEvents() {
      return [];
    },
    async getTokenMarketStats() {
      return null;
    },
    async getPartnerClaimStats() {
      return null;
    },
    async prepareLaunchDraft() {
      return {
        tokenMint: "MintDraft123",
        metadataUrl: "https://metadata.bags.fm/draft.json",
        configKey: "CfgDraft123",
        launchTransactionBase64: Buffer.from("demo").toString("base64"),
      };
    },
  };
}

describe("bags launch approval", () => {
  it("prepares a launch draft and persists it through the approval flow", async () => {
    const snapshot = createMockArenaSnapshot();
    const project = snapshot.projects.find((candidate) => candidate.id === "project-ghost-kitchen");

    expect(project).toBeDefined();

    const harness = createRepository(project!);
    const result = await approveProjectLaunch(project!.id, {
      repository: harness.repository,
      gateway: createGateway(),
    });

    expect(result.mode).toBe("demo");
    expect(result.launchDraft.tokenMint).toBe("MintDraft123");
    expect(result.project.token.mint).toBe("MintDraft123");
    expect(harness.readCapturedInput()?.configKey).toBe("CfgDraft123");
    expect(harness.readCapturedInput()?.bagsUrl).toBe("https://bags.fm/token/MintDraft123");
  });
});
