export type SeasonStatus = "draft" | "live" | "frozen" | "ended";
export type ProjectLaunchStatus = "building" | "launch-ready" | "live";
export type RunPhase =
  | "planning"
  | "coding"
  | "testing"
  | "deploying"
  | "launch-ready"
  | "post-launch";
export type RunOutcome = "healthy" | "blocked" | "warning";
export type ArtifactType =
  | "log"
  | "screenshot"
  | "build-report"
  | "commit-diff"
  | "spec";
export type EventCategory = "run" | "deploy" | "token" | "score" | "admin";
export type TaskStatus = "queued" | "active" | "done";
export type InfrastructureStatus =
  | "local-only"
  | "github-ready"
  | "vercel-ready"
  | "fully-provisioned"
  | "degraded";

export interface Season {
  id: string;
  name: string;
  slug: string;
  status: SeasonStatus;
  startAt: string;
  freezeAt: string;
  endAt: string;
  summary: string;
}

export interface HouseAgent {
  id: string;
  slug: string;
  displayName: string;
  handle: string;
  color: string;
  accent: string;
  model: string;
  persona: string;
  prompt: string;
  walletLabel: string;
  walletAddress: string;
  repoOwner: string;
  templateRepo: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  detail: string;
  status: TaskStatus;
  etaHours: number;
}

export interface Artifact {
  id: string;
  type: ArtifactType;
  label: string;
  url: string;
  createdAt: string;
}

export interface Deployment {
  id: string;
  sha: string;
  branch: string;
  previewUrl: string;
  status: "queued" | "building" | "ready" | "failed";
  durationSeconds: number;
  screenshotLabel: string;
  createdAt: string;
}

export interface AgentRun {
  id: string;
  phase: RunPhase;
  outcome: RunOutcome;
  objective: string;
  promptSnapshot: string;
  startedAt: string;
  endedAt: string;
  terminal: string[];
  mergedCommits24h: number;
  completedTasks24h: number;
  successfulDeploys24h: number;
}

export interface CreatorStat {
  wallet: string;
  username: string;
  totalClaimed: number;
  royaltyBps: number;
}

export interface TokenClaimEvent {
  id: string;
  wallet: string;
  amount: number;
  signature: string;
  timestamp: string;
}

export interface TokenPerformance {
  priceUsd: number;
  marketCap: number;
  volume24h: number;
  lifetimeFees: number;
  claimCount: number;
  priceChange24h: number;
  holders: number;
  sparkline: number[];
  partnerClaimedFees?: number;
  partnerUnclaimedFees?: number;
  updatedAt: string;
}

export interface TokenLaunch {
  id: string;
  mint: string;
  symbol: string;
  name: string;
  description: string;
  metadataUrl: string;
  bagsUrl: string;
  configKey: string;
  partnerKey: string;
  creatorWallet: string;
  launchSignature: string;
  launchedAt: string;
  status: ProjectLaunchStatus;
  performance: TokenPerformance;
  creators: CreatorStat[];
  claims: TokenClaimEvent[];
}

export interface ProjectInfrastructure {
  status: InfrastructureStatus;
  githubRepoFullName?: string;
  githubRepoId?: number;
  githubRepoNodeId?: string;
  githubRepoOwnerId?: number;
  githubDefaultBranch?: string;
  githubTemplateUsed?: string;
  vercelProjectId?: string;
  vercelProjectName?: string;
  vercelAccountId?: string;
  vercelDeployHookUrl?: string;
  vercelDeployHookName?: string;
  lastProvisionedAt?: string;
  lastError?: string;
  notes: string[];
}

export interface ArenaEvent {
  id: string;
  agentId: string;
  projectId: string;
  category: EventCategory;
  title: string;
  detail: string;
  createdAt: string;
  scoreDelta?: number;
}

export interface Project {
  id: string;
  slug: string;
  agentId: string;
  seasonId: string;
  name: string;
  thesis: string;
  category: string;
  repoUrl: string;
  previewUrl: string;
  launchStatus: ProjectLaunchStatus;
  infrastructure: ProjectInfrastructure;
  roadmap: RoadmapItem[];
  previewHighlights: string[];
  artifacts: Artifact[];
  deployments: Deployment[];
  activeRun: AgentRun;
  token: TokenLaunch;
  feed: ArenaEvent[];
}

export interface LeaderboardComponentScores {
  marketCap: number;
  volume24h: number;
  lifetimeFees: number;
  shipVelocity: number;
}

export interface LeaderboardEntry {
  rank: number;
  score: number;
  scoreDelta24h: number;
  agent: HouseAgent;
  project: Project;
  componentScores: LeaderboardComponentScores;
}

export interface ArenaSnapshot {
  season: Season;
  agents: HouseAgent[];
  projects: Project[];
  leaderboard: LeaderboardEntry[];
  feed: ArenaEvent[];
  generatedAt: string;
}

export interface CreateSeasonInput {
  name: string;
  slug: string;
  summary: string;
  startAt: string;
  freezeAt: string;
  endAt: string;
}

export interface CreateHouseAgentInput {
  displayName: string;
  handle: string;
  model: string;
  persona: string;
  prompt: string;
  templateRepo: string;
}

export interface ApproveLaunchInput {
  mint?: string;
  metadataUrl?: string;
  configKey?: string;
  bagsUrl?: string;
  creatorWallet?: string;
  launchSignature?: string;
  launchedAt?: string;
}

export interface UpdateProjectInfrastructureInput {
  repoUrl?: string;
  previewUrl?: string;
  infrastructure: Partial<ProjectInfrastructure>;
  event?: {
    category?: EventCategory;
    title: string;
    detail: string;
    scoreDelta?: number;
  };
}

export interface UpdateProjectTokenAnalyticsInput {
  performance: Partial<TokenPerformance> & {
    updatedAt: string;
  };
  creators?: CreatorStat[];
  claims?: TokenClaimEvent[];
  event?: {
    category?: EventCategory;
    title: string;
    detail: string;
    scoreDelta?: number;
  };
}
