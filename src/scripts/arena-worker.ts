import { Worker } from "bullmq";

import {
  runHouseLeagueCycle,
  runProjectCycle,
  runRetryCycle,
} from "../lib/agents/runtime";
import {
  arenaQueueName,
  getArenaQueueConnectionOptions,
} from "../lib/queue";

function readFlag(name: string) {
  return process.argv.some((argument) => argument === name);
}

function readPositionalArguments() {
  return process.argv.slice(2).filter((argument) => !argument.startsWith("-"));
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

async function runDirectMode() {
  const positional = readPositionalArguments();
  const explicitRunId = readOption("--run");
  const explicitProjectId = readOption("--project");
  const runId =
    explicitRunId ?? positional.find((argument) => argument.startsWith("run-"));
  const projectId =
    explicitProjectId ??
    positional.find((argument) => argument.startsWith("project-"));

  if (projectId) {
    const project = await runProjectCycle(projectId);
    console.log(`[arena-worker] completed project cycle for ${project.slug}`);
    return;
  }

  if (runId) {
    const project = await runRetryCycle(runId);
    console.log(`[arena-worker] completed retry cycle for ${project.slug}`);
    return;
  }

  const projects = await runHouseLeagueCycle();
  console.log(`[arena-worker] completed house league cycle for ${projects.length} projects`);
}

async function main() {
  const forceDirect = readFlag("--direct") || readFlag("--all");
  const connection = getArenaQueueConnectionOptions();

  if (forceDirect || !connection) {
    await runDirectMode();
    return;
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
    console.log(`[arena-worker] completed ${job.name} (${job.id})`);
  });

  worker.on("failed", (job, error) => {
    console.error(`[arena-worker] failed ${job?.name ?? "unknown"} (${job?.id ?? "n/a"})`, error);
  });

  process.on("SIGINT", async () => {
    await worker.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await worker.close();
    process.exit(0);
  });

  console.log("[arena-worker] listening for arena jobs");
}

main().catch((error) => {
  console.error("[arena-worker] fatal", error);
  process.exit(1);
});
