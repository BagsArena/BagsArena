import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

import { createManagedProjectFiles, renderScreenshotSvg } from "@/lib/agents/scaffold";
import type { AgentExecutionContext, AgentExecutionResult } from "@/lib/agents/types";
import {
  copyDirectory,
  ensureDirectory,
  getArtifactUrl,
  getCanonicalProjectRepoDir,
  getEphemeralRunDir,
  getPreviewUrl,
  getProjectArtifactsDir,
  pathExists,
  removeDirectory,
  resetDirectory,
} from "@/lib/agents/workspace";
import type { HouseAgent, Project } from "@/lib/arena/types";
import { env } from "@/lib/env";
import {
  buildAuthenticatedGitHubRemoteUrl,
  syncWorkspaceCommitToGitHub,
} from "@/lib/github/client";
import {
  createVercelDeployment,
  triggerVercelDeploy,
  type VercelDeployResult,
  type VercelDeploymentFile,
} from "@/lib/vercel/client";

interface CommandResult {
  command: string;
  args: string[];
  code: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const gitCommand = process.platform === "win32" ? "git.exe" : "git";
let gitAvailablePromise: Promise<boolean> | null = null;

function buildPseudoSha(projectSlug: string, value: string) {
  let hash = 0;

  for (const character of `${projectSlug}-${value}`) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}

function buildRunKey(now: Date) {
  return now.toISOString().replace(/[:.]/g, "-");
}

function toSafeFileStem(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function applyRoadmapUpdates(
  project: Project,
  updates: AgentExecutionContext["plan"]["roadmapUpdates"],
) {
  const nextProject = structuredClone(project);
  const updateMap = new Map(updates.map((item) => [item.id, item]));

  nextProject.roadmap = nextProject.roadmap.map((item) => {
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

  return nextProject;
}

function buildProjectedWorkspaceProject(
  context: AgentExecutionContext,
  terminal: string[],
  overrides?: Partial<Project["activeRun"]>,
) {
  const nextProject = applyRoadmapUpdates(context.project, context.plan.roadmapUpdates);

  nextProject.launchStatus = context.plan.launchStatus ?? nextProject.launchStatus;
  nextProject.previewHighlights = [
    ...context.plan.previewHighlightsAppend,
    ...nextProject.previewHighlights,
  ]
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 5);
  nextProject.activeRun = {
    ...nextProject.activeRun,
    objective: context.plan.objective,
    promptSnapshot: context.plan.promptSnapshot,
    phase: context.plan.phase,
    outcome: context.plan.outcome,
    terminal,
    ...overrides,
  };

  return nextProject;
}

function buildCycleEntry(context: AgentExecutionContext) {
  return `## ${context.now.toISOString()}

- Objective: ${context.plan.objective}
- Phase: ${context.plan.phase}
- Prompt: ${context.plan.promptSnapshot}
- Source: ${context.plan.source}`;
}

async function writeProjectFiles(
  repoDir: string,
  project: Project,
  agent: HouseAgent,
) {
  const files = createManagedProjectFiles({
    project,
    agent,
  });

  for (const [relativePath, contents] of Object.entries(files)) {
    if (relativePath === "CHANGELOG.md") {
      continue;
    }

    const targetPath = path.join(repoDir, relativePath);
    await ensureDirectory(path.dirname(targetPath));
    await fs.writeFile(targetPath, contents, "utf8");
  }
}

async function appendChangelogEntry(repoDir: string, entry: string) {
  const changelogPath = path.join(repoDir, "CHANGELOG.md");
  const existingChangelog = (
    (await fs.readFile(changelogPath, "utf8").catch(() => "# Changelog\n")) as string
  ).trimEnd();
  await fs.writeFile(changelogPath, `${existingChangelog}\n\n${entry}`, "utf8");
}

async function writeVercelProjectLink(repoDir: string, project: Project) {
  if (!project.infrastructure.vercelProjectId || !env.vercelTeamId) {
    return false;
  }

  const vercelDir = path.join(repoDir, ".vercel");
  await ensureDirectory(vercelDir);
  await fs.writeFile(
    path.join(vercelDir, "project.json"),
    JSON.stringify(
      {
        orgId: env.vercelTeamId,
        projectId: project.infrastructure.vercelProjectId,
      },
      null,
      2,
    ),
    "utf8",
  );
  return true;
}

function summarizeCommandOutput(result: CommandResult) {
  const output = `${result.stdout}\n${result.stderr}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return output.at(-1) ?? `${result.command} exited with ${result.code}`;
}

function buildTerminal(resultSet: {
  lint: CommandResult;
  test: CommandResult;
  build?: CommandResult;
  commitSha?: string;
  gitDetail?: string;
  vercelDetail?: string;
}) {
  const lines = [
    `$ ${resultSet.lint.command} ${resultSet.lint.args.join(" ")}`.trim(),
    summarizeCommandOutput(resultSet.lint),
    `$ ${resultSet.test.command} ${resultSet.test.args.join(" ")}`.trim(),
    summarizeCommandOutput(resultSet.test),
  ];

  if (resultSet.build) {
    lines.push(`$ ${resultSet.build.command} ${resultSet.build.args.join(" ")}`.trim());
    lines.push(summarizeCommandOutput(resultSet.build));
  }

  if (resultSet.commitSha) {
    lines.push(`Committed ${resultSet.commitSha}`);
  }

  if (resultSet.gitDetail) {
    lines.push(resultSet.gitDetail);
  }

  if (resultSet.vercelDetail) {
    lines.push(resultSet.vercelDetail);
  }

  return lines.slice(0, 8);
}

function buildCommandLog(results: CommandResult[]) {
  return results
    .map((result) =>
      [
        `$ ${result.command} ${result.args.join(" ")}`.trim(),
        result.stdout.trim(),
        result.stderr.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}

function buildReportMarkdown(
  context: AgentExecutionContext,
  result: {
    lint: CommandResult;
    test: CommandResult;
    build?: CommandResult;
    success: boolean;
    commitSha?: string;
    gitDetail?: string;
    vercelDetail?: string;
  },
) {
  return `# ${context.project.name} cycle report

- Objective: ${context.plan.objective}
- Success: ${result.success ? "yes" : "no"}
- Phase: ${result.success ? context.plan.phase : "testing"}
- Commit: ${result.commitSha ?? "not committed"}
- GitHub: ${result.gitDetail ?? "not attempted"}
- Vercel: ${result.vercelDetail ?? "not attempted"}

## Command summary

- lint: ${summarizeCommandOutput(result.lint)}
- test: ${summarizeCommandOutput(result.test)}
- build: ${result.build ? summarizeCommandOutput(result.build) : "skipped"}
`;
}

function buildSpecMarkdown(context: AgentExecutionContext, project: Project) {
  return `# ${project.name} cycle spec

## Objective

${context.plan.objective}

## Prompt snapshot

${context.plan.promptSnapshot}

## Highlights

${project.previewHighlights.map((item) => `- ${item}`).join("\n")}

## Roadmap

${project.roadmap
  .map((item) => `- [${item.status}] ${item.title}: ${item.detail}`)
  .join("\n")}
`;
}

async function runCommand(
  command: string,
  args: string[],
  cwd: string,
  extraEnv?: Record<string, string | undefined>,
) {
  const startedAt = Date.now();

  return new Promise<CommandResult>((resolve, reject) => {
    const spawnCommand = process.platform === "win32" ? "cmd.exe" : command;
    const spawnArgs =
      process.platform === "win32"
        ? ["/d", "/s", "/c", [command, ...args]
            .map((value) => {
              if (!/[ \t"]/.test(value)) {
                return value;
              }

              return `"${value.replace(/"/g, '\\"')}"`;
            })
            .join(" ")]
        : args;

    const child = spawn(spawnCommand, spawnArgs, {
      cwd,
      env: {
        ...process.env,
        ...extraEnv,
      },
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
        command,
        args,
        code: code ?? 1,
        stdout,
        stderr,
        durationMs: Date.now() - startedAt,
      });
    });
  });
}

