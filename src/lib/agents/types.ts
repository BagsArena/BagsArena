import type {
  ArtifactType,
  Deployment,
  EventCategory,
  HouseAgent,
  Project,
  ProjectLaunchStatus,
  RunOutcome,
  RunPhase,
  TaskStatus,
} from "@/lib/arena/types";

export interface AgentCycleMetricDelta {
  mergedCommits24h: number;
  completedTasks24h: number;
  successfulDeploys24h: number;
}

export interface AgentCycleTokenDelta {
  marketCap: number;
  volume24h: number;
  lifetimeFees: number;
  priceUsd: number;
  claimCount: number;
  priceChange24h: number;
  holders: number;
  sparklinePoint?: number;
}

export interface AgentCycleRoadmapUpdate {
  id: string;
  status: TaskStatus;
  detail?: string;
  etaHours?: number;
}

export interface AgentCycleArtifactInput {
  type: ArtifactType;
  label: string;
  url: string;
}

export interface AgentCycleDeploymentInput {
  sha: string;
  branch: string;
  previewUrl: string;
  status: Deployment["status"];
  durationSeconds: number;
  screenshotLabel: string;
}

export interface AgentCycleEventInput {
  category: EventCategory;
  title: string;
  detail: string;
  scoreDelta?: number;
}

export interface AgentCyclePlan {
  source: "openai" | "fallback";
  objective: string;
  promptSnapshot: string;
  phase: RunPhase;
  outcome: RunOutcome;
  terminal: string[];
  metricsDelta: AgentCycleMetricDelta;
  roadmapUpdates: AgentCycleRoadmapUpdate[];
  previewHighlightsAppend: string[];
  artifacts: AgentCycleArtifactInput[];
  deployment?: AgentCycleDeploymentInput;
  event: AgentCycleEventInput;
  launchStatus?: ProjectLaunchStatus;
  tokenDelta?: AgentCycleTokenDelta;
}

export interface AgentPlannerContext {
  now: Date;
  agent: HouseAgent;
  project: Project;
}

export interface AgentExecutionContext extends AgentPlannerContext {
  plan: AgentCyclePlan;
}

export interface AgentExecutionResult {
  phase: RunPhase;
  outcome: RunOutcome;
  terminal: string[];
  metricsDelta: AgentCycleMetricDelta;
  artifacts: AgentCycleArtifactInput[];
  deployment?: AgentCycleDeploymentInput;
  event: AgentCycleEventInput;
}

export interface ApplyAgentCycleInput extends AgentCyclePlan {
  projectId: string;
  startedAt: string;
  endedAt: string;
}

export interface RunProjectCycleResult {
  queued: boolean;
  projectId: string;
  projectSlug: string;
  runId: string;
  jobId: string | null;
}
