import { executeAgentCycle } from "@/lib/agents/executor";
import { buildFallbackAgentCyclePlan, planAgentCycle } from "@/lib/agents/planner";
import { arenaRepository } from "@/lib/arena/repository";

export async function runProjectCycle(projectId: string) {
  const snapshot = await arenaRepository.getSnapshot();
  const project = snapshot.projects.find((candidate) => candidate.id === projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  const agent = snapshot.agents.find((candidate) => candidate.id === project.agentId);

  if (!agent) {
    throw new Error(`Agent not found for project ${project.slug}.`);
  }

  const startedAt = new Date();
  const plan = await planAgentCycle({
    now: startedAt,
    project,
    agent,
  });
  const execution = await executeAgentCycle({
    now: startedAt,
    project,
    agent,
    plan,
  });
  const endedAt = new Date();

  return arenaRepository.applyAgentCycle({
    ...plan,
    phase: execution.phase,
    outcome: execution.outcome,
    terminal: execution.terminal,
    metricsDelta: execution.metricsDelta,
    artifacts: execution.artifacts,
    deployment: execution.deployment,
    event: execution.event,
    roadmapUpdates:
      execution.outcome === "healthy" ? plan.roadmapUpdates : [],
    previewHighlightsAppend:
      execution.outcome === "healthy" ? plan.previewHighlightsAppend : [],
    launchStatus:
      execution.outcome === "healthy"
        ? (plan.launchStatus ?? project.launchStatus)
        : project.launchStatus,
    tokenDelta:
      execution.outcome === "healthy" && project.launchStatus === "live"
        ? plan.tokenDelta
        : undefined,
    projectId,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
  });
}

export async function runRetryCycle(runId: string) {
  const snapshot = await arenaRepository.getSnapshot();
  const project = snapshot.projects.find((candidate) => candidate.activeRun.id === runId);

  if (!project) {
    throw new Error("Run not found for retry.");
  }

  return runProjectCycle(project.id);
}

export async function runHouseLeagueCycle() {
  const snapshot = await arenaRepository.getSnapshot();
  const results = [];

  for (const project of snapshot.projects.slice(0, 4)) {
    results.push(await runProjectCycle(project.id));
  }

  return results;
}

export async function runProjectFallbackCycle(projectId: string, now = new Date()) {
  const snapshot = await arenaRepository.getSnapshot();
  const project = snapshot.projects.find((candidate) => candidate.id === projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  const agent = snapshot.agents.find((candidate) => candidate.id === project.agentId);

  if (!agent) {
    throw new Error(`Agent not found for project ${project.slug}.`);
  }

  const startedAt = new Date(now);
  const plan = buildFallbackAgentCyclePlan({
    now: startedAt,
    project,
    agent,
  });
  const endedAt = new Date();

  return arenaRepository.applyAgentCycle({
    ...plan,
    projectId,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
  });
}

export async function runHouseLeagueFallbackCycle(now = new Date()) {
  const snapshot = await arenaRepository.getSnapshot();
  const results = [];

  for (const project of snapshot.projects.slice(0, 4)) {
    results.push(await runProjectFallbackCycle(project.id, now));
  }

  return results;
}