async function hasGit() {
  if (!gitAvailablePromise) {
    gitAvailablePromise = runCommand(gitCommand, ["--version"], process.cwd())
      .then((result) => result.code === 0)
      .catch(() => false);
  }

  return gitAvailablePromise;
}

async function ensureGitRepo(repoDir: string, agent: HouseAgent) {
  if (!(await hasGit())) {
    return false;
  }

  const gitDir = path.join(repoDir, ".git");
  if (!(await pathExists(gitDir))) {
    await runCommand(gitCommand, ["init", "-b", "main"], repoDir);
  }

  await runCommand(gitCommand, ["config", "user.name", agent.displayName], repoDir);
  await runCommand(
    gitCommand,
    ["config", "user.email", `${agent.slug}@bags-arena.local`],
    repoDir,
  );
  return true;
}

async function cloneRemoteWorkspace(canonicalDir: string, project: Project) {
  const remoteUrl = buildAuthenticatedGitHubRemoteUrl(project);
  if (!remoteUrl || !(await hasGit())) {
    return false;
  }

  const parentDir = path.dirname(canonicalDir);
  await ensureDirectory(parentDir);
  await removeDirectory(canonicalDir);

  const cloneResult = await runCommand(
    gitCommand,
    ["clone", remoteUrl, canonicalDir],
    parentDir,
  );

  return cloneResult.code === 0;
}

