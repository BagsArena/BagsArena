import { getPreviewUrl } from "@/lib/agents/workspace";
import type { ProjectInfrastructure } from "@/lib/arena/types";

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

export function resolveProjectPreviewUrl(
  projectSlug: string,
  previewUrl: string,
  infrastructure: ProjectInfrastructure,
) {
  if (!previewUrl || shouldUseLocalPreview(infrastructure)) {
    return getPreviewUrl(projectSlug);
  }

  return previewUrl;
}
