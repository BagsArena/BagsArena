import type { Project } from "@/lib/arena/types";
import { env } from "@/lib/env";
import type { GitHubProvisionedRepository } from "@/lib/github/client";

export interface VercelDeployResult {
  triggered: boolean;
  detail: string;
  inspectorUrl?: string;
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

async function createProject(
  project: Project,
  githubRepo: GitHubProvisionedRepository,
) {
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
      buildCommand: "npm run build",
      installCommand: "npm install",
      outputDirectory: "dist",
      gitRepository: githubRepo.mocked
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

export async function ensureVercelProject(
  project: Project,
  githubRepo: GitHubProvisionedRepository,
  manualDeployHookUrl?: string,
) {
  if (!env.vercelToken || env.arenaDemoMode) {
    return {
      id: `mock-${project.slug}`,
      name: project.slug,
      previewUrl: `https://${project.slug}.vercel.app`,
      deployHookUrl: manualDeployHookUrl ?? readDeployHooks()[project.slug],
      deployHookName: manualDeployHookUrl ? "manual" : undefined,
      mocked: true,
    } satisfies VercelProvisionedProject;
  }

  const existing = await getProject(project.slug);

  if (existing) {
    const mapped = mapVercelProject(existing);
    return {
      ...mapped,
      deployHookUrl:
        manualDeployHookUrl ?? mapped.deployHookUrl ?? readDeployHooks()[project.slug],
      deployHookName:
        manualDeployHookUrl && !mapped.deployHookUrl
          ? "manual"
          : mapped.deployHookName,
    } satisfies VercelProvisionedProject;
  }

  const created = await createProject(project, githubRepo);

  if (!created) {
    throw new Error(`Vercel project creation returned no data for ${project.slug}.`);
  }

  const mapped = mapVercelProject(created);

  return {
    ...mapped,
    deployHookUrl:
      manualDeployHookUrl ?? mapped.deployHookUrl ?? readDeployHooks()[project.slug],
    deployHookName:
      manualDeployHookUrl && !mapped.deployHookUrl ? "manual" : mapped.deployHookName,
  } satisfies VercelProvisionedProject;
}

export async function triggerVercelDeploy(
  projectSlug: string,
  deployHookUrl?: string,
) {
  const hooks = readDeployHooks();
  const hookUrl = deployHookUrl ?? hooks[projectSlug];

  if (!hookUrl) {
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
