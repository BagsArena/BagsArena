import { describe, expect, it } from "vitest";

import { buildFallbackAgentCyclePlan } from "@/lib/agents/planner";
import { createMockArenaSnapshot } from "@/lib/arena/mock-data";

describe("agent cycle planner", () => {
  it("builds a deterministic fallback cycle for a live project", () => {
    const snapshot = createMockArenaSnapshot();
    const project = snapshot.projects[0];
    const agent = snapshot.agents.find((candidate) => candidate.id === project.agentId);

    expect(agent).toBeDefined();

    const plan = buildFallbackAgentCyclePlan({
      now: new Date("2026-03-15T18:00:00.000Z"),
      project,
      agent: agent!,
    });

    expect(plan.source).toBe("fallback");
    expect(plan.objective).toContain(project.name);
    expect(plan.metricsDelta.mergedCommits24h).toBeGreaterThan(0);
    expect(plan.previewHighlightsAppend.length).toBeGreaterThan(0);
    expect(plan.event.detail).toContain(project.name);
    expect(plan.tokenDelta?.marketCap).toBeGreaterThan(0);
    expect(plan.deployment?.previewUrl).toContain(project.slug);
  });

  it("keeps launch-ready projects awaiting operator approval", () => {
    const snapshot = createMockArenaSnapshot();
    const project = snapshot.projects.find((candidate) => candidate.launchStatus === "launch-ready");
    const agent = snapshot.agents.find((candidate) => candidate.id === project?.agentId);

    expect(project).toBeDefined();
    expect(agent).toBeDefined();

    const plan = buildFallbackAgentCyclePlan({
      now: new Date("2026-03-15T18:00:00.000Z"),
      project: project!,
      agent: agent!,
    });

    expect(plan.launchStatus).toBe("launch-ready");
    expect(plan.phase).toBe("launch-ready");
    expect(plan.terminal.at(-1)).toContain("Deploy skipped");
  });
});
