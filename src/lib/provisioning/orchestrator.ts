import type { HouseAgent, InfrastructureStatus, Project } from "@/lib/arena/types";
import { ensureGitHubRepository } from "@/lib/github/client";
import { ensureVercelProject } from "@/lib/vercel/client";

function determineInfrastructureStatus(args: {
  githubReady: boolean;
  vercelReady: boolean;
  hasDeployHook: boolean;
  hadError: boolean;
}): InfrastructureStatus {
  if (args.hadError) {
    return "degraded";
  }

  if (args.githubReady && args.vercelReady && args.hasDeployHook) {
    return "fully-provisioned";
  }

  if (args.vercelReady) {
    return "vercel-ready";
  }

  if (args.githubReady) {
    return "github-ready";
  }

  return "local-only";
}

export async function provisionProjectInfrastructure(
  project: Project,
  agent: HouseAgent,
  manualDeployHookUrl?: string,
) {
  const notes: string[] = [];

  try {
    const githubRepo = await ensureGitHubRepository(project, agent);
    if (githubRepo.mocked) {
      notes.push("GitHub provisioning ran in mock mode.");
    }

    const vercelProject = await ensureVercelProject(
      project,
      githubRepo,
      manualDeployHookUrl,
    );
    if (vercelProject.mocked) {
      notes.push("Vercel provisioning ran in mock mode.");
    }

    if (!vercelProject.deployHookUrl) {
      notes.push(
        "No Vercel deploy hook is registered yet. Create one in the Vercel dashboard or provide it manually.",
      );
    }

    const status = determineInfrastructureStatus({
      githubReady: true,
      vercelReady: true,
      hasDeployHook: Boolean(vercelProject.deployHookUrl),
      hadError: false,
    });

    return {
      repoUrl: githubRepo.htmlUrl,
      previewUrl: vercelProject.previewUrl,
      infrastructure: {
        status,
        githubRepoFullName: githubRepo.fullName,
        githubRepoId: githubRepo.id,
        githubRepoNodeId: githubRepo.nodeId,
        githubRepoOwnerId: githubRepo.ownerId,
        githubDefaultBranch: githubRepo.defaultBranch,
        githubTemplateUsed: githubRepo.templateUsed,
        vercelProjectId: vercelProject.id,
        vercelProjectName: vercelProject.name,
        vercelAccountId: vercelProject.accountId,
        vercelDeployHookUrl: vercelProject.deployHookUrl,
        vercelDeployHookName: vercelProject.deployHookName,
        lastProvisionedAt: new Date().toISOString(),
        lastError: undefined,
        notes,
      },
      event: {
        category: "admin" as const,
        title: "Remote infrastructure provisioned",
        detail: `${project.name} is wired for ${githubRepo.fullName} and Vercel project ${vercelProject.name}.`,
      },
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Provisioning failed.";

    return {
      repoUrl: project.repoUrl,
      previewUrl: project.previewUrl,
      infrastructure: {
        status: determineInfrastructureStatus({
          githubReady: Boolean(project.infrastructure.githubRepoFullName),
          vercelReady: Boolean(project.infrastructure.vercelProjectId),
          hasDeployHook: Boolean(project.infrastructure.vercelDeployHookUrl),
          hadError: true,
        }),
        lastProvisionedAt: new Date().toISOString(),
        lastError: detail,
        notes: [...project.infrastructure.notes, detail].slice(-6),
      },
      event: {
        category: "admin" as const,
        title: "Remote infrastructure failed",
        detail,
      },
    };
  }
}
