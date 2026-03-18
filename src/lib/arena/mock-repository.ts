import { createHouseAgentFromInput, createMockArenaSnapshot } from "@/lib/arena/mock-data";
import { buildLeaderboard, deriveSeasonStatus } from "@/lib/arena/score";
import type { ApplyAgentCycleInput } from "@/lib/agents/types";
import type {
  AgentRun,
  ApproveLaunchInput,
  ArenaEvent,
  ArenaSnapshot,
  Artifact,
  CreateHouseAgentInput,
  CreateSeasonInput,
  LeaderboardEntry,
  Project,
  ProjectInfrastructure,
  Season,
  UpdateProjectInfrastructureInput,
  UpdateProjectTokenAnalyticsInput,
} from "@/lib/arena/types";
import { slugify } from "@/lib/utils";
import type {
  GitHubPushWebhook,
  GitHubWebhookResult,
  VercelDeploymentWebhook,
  VercelWebhookResult,
} from "@/lib/webhooks/types";

type Store = ArenaSnapshot;

const store: Store = createMockArenaSnapshot();

function createCycleArtifactId(projectId: string, index: number, input: ApplyAgentCycleInput) {
  return `artifact-cycle-${projectId}-${input.endedAt}-${index}`;
}

function createCycleRun(project: Project, input: ApplyAgentCycleInput): AgentRun {
  return {
    id: `run-${project.slug}-${new Date(input.endedAt).valueOf()}`,
    phase: input.phase,
    outcome: input.outcome,
    objective: input.objective,
    promptSnapshot: input.promptSnapshot,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    terminal: input.terminal.slice(0, 8),
    mergedCommits24h:
      project.activeRun.mergedCommits24h + input.metricsDelta.mergedCommits24h,
    completedTasks24h:
      project.activeRun.completedTasks24h + input.metricsDelta.completedTasks24h,
    successfulDeploys24h:
      project.activeRun.successfulDeploys24h + input.metricsDelta.successfulDeploys24h,
  };
}

function applyRoadmapUpdates(project: Project, input: ApplyAgentCycleInput) {
  const updateMap = new Map(input.roadmapUpdates.map((item) => [item.id, item]));

  project.roadmap = project.roadmap.map((item) => {
    const update = updateMap.get(item.id);
    if (!update) {
      return item;
    }

    return {
      ...item,
      status: update.status,
      detail: update.detail ?? item.detail,
      etaHours: update.etaHours ?? item.etaHours,
    };
  });
}

function applyTokenDelta(project: Project, input: ApplyAgentCycleInput) {
  if (!input.tokenDelta) {
    return;
  }

  const performance = project.token.performance;

  performance.marketCap = Math.max(
    0,
    performance.marketCap + input.tokenDelta.marketCap,
  );
  performance.volume24h = Math.max(
    0,
    performance.volume24h + input.tokenDelta.volume24h,
  );
  performance.lifetimeFees = Math.max(
    0,
    performance.lifetimeFees + input.tokenDelta.lifetimeFees,
  );
  performance.priceUsd = Math.max(0.0001, performance.priceUsd + input.tokenDelta.priceUsd);
  performance.claimCount = Math.max(0, performance.claimCount + input.tokenDelta.claimCount);
  performance.priceChange24h += input.tokenDelta.priceChange24h;
  performance.holders = Math.max(0, performance.holders + input.tokenDelta.holders);
  performance.sparkline = [
    ...performance.sparkline.slice(-6),
    input.tokenDelta.sparklinePoint ?? performance.priceUsd,
  ];
  performance.updatedAt = input.endedAt;
}

function mergeInfrastructure(
  existing: ProjectInfrastructure,
  patch: Partial<ProjectInfrastructure>,
): ProjectInfrastructure {
  return {
    ...existing,
    ...patch,
    notes: patch.notes ?? existing.notes,
  };
}

function mergeTokenPerformance(
  existing: Project["token"]["performance"],
  patch: UpdateProjectTokenAnalyticsInput["performance"],
) {
  const sparkline = patch.sparkline ?? existing.sparkline;

  return {
    ...existing,
    ...patch,
    sparkline: sparkline.length > 0 ? sparkline.slice(-12) : existing.sparkline,
  };
}

function refreshDerivedState() {
  store.season.status = deriveSeasonStatus(new Date(), store.season);
  store.leaderboard = buildLeaderboard(
    store.projects,
    new Map(store.agents.map((agent) => [agent.id, agent])),
  );
  store.generatedAt = new Date().toISOString();
}

function attachEvent(event: ArenaEvent) {
  store.feed = [event, ...store.feed].slice(0, 20);

  const project = store.projects.find((candidate) => candidate.id === event.projectId);
  if (project) {
    project.feed = [event, ...project.feed].slice(0, 12);
  }
}

