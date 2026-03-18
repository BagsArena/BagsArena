import {
  ArtifactType as PrismaArtifactType,
  EventCategory as PrismaEventCategory,
  LaunchStatus as PrismaLaunchStatus,
  Prisma,
  RunOutcome as PrismaRunOutcome,
  RunPhase as PrismaRunPhase,
  SeasonStatus as PrismaSeasonStatus,
} from "@prisma/client";

import type { ApplyAgentCycleInput } from "@/lib/agents/types";
import { prisma } from "@/lib/db";
import { createHouseAgentFromInput, createMockArenaSnapshot } from "@/lib/arena/mock-data";
import {
  applyAgentRuntimeConfig,
  applyTokenRuntimeConfig,
} from "@/lib/arena/runtime-config";
import { resolveProjectPreviewUrl } from "@/lib/arena/preview";
import { buildLeaderboard, deriveSeasonStatus } from "@/lib/arena/score";
import type {
  AgentRun,
  ApproveLaunchInput,
  ArenaEvent,
  ArenaSnapshot,
  Artifact,
  CreateHouseAgentInput,
  CreateSeasonInput,
  Deployment,
  HouseAgent,
  LeaderboardEntry,
  Project,
  ProjectInfrastructure,
  ProjectLaunchStatus,
  Season,
  TokenLaunch,
  UpdateProjectInfrastructureInput,
  UpdateProjectTokenAnalyticsInput,
} from "@/lib/arena/types";
import { env } from "@/lib/env";
import { slugify } from "@/lib/utils";
import type {
  GitHubPushWebhook,
  GitHubWebhookResult,
  VercelDeploymentWebhook,
  VercelWebhookResult,
} from "@/lib/webhooks/types";

const projectInclude = {
  agent: true,
  runs: {
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
  },
  artifacts: {
    orderBy: {
      createdAt: "desc",
    },
  },
  deployments: {
    orderBy: {
      createdAt: "desc",
    },
  },
  tokenLaunch: true,
  events: {
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
  },
} satisfies Prisma.ProjectInclude;

type ProjectRecord = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

let databaseState: "unknown" | "ready" | "failed" = "unknown";
let databaseReadyPromise: Promise<boolean> | null = null;

function fromSnakeCase<T extends string>(value: string): T {
  return value.replace(/_/g, "-") as T;
}

function toSnakeCase<T extends string>(value: string): T {
  return value.replace(/-/g, "_") as T;
}

function toSeasonStatus(status: PrismaSeasonStatus): Season["status"] {
  return status;
}

function toLaunchStatus(status: PrismaLaunchStatus): ProjectLaunchStatus {
  return fromSnakeCase<ProjectLaunchStatus>(status);
}

function fromLaunchStatus(status: ProjectLaunchStatus): PrismaLaunchStatus {
  return toSnakeCase<PrismaLaunchStatus>(status);
}

function toRunPhase(phase: PrismaRunPhase): AgentRun["phase"] {
  return fromSnakeCase<AgentRun["phase"]>(phase);
}

function fromRunPhase(phase: AgentRun["phase"]): PrismaRunPhase {
  return toSnakeCase<PrismaRunPhase>(phase);
}

function toRunOutcome(outcome: PrismaRunOutcome): AgentRun["outcome"] {
  return outcome;
}

function fromRunOutcome(outcome: AgentRun["outcome"]): PrismaRunOutcome {
  return outcome;
}

function toArtifactType(type: PrismaArtifactType): Artifact["type"] {
  return fromSnakeCase<Artifact["type"]>(type);
}

function fromArtifactType(type: Artifact["type"]): PrismaArtifactType {
  return toSnakeCase<PrismaArtifactType>(type);
}

function toEventCategory(category: PrismaEventCategory): ArenaEvent["category"] {
  return category;
}

function fromEventCategory(category: ArenaEvent["category"]): PrismaEventCategory {
  return category;
}

function readJson<T>(value: Prisma.JsonValue, fallback: T): T {
  return (value ?? fallback) as T;
}

function asJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function mergePreviewHighlights(
  existing: string[],
  incoming: string[],
) {
  return [...incoming, ...existing].filter((value, index, values) => {
    return values.indexOf(value) === index;
  }).slice(0, 5);
}

function applyTokenPerformanceDelta(
  performance: TokenLaunch["performance"],
  input: ApplyAgentCycleInput,
) {
  if (!input.tokenDelta) {
    return performance;
  }

  return {
    ...performance,
    marketCap: Math.max(0, performance.marketCap + input.tokenDelta.marketCap),
    volume24h: Math.max(0, performance.volume24h + input.tokenDelta.volume24h),
    lifetimeFees: Math.max(0, performance.lifetimeFees + input.tokenDelta.lifetimeFees),
    priceUsd: Math.max(0.0001, performance.priceUsd + input.tokenDelta.priceUsd),
    claimCount: Math.max(0, performance.claimCount + input.tokenDelta.claimCount),
    priceChange24h: performance.priceChange24h + input.tokenDelta.priceChange24h,
    holders: Math.max(0, performance.holders + input.tokenDelta.holders),
    sparkline: [
      ...performance.sparkline.slice(-6),
      input.tokenDelta.sparklinePoint ?? performance.priceUsd,
    ],
    updatedAt: input.endedAt,
  };
}

