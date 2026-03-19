import { Worker } from "bullmq";

import { triggerScheduledHouseLeagueCycle, triggerScheduledMetricsRefresh } from "../lib/arena/automation";
import { runHouseLeagueCycle, runProjectCycle, runRetryCycle } from "../lib/agents/runtime";
import { env } from "../lib/env";
import { arenaQueueName, getArenaQueueConnectionOptions } from "../lib/queue";

function readFlag(name: string) {
  return process.argv.some((argument) => argument === name);
}

function readOption(name: string) {
  const prefix = `${name}=`;
  const inlineValue = process.argv.find((argument) => argument.startsWith(prefix));
  if (inlineValue) {
    return inlineValue.slice(prefix.length);
  }

  const index = process.argv.findIndex((argument) => argument === name);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function readMinutes(name: string, fallback: number) {
  const value = Number(readOption(name) ?? fallback.toString());
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }

  return value;
}

async function startArenaWorker() {
  const connection = getArenaQueueConnectionOptions();
  if (!connection) {
    console.log("[arena-daemon] Redis not configured. Running without queue worker.");
    return null;
  }

  const worker = new Worker(
    arenaQueueName,
    async (job) => {
      if (job.name === "project-cycle") {
        const project = await runProjectCycle(String(job.data.projectId));
        return {
          projectId: project.id,
          slug: project.slug,
          runId: project.activeRun.id,
        };
      }

      if (job.name === "house-league-cycle") {
        const projects = await runHouseLeagueCycle();
        return {
          count: projects.length,
          projectIds: projects.map((project) => project.id),
        };
      }

      if (job.name === "retry-run") {
        const project = await runRetryCycle(String(job.data.runId));
        return {
          projectId: project.id,
          slug: project.slug,
          runId: project.activeRun.id,
        };
      }

      throw new Error(`Unsupported arena job ${job.name}`);
    },
    {
      connection,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[arena-daemon] completed ${job.name} (${job.id})`);
  });

  worker.on("failed", (job, error) => {
    console.error(`[arena-daemon] failed ${job?.name ?? "unknown"} (${job?.id ?? "n/a"})`, error);
  });

  console.log("[arena-daemon] queue worker online");
  return worker;
}

async function main() {
  const cycleIntervalMinutes = readMinutes(
    "--cycle-interval-minutes",
    env.arenaCycleIntervalMinutes,
  );
  const metricsIntervalMinutes = readMinutes(
    "--metrics-interval-minutes",
    env.arenaMetricsIntervalMinutes,
  );
  const skipInitial = readFlag("--skip-initial");
  const worker = await startArenaWorker();

  let shuttingDown = false;
  let cycleInFlight = false;
  let metricsInFlight = false;

  const runCycle = async () => {
    if (shuttingDown || cycleInFlight) {
      return;
    }

    cycleInFlight = true;
    try {
      const result = await triggerScheduledHouseLeagueCycle();

      if (!result.acquired) {
        console.log("[arena-daemon] skipped cycle tick because a previous cycle is still active");
        return;
      }

      console.log(
        `[arena-daemon] cycle tick -> ${result.value?.mode ?? "unknown"} (${result.value?.projectCount ?? 0} projects)`,
      );
    } catch (error) {
      console.error("[arena-daemon] cycle tick failed", error);
    } finally {
      cycleInFlight = false;
    }
  };

  const runMetrics = async () => {
    if (shuttingDown || metricsInFlight) {
      return;
    }

    metricsInFlight = true;
    try {
      const result = await triggerScheduledMetricsRefresh();

      if (!result.acquired) {
        console.log("[arena-daemon] skipped metrics tick because a previous refresh is still active");
        return;
      }

      console.log(
        `[arena-daemon] metrics tick -> ${result.value?.source ?? "unknown"} (${result.value?.projectCount ?? 0} projects)`,
      );
    } catch (error) {
      console.error("[arena-daemon] metrics tick failed", error);
    } finally {
      metricsInFlight = false;
    }
  };

  if (!skipInitial) {
    await runCycle();
    await runMetrics();
  }

  const cycleTimer = setInterval(() => {
    void runCycle();
  }, Math.round(cycleIntervalMinutes * 60_000));

  const metricsTimer = setInterval(() => {
    void runMetrics();
  }, Math.round(metricsIntervalMinutes * 60_000));

  const shutdown = async () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    clearInterval(cycleTimer);
    clearInterval(metricsTimer);

    if (worker) {
      await worker.close();
    }

    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });

  process.on("SIGTERM", () => {
    void shutdown();
  });

  console.log(
    `[arena-daemon] online (cycle=${cycleIntervalMinutes}m, metrics=${metricsIntervalMinutes}m)`,
  );

  await new Promise(() => undefined);
}

main().catch((error) => {
  console.error("[arena-daemon] fatal", error);
  process.exit(1);
});
