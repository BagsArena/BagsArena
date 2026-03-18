import { describe, expect, it } from "vitest";

import { createMockArenaSnapshot } from "@/lib/arena/mock-data";
import { createManagedProjectFiles } from "@/lib/agents/scaffold";

describe("managed project scaffold", () => {
  it("creates a runnable workspace file set", () => {
    const snapshot = createMockArenaSnapshot();
    const project = snapshot.projects[0];
    const agent = snapshot.agents.find((candidate) => candidate.id === project.agentId);

    expect(agent).toBeDefined();

    const files = createManagedProjectFiles({
      project,
      agent: agent!,
    });

    expect(files["package.json"]).toContain(`"name": "${project.slug}"`);
    expect(files["scripts/build.mjs"]).toContain("Build complete for");
    expect(files["scripts/test.mjs"]).toContain('test("project data exposes a live objective"');
    expect(files["data/project.json"]).toContain(project.name);
  });
});
