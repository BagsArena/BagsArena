import type { Project } from "@/lib/arena/types";
import { env } from "@/lib/env";
import type { GitHubProvisionedRepository } from "@/lib/github/client";

export interface VercelDeployResult {
  triggered: boolean;
  detail: string;
  inspectorUrl?: string;
}

export interface VercelDeploymentFile {
  file: string;
  data: string;
  encoding: "base64" | "utf-8";
}

export interface VercelProvisionedProject {
  id: string;
  name: string;
  accountId?: string;
  previewUrl: string;
  deployHookUrl?: string;
  deployHookName?: string;
  mocked: boolean;
}

function readDeployHooks() {
  if (!env.vercelDeployHooksJson) {
    return {} as Record<string, string>;
  }

  try {
    return JSON.parse(env.vercelDeployHooksJson) as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
}

function withTeamQuery() {
  if (!env.vercelTeamId) {
    return "";
  }

  return `?teamId=${encodeURIComponent(env.vercelTeamId)}`;
}

function normalizeDeploymentUrl(url?: string) {
  if (!url) {
    return undefined;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `https://${url}`;
}

function buildPublicProjectDomain(projectSlug: string) {
  if (!env.projectPublicDomainBase) {
    return undefined;
  }

  return `${projectSlug}.${env.projectPublicDomainBase}`;
}

async function vercelRequest<T>(pathname: string, init?: RequestInit) {
  const response = await fetch(`${env.vercelApiBaseUrl}${pathname}${withTeamQuery()}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.vercelToken}`,
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Vercel request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

function mapVercelProject(record: {
  id: string;
  name: string;
  accountId?: string;
  link?: {
    deployHooks?: Array<{
      name?: string;
      url?: string;
    }>;
  };
}): VercelProvisionedProject {
  const deployHook = record.link?.deployHooks?.[0];

  return {
    id: record.id,
    name: record.name,
    accountId: record.accountId,
    previewUrl: `https://${record.name}.vercel.app`,
    deployHookUrl: deployHook?.url,
    deployHookName: deployHook?.name,
    mocked: false,
  };
}

async function getProject(projectName: string) {
  return vercelRequest<{
    id: string;
    name: string;
    accountId?: string;
    link?: {
      deployHooks?: Array<{
        name?: string;
        url?: string;
      }>;
    };
  }>(`/v9/projects/${projectName}`, {
    method: "GET",
  });
}

async function getProjectDomains(projectName: string) {
  return vercelRequest<{
    domains: Array<{
      name: string;
      verified?: boolean;
    }>;
  }>(`/v9/projects/${projectName}/domains`, {
    method: "GET",
  });
}

async function ensureProjectDomain(projectName: string, domainName: string) {
  const existing = await getProjectDomains(projectName);
  const matched = existing?.domains.find((domain) => domain.name === domainName);

  if (matched) {
    return matched;
  }

  return vercelRequest<{
    name: string;
    verified?: boolean;
  }>(`/v10/projects/${projectName}/domains`, {
    method: "POST",
    body: JSON.stringify({
      name: domainName,
      gitBranch: null,
    }),
  });
}

async function createProject(
  project: Project,
  githubRepo: GitHubProvisionedRepository,
  options?: {
    linkGitRepository?: boolean;
  },
) {
  const linkGitRepository = options?.linkGitRepository ?? !githubRepo.mocked;
  return vercelRequest<{
    id: string;
    name: string;
    accountId?: string;
    link?: {
      deployHooks?: Array<{
        name?: string;
        url?: string;
      }>;
    };
  }>("/v11/projects", {
    method: "POST",
    body: JSON.stringify({
      name: project.slug,
      framework: null,
      buildCommand: "echo skip-build",
      installCommand: "echo skip-install",
      outputDirectory: ".",
      rootDirectory: null,
      gitRepository: !linkGitRepository
        ? undefined
        : {
            type: "github",
            repo: githubRepo.fullName,
            repoId: githubRepo.id,
            productionBranch: githubRepo.defaultBranch,
            ...(githubRepo.ownerId
              ? {
                  repoOwnerId: githubRepo.ownerId,
                }
              : {}),
          },
    }),
  });
}

async function updateProjectSettings(projectName: string) {
  return vercelRequest<{
    id: string;
    name: string;
    accountId?: string;
    link?: {
      deployHooks?: Array<{
        name?: string;
        url?: string;
      }>;
    };
  }>(`/v9/projects/${projectName}`, {
    method: "PATCH",
    body: JSON.stringify({
      framework: null,
      buildCommand: "echo skip-build",
      installCommand: "echo skip-install",
      outputDirectory: ".",
      rootDirectory: null,
    }),
  });
}

export async function ensureVercelProject(
  project: Project,
  githubRepo: GitHubProvisionedRepository,
  manualDeployHookUrl?: string,
) {
  if (!env.vercelToken || env.arenaDemoMode) {
    const publicDomain = buildPublicProjectDomain(project.slug);
    return {
      id: `mock-${project.slug}`,
      name: project.slug,
      previewUrl: publicDomain
        ? `https://${publicDomain}`
        : `https://${project.slug}.vercel.app`,
      deployHookUrl: manualDeployHookUrl ?? readDeployHooks()[project.slug],
      deployHookName: manualDeployHookUrl ? "manual" : undefined,
      mocked: true,
    } satisfies VercelProvisionedProject;
  }

  const existing = await getProject(project.slug);

  if (existing) {
    const updated = (await updateProjectSettings(project.slug)) ?? existing;
    const mapped = mapVercelProject(updated);
    const publicDomain = buildPublicProjectDomain(project.slug);
    const ensuredDomain = publicDomain
      ? await ensureProjectDomain(project.slug, publicDomain)
      : null;
    return {
      ...mapped,
      previewUrl:
        ensuredDomain?.verified === false || !publicDomain
          ? mapped.previewUrl
          : `https://${publicDomain}`,
      deployHookUrl:
        manualDeployHookUrl ?? mapped.deployHookUrl ?? readDeployHooks()[project.slug],
      deployHookName:
        manualDeployHookUrl && !mapped.deployHookUrl
          ? "manual"
          : mapped.deployHookName,
    } satisfies VercelProvisionedProject;
  }

  let created;

  try {
    created = await createProject(project, githubRepo);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);

    if (
      !githubRepo.mocked &&
      /install the github integration first/i.test(detail)
    ) {
      created = await createProject(project, githubRepo, {
        linkGitRepository: false,
      });
    } else {
      throw error;
    }
  }

  if (!created) {
    throw new Error(`Vercel project creation returned no data for ${project.slug}.`);
  }

  const updated = (await updateProjectSettings(project.slug)) ?? created;
  const mapped = mapVercelProject(updated);
  const publicDomain = buildPublicProjectDomain(project.slug);
  const ensuredDomain = publicDomain
    ? await ensureProjectDomain(project.slug, publicDomain)
    : null;

  return {
    ...mapped,
    previewUrl:
      ensuredDomain?.verified === false || !publicDomain
        ? mapped.previewUrl
        : `https://${publicDomain}`,
    deployHookUrl:
      manualDeployHookUrl ?? mapped.deployHookUrl ?? readDeployHooks()[project.slug],
    deployHookName:
      manualDeployHookUrl && !mapped.deployHookUrl ? "manual" : mapped.deployHookName,
  } satisfies VercelProvisionedProject;
}

export async function triggerVercelDeploy(
  projectSlug: string,
  deployHookUrl?: string,
  project?: Pick<Project, "previewUrl" | "infrastructure">,
) {
  const hooks = readDeployHooks();
  const hookUrl = deployHookUrl ?? hooks[projectSlug];

  if (!hookUrl) {
    if (project?.infrastructure.vercelProjectId) {
      return {
        triggered: true,
        detail: "Vercel is linked through Git. Waiting for the repository push to trigger the deployment.",
        inspectorUrl: project.previewUrl,
      } satisfies VercelDeployResult;
    }

    return {
      triggered: false,
      detail: "Vercel trigger skipped because no deploy hook is configured for this project.",
    } satisfies VercelDeployResult;
  }

  try {
    const response = await fetch(hookUrl, {
      method: "POST",
      headers: env.vercelToken
        ? {
            Authorization: `Bearer ${env.vercelToken}`,
          }
        : undefined,
    });

    if (!response.ok) {
      return {
        triggered: false,
        detail: `Vercel deploy hook failed with ${response.status}.`,
      } satisfies VercelDeployResult;
    }

    const payload = (await response.json().catch(() => null)) as
      | { inspectUrl?: string; url?: string }
      | null;

    return {
      triggered: true,
      detail: "Vercel deploy hook accepted the build.",
      inspectorUrl: payload?.inspectUrl ?? payload?.url,
    } satisfies VercelDeployResult;
  } catch (error) {
    return {
      triggered: false,
      detail: error instanceof Error ? error.message : "Vercel deploy hook failed.",
    } satisfies VercelDeployResult;
  }
}

export async function createVercelDeployment(
  project: Project,
  files: VercelDeploymentFile[],
  gitMetadata?: {
    commitSha?: string;
    commitMessage?: string;
  },
) {
  if (!env.vercelToken) {
    return {
      triggered: false,
      detail: "Vercel deployment skipped because VERCEL_TOKEN is not configured.",
    } satisfies VercelDeployResult;
  }

  if (!project.infrastructure.vercelProjectName) {
    return {
      triggered: false,
      detail: "Vercel deployment skipped because the project has not been provisioned yet.",
    } satisfies VercelDeployResult;
  }

  const response = await vercelRequest<{
    inspectorUrl?: string;
    url?: string;
    errorMessage?: string;
    readyState?: string;
  }>("/v13/deployments", {
    method: "POST",
    body: JSON.stringify({
      name: project.slug,
      project: project.infrastructure.vercelProjectName,
      target: "production",
      files,
      projectSettings: {
        framework: null,
        buildCommand: null,
        devCommand: null,
        installCommand: null,
        outputDirectory: null,
      },
      gitMetadata: gitMetadata
        ? {
            remoteUrl: project.repoUrl,
            commitRef: project.infrastructure.githubDefaultBranch ?? "main",
            commitSha: gitMetadata.commitSha,
            commitMessage: gitMetadata.commitMessage,
            dirty: false,
          }
        : undefined,
    }),
  });

  if (!response) {
    return {
      triggered: false,
      detail: "Vercel deployment creation returned no data.",
    } satisfies VercelDeployResult;
  }

  return {
    triggered: true,
    detail:
      response.readyState === "READY"
        ? "Vercel accepted the production deployment."
        : "Vercel queued the production deployment.",
    inspectorUrl:
      (buildPublicProjectDomain(project.slug)
        ? `https://${buildPublicProjectDomain(project.slug)}`
        : undefined) ??
      normalizeDeploymentUrl(response.inspectorUrl ?? response.url),
  } satisfies VercelDeployResult;
}