function readProjectInfrastructure(value: Prisma.JsonValue): ProjectInfrastructure {
  return readJson(value, {
    status: "local-only",
    notes: [],
  });
}

function mergeInfrastructure(
  existing: ProjectInfrastructure,
  patch: Partial<ProjectInfrastructure>,
) {
  return {
    ...existing,
    ...patch,
    notes: patch.notes ?? existing.notes,
  };
}

function mergeTokenPerformance(
  existing: TokenLaunch["performance"],
  patch: UpdateProjectTokenAnalyticsInput["performance"],
) {
  const sparkline = patch.sparkline ?? existing.sparkline;

  return {
    ...existing,
    ...patch,
    sparkline: sparkline.length > 0 ? sparkline.slice(-12) : existing.sparkline,
  };
}

function mapSeason(record: {
  id: string;
  name: string;
  slug: string;
  status: PrismaSeasonStatus;
  startAt: Date;
  freezeAt: Date;
  endAt: Date;
  summary: string;
}): Season {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    status: toSeasonStatus(record.status),
    startAt: record.startAt.toISOString(),
    freezeAt: record.freezeAt.toISOString(),
    endAt: record.endAt.toISOString(),
    summary: record.summary,
  };
}

function mapHouseAgent(record: {
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
}): HouseAgent {
  return applyAgentRuntimeConfig({
    id: record.id,
    slug: record.slug,
    displayName: record.displayName,
    handle: record.handle,
    color: record.color,
    accent: record.accent,
    model: record.model,
    persona: record.persona,
    prompt: record.prompt,
    walletLabel: record.walletLabel,
    walletAddress: record.walletAddress,
    repoOwner: record.repoOwner,
    templateRepo: record.templateRepo,
  });
}

function mapArenaEvent(record: {
  id: string;
  projectId: string;
  title: string;
  detail: string;
  category: PrismaEventCategory;
  createdAt: Date;
  scoreDelta: number | null;
  project?: {
    agentId: string;
  };
  agentId?: string;
}): ArenaEvent {
  return {
    id: record.id,
    agentId: record.project?.agentId ?? record.agentId ?? "unknown-agent",
    projectId: record.projectId,
    category: toEventCategory(record.category),
    title: record.title,
    detail: record.detail,
    createdAt: record.createdAt.toISOString(),
    scoreDelta: record.scoreDelta ?? undefined,
  };
}

function mapProject(record: ProjectRecord): Project {
  const tokenRecord = record.tokenLaunch;
  const runRecord = record.runs[0];
  const agent = mapHouseAgent(record.agent);
  const infrastructure = readProjectInfrastructure(record.infrastructure);

  if (!tokenRecord || !runRecord) {
    throw new Error(`Project ${record.slug} is missing required launch/run state.`);
  }

  const token = applyTokenRuntimeConfig({
    id: tokenRecord.id,
    mint: tokenRecord.mint,
    symbol: tokenRecord.symbol,
    name: tokenRecord.name,
    description: tokenRecord.description,
    metadataUrl: tokenRecord.metadataUrl,
    bagsUrl: tokenRecord.bagsUrl,
    configKey: tokenRecord.configKey,
    partnerKey: tokenRecord.partnerKey,
    creatorWallet: tokenRecord.creatorWallet,
    launchSignature: tokenRecord.launchSignature,
    launchedAt: tokenRecord.launchedAt.toISOString(),
    status: toLaunchStatus(tokenRecord.status),
    performance: readJson(tokenRecord.performance, {
      priceUsd: 0,
      marketCap: 0,
      volume24h: 0,
      lifetimeFees: 0,
      claimCount: 0,
      priceChange24h: 0,
      holders: 0,
      sparkline: [],
      updatedAt: new Date(0).toISOString(),
    }),
    creators: readJson(tokenRecord.creators, []),
    claims: readJson(tokenRecord.claims, []),
  }, agent);

  return {
    id: record.id,
    slug: record.slug,
    agentId: record.agentId,
    seasonId: record.seasonId,
    name: record.name,
    thesis: record.thesis,
    category: record.category,
    repoUrl: record.repoUrl,
    previewUrl: resolveProjectPreviewUrl(record.slug, record.previewUrl, infrastructure),
    launchStatus: toLaunchStatus(record.launchStatus),
    infrastructure,
    roadmap: readJson(record.roadmap, []),
    previewHighlights: readJson(record.previewNotes, []),
    artifacts: record.artifacts.map(
      (artifact): Artifact => ({
        id: artifact.id,
        type: toArtifactType(artifact.type),
        label: artifact.label,
        url: artifact.url,
        createdAt: artifact.createdAt.toISOString(),
      }),
    ),
    deployments: record.deployments.map(
      (deployment): Deployment => ({
        id: deployment.id,
        sha: deployment.sha,
        branch: deployment.branch,
        previewUrl: resolveProjectPreviewUrl(
          record.slug,
          deployment.previewUrl,
          infrastructure,
        ),
        status: deployment.status as Deployment["status"],
        durationSeconds: deployment.durationSeconds,
        screenshotLabel: deployment.screenshotLabel,
        createdAt: deployment.createdAt.toISOString(),
      }),
    ),
    activeRun: {
      id: runRecord.id,
      phase: toRunPhase(runRecord.phase),
      outcome: toRunOutcome(runRecord.outcome),
      objective: runRecord.objective,
      promptSnapshot: runRecord.promptSnapshot,
      startedAt: runRecord.startedAt.toISOString(),
      endedAt: runRecord.endedAt.toISOString(),
      terminal: readJson(runRecord.terminal, []),
      mergedCommits24h: runRecord.mergedCommits24h,
      completedTasks24h: runRecord.completedTasks24h,
      successfulDeploys24h: runRecord.successfulDeploys24h,
    },
    token,
    feed: record.events.map((event) =>
      mapArenaEvent({
        ...event,
        agentId: record.agentId,
      }),
    ),
  };
}

