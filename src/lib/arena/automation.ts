import { refreshHouseLeagueTokenAnalytics } from "@/lib/bags/analytics";
import { runHouseLeagueCycle, runHouseLeagueFallbackCycle } from "@/lib/agents/runtime";
import { env } from "@/lib/env";
import { enqueueHouseLeagueCycle } from "@/lib/queue";
import { runIntervalTask, withRedisLock } from "@/lib/redis-lock";

export interface ScheduledCycleResult {
  mode: "queued" | "direct";
  queuedJobId: string | null;
  projectCount: number;
}

export interface ScheduledMetricsResult {
  source: "demo" | "bags";
  projectCount: number;
}

export interface WebsiteHeartbeatResult {
  updated: boolean;
  cycleRan: boolean;
  metricsRan: boolean;
  cycleMode: "fallback" | "queued" | "direct" | "skipped";
  metricsSource: "demo" | "bags" | "skipped";
}

export async function triggerScheduledHouseLeagueCycle() {
  return withRedisLock<ScheduledCycleResult>(
    "arena:cron:cycle",
    14 * 60_000,
    async () => {
      const queuedJob = await enqueueHouseLeagueCycle();

      if (queuedJob) {
        return {
          mode: "queued",
          queuedJobId: String(queuedJob.id),
          projectCount: 4,
        };
      }

      const projects = await runHouseLeagueCycle();
      return {
        mode: "direct",
        queuedJobId: null,
        projectCount: projects.length,
      };
    },
  );
}

export async function triggerScheduledMetricsRefresh() {
  return withRedisLock<ScheduledMetricsResult>(
    "arena:cron:metrics",
    4 * 60_000,
    async () => {
      const result = await refreshHouseLeagueTokenAnalytics();

      return {
        source: result.source as "demo" | "bags",
        projectCount: result.projects.length,
      };
    },
  );
}

export async function triggerWebsiteHeartbeat(): Promise<WebsiteHeartbeatResult> {
  const cycleIntervalMs = Math.max(1, env.arenaCycleIntervalMinutes) * 60_000;
  const metricsIntervalMs = Math.max(1, env.arenaMetricsIntervalMinutes) * 60_000;

  const cycleResult =
    env.arenaExecutorMode === "simulated"
      ? await runIntervalTask(
          "arena:website:cycle",
          cycleIntervalMs,
          Math.max(30_000, cycleIntervalMs - 5_000),
          async () => {
            const projects = await runHouseLeagueFallbackCycle();
            return {
              projectCount: projects.length,
            };
          },
        )
      : {
          ran: false as const,
          reason: "interval" as const,
        };

  const metricsResult = await runIntervalTask(
    "arena:website:metrics",
    metricsIntervalMs,
    Math.max(30_000, metricsIntervalMs - 5_000),
    async () => {
      const result = await refreshHouseLeagueTokenAnalytics();
      return {
        source: result.source as "demo" | "bags",
        projectCount: result.projects.length,
      };
    },
  );

  return {
    updated: cycleResult.ran || metricsResult.ran,
    cycleRan: cycleResult.ran,
    metricsRan: metricsResult.ran,
    cycleMode: cycleResult.ran ? "fallback" : "skipped",
    metricsSource: metricsResult.ran ? (metricsResult.value?.source ?? "demo") : "skipped",
  };
}
