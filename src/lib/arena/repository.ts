import { mockArenaRepository } from "@/lib/arena/mock-repository";
import { canUsePrismaArenaRepository, prismaArenaRepository } from "@/lib/arena/prisma-repository";
import type { ApplyAgentCycleInput } from "@/lib/agents/types";
import type {
  AgentRun,
  ApproveLaunchInput,
  ArenaEvent,
  ArenaSnapshot,
  CreateHouseAgentInput,
  CreateSeasonInput,
  HouseAgent,
  LeaderboardEntry,
  Project,
  Season,
  TokenLaunch,
  UpdateProjectInfrastructureInput,
  UpdateProjectTokenAnalyticsInput,
} from "@/lib/arena/types";
import type {
  GitHubPushWebhook,
  GitHubWebhookResult,
  VercelDeploymentWebhook,
  VercelWebhookResult,
} from "@/lib/webhooks/types";

export interface ArenaRepository {
  getSnapshot(): Promise<ArenaSnapshot>;
  getCurrentSeason(): Promise<Season>;
  getSeasonBySlug(slug: string): Promise<Season | null>;
  getLeaderboard(slug: string): Promise<LeaderboardEntry[]>;
  getProjectBySlug(slug: string): Promise<Project | null>;
  getTokenByMint(mint: string): Promise<TokenLaunch | null>;
  getArenaFeed(): Promise<ArenaEvent[]>;
  getProjectFeed(slug: string): Promise<ArenaEvent[]>;
  createSeason(input: CreateSeasonInput): Promise<Season>;
  createHouseAgent(input: CreateHouseAgentInput): Promise<HouseAgent>;
  approveLaunch(projectId: string, input?: ApproveLaunchInput): Promise<Project>;
  retryRun(runId: string): Promise<AgentRun>;
  updateProjectInfrastructure(
    projectId: string,
    input: UpdateProjectInfrastructureInput,
  ): Promise<Project>;
  updateProjectTokenAnalytics(
    projectId: string,
    input: UpdateProjectTokenAnalyticsInput,
  ): Promise<Project>;
  applyAgentCycle(input: ApplyAgentCycleInput): Promise<Project>;
  recordGitHubPush(input: GitHubPushWebhook): Promise<GitHubWebhookResult>;
  recordVercelDeployment(
    input: VercelDeploymentWebhook,
  ): Promise<VercelWebhookResult>;
}

let repositoryPromise: Promise<ArenaRepository> | null = null;

async function resolveRepository(): Promise<ArenaRepository> {
  if (await canUsePrismaArenaRepository()) {
    return prismaArenaRepository;
  }

  return mockArenaRepository;
}

async function getRepository() {
  if (!repositoryPromise) {
    repositoryPromise = resolveRepository();
  }

  return repositoryPromise;
}

export const arenaRepository: ArenaRepository = {
  async getSnapshot() {
    return (await getRepository()).getSnapshot();
  },

  async getCurrentSeason() {
    return (await getRepository()).getCurrentSeason();
  },

  async getSeasonBySlug(slug) {
    return (await getRepository()).getSeasonBySlug(slug);
  },

  async getLeaderboard(slug) {
    return (await getRepository()).getLeaderboard(slug);
  },

  async getProjectBySlug(slug) {
    return (await getRepository()).getProjectBySlug(slug);
  },

  async getTokenByMint(mint) {
    return (await getRepository()).getTokenByMint(mint);
  },

  async getArenaFeed() {
    return (await getRepository()).getArenaFeed();
  },

  async getProjectFeed(slug) {
    return (await getRepository()).getProjectFeed(slug);
  },

  async createSeason(input) {
    return (await getRepository()).createSeason(input);
  },

  async createHouseAgent(input) {
    return (await getRepository()).createHouseAgent(input);
  },

  async approveLaunch(projectId, input) {
    return (await getRepository()).approveLaunch(projectId, input);
  },

  async retryRun(runId) {
    return (await getRepository()).retryRun(runId);
  },

  async updateProjectInfrastructure(projectId, input) {
    return (await getRepository()).updateProjectInfrastructure(projectId, input);
  },

  async updateProjectTokenAnalytics(projectId, input) {
    return (await getRepository()).updateProjectTokenAnalytics(projectId, input);
  },

  async applyAgentCycle(input) {
    return (await getRepository()).applyAgentCycle(input);
  },

  async recordGitHubPush(input) {
    return (await getRepository()).recordGitHubPush(input);
  },

  async recordVercelDeployment(input) {
    return (await getRepository()).recordVercelDeployment(input);
  },
};