async function seedDatabaseFromSnapshot() {
  const snapshot = createMockArenaSnapshot();

  await prisma.$transaction(async (tx) => {
    await tx.season.create({
      data: {
        id: snapshot.season.id,
        name: snapshot.season.name,
        slug: snapshot.season.slug,
        status: snapshot.season.status,
        summary: snapshot.season.summary,
        startAt: new Date(snapshot.season.startAt),
        freezeAt: new Date(snapshot.season.freezeAt),
        endAt: new Date(snapshot.season.endAt),
      },
    });

    await tx.houseAgent.createMany({
      data: snapshot.agents.map((agent) => ({
        id: agent.id,
        slug: agent.slug,
        displayName: agent.displayName,
        handle: agent.handle,
        color: agent.color,
        accent: agent.accent,
        model: agent.model,
        persona: agent.persona,
        prompt: agent.prompt,
        walletLabel: agent.walletLabel,
        walletAddress: agent.walletAddress,
        repoOwner: agent.repoOwner,
        templateRepo: agent.templateRepo,
      })),
    });

    for (const project of snapshot.projects) {
      await tx.project.create({
        data: {
          id: project.id,
          slug: project.slug,
          name: project.name,
          thesis: project.thesis,
          category: project.category,
          repoUrl: project.repoUrl,
          previewUrl: project.previewUrl,
          launchStatus: fromLaunchStatus(project.launchStatus),
          infrastructure: asJsonValue(project.infrastructure),
          previewNotes: asJsonValue(project.previewHighlights),
          roadmap: asJsonValue(project.roadmap),
          seasonId: project.seasonId,
          agentId: project.agentId,
        },
      });

      await tx.agentRun.create({
        data: {
          id: project.activeRun.id,
          phase: fromRunPhase(project.activeRun.phase),
          outcome: fromRunOutcome(project.activeRun.outcome),
          objective: project.activeRun.objective,
          promptSnapshot: project.activeRun.promptSnapshot,
          terminal: asJsonValue(project.activeRun.terminal),
          mergedCommits24h: project.activeRun.mergedCommits24h,
          completedTasks24h: project.activeRun.completedTasks24h,
          successfulDeploys24h: project.activeRun.successfulDeploys24h,
          startedAt: new Date(project.activeRun.startedAt),
          endedAt: new Date(project.activeRun.endedAt),
          projectId: project.id,
          createdAt: new Date(project.activeRun.startedAt),
        },
      });

      if (project.artifacts.length > 0) {
        await tx.artifact.createMany({
          data: project.artifacts.map((artifact) => ({
            id: artifact.id,
            type: fromArtifactType(artifact.type),
            label: artifact.label,
            url: artifact.url,
            projectId: project.id,
            createdAt: new Date(artifact.createdAt),
          })),
        });
      }

      if (project.deployments.length > 0) {
        await tx.deployment.createMany({
          data: project.deployments.map((deployment) => ({
            id: deployment.id,
            sha: deployment.sha,
            branch: deployment.branch,
            previewUrl: deployment.previewUrl,
            status: deployment.status,
            durationSeconds: deployment.durationSeconds,
            screenshotLabel: deployment.screenshotLabel,
            projectId: project.id,
            createdAt: new Date(deployment.createdAt),
          })),
        });
      }

      await tx.tokenLaunch.create({
        data: {
          id: project.token.id,
          mint: project.token.mint,
          symbol: project.token.symbol,
          name: project.token.name,
          description: project.token.description,
          metadataUrl: project.token.metadataUrl,
          bagsUrl: project.token.bagsUrl,
          configKey: project.token.configKey,
          partnerKey: project.token.partnerKey,
          creatorWallet: project.token.creatorWallet,
          launchSignature: project.token.launchSignature,
          launchedAt: new Date(project.token.launchedAt),
          status: fromLaunchStatus(project.token.status),
          performance: asJsonValue(project.token.performance),
          creators: asJsonValue(project.token.creators),
          claims: asJsonValue(project.token.claims),
          projectId: project.id,
        },
      });

      await tx.metricSnapshot.create({
        data: {
          mint: project.token.mint,
          marketCap: project.token.performance.marketCap,
          volume24h: project.token.performance.volume24h,
          lifetimeFees: project.token.performance.lifetimeFees,
          priceUsd: project.token.performance.priceUsd,
          claimCount: project.token.performance.claimCount,
          recordedAt: new Date(project.token.performance.updatedAt),
        },
      });
    }

    if (snapshot.feed.length > 0) {
      await tx.arenaEvent.createMany({
        data: snapshot.feed.map((event) => ({
          id: event.id,
          category: fromEventCategory(event.category),
          title: event.title,
          detail: event.detail,
          scoreDelta: event.scoreDelta ?? null,
          createdAt: new Date(event.createdAt),
          projectId: event.projectId,
        })),
      });
    }

    if (snapshot.leaderboard.length > 0) {
      await tx.scoreSnapshot.createMany({
        data: snapshot.leaderboard.map((entry) => ({
          seasonId: snapshot.season.id,
          agentId: entry.agent.id,
          score: entry.score,
          marketCap: entry.componentScores.marketCap,
          volume24h: entry.componentScores.volume24h,
          lifetimeFees: entry.componentScores.lifetimeFees,
          shipVelocity: entry.componentScores.shipVelocity,
          recordedAt: new Date(snapshot.generatedAt),
        })),
      });
    }
  });
}

