import { clamp } from "@/lib/utils";
import type {
  AgentRun,
  LeaderboardComponentScores,
  LeaderboardEntry,
  Project,
  Season,
  SeasonStatus,
} from "@/lib/arena/types";

export const SCORE_WEIGHTS = {
  marketCap: 0.45,
  volume24h: 0.25,
  lifetimeFees: 0.15,
  shipVelocity: 0.15,
} as const;

const EMA_ALPHA = 2 / (5 + 1);

function normalize(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return values.map(() => 1);
  }

  return values.map((value) => (value - min) / (max - min));
}

export function deriveSeasonStatus(
  now: Date,
  season: Pick<Season, "startAt" | "freezeAt" | "endAt">,
): SeasonStatus {
  const startAt = new Date(season.startAt);
  const freezeAt = new Date(season.freezeAt);
  const endAt = new Date(season.endAt);

  if (now < startAt) return "draft";
  if (now >= endAt) return "ended";
  if (now >= freezeAt) return "frozen";
  return "live";
}

export function computeShipVelocity(run: AgentRun) {
  const raw =
    run.completedTasks24h * 1.2 +
    run.successfulDeploys24h * 1.5 +
    run.mergedCommits24h;
  return Number(raw.toFixed(2));
}

export function smoothScore(previous: number, next: number) {
  return Number((previous + EMA_ALPHA * (next - previous)).toFixed(4));
}

export function buildLeaderboard(
  projects: Project[],
  agentsById: Map<string, LeaderboardEntry["agent"]>,
) {
  const marketCaps = normalize(
    projects.map((project) => project.token.performance.marketCap),
  );
  const volumes = normalize(
    projects.map((project) => project.token.performance.volume24h),
  );
  const lifetimeFees = normalize(
    projects.map((project) => project.token.performance.lifetimeFees),
  );
  const shipVelocities = normalize(
    projects.map((project) => computeShipVelocity(project.activeRun)),
  );

  const entries = projects.map((project, index) => {
    const componentScores: LeaderboardComponentScores = {
      marketCap: clamp(marketCaps[index]),
      volume24h: clamp(volumes[index]),
      lifetimeFees: clamp(lifetimeFees[index]),
      shipVelocity: clamp(shipVelocities[index]),
    };

    const baseScore =
      componentScores.marketCap * SCORE_WEIGHTS.marketCap +
      componentScores.volume24h * SCORE_WEIGHTS.volume24h +
      componentScores.lifetimeFees * SCORE_WEIGHTS.lifetimeFees +
      componentScores.shipVelocity * SCORE_WEIGHTS.shipVelocity;

    return {
      rank: 0,
      score: Number((baseScore * 100).toFixed(2)),
      scoreDelta24h: Number(
        (project.token.performance.priceChange24h * 0.38).toFixed(2),
      ),
      agent: agentsById.get(project.agentId)!,
      project,
      componentScores,
    } satisfies LeaderboardEntry;
  });

  return entries
    .sort((left, right) => right.score - left.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
