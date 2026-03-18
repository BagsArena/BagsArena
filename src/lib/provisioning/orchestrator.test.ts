import { describe, expect, it } from "vitest";

import { createMockArenaSnapshot } from "@/lib/arena/mock-data";
import { provisionProjectInfrastructure } from "@/lib/provisioning/orchestrator";

describe("project infrastructure provisioning", () => {
  it("returns mocked remote resources in demo mode", async () => {
    const snapshot = createMockArenaSnapshot();
    const project = snapshot.projects[0];
    const agent = snapshot.agents.find((candidate) => candidate.id === project.agentId);

    expect(agent).toBeDefined();

    const result = await provisionProjectInfrastructure(project, agent!);

    expect(result.repoUrl).toContain(project.slug);
    expect(result.previewUrl).toContain(project.slug);
    expect(result.infrastructure.status).toBe("vercel-ready");
    expect(result.infrastructure.notes.length).toBeGreaterThan(0);
  });
});
