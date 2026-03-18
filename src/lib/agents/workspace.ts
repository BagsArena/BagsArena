import { promises as fs } from "node:fs";
import path from "node:path";

import { env } from "@/lib/env";

const ignoredEntries = new Set(["node_modules"]);

export function getArenaWorkspaceRoot() {
  return env.arenaWorkspaceRoot || path.join(process.cwd(), ".arena");
}

export function getArenaReposRoot() {
  return path.join(getArenaWorkspaceRoot(), "repos");
}

export function getArenaRunsRoot() {
  return path.join(getArenaWorkspaceRoot(), "runs");
}

export function getArenaArtifactsRoot() {
  return path.join(getArenaWorkspaceRoot(), "artifacts");
}

export function getCanonicalProjectRepoDir(projectSlug: string) {
  return path.join(getArenaReposRoot(), projectSlug);
}

export function getEphemeralRunDir(projectSlug: string, runKey: string) {
  return path.join(getArenaRunsRoot(), `${projectSlug}-${runKey}`);
}

export function getProjectArtifactsDir(projectSlug: string) {
  return path.join(getArenaArtifactsRoot(), projectSlug);
}

export function getPreviewBuildPath(projectSlug: string) {
  return path.join(getCanonicalProjectRepoDir(projectSlug), "dist", "index.html");
}

export function getArtifactPath(projectSlug: string, fileName: string) {
  return path.join(getProjectArtifactsDir(projectSlug), fileName);
}

export function getPreviewUrl(projectSlug: string) {
  return `${env.appUrl}/preview/${projectSlug}`;
}

export function getArtifactUrl(projectSlug: string, fileName: string) {
  return `${env.appUrl}/artifacts/${projectSlug}/${encodeURIComponent(fileName)}`;
}

export async function ensureDirectory(directoryPath: string) {
  await fs.mkdir(directoryPath, { recursive: true });
}

export async function pathExists(targetPath: string) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function copyDirectory(sourceDir: string, targetDir: string) {
  await ensureDirectory(targetDir);
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (ignoredEntries.has(entry.name)) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
      continue;
    }

    await ensureDirectory(path.dirname(targetPath));
    await fs.copyFile(sourcePath, targetPath);
  }
}

export async function resetDirectory(directoryPath: string) {
  await fs.rm(directoryPath, { recursive: true, force: true });
  await ensureDirectory(directoryPath);
}

export async function removeDirectory(directoryPath: string) {
  await fs.rm(directoryPath, { recursive: true, force: true });
}
