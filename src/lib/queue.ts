import { Queue, type ConnectionOptions } from "bullmq";

import { env } from "@/lib/env";

let arenaQueue: Queue | null = null;
export const arenaQueueName = "arena-runs";

export function getArenaQueueConnectionOptions(): ConnectionOptions | null {
  if (!env.redisUrl) {
    return null;
  }

  const url = new URL(env.redisUrl);
  return {
    host: url.hostname,
    port: Number(url.port || "6379"),
    username: url.username || undefined,
    password: url.password || undefined,
    tls: url.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}

export function getArenaQueue() {
  const connection = getArenaQueueConnectionOptions();
  if (!connection) {
    return null;
  }

  if (!arenaQueue) {
    arenaQueue = new Queue(arenaQueueName, {
      connection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 200,
      },
    });
  }

  return arenaQueue;
}

export async function enqueueRunRetry(runId: string) {
  const queue = getArenaQueue();

  if (!queue) {
    return null;
  }

  return queue.add(
    "retry-run",
    { runId },
    {
      jobId: `retry-run:${runId}`,
    },
  );
}

export async function enqueueProjectCycle(projectId: string) {
  const queue = getArenaQueue();

  if (!queue) {
    return null;
  }

  return queue.add(
    "project-cycle",
    { projectId },
    {
      jobId: `project-cycle:${projectId}`,
    },
  );
}

export async function enqueueHouseLeagueCycle() {
  const queue = getArenaQueue();

  if (!queue) {
    return null;
  }

  return queue.add(
    "house-league-cycle",
    {
      requestedAt: new Date().toISOString(),
    },
    {
      jobId: "house-league-cycle",
    },
  );
}
