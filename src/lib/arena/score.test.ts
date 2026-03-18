import { describe, expect, it } from "vitest";

import { createMockArenaSnapshot } from "@/lib/arena/mock-data";
import { buildLeaderboard, computeShipVelocity, smoothScore } from "@/lib/arena/score";

describe("arena scoring", () => {
  it("computes ship velocity from task, deploy, and commit output", () => {
    const snapshot = createMockArenaSnapshot();
    const run = snapshot.projects[0].activeRun;

    expect(computeShipVelocity(run)).toBe(20);
  });

  it("ranks projects by the weighted composite score", () => {
    const snapshot = createMockArenaSnapshot();
    const leaderboard = buildLeaderboard(
      snapshot.projects,
      new Map(snapshot.agents.map((agent) => [agent.id, agent])),
    );

    expect(leaderboard[0]?.project.slug).toBe("signal-safari");
    expect(leaderboard).toHaveLength(4);
    expect(leaderboard[0]!.score).toBeGreaterThan(leaderboard[1]!.score);
  });

  it("does not award phantom market points when every token metric is zero", () => {
    expect(smoothScore(0, 0)).toBe(0);

    const snapshot = createMockArenaSnapshot();
    const leaderboard = buildLeaderboard(
      snapshot.projects,
      new Map(snapshot.agents.map((agent) => [agent.id, agent])),
    );

    expect(
      leaderboard.every(
        (entry) =>
          entry.componentScores.marketCap === 0 &&
          entry.componentScores.volume24h === 0 &&
          entry.componentScores.lifetimeFees === 0,
      ),
    ).toBe(true);
  });
});