async function ensureDatabaseReady() {
  if (!env.databaseUrl) {
    return false;
  }

  if (databaseState === "ready") {
    return true;
  }

  if (databaseState === "failed") {
    return false;
  }

  if (!databaseReadyPromise) {
    databaseReadyPromise = (async () => {
      try {
        const seasonCount = await prisma.season.count();
        if (seasonCount === 0) {
          await seedDatabaseFromSnapshot();
        }
        databaseState = "ready";
        return true;
      } catch (error) {
        console.warn("[bags-arena] Prisma repository unavailable, falling back to mock data.", error);
        databaseState = "failed";
        return false;
      }
    })();
  }

  return databaseReadyPromise;
}

async function getCurrentSeasonRecord() {
  return prisma.season.findFirst({
    orderBy: [{ startAt: "desc" }, { createdAt: "desc" }],
  });
}

async function getProjectsForSeason(seasonId: string) {
  return prisma.project.findMany({
    where: {
      seasonId,
    },
    orderBy: [{ createdAt: "asc" }],
    include: projectInclude,
  });
}

async function getArenaFeedRecords() {
  return prisma.arenaEvent.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 20,
    include: {
      project: {
        select: {
          id: true,
          agentId: true,
        },
      },
    },
  });
}

async function findProjectRecordByRepoReference(
  repositoryUrl: string,
  repositoryFullName: string,
) {
  return prisma.project.findFirst({
    where: {
      OR: [
        {
          repoUrl: repositoryUrl,
        },
        {
          repoUrl: {
            endsWith: repositoryFullName,
          },
        },
        {
          slug: repositoryFullName.split("/").at(-1),
        },
      ],
    },
    include: projectInclude,
  });
}

async function findProjectRecordByDeploymentReference(
  previewUrl: string,
  projectName: string,
  repositoryFullName?: string,
) {
  const previewHost = new URL(previewUrl).host;
  const slug = slugify(projectName);

  return prisma.project.findFirst({
    where: {
      OR: [
        {
          previewUrl: {
            contains: previewHost,
          },
        },
        {
          previewUrl: {
            contains: projectName,
          },
        },
        {
          slug,
        },
        ...(repositoryFullName
          ? [
              {
                repoUrl: {
                  endsWith: repositoryFullName,
                },
              },
            ]
          : []),
      ],
    },
    include: projectInclude,
  });
}

export async function canUsePrismaArenaRepository() {
  return ensureDatabaseReady();
}

