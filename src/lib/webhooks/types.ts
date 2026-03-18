import type { Deployment } from "@/lib/arena/types";

export interface GitHubPushWebhook {
  repositoryUrl: string;
  repositoryFullName: string;
  repositoryName: string;
  branch: string;
  sha: string;
  message: string;
  compareUrl: string;
  author: string;
  timestamp: string;
  commitsCount: number;
}

export interface VercelDeploymentWebhook {
  deploymentId: string;
  projectName: string;
  repositoryFullName?: string;
  previewUrl: string;
  branch: string;
  sha: string;
  message: string;
  status: Deployment["status"];
  createdAt: string;
  durationSeconds: number;
}

export interface GitHubWebhookResult {
  ok: true;
  projectId: string;
  projectSlug: string;
  commitsCount: number;
  eventTitle: string;
}

export interface VercelWebhookResult {
  ok: true;
  projectId: string;
  projectSlug: string;
  deploymentId: string;
  status: Deployment["status"];
}