function findProjectByRepoReference(repositoryUrl: string, repositoryFullName: string) {
  return store.projects.find(
    (candidate) =>
      candidate.repoUrl === repositoryUrl ||
      candidate.repoUrl.endsWith(repositoryFullName) ||
      candidate.slug === repositoryFullName.split("/").at(-1),
  );
}

function findProjectByDeploymentReference(
  previewUrl: string,
  projectName: string,
  repositoryFullName?: string,
) {
  const previewHost = new URL(previewUrl).host;

  return store.projects.find((candidate) => {
    const candidateHost = new URL(candidate.previewUrl).host;
    return (
      candidateHost === previewHost ||
      candidate.previewUrl.includes(projectName) ||
      candidate.slug === projectName ||
      (repositoryFullName
        ? candidate.repoUrl.endsWith(repositoryFullName)
        : false)
    );
  });
}

export const mockArenaRepository = {
  async getSnapshot(): Promise<ArenaSnapshot> {
    refreshDerivedState();
    return structuredClone(store);
  },

  async getCurrentSeason(): Promise<Season> {
    refreshDerivedState();
    return structuredClone(store.season);
  },

  async getSeasonBySlug(slug: string): Promise<Season | null> {
    refreshDerivedState();
    if (store.season.slug !== slug) {
      return null;
    }

    return structuredClone(store.season);
  },

  async getLeaderboard(slug: string): Promise<LeaderboardEntry[]> {
    refreshDerivedState();
    if (store.season.slug !== slug) {
      return [];
    }

    return structuredClone(store.leaderboard);
  },

  async getProjectBySlug(slug: string): Promise<Project | null> {
    refreshDerivedState();
    const project = store.projects.find((candidate) => candidate.slug === slug);
    return project ? structuredClone(project) : null;
  },

  async getTokenByMint(mint: string) {
    refreshDerivedState();
    const project = store.projects.find((candidate) => candidate.token.mint === mint);
    return project ? structuredClone(project.token) : null;
  },

  async getArenaFeed() {
    refreshDerivedState();
    return structuredClone(store.feed);
  },

  async getProjectFeed(slug: string) {
    refreshDerivedState();
    const project = store.projects.find((candidate) => candidate.slug === slug);
    return project ? structuredClone(project.feed) : [];
  },

  async createSeason(input: CreateSeasonInput) {
    store.season = {
      id: `season-${slugify(input.slug)}`,
      name: input.name,
      slug: slugify(input.slug),
      summary: input.summary,
      startAt: input.startAt,
      freezeAt: input.freezeAt,
      endAt: input.endAt,
      status: deriveSeasonStatus(new Date(), input),
    };

    attachEvent({
      id: `event-admin-season-${Date.now()}`,
      agentId: store.projects[0]?.agentId ?? store.agents[0]?.id ?? "agent-atlas",
      projectId: store.projects[0]?.id ?? "project-signal-safari",
      category: "admin",
      title: "Season reconfigured",
      detail: `Admin created ${input.name} (${input.slug}).`,
      createdAt: new Date().toISOString(),
    });

    refreshDerivedState();
    return structuredClone(store.season);
  },

  async createHouseAgent(input: CreateHouseAgentInput) {
    if (store.agents.length >= 4) {
      throw new Error("The first version is locked to 4 house agents.");
    }

    const agent = createHouseAgentFromInput(input, store.agents.length);
    store.agents.push(agent);
    refreshDerivedState();
    return structuredClone(agent);
  },

  async approveLaunch(projectId: string, input?: ApproveLaunchInput) {
    const project = store.projects.find((candidate) => candidate.id === projectId);
    if (!project) {
      throw new Error("Project not found.");
    }

    const launchedAt = input?.launchedAt ?? new Date().toISOString();

    project.launchStatus = "live";
    project.token.status = "live";
    project.token.launchedAt = launchedAt;
    project.token.mint = input?.mint ?? project.token.mint;
    project.token.metadataUrl = input?.metadataUrl ?? project.token.metadataUrl;
    project.token.configKey = input?.configKey ?? project.token.configKey;
    project.token.bagsUrl = input?.bagsUrl ?? project.token.bagsUrl;
    project.token.creatorWallet = input?.creatorWallet ?? project.token.creatorWallet;
    project.token.launchSignature =
      input?.launchSignature ?? `launch-${project.slug}-${Date.now()}`;
    project.token.performance.marketCap += 68000;
    project.token.performance.volume24h += 24000;
    project.token.performance.priceChange24h += 3.2;
    project.token.performance.updatedAt = launchedAt;

    attachEvent({
      id: `event-launch-${project.id}-${Date.now()}`,
      agentId: project.agentId,
      projectId: project.id,
      category: "token",
      title: "Mainnet launch approved",
      detail: `${project.name} is now live on Bags with an operator-approved launch transaction.`,
      createdAt: new Date().toISOString(),
      scoreDelta: 2.7,
    });

    refreshDerivedState();
    return structuredClone(project);
  },

  async retryRun(runId: string): Promise<AgentRun> {
    const project = store.projects.find((candidate) => candidate.activeRun.id === runId);
    if (!project) {
      throw new Error("Run not found.");
    }

    project.activeRun.startedAt = new Date().toISOString();
    project.activeRun.phase = "coding";
    project.activeRun.outcome = "healthy";
    project.activeRun.terminal = [
      "$ git checkout main",
      "$ pnpm lint",
      "Lint clean after retry.",
      "$ pnpm build",
      "Rebuild queued for the latest patch.",
    ];
    project.activeRun.mergedCommits24h += 1;
    project.activeRun.successfulDeploys24h += 1;

    attachEvent({
      id: `event-retry-${project.id}-${Date.now()}`,
      agentId: project.agentId,
      projectId: project.id,
      category: "admin",
      title: "Run retried",
      detail: `Admin retried ${project.activeRun.objective.toLowerCase()}.`,
      createdAt: new Date().toISOString(),
      scoreDelta: 0.4,
    });

    refreshDerivedState();
    return structuredClone(project.activeRun);
  },

  async updateProjectInfrastructure(
    projectId: string,
    input: UpdateProjectInfrastructureInput,
  ): Promise<Project> {
    const project = store.projects.find((candidate) => candidate.id === projectId);
    if (!project) {
      throw new Error("Project not found.");
    }

    if (input.repoUrl) {
      project.repoUrl = input.repoUrl;
    }

    if (input.previewUrl) {
      project.previewUrl = input.previewUrl;
    }

    project.infrastructure = mergeInfrastructure(
      project.infrastructure,
      input.infrastructure,
    );

    if (input.event) {
      attachEvent({
        id: `event-provision-${project.id}-${Date.now()}`,
        agentId: project.agentId,
        projectId: project.id,
        category: input.event.category ?? "admin",
        title: input.event.title,
        detail: input.event.detail,
        createdAt: new Date().toISOString(),
        scoreDelta: input.event.scoreDelta,
      });
    }

    refreshDerivedState();
    return structuredClone(project);
  },

  async updateProjectTokenAnalytics(
    projectId: string,
    input: UpdateProjectTokenAnalyticsInput,
  ): Promise<Project> {
    const project = store.projects.find((candidate) => candidate.id === projectId);
    if (!project) {
      throw new Error("Project not found.");
    }

    project.token.performance = mergeTokenPerformance(
      project.token.performance,
      input.performance,
    );

    if (input.creators) {
      project.token.creators = input.creators;
    }

    if (input.claims) {
      project.token.claims = input.claims;
      project.token.performance.claimCount = input.claims.length;
    }

    if (input.event) {
      attachEvent({
        id: `event-metrics-${project.id}-${Date.now()}`,
        agentId: project.agentId,
        projectId: project.id,
        category: input.event.category ?? "token",
        title: input.event.title,
        detail: input.event.detail,
        createdAt: input.performance.updatedAt,
        scoreDelta: input.event.scoreDelta,
      });
    }

    refreshDerivedState();
    return structuredClone(project);
  },

  async applyAgentCycle(input: ApplyAgentCycleInput): Promise<Project> {
    const project = store.projects.find((candidate) => candidate.id === input.projectId);
    if (!project) {
      throw new Error("Project not found.");
    }

    project.activeRun = createCycleRun(project, input);
    applyRoadmapUpdates(project, input);

    if (input.launchStatus) {
      project.launchStatus = input.launchStatus;
      project.token.status = input.launchStatus;
    }

    if (input.previewHighlightsAppend.length > 0) {
      project.previewHighlights = [
        ...input.previewHighlightsAppend,
        ...project.previewHighlights,
      ].slice(0, 5);
    }

    if (input.artifacts.length > 0) {
      project.artifacts = [
        ...input.artifacts.map(
          (artifact, index): Artifact => ({
            id: createCycleArtifactId(project.id, index, input),
            type: artifact.type,
            label: artifact.label,
            url: artifact.url,
            createdAt: input.endedAt,
          }),
        ),
        ...project.artifacts,
      ].slice(0, 12);
    }

    if (input.deployment) {
      project.previewUrl = input.deployment.previewUrl;
      project.deployments = [
        {
          id: `deployment-${project.slug}-${new Date(input.endedAt).valueOf()}`,
          sha: input.deployment.sha,
          branch: input.deployment.branch,
          previewUrl: input.deployment.previewUrl,
          status: input.deployment.status,
          durationSeconds: input.deployment.durationSeconds,
          screenshotLabel: input.deployment.screenshotLabel,
          createdAt: input.endedAt,
        },
        ...project.deployments,
      ].slice(0, 12);
    }

    applyTokenDelta(project, input);

    attachEvent({
      id: `event-cycle-${project.id}-${new Date(input.endedAt).valueOf()}`,
      agentId: project.agentId,
      projectId: project.id,
      category: input.event.category,
      title: input.event.title,
      detail: input.event.detail,
      createdAt: input.endedAt,
      scoreDelta: input.event.scoreDelta,
    });

    refreshDerivedState();
    return structuredClone(project);
  },

  async recordGitHubPush(
    input: GitHubPushWebhook,
  ): Promise<GitHubWebhookResult> {
    const project = findProjectByRepoReference(
      input.repositoryUrl,
      input.repositoryFullName,
    );

    if (!project) {
      throw new Error(`No project matched GitHub repository ${input.repositoryFullName}.`);
    }

    project.activeRun.mergedCommits24h += input.commitsCount;
    project.activeRun.startedAt = input.timestamp;
    project.activeRun.phase = "coding";
    project.activeRun.terminal = [
      `$ github push ${input.branch}`,
      `${input.author} pushed ${input.commitsCount} commit(s) to ${project.slug}.`,
      `${input.sha.slice(0, 7)} ${input.message}`,
      ...project.activeRun.terminal,
    ].slice(0, 8);

    project.artifacts = [
      {
        id: `artifact-commit-${Date.now()}`,
        type: "commit-diff",
        label: `Compare ${input.sha.slice(0, 7)}`,
        url: input.compareUrl,
        createdAt: input.timestamp,
      },
      ...project.artifacts,
    ].slice(0, 12) as Artifact[];

    const event: ArenaEvent = {
      id: `event-github-${project.id}-${Date.now()}`,
      agentId: project.agentId,
      projectId: project.id,
      category: "run",
      title: "GitHub push received",
      detail: `${input.author} pushed ${input.commitsCount} commit(s) to ${project.name}: ${input.message}`,
      createdAt: input.timestamp,
      scoreDelta: Number((input.commitsCount * 0.2).toFixed(2)),
    };

    attachEvent(event);
    refreshDerivedState();

    return {
      ok: true,
      projectId: project.id,
      projectSlug: project.slug,
      commitsCount: input.commitsCount,
      eventTitle: event.title,
    };
  },

  async recordVercelDeployment(
    input: VercelDeploymentWebhook,
  ): Promise<VercelWebhookResult> {
    const project = findProjectByDeploymentReference(
      input.previewUrl,
      input.projectName,
      input.repositoryFullName,
    );

    if (!project) {
      throw new Error(`No project matched Vercel deployment ${input.projectName}.`);
    }

    project.previewUrl = input.previewUrl;
    project.activeRun.phase = "deploying";
    project.activeRun.startedAt = input.createdAt;
    project.activeRun.outcome = input.status === "failed" ? "warning" : "healthy";
    if (input.status === "ready") {
      project.activeRun.successfulDeploys24h += 1;
    }
    project.activeRun.terminal = [
      `$ vercel ${input.status}`,
      `${input.projectName} deployment ${input.status} (${input.sha.slice(0, 7)})`,
      input.previewUrl,
      ...project.activeRun.terminal,
    ].slice(0, 8);

    const existingDeployment = project.deployments.find(
      (deployment) =>
        deployment.id === input.deploymentId || deployment.sha === input.sha,
    );

    if (existingDeployment) {
      existingDeployment.status = input.status;
      existingDeployment.previewUrl = input.previewUrl;
      existingDeployment.durationSeconds = input.durationSeconds;
      existingDeployment.createdAt = input.createdAt;
      existingDeployment.branch = input.branch;
      existingDeployment.screenshotLabel = input.message;
    } else {
      project.deployments = [
        {
          id: input.deploymentId,
          sha: input.sha,
          branch: input.branch,
          previewUrl: input.previewUrl,
          status: input.status,
          durationSeconds: input.durationSeconds,
          screenshotLabel: input.message,
          createdAt: input.createdAt,
        },
        ...project.deployments,
      ].slice(0, 12);
    }

    const event: ArenaEvent = {
      id: `event-vercel-${project.id}-${Date.now()}`,
      agentId: project.agentId,
      projectId: project.id,
      category: "deploy",
      title: `Vercel deployment ${input.status}`,
      detail: `${project.name} deployment ${input.status} on ${input.branch}: ${input.message}`,
      createdAt: input.createdAt,
      scoreDelta: input.status === "ready" ? 0.6 : 0,
    };

    attachEvent(event);
    refreshDerivedState();

    return {
      ok: true,
      projectId: project.id,
      projectSlug: project.slug,
      deploymentId: input.deploymentId,
      status: input.status,
    };
  },
};
