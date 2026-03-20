import { spawn } from "node:child_process";

import type { HouseAgent, Project } from "@/lib/arena/types";
import { env } from "@/lib/env";

export interface GitHubSyncResult {
  pushed: boolean;
  compareUrl?: string;
  detail: string;
}

export interface GitHubProvisionedRepository {
  owner: string;
  ownerId?: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  id?: number;
  nodeId?: string;
  defaultBranch: string;
  templateUsed?: string;
  mocked: boolean;
}

export function parseGitHubRepo(repoUrl: string) {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (!match) {
    return null;
  }

  return {
    owner: match[1],
    repo: match[2],
  };
}

function createGitHubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${env.githubToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubRequest<T>(pathname: string, init?: RequestInit) {
  const response = await fetch(`${env.githubApiBaseUrl}${pathname}`, {
    ...init,
    headers: {
      ...createGitHubHeaders(),
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `GitHub request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

async function resolveGitHubOwner() {
  if (env.githubOwner) {
    return {
      owner: env.githubOwner,
      ownerType: env.githubOwnerType === "org" ? "org" : "user",
    } as const;
  }

  const viewer = await githubRequest<{ login: string }>("/user");

  if (!viewer?.login) {
    throw new Error("Unable to resolve the authenticated GitHub owner.");
  }

  return {
    owner: viewer.login,
    ownerType: "user",
  } as const;
}

function mapRepoResponse(record: {
  id?: number;
  node_id?: string;
  name: string;
  full_name: string;
  html_url: string;
  default_branch?: string;
  owner?: { login?: string; id?: number };
}): GitHubProvisionedRepository {
  return {
    owner: record.owner?.login ?? record.full_name.split("/")[0] ?? "bags-arena",
    ownerId: record.owner?.id,
    name: record.name,
    fullName: record.full_name,
    htmlUrl: record.html_url,
    id: record.id,
    nodeId: record.node_id,
    defaultBranch: record.default_branch ?? "main",
    mocked: false,
  };
}

async function getRepository(owner: string, repo: string) {
  return githubRequest<{
    id?: number;
    node_id?: string;
    name: string;
    full_name: string;
    html_url: string;
    default_branch?: string;
    owner?: { login?: string; id?: number };
  }>(`/repos/${owner}/${repo}`, {
    method: "GET",
  });
}

async function createRepository(
  owner: string,
  ownerType: "user" | "org",
  project: Project,
) {
  const pathname =
    ownerType === "org" ? `/orgs/${owner}/repos` : "/user/repos";
  return githubRequest<{
    id?: number;
    node_id?: string;
    name: string;
    full_name: string;
    html_url: string;
    default_branch?: string;
    owner?: { login?: string; id?: number };
  }>(pathname, {
    method: "POST",
    body: JSON.stringify({
      name: project.slug,
      description: `Bags Arena house-agent project for ${project.name}.`,
      private: env.githubRepoPrivate,
      auto_init: false,
    }),
  });
}

export function buildAuthenticatedGitHubRemoteUrl(project: Pick<Project, "repoUrl">) {
  if (!env.githubToken) {
    return null;
  }

  const repo = parseGitHubRepo(project.repoUrl);
  if (!repo) {
    return null;
  }

  return `https://x-access-token:${env.githubToken}@github.com/${repo.owner}/${repo.repo}.git`;
}

export async function ensureGitHubRepository(
  project: Project,
  agent: HouseAgent,
) {
  if (!env.githubToken || env.arenaDemoMode) {
    return {
      owner: agent.repoOwner,
      name: project.slug,
      fullName: `${agent.repoOwner}/${project.slug}`,
      htmlUrl: `https://github.com/${agent.repoOwner}/${project.slug}`,
      defaultBranch: "main",
      templateUsed: agent.templateRepo,
      mocked: true,
    } satisfies GitHubProvisionedRepository;
  }

  const { owner, ownerType } = await resolveGitHubOwner();
  const existing = await getRepository(owner, project.slug);

  if (existing) {
    return {
      ...mapRepoResponse(existing),
      templateUsed: agent.templateRepo,
    } satisfies GitHubProvisionedRepository;
  }

  const created = await createRepository(owner, ownerType, project);

  if (!created) {
    throw new Error(`GitHub repository creation returned no data for ${project.slug}.`);
  }

  return {
    ...mapRepoResponse(created),
    templateUsed: agent.templateRepo,
  } satisfies GitHubProvisionedRepository;
}

function runGitPush(repoDir: string, remoteUrl: string) {
  const gitCommand = process.platform === "win32" ? "git.exe" : "git";
  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(gitCommand, ["push", remoteUrl, "HEAD:main"], {
      cwd: repoDir,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

export async function syncWorkspaceCommitToGitHub(
  repoDir: string,
  project: Project,
  commitSha: string,
) {
  if (!env.githubToken) {
    return {
      pushed: false,
      detail: "GitHub push skipped because GITHUB_TOKEN is not configured.",
    } satisfies GitHubSyncResult;
  }

  const repo = parseGitHubRepo(project.repoUrl);
  if (!repo) {
    return {
      pushed: false,
      detail: `GitHub push skipped because ${project.repoUrl} is not a GitHub repository.`,
    } satisfies GitHubSyncResult;
  }

  const remoteUrl = buildAuthenticatedGitHubRemoteUrl(project);

  if (!remoteUrl) {
    return {
      pushed: false,
      detail: `GitHub push skipped because ${project.repoUrl} is not an authenticated GitHub remote.`,
    } satisfies GitHubSyncResult;
  }

  try {
    const result = await runGitPush(repoDir, remoteUrl);

    if (result.code !== 0) {
      return {
        pushed: false,
        detail: result.stderr.trim() || "GitHub push failed.",
      } satisfies GitHubSyncResult;
    }

    return {
      pushed: true,
      compareUrl: `${project.repoUrl.replace(/\.git$/i, "")}/commit/${commitSha}`,
      detail: "Commit pushed to GitHub main.",
    } satisfies GitHubSyncResult;
  } catch (error) {
    return {
      pushed: false,
      detail: error instanceof Error ? error.message : "GitHub push failed.",
    } satisfies GitHubSyncResult;
  }
}