export const prismaArenaRepository = {
  async getSnapshot(): Promise<ArenaSnapshot> {
    const seasonRecord = await getCurrentSeasonRecord();
    if (!seasonRecord) {
      throw new Error("No season found in persistence layer.");
    }

    const [projectRecords, feedRecords] = await Promise.all([
      getProjectsForSeason(seasonRecord.id),
      getArenaFeedRecords(),
    ]);

    const season = mapSeason(seasonRecord);
    season.status = deriveSeasonStatus(new Date(), season);

    const projects = projectRecords.map(mapProject);
    const agents = projectRecords.map((record) => mapHouseAgent(record.agent));
    const leaderboard = buildLeaderboard(
      projects,
      new Map(agents.map((agent) => [agent.id, agent])),
    );

    return {
      season,
      agents,
      projects,
      leaderboard,
      feed: feedRecords.map((event) => mapArenaEvent(event)),
      generatedAt: new Date().toISOString(),
    };
  },

  async getCurrentSeason(): Promise<Season> {
    const seasonRecord = await getCurrentSeasonRecord();
    if (!seasonRecord) {
      throw new Error("No season found in persistence layer.");
    }

    const season = mapSeason(seasonRecord);
    season.status = deriveSeasonStatus(new Date(), season);
    return season;
  },

  async getSeasonBySlug(slug: string): Promise<Season | null> {
    const seasonRecord = await prisma.season.findUnique({
      where: {
        slug,
      },
    });

    if (!seasonRecord) {
      return null;
    }

    const season = mapSeason(seasonRecord);
    season.status = deriveSeasonStatus(new Date(), season);
    return season;
  },

  async getLeaderboard(slug: string): Promise<LeaderboardEntry[]> {
    const seasonRecord = await prisma.season.findUnique({
      where: {
        slug,
      },
    });

    if (!seasonRecord) {
      return [];
    }

    const projectRecords = await getProjectsForSeason(seasonRecord.id);
    const projects = projectRecords.map(mapProject);
    const agents = projectRecords.map((record) => mapHouseAgent(record.agent));

    return buildLeaderboard(
      projects,
      new Map(agents.map((agent) => [agent.id, agent])),
    );
  },

  async getProjectBySlug(slug: string): Promise<Project | null> {
    const projectRecord = await prisma.project.findUnique({
      where: {
        slug,
      },
      include: projectInclude,
    });

    return projectRecord ? mapProject(projectRecord) : null;
  },

  async getTokenByMint(mint: string): Promise<TokenLaunch | null> {
    const tokenRecord = await prisma.tokenLaunch.findUnique({
      where: {
        mint,
      },
    });

    if (!tokenRecord) {
      return null;
    }

    return {
      id: tokenRecord.id,
      mint: tokenRecord.mint,
      symbol: tokenRecord.symbol,
      name: tokenRecord.name,
      description: tokenRecord.description,
      metadataUrl: tokenRecord.metadataUrl,
      bagsUrl: tokenRecord.bagsUrl,
      configKey: tokenRecord.configKey,
      partnerKey: tokenRecord.partnerKey,
      creatorWallet: tokenRecord.creatorWallet,
      launchSignature: tokenRecord.launchSignature,
      launchedAt: tokenRecord.launchedAt.toISOString(),
      status: toLaunchStatus(tokenRecord.status),
      performance: readJson(tokenRecord.performance, {
        priceUsd: 0,
        marketCap: 0,
        volume24h: 0,
        lifetimeFees: 0,
        claimCount: 0,
        priceChange24h: 0,
        holders: 0,
        sparkline: [],
        updatedAt: new Date(0).toISOString(),
      }),
      creators: readJson(tokenRecord.creators, []),
      claims: readJson(tokenRecord.claims, []),
    };
  },

  async getArenaFeed(): Promise<ArenaEvent[]> {
    return (await getArenaFeedRecords()).map((event) => mapArenaEvent(event));
  },

  async getProjectFeed(slug: string): Promise<ArenaEvent[]> {
    const project = await prisma.project.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
        agentId: true,
        events: {
          orderBy: [{ createdAt: "desc" }],
          take: 12,
        },
      },
    });

    if (!project) {
      return [];
    }

    return project.events.map((event) =>
      mapArenaEvent({
        ...event,
        projectId: project.id,
        agentId: project.agentId,
      }),
    );
  },

  async createSeason(input: CreateSeasonInput): Promise<Season> {
    const season = await prisma.season.upsert({
      where: {
        slug: slugify(input.slug),
      },
      update: {
        name: input.name,
        summary: input.summary,
        startAt: new Date(input.startAt),
        freezeAt: new Date(input.freezeAt),
        endAt: new Date(input.endAt),
        status: deriveSeasonStatus(new Date(), input),
      },
      create: {
        name: input.name,
        slug: slugify(input.slug),
        summary: input.summary,
        startAt: new Date(input.startAt),
        freezeAt: new Date(input.freezeAt),
        endAt: new Date(input.endAt),
        status: deriveSeasonStatus(new Date(), input),
      },
    });

    const anchorProject = await prisma.project.findFirst({
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
      },
    });

    if (anchorProject) {
      await prisma.arenaEvent.create({
        data: {
          category: PrismaEventCategory.admin,
          title: "Season reconfigured",
          detail: `Admin created ${input.name} (${input.slug}).`,
          projectId: anchorProject.id,
        },
      });
    }

    const mapped = mapSeason(season);
    mapped.status = deriveSeasonStatus(new Date(), mapped);
    return mapped;
  },

  async createHouseAgent(input: CreateHouseAgentInput): Promise<HouseAgent> {
    const count = await prisma.houseAgent.count();
    if (count >= 4) {
      throw new Error("The first version is locked to 4 house agents.");
    }

    const agent = createHouseAgentFromInput(input, count);
    const record = await prisma.houseAgent.create({
      data: {
        id: agent.id,
        slug: agent.slug,
        displayName: agent.displayName,
        handle: agent.handle,
        color: agent.color,
        accent: agent.accent,
        model: agent.model,
        persona: agent.persona,
        prompt: agent.prompt,
        walletLabel: agent.walletLabel,
        walletAddress: agent.walletAddress,
        repoOwner: agent.repoOwner,
        templateRepo: agent.templateRepo,
      },
    });

    return mapHouseAgent(record);
  },

  async approveLaunch(
    projectId: string,
    input?: ApproveLaunchInput,
  ): Promise<Project> {
    const now = new Date(input?.launchedAt ?? Date.now());

    await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: {
          id: projectId,
        },
        include: {
          tokenLaunch: true,
        },
      });

      if (!project?.tokenLaunch) {
        throw new Error("Project not found.");
      }

      const performance = readJson(project.tokenLaunch.performance, {
        priceUsd: 0,
        marketCap: 0,
        volume24h: 0,
        lifetimeFees: 0,
        claimCount: 0,
        priceChange24h: 0,
        holders: 0,
        sparkline: [],
        updatedAt: now.toISOString(),
      });

      const updatedPerformance = {
        ...performance,
        marketCap: Number(performance.marketCap) + 68000,
        volume24h: Number(performance.volume24h) + 24000,
        priceChange24h: Number(performance.priceChange24h) + 3.2,
        updatedAt: now.toISOString(),
      };

      await tx.project.update({
        where: {
          id: projectId,
        },
        data: {
          launchStatus: PrismaLaunchStatus.live,
        },
      });

      await tx.tokenLaunch.update({
        where: {
          projectId,
        },
        data: {
          status: PrismaLaunchStatus.live,
          launchedAt: now,
          mint: input?.mint ?? project.tokenLaunch.mint,
          metadataUrl: input?.metadataUrl ?? project.tokenLaunch.metadataUrl,
          configKey: input?.configKey ?? project.tokenLaunch.configKey,
          bagsUrl: input?.bagsUrl ?? project.tokenLaunch.bagsUrl,
          creatorWallet: input?.creatorWallet ?? project.tokenLaunch.creatorWallet,
          launchSignature:
            input?.launchSignature ?? `launch-${project.slug}-${now.valueOf()}`,
          performance: asJsonValue(updatedPerformance),
        },
      });

      await tx.metricSnapshot.create({
        data: {
          mint: project.tokenLaunch.mint,
          marketCap: updatedPerformance.marketCap,
          volume24h: updatedPerformance.volume24h,
          lifetimeFees: Number(performance.lifetimeFees),
          priceUsd: Number(performance.priceUsd),
          claimCount: Number(performance.claimCount),
          recordedAt: now,
        },
      });

      await tx.arenaEvent.create({
        data: {
          category: PrismaEventCategory.token,
          title: "Mainnet launch approved",
          detail: `${project.name} is now live on Bags with an operator-approved launch transaction.`,
          scoreDelta: 2.7,
          projectId,
        },
      });
    });

    const updated = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: projectInclude,
    });

    if (!updated) {
      throw new Error("Project not found after launch approval.");
    }

    return mapProject(updated);
  },

  async retryRun(runId: string): Promise<AgentRun> {
    const now = new Date();

    const run = await prisma.agentRun.findUnique({
      where: {
        id: runId,
      },
      include: {
        project: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!run) {
      throw new Error("Run not found.");
    }

    const updatedRun = await prisma.agentRun.update({
      where: {
        id: runId,
      },
      data: {
        startedAt: now,
        phase: PrismaRunPhase.coding,
        outcome: PrismaRunOutcome.healthy,
        terminal: asJsonValue([
          "$ git checkout main",
          "$ pnpm lint",
          "Lint clean after retry.",
          "$ pnpm build",
          "Rebuild queued for the latest patch.",
        ]),
        mergedCommits24h: run.mergedCommits24h + 1,
        successfulDeploys24h: run.successfulDeploys24h + 1,
      },
    });

    await prisma.arenaEvent.create({
      data: {
        category: PrismaEventCategory.admin,
        title: "Run retried",
        detail: `Admin retried ${run.objective.toLowerCase()}.`,
        scoreDelta: 0.4,
        projectId: run.project.id,
      },
    });

    return {
      id: updatedRun.id,
      phase: toRunPhase(updatedRun.phase),
      outcome: toRunOutcome(updatedRun.outcome),
      objective: updatedRun.objective,
      promptSnapshot: updatedRun.promptSnapshot,
      startedAt: updatedRun.startedAt.toISOString(),
      endedAt: updatedRun.endedAt.toISOString(),
      terminal: readJson(updatedRun.terminal, []),
      mergedCommits24h: updatedRun.mergedCommits24h,
      completedTasks24h: updatedRun.completedTasks24h,
      successfulDeploys24h: updatedRun.successfulDeploys24h,
    };
  },

  async updateProjectInfrastructure(
    projectId: string,
    input: UpdateProjectInfrastructureInput,
  ): Promise<Project> {
    const projectRecord = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: projectInclude,
    });

    if (!projectRecord) {
      throw new Error("Project not found.");
    }

    const project = mapProject(projectRecord);
    const infrastructure = mergeInfrastructure(
      project.infrastructure,
      input.infrastructure,
    );

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: {
          id: projectId,
        },
        data: {
          repoUrl: input.repoUrl ?? project.repoUrl,
          previewUrl: input.previewUrl ?? project.previewUrl,
          infrastructure: asJsonValue(infrastructure),
        },
      });

      if (input.event) {
        await tx.arenaEvent.create({
          data: {
            category: fromEventCategory(input.event.category ?? "admin"),
            title: input.event.title,
            detail: input.event.detail,
            scoreDelta: input.event.scoreDelta ?? null,
            projectId,
          },
        });
      }
    });

    const updated = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: projectInclude,
    });

    if (!updated) {
      throw new Error("Project not found after infrastructure update.");
    }

    return mapProject(updated);
  },

  async updateProjectTokenAnalytics(
    projectId: string,
    input: UpdateProjectTokenAnalyticsInput,
  ): Promise<Project> {
    const projectRecord = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: projectInclude,
    });

    if (!projectRecord) {
      throw new Error("Project not found.");
    }

    const project = mapProject(projectRecord);
    const performance = mergeTokenPerformance(
      project.token.performance,
      input.performance,
    );
    const claims = input.claims ?? project.token.claims;

    await prisma.$transaction(async (tx) => {
      await tx.tokenLaunch.update({
        where: {
          projectId,
        },
        data: {
          performance: asJsonValue({
            ...performance,
            claimCount: claims.length,
          }),
          creators: asJsonValue(input.creators ?? project.token.creators),
          claims: asJsonValue(claims),
        },
      });

      await tx.metricSnapshot.create({
        data: {
          mint: project.token.mint,
          marketCap: performance.marketCap,
          volume24h: performance.volume24h,
          lifetimeFees: performance.lifetimeFees,
          priceUsd: performance.priceUsd,
          claimCount: claims.length,
          recordedAt: new Date(input.performance.updatedAt),
        },
      });

      if (input.event) {
        await tx.arenaEvent.create({
          data: {
            category: fromEventCategory(input.event.category ?? "token"),
            title: input.event.title,
            detail: input.event.detail,
            scoreDelta: input.event.scoreDelta ?? null,
            projectId,
            createdAt: new Date(input.performance.updatedAt),
          },
        });
      }
    });

    const updated = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: projectInclude,
    });

    if (!updated) {
      throw new Error("Project not found after analytics update.");
    }

    return mapProject(updated);
  },

  async applyAgentCycle(input: ApplyAgentCycleInput): Promise<Project> {
    const now = new Date(input.endedAt);

    await prisma.$transaction(async (tx) => {
      const projectRecord = await tx.project.findUnique({
        where: {
          id: input.projectId,
        },
        include: projectInclude,
      });

      if (!projectRecord) {
        throw new Error("Project not found.");
      }

      const project = mapProject(projectRecord);
      const previousRun = project.activeRun;
      const updatedPreviewHighlights = mergePreviewHighlights(
        project.previewHighlights,
        input.previewHighlightsAppend,
      );
      const updatedPerformance = applyTokenPerformanceDelta(
        project.token.performance,
        input,
      );

      await tx.project.update({
        where: {
          id: input.projectId,
        },
        data: {
          previewUrl: input.deployment?.previewUrl ?? project.previewUrl,
          launchStatus: fromLaunchStatus(input.launchStatus ?? project.launchStatus),
          roadmap: asJsonValue(
            project.roadmap.map((item) => {
              const update = input.roadmapUpdates.find((candidate) => candidate.id === item.id);
              if (!update) {
                return item;
              }

              return {
                ...item,
                status: update.status,
                detail: update.detail ?? item.detail,
                etaHours: update.etaHours ?? item.etaHours,
              };
            }),
          ),
          previewNotes: asJsonValue(updatedPreviewHighlights),
        },
      });

      await tx.agentRun.create({
        data: {
          phase: fromRunPhase(input.phase),
          outcome: fromRunOutcome(input.outcome),
          objective: input.objective,
          promptSnapshot: input.promptSnapshot,
          terminal: asJsonValue(input.terminal.slice(0, 8)),
          mergedCommits24h:
            previousRun.mergedCommits24h + input.metricsDelta.mergedCommits24h,
          completedTasks24h:
            previousRun.completedTasks24h + input.metricsDelta.completedTasks24h,
          successfulDeploys24h:
            previousRun.successfulDeploys24h + input.metricsDelta.successfulDeploys24h,
          startedAt: new Date(input.startedAt),
          endedAt: now,
          projectId: input.projectId,
          createdAt: now,
        },
      });

      if (input.artifacts.length > 0) {
        await tx.artifact.createMany({
          data: input.artifacts.map((artifact) => ({
            type: fromArtifactType(artifact.type),
            label: artifact.label,
            url: artifact.url,
            projectId: input.projectId,
            createdAt: now,
          })),
        });
      }

      if (input.deployment) {
        await tx.deployment.create({
          data: {
            sha: input.deployment.sha,
            branch: input.deployment.branch,
            previewUrl: input.deployment.previewUrl,
            status: input.deployment.status,
            durationSeconds: input.deployment.durationSeconds,
            screenshotLabel: input.deployment.screenshotLabel,
            projectId: input.projectId,
            createdAt: now,
          },
        });
      }

      await tx.tokenLaunch.update({
        where: {
          projectId: input.projectId,
        },
        data: {
          status: fromLaunchStatus(input.launchStatus ?? project.token.status),
          performance: asJsonValue(updatedPerformance),
        },
      });

      if (input.tokenDelta) {
        await tx.metricSnapshot.create({
          data: {
            mint: project.token.mint,
            marketCap: updatedPerformance.marketCap,
            volume24h: updatedPerformance.volume24h,
            lifetimeFees: updatedPerformance.lifetimeFees,
            priceUsd: updatedPerformance.priceUsd,
            claimCount: updatedPerformance.claimCount,
            recordedAt: now,
          },
        });
      }

      await tx.arenaEvent.create({
        data: {
          category: fromEventCategory(input.event.category),
          title: input.event.title,
          detail: input.event.detail,
          scoreDelta: input.event.scoreDelta ?? null,
          projectId: input.projectId,
          createdAt: now,
        },
      });
    });

    const updated = await prisma.project.findUnique({
      where: {
        id: input.projectId,
      },
      include: projectInclude,
    });

    if (!updated) {
      throw new Error("Project not found after cycle application.");
    }

    return mapProject(updated);
  },

  async recordGitHubPush(
    input: GitHubPushWebhook,
  ): Promise<GitHubWebhookResult> {
    const project = await findProjectRecordByRepoReference(
      input.repositoryUrl,
      input.repositoryFullName,
    );

    if (!project) {
      throw new Error(`No project matched GitHub repository ${input.repositoryFullName}.`);
    }

    const run = project.runs[0];
    if (!run) {
      throw new Error(`Project ${project.slug} has no active run to update.`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.agentRun.update({
        where: {
          id: run.id,
        },
        data: {
          startedAt: new Date(input.timestamp),
          phase: PrismaRunPhase.coding,
          mergedCommits24h: run.mergedCommits24h + input.commitsCount,
          terminal: asJsonValue([
            `$ github push ${input.branch}`,
            `${input.author} pushed ${input.commitsCount} commit(s) to ${project.slug}.`,
            `${input.sha.slice(0, 7)} ${input.message}`,
            ...readJson(run.terminal, []),
          ].slice(0, 8)),
        },
      });

      await tx.artifact.create({
        data: {
          id: `artifact-commit-${Date.now()}`,
          type: PrismaArtifactType.commit_diff,
          label: `Compare ${input.sha.slice(0, 7)}`,
          url: input.compareUrl,
          projectId: project.id,
          createdAt: new Date(input.timestamp),
        },
      });

      await tx.arenaEvent.create({
        data: {
          category: PrismaEventCategory.run,
          title: "GitHub push received",
          detail: `${input.author} pushed ${input.commitsCount} commit(s) to ${project.name}: ${input.message}`,
          scoreDelta: Number((input.commitsCount * 0.2).toFixed(2)),
          projectId: project.id,
          createdAt: new Date(input.timestamp),
        },
      });
    });

    return {
      ok: true,
      projectId: project.id,
      projectSlug: project.slug,
      commitsCount: input.commitsCount,
      eventTitle: "GitHub push received",
    };
  },

  async recordVercelDeployment(
    input: VercelDeploymentWebhook,
  ): Promise<VercelWebhookResult> {
    const project = await findProjectRecordByDeploymentReference(
      input.previewUrl,
      input.projectName,
      input.repositoryFullName,
    );

    if (!project) {
      throw new Error(`No project matched Vercel deployment ${input.projectName}.`);
    }

    const run = project.runs[0];
    if (!run) {
      throw new Error(`Project ${project.slug} has no active run to update.`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: {
          id: project.id,
        },
        data: {
          previewUrl: input.previewUrl,
        },
      });

      await tx.agentRun.update({
        where: {
          id: run.id,
        },
        data: {
          startedAt: new Date(input.createdAt),
          phase: PrismaRunPhase.deploying,
          outcome:
            input.status === "failed"
              ? PrismaRunOutcome.warning
              : PrismaRunOutcome.healthy,
          successfulDeploys24h:
            run.successfulDeploys24h + (input.status === "ready" ? 1 : 0),
          terminal: asJsonValue([
            `$ vercel ${input.status}`,
            `${input.projectName} deployment ${input.status} (${input.sha.slice(0, 7)})`,
            input.previewUrl,
            ...readJson(run.terminal, []),
          ].slice(0, 8)),
        },
      });

      await tx.deployment.upsert({
        where: {
          id: input.deploymentId,
        },
        update: {
          sha: input.sha,
          branch: input.branch,
          previewUrl: input.previewUrl,
          status: input.status,
          durationSeconds: input.durationSeconds,
          screenshotLabel: input.message,
          projectId: project.id,
          createdAt: new Date(input.createdAt),
        },
        create: {
          id: input.deploymentId,
          sha: input.sha,
          branch: input.branch,
          previewUrl: input.previewUrl,
          status: input.status,
          durationSeconds: input.durationSeconds,
          screenshotLabel: input.message,
          projectId: project.id,
          createdAt: new Date(input.createdAt),
        },
      });

      await tx.arenaEvent.create({
        data: {
          category: PrismaEventCategory.deploy,
          title: `Vercel deployment ${input.status}`,
          detail: `${project.name} deployment ${input.status} on ${input.branch}: ${input.message}`,
          scoreDelta: input.status === "ready" ? 0.6 : 0,
          projectId: project.id,
          createdAt: new Date(input.createdAt),
        },
      });
    });

    return {
      ok: true,
      projectId: project.id,
      projectSlug: project.slug,
      deploymentId: input.deploymentId,
      status: input.status,
    };
  },
};
