import { describe, expect, it, vi } from "vitest";

import { createMockArenaSnapshot } from "@/lib/arena/mock-data";
import { provisionProjectInfrastructure } from "@/lib/provisioning/orchestrator";

vi.mock("@/lib/github/client", () => ({
  ensureGitHubRepository: vi.fn(async (_project, agent) => ({
    owner: agent.repoOwner,
    ownerId: 1,
    name: "signal-safari",
    fullName: `${agent.repoOwner}/signal-safari`,
    htmlUrl: `https://github.com/${agent.repoOwner}/signal-safari`,
    id: 1,
    nodeId: "repo-node",
    defaultBranch: "main",
    templateUsed: agent.templateRepo,
    mocked: true,
  })),
}));

vi.mock("@/lib/vercel/client", () => ({
  ensureVercelProject: vi.fn(async (project) => ({
    id: `mock-${project.slug}`,
    name: project.slug,
    previewUrl: `https://${project.slug}.vercel.app`,
    deployHookUrl: undefined,
    deployHookName: undefined,
    mocked: true,
  })),
}));

describe("project infrastructure provisioning", () => {
  it("returns provisioned remote resources", async () => {
    const snapshot = createMockArenaSnapshot();
    const project = snapshot.projects[0];
    const agent = snapshot.agents.find((candidate) => candidate.id === project.agentId);

    expect(agent).toBeDefined();

    const result = await provisionProjectInfrastructure(project, agent!);

    expect(result.repoUrl).toContain(project.slug);
    expect(result.previewUrl).toContain(project.slug);
    expect(["vercel-ready", "fully-provisioned"]).toContain(
      result.infrastructure.status,
    );
    expect(result.infrastructure.notes.length).toBeGreaterThan(0);
  });
});