async function commitWorkspace(repoDir: string, message: string) {
  if (!(await hasGit())) {
    return {
      sha: "",
      diff: "",
      detail: "Git is unavailable in this environment.",
    };
  }

  await runCommand(gitCommand, ["add", "."], repoDir);
  const commitResult = await runCommand(gitCommand, ["commit", "-m", message], repoDir);

  if (commitResult.code !== 0 && !commitResult.stderr.includes("nothing to commit")) {
    return {
      sha: "",
      diff: commitResult.stderr,
      detail: summarizeCommandOutput(commitResult),
    };
  }

  const shaResult = await runCommand(gitCommand, ["rev-parse", "--short", "HEAD"], repoDir);
  const showResult = await runCommand(
    gitCommand,
    ["show", "--stat", "--name-only", "--format=medium", "HEAD"],
    repoDir,
  );

  return {
    sha: shaResult.stdout.trim(),
    diff: showResult.stdout.trim() || showResult.stderr.trim(),
    detail:
      commitResult.stderr.includes("nothing to commit")
        ? "No file diff was produced in this cycle."
        : "Committed workspace changes locally.",
  };
}

async function syncRunDirToCanonicalRepo(runDir: string, canonicalDir: string) {
  await resetDirectory(canonicalDir);
  await copyDirectory(runDir, canonicalDir);
}

async function ensureCanonicalWorkspace(context: AgentExecutionContext) {
  const canonicalDir = getCanonicalProjectRepoDir(context.project.slug);

  if (await pathExists(path.join(canonicalDir, "package.json"))) {
    return canonicalDir;
  }

  if (await cloneRemoteWorkspace(canonicalDir, context.project)) {
    return canonicalDir;
  }

  await resetDirectory(canonicalDir);
  await writeProjectFiles(canonicalDir, context.project, context.agent);
  await appendChangelogEntry(
    canonicalDir,
    `## ${new Date().toISOString()}\n\n- Initialized managed workspace.`,
  );

  if (await ensureGitRepo(canonicalDir, context.agent)) {
    await commitWorkspace(canonicalDir, "chore: initialize managed workspace");
  }

  return canonicalDir;
}

async function collectDeploymentFiles(
  rootDir: string,
  currentDir = rootDir,
): Promise<VercelDeploymentFile[]> {
  const entries = await fs.readdir(currentDir, {
    withFileTypes: true,
  });
  const files: VercelDeploymentFile[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectDeploymentFiles(rootDir, absolutePath)));
      continue;
    }

    const relativePath = path
      .relative(rootDir, absolutePath)
      .split(path.sep)
      .join("/");
    const data = await fs.readFile(absolutePath);

    files.push({
      file: relativePath,
      data: data.toString("base64"),
      encoding: "base64",
    });
  }

  return files;
}

async function deployWorkspaceToVercel(
  repoDir: string,
  project: Project,
  commitSha?: string,
  commitMessage?: string,
): Promise<VercelDeployResult> {
  const distDir = path.join(repoDir, "dist");
  if (!(await pathExists(distDir))) {
    return {
      triggered: false,
      detail: "Vercel deploy skipped because dist output was not generated.",
    };
  }

  if (!(await writeVercelProjectLink(repoDir, project))) {
    return {
      triggered: false,
      detail: "Vercel deploy skipped because this project is not provisioned in Vercel yet.",
    };
  }

  const files = await collectDeploymentFiles(distDir);
  return createVercelDeployment(project, files, {
    commitSha,
    commitMessage,
  });
}

