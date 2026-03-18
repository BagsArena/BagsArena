import type {
  GitHubPushWebhook,
  VercelDeploymentWebhook,
} from "@/lib/webhooks/types";

function ensureUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

function branchFromRef(ref: string | undefined) {
  if (!ref) {
    return "main";
  }

  return ref.replace(/^refs\/heads\//, "") || "main";
}

function coerceIsoDate(value: string | number | undefined) {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value === "number") {
    return new Date(value).toISOString();
  }

  return new Date(value).toISOString();
}

function mapVercelStatus(value: string | undefined): VercelDeploymentWebhook["status"] {
  const normalized = value?.toLowerCase() ?? "";

  if (normalized.includes("ready") || normalized.includes("succeed")) {
    return "ready";
  }

  if (normalized.includes("error") || normalized.includes("fail") || normalized.includes("cancel")) {
    return "failed";
  }

  if (normalized.includes("queue") || normalized.includes("pending")) {
    return "queued";
  }

  return "building";
}

export function normalizeGitHubPushWebhook(
  payload: Record<string, unknown>,
): GitHubPushWebhook | null {
  const repository = (payload.repository ?? {}) as Record<string, unknown>;
  const headCommit = (payload.head_commit ?? {}) as Record<string, unknown>;
  const commits = Array.isArray(payload.commits)
    ? (payload.commits as Array<Record<string, unknown>>)
    : [];
  const lastCommit = commits.at(-1) ?? {};
  const repositoryFullName =
    (repository.full_name as string | undefined) ??
    (repository.name as string | undefined);

  if (!repositoryFullName) {
    return null;
  }

  const repositoryUrl =
    (repository.html_url as string | undefined) ??
    `https://github.com/${repositoryFullName}`;

  const repositoryName =
    repositoryFullName.split("/").at(-1) ?? repositoryFullName;

  return {
    repositoryUrl,
    repositoryFullName,
    repositoryName,
    branch: branchFromRef(payload.ref as string | undefined),
    sha:
      (headCommit.id as string | undefined) ??
      (lastCommit.id as string | undefined) ??
      "unknown",
    message:
      (headCommit.message as string | undefined) ??
      (lastCommit.message as string | undefined) ??
      `${Math.max(commits.length, 1)} commits pushed`,
    compareUrl:
      (payload.compare as string | undefined) ??
      (headCommit.url as string | undefined) ??
      repositoryUrl,
    author:
      ((payload.pusher as Record<string, unknown> | undefined)?.name as string | undefined) ??
      ((headCommit.author as Record<string, unknown> | undefined)?.name as string | undefined) ??
      "github",
    timestamp: coerceIsoDate(
      (headCommit.timestamp as string | undefined) ??
        (lastCommit.timestamp as string | undefined),
    ),
    commitsCount: Math.max(commits.length, 1),
  };
}

export function normalizeVercelDeploymentWebhook(
  payload: Record<string, unknown>,
): VercelDeploymentWebhook | null {
  const eventPayload = ((payload.payload as Record<string, unknown> | undefined) ??
    payload) as Record<string, unknown>;
  const meta = (eventPayload.meta ?? {}) as Record<string, unknown>;

  const deploymentId = eventPayload.id as string | undefined;
  const url = ensureUrl(eventPayload.url as string | undefined);
  const projectName =
    (eventPayload.name as string | undefined) ??
    (meta.githubRepo as string | undefined);

  if (!deploymentId || !url || !projectName) {
    return null;
  }

  const createdAt = coerceIsoDate(
    (eventPayload.createdAt as number | string | undefined) ??
      (payload.createdAt as number | string | undefined),
  );
  const readyAt = eventPayload.readyAt as number | undefined;
  const durationSeconds =
    readyAt && eventPayload.createdAt
      ? Math.max(0, Math.round((readyAt - Number(eventPayload.createdAt)) / 1000))
      : 0;

  return {
    deploymentId,
    projectName,
    repositoryFullName:
      meta.githubOrg && meta.githubRepo
        ? `${meta.githubOrg}/${meta.githubRepo}`
        : undefined,
    previewUrl: url,
    branch: (meta.githubCommitRef as string | undefined) ?? "main",
    sha: (meta.githubCommitSha as string | undefined) ?? "unknown",
    message:
      (meta.githubCommitMessage as string | undefined) ??
      `${projectName} deployment ${mapVercelStatus(
        (eventPayload.state as string | undefined) ??
          (payload.type as string | undefined),
      )}`,
    status: mapVercelStatus(
      (eventPayload.readyState as string | undefined) ??
        (eventPayload.state as string | undefined) ??
        (payload.type as string | undefined),
    ),
    createdAt,
    durationSeconds,
  };
}
