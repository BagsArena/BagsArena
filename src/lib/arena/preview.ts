import { getPreviewUrl } from "@/lib/agents/workspace";
import type { ProjectInfrastructure } from "@/lib/arena/types";
import { env } from "@/lib/env";

function hasRemotePreviewInfrastructure(infrastructure: ProjectInfrastructure) {
  return Boolean(
    infrastructure.vercelProjectId ||
      infrastructure.vercelProjectName ||
      infrastructure.vercelDeployHookUrl,
  );
}

export function shouldUseLocalPreview(infrastructure: ProjectInfrastructure) {
  if (infrastructure.status === "local-only") {
    return true;
  }

  return !hasRemotePreviewInfrastructure(infrastructure);
}

function fallbackRemotePreviewUrl(
  projectSlug: string,
  infrastructure: ProjectInfrastructure,
) {
  if (env.vercelTeamSlug) {
    return `https://${projectSlug}-${env.vercelTeamSlug}.vercel.app`;
  }

  if (infrastructure.vercelProjectName) {
    return `https://${infrastructure.vercelProjectName}.vercel.app`;
  }

  if (infrastructure.vercelProjectId) {
    return `https://${projectSlug}.vercel.app`;
  }

  return undefined;
}

function stripWwwPrefix(hostname: string) {
  return hostname.replace(/^www\./i, "");
}

function isImplicitProjectDomainPreview(
  projectSlug: string,
  previewUrl: string,
  infrastructure: ProjectInfrastructure,
) {
  if (!infrastructure.vercelProjectId && !infrastructure.vercelProjectName) {
    return false;
  }

  if (env.projectPublicDomainBase) {
    return false;
  }

  try {
    const previewHost = stripWwwPrefix(new URL(previewUrl).hostname);
    const appHost = stripWwwPrefix(new URL(env.appUrl).hostname);

    if (
      previewHost.startsWith(`${projectSlug}.`) &&
      !previewHost.endsWith(".vercel.app") &&
      appHost === "localhost"
    ) {
      return true;
    }

    return previewHost === `${projectSlug}.${appHost}`;
  } catch {
    return false;
  }
}

export function resolveProjectPreviewUrl(
  projectSlug: string,
  previewUrl: string,
  infrastructure: ProjectInfrastructure,
) {
  if (!previewUrl || shouldUseLocalPreview(infrastructure)) {
    return getPreviewUrl(projectSlug);
  }

  if (isImplicitProjectDomainPreview(projectSlug, previewUrl, infrastructure)) {
    return fallbackRemotePreviewUrl(projectSlug, infrastructure) ?? previewUrl;
  }

  return previewUrl;
}