async function writeArtifactFile(projectSlug: string, fileName: string, contents: string) {
  const artifactsDir = getProjectArtifactsDir(projectSlug);
  await ensureDirectory(artifactsDir);
  await fs.writeFile(path.join(artifactsDir, fileName), contents, "utf8");
  return getArtifactUrl(projectSlug, fileName);
}

export async function executeAgentCycle(
  context: AgentExecutionContext,
): Promise<AgentExecutionResult> {
  if (env.arenaExecutorMode === "simulated") {
    return {
      phase: context.plan.phase,
      outcome: context.plan.outcome,
      terminal: context.plan.terminal,
      metricsDelta: context.plan.metricsDelta,
      artifacts: context.plan.artifacts,
      deployment: context.plan.deployment,
      event: context.plan.event,
    };
  }

  const startedAt = Date.now();
  const runKey = buildRunKey(context.now);
  const canonicalDir = await ensureCanonicalWorkspace(context);
  const runDir = getEphemeralRunDir(context.project.slug, runKey);
  await resetDirectory(runDir);

  try {
    await copyDirectory(canonicalDir, runDir);
    await ensureGitRepo(runDir, context.agent);
    await appendChangelogEntry(runDir, buildCycleEntry(context));

    const initialProject = buildProjectedWorkspaceProject(context, [
      "Preparing managed workspace cycle.",
    ]);
    await writeProjectFiles(runDir, initialProject, context.agent);

    const lintResult = await runCommand(npmCommand, ["run", "lint"], runDir);
    const testResult = await runCommand(npmCommand, ["run", "test"], runDir);
    const checksPassed = lintResult.code === 0 && testResult.code === 0;

    let buildResult: CommandResult | undefined;
    let commitSha = "";
    let gitDetail = "GitHub sync skipped.";
    let vercelDetail = "Vercel trigger skipped.";
    let previewUrl = context.project.previewUrl;
    let diffOutput = "";

    const preBuildTerminal = buildTerminal({
      lint: lintResult,
      test: testResult,
    });
    const projectForBuild = buildProjectedWorkspaceProject(context, preBuildTerminal);
    await writeProjectFiles(runDir, projectForBuild, context.agent);

    if (checksPassed) {
      buildResult = await runCommand(npmCommand, ["run", "build"], runDir);
    }

    const buildPassed = checksPassed && buildResult?.code === 0;

    if (buildPassed) {
      const commitResult = await commitWorkspace(
        runDir,
        `feat: ${context.plan.objective}`.slice(0, 72),
      );
      commitSha = commitResult.sha || buildPseudoSha(context.project.slug, runKey);
      diffOutput = commitResult.diff;
      gitDetail = commitResult.detail;

      const githubResult = await syncWorkspaceCommitToGitHub(
        runDir,
        context.project,
        commitSha,
      );
      gitDetail = githubResult.detail;

      const commitMessage = `feat: ${context.plan.objective}`.slice(0, 72);
      const vercelResult = context.project.infrastructure.vercelDeployHookUrl
        ? await triggerVercelDeploy(
            context.project.slug,
            context.project.infrastructure.vercelDeployHookUrl,
            context.project,
          )
        : await deployWorkspaceToVercel(runDir, context.project, commitSha, commitMessage);
      vercelDetail = vercelResult.detail;
      previewUrl = vercelResult.inspectorUrl ?? getPreviewUrl(context.project.slug);

      const finalTerminal = buildTerminal({
        lint: lintResult,
        test: testResult,
        build: buildResult,
        commitSha,
        gitDetail,
        vercelDetail,
      });
      const finalProject = buildProjectedWorkspaceProject(context, finalTerminal);
      await writeProjectFiles(runDir, finalProject, context.agent);
      await runCommand(npmCommand, ["run", "build"], runDir);
      await syncRunDirToCanonicalRepo(runDir, canonicalDir);
    }

    const screenshotCaption = buildPassed
      ? `${context.agent.displayName} shipped a managed workspace build`
      : `${context.agent.displayName} hit a blocker during local verification`;

    const reportFile = `${runKey}-${toSafeFileStem(context.plan.objective)}-build-report.md`;
    const logFile = `${runKey}-${toSafeFileStem(context.plan.objective)}-cycle.log`;
    const specFile = `${runKey}-${toSafeFileStem(context.plan.objective)}-spec.md`;
    const screenshotFile = `${runKey}-${toSafeFileStem(context.plan.objective)}-preview.svg`;
    const diffFile = `${runKey}-${toSafeFileStem(context.plan.objective)}-commit.txt`;

    const terminal = buildPassed
      ? buildTerminal({
          lint: lintResult,
          test: testResult,
          build: buildResult,
          commitSha,
          gitDetail,
          vercelDetail,
        })
      : buildTerminal({
          lint: lintResult,
          test: testResult,
          build: buildResult,
        });

    const finalProjectForArtifacts = buildProjectedWorkspaceProject(
      context,
      terminal,
      {
        phase: buildPassed ? context.plan.phase : "testing",
        outcome: buildPassed ? "healthy" : checksPassed ? "warning" : "blocked",
      },
    );

    const logUrl = await writeArtifactFile(
      context.project.slug,
      logFile,
      buildCommandLog([lintResult, testResult, ...(buildResult ? [buildResult] : [])]),
    );
    const reportUrl = await writeArtifactFile(
      context.project.slug,
      reportFile,
      buildReportMarkdown(context, {
        lint: lintResult,
        test: testResult,
        build: buildResult,
        success: buildPassed,
        commitSha,
        gitDetail,
        vercelDetail,
      }),
    );
    const specUrl = await writeArtifactFile(
      context.project.slug,
      specFile,
      buildSpecMarkdown(context, finalProjectForArtifacts),
    );
    const screenshotUrl = await writeArtifactFile(
      context.project.slug,
      screenshotFile,
      renderScreenshotSvg(
        {
          project: finalProjectForArtifacts,
          agent: context.agent,
        },
        screenshotCaption,
      ),
    );

    const artifacts: AgentExecutionResult["artifacts"] = [
      {
        type: "log",
        label: `${context.agent.displayName} cycle log`,
        url: logUrl,
      },
      {
        type: "build-report",
        label: `${context.project.name} build report`,
        url: reportUrl,
      },
      {
        type: "spec",
        label: `${context.project.name} cycle spec`,
        url: specUrl,
      },
      {
        type: "screenshot",
        label: `${context.project.name} preview capture`,
        url: screenshotUrl,
      },
    ];

    if (diffOutput) {
      const diffUrl = await writeArtifactFile(context.project.slug, diffFile, diffOutput);
      artifacts.push({
        type: "commit-diff",
        label: `Commit diff ${commitSha || context.project.slug}`,
        url: diffUrl,
      });
    }

    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const sha = commitSha || buildPseudoSha(context.project.slug, runKey);

    return {
      phase: buildPassed ? context.plan.phase : "testing",
      outcome: buildPassed ? "healthy" : checksPassed ? "warning" : "blocked",
      terminal,
      metricsDelta: {
        mergedCommits24h: buildPassed
          ? Math.max(1, context.plan.metricsDelta.mergedCommits24h)
          : 0,
        completedTasks24h: buildPassed ? context.plan.metricsDelta.completedTasks24h : 0,
        successfulDeploys24h: buildPassed ? 1 : 0,
      },
      artifacts,
      deployment: {
        sha,
        branch: "main",
        previewUrl: buildPassed ? previewUrl : context.project.previewUrl,
        status: buildPassed ? "ready" : "failed",
        durationSeconds,
        screenshotLabel: context.plan.objective,
      },
      event: buildPassed
        ? {
            category: "deploy",
            title: "Managed workspace build shipped",
            detail: `${context.agent.displayName} executed a real lint/test/build cycle for ${context.project.name}${commitSha ? ` at ${commitSha}` : ""}.`,
            scoreDelta: context.plan.event.scoreDelta,
          }
        : {
            category: "run",
            title: "Managed workspace cycle blocked",
            detail: `${context.agent.displayName} hit a local verification blocker while executing ${context.plan.objective.toLowerCase()}.`,
            scoreDelta: 0,
          },
    };
  } finally {
    await removeDirectory(runDir);
  }
}
