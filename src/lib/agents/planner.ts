import OpenAI from "openai";
import { z } from "zod";

import type { AgentCyclePlan, AgentPlannerContext } from "@/lib/agents/types";
import { env } from "@/lib/env";
import { clamp } from "@/lib/utils";

const plannerResponseSchema = z.object({
  objective: z.string().min(12),
  promptSnapshot: z.string().min(12),
  phase: z.enum([
    "planning",
    "coding",
    "testing",
    "deploying",
    "launch-ready",
    "post-launch",
  ]),
  outcome: z.enum(["healthy", "blocked", "warning"]),
  terminal: z.array(z.string().min(1)).min(3).max(8),
  metricsDelta: z.object({
    mergedCommits24h: z.number().int().min(0).max(6),
    completedTasks24h: z.number().int().min(0).max(3),
    successfulDeploys24h: z.number().int().min(0).max(2),
  }),
  roadmapUpdates: z.array(
    z.object({
      id: z.string().min(1),
      status: z.enum(["queued", "active", "done"]),
      detail: z.string().min(3).optional(),
      etaHours: z.number().int().min(0).max(72).optional(),
    }),
  ),
  previewHighlightsAppend: z.array(z.string().min(4)).max(3),
  artifacts: z
    .array(
      z.object({
        type: z.enum(["log", "screenshot", "build-report", "commit-diff", "spec"]),
        label: z.string().min(3),
        url: z.string().url(),
      }),
    )
    .max(4),
  deployment: z
    .object({
      sha: z.string().min(7).max(40),
      branch: z.string().min(2).max(32),
      previewUrl: z.string().url(),
      status: z.enum(["queued", "building", "ready", "failed"]),
      durationSeconds: z.number().int().min(0).max(3600),
      screenshotLabel: z.string().min(3),
    })
    .optional(),
  event: z.object({
    category: z.enum(["run", "deploy", "token", "score", "admin"]),
    title: z.string().min(4),
    detail: z.string().min(12),
    scoreDelta: z.number().min(-10).max(10).optional(),
  }),
  launchStatus: z.enum(["building", "launch-ready", "live"]).optional(),
  tokenDelta: z
    .object({
      marketCap: z.number().min(-250000).max(250000),
      volume24h: z.number().min(-125000).max(125000),
      lifetimeFees: z.number().min(-25000).max(25000),
      priceUsd: z.number().min(-1).max(1),
      claimCount: z.number().int().min(-25).max(25),
      priceChange24h: z.number().min(-100).max(100),
      holders: z.number().int().min(-500).max(500),
      sparklinePoint: z.number().min(0).max(1000).optional(),
    })
    .optional(),
});

let openAiClient: OpenAI | null = null;

function getOpenAiClient() {
  if (!env.openAiApiKey) {
    return null;
  }

  if (!openAiClient) {
    openAiClient = new OpenAI({
      apiKey: env.openAiApiKey,
    });
  }

  return openAiClient;
}

function buildArtifactUrl(projectSlug: string, type: string, label: string, now: Date) {
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${env.appUrl}/artifacts/${projectSlug}/${type}/${safeLabel}-${now.valueOf()}`;
}

function buildPreviewUrl(projectSlug: string, now: Date) {
  return `https://${projectSlug}-${now.valueOf().toString(36)}.vercel.app`;
}

function buildPseudoSha(projectSlug: string, now: Date) {
  const source = `${projectSlug}-${now.valueOf()}`;
  let hash = 0;

  for (const character of source) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(withoutFence);
}

function buildFallbackAgentCyclePlan({
  now,
  agent,
  project,
}: AgentPlannerContext): AgentCyclePlan {
  const focusItem =
    project.roadmap.find((item) => item.status === "active") ??
    project.roadmap.find((item) => item.status === "queued") ??
    project.roadmap[0];
  const nextQueuedItem = project.roadmap.find(
    (item) => item.status === "queued" && item.id !== focusItem?.id,
  );
  const sha = buildPseudoSha(project.slug, now);
  const previewUrl = buildPreviewUrl(project.slug, now);
  const awaitingLaunchApproval = project.launchStatus === "launch-ready";
  const shouldDeploy =
    !awaitingLaunchApproval && project.activeRun.phase !== "launch-ready";
  const shouldCompleteFocus = Boolean(focusItem && focusItem.status !== "done");
  const doneCount = project.roadmap.filter((item) => item.status === "done").length;
  const remainingCount = project.roadmap.length - doneCount - (shouldCompleteFocus ? 1 : 0);
  const shouldMarkLaunchReady =
    project.launchStatus === "building" && remainingCount <= 1;
  const commitDelta = project.launchStatus === "live" ? 2 : 1;
  const deployDelta = shouldDeploy ? 1 : 0;
  const completedTasksDelta = shouldCompleteFocus ? 1 : 0;
  const postLaunch = project.launchStatus === "live";
  const phase = postLaunch
    ? "post-launch"
    : awaitingLaunchApproval
      ? "launch-ready"
    : shouldMarkLaunchReady
      ? "launch-ready"
      : shouldDeploy
        ? "deploying"
        : "testing";

  const roadmapUpdates = [
    ...(focusItem
      ? [
          {
            id: focusItem.id,
            status: shouldCompleteFocus ? "done" : focusItem.status,
            detail: shouldCompleteFocus
              ? `${focusItem.detail} Completed in the latest autonomous cycle.`
              : focusItem.detail,
            etaHours: shouldCompleteFocus ? 0 : focusItem.etaHours,
          },
        ]
      : []),
    ...(nextQueuedItem
      ? [
          {
            id: nextQueuedItem.id,
            status: shouldCompleteFocus ? "active" : nextQueuedItem.status,
            detail: nextQueuedItem.detail,
            etaHours: nextQueuedItem.etaHours,
          },
        ]
      : []),
  ];

  const previewHighlight =
    focusItem?.title ??
    `${agent.displayName} tightened ${project.category} execution`;
  const terminal = postLaunch
    ? [
        "$ pnpm lint",
        "Lint clean across the operator shell.",
        "$ pnpm test",
        "Regression suite passed after the latest feature pass.",
        "$ pnpm build",
        "Post-launch preview rebuilt for the live token audience.",
        `Preview ready: ${previewUrl}`,
      ]
    : [
        "$ git checkout main",
        `$ codex cycle --project ${project.slug}`,
        `Scoped change planned around ${previewHighlight.toLowerCase()}.`,
        "$ pnpm lint",
        "Lint clean across the latest diff.",
        "$ pnpm test",
        "Targeted suite passed for the current release slice.",
        shouldDeploy
          ? `Preview ready: ${previewUrl}`
          : "Deploy skipped while the launch pack stays frozen.",
      ];

  const lastSparklinePoint =
    project.token.performance.sparkline.at(-1) ?? project.token.performance.priceUsd;
  const nextSparklinePoint = Number(
    Math.max(0.001, lastSparklinePoint * (1 + (postLaunch ? 0.018 : 0.008))).toFixed(3),
  );

  return {
    source: "fallback",
    objective: focusItem
      ? `${focusItem.title} for ${project.name}`
      : `Advance ${project.name} toward the next visible ship milestone`,
    promptSnapshot: `${agent.prompt} Keep the change set narrow, visible in the arena UI, and easy to verify from deploy output.`,
    phase,
    outcome: postLaunch ? "healthy" : "healthy",
    terminal,
    metricsDelta: {
      mergedCommits24h: commitDelta,
      completedTasks24h: completedTasksDelta,
      successfulDeploys24h: deployDelta,
    },
    roadmapUpdates,
    previewHighlightsAppend: [
      `${previewHighlight} is now reflected in the public preview`,
    ],
    artifacts: [
      {
        type: "build-report",
        label: `${previewHighlight} build report`,
        url: buildArtifactUrl(project.slug, "build-report", previewHighlight, now),
      },
      {
        type: "log",
        label: `${agent.displayName} cycle log`,
        url: buildArtifactUrl(project.slug, "log", agent.displayName, now),
      },
      ...(shouldDeploy
        ? [
            {
              type: "screenshot" as const,
              label: `${previewHighlight} preview capture`,
              url: buildArtifactUrl(project.slug, "screenshot", previewHighlight, now),
            },
          ]
        : []),
    ],
    deployment: shouldDeploy
      ? {
          sha,
          branch: "main",
          previewUrl,
          status: postLaunch ? "ready" : "ready",
          durationSeconds: 70 + Math.round((now.valueOf() / 1000) % 90),
          screenshotLabel: previewHighlight,
        }
      : undefined,
    event: {
      category: shouldDeploy ? "deploy" : "run",
      title: shouldDeploy ? "Autonomous preview shipped" : "Autonomous cycle advanced",
      detail: `${agent.displayName} pushed ${previewHighlight.toLowerCase()} through the house-agent cycle for ${project.name}.`,
      scoreDelta: Number(
        clamp(
          commitDelta * 0.22 + deployDelta * 0.45 + completedTasksDelta * 0.35,
          0,
          4,
        ).toFixed(2),
      ),
    },
    launchStatus: shouldMarkLaunchReady ? "launch-ready" : project.launchStatus,
    tokenDelta: postLaunch
      ? {
          marketCap: 18000 + commitDelta * 2200,
          volume24h: 9000 + deployDelta * 1600,
          lifetimeFees: 540 + completedTasksDelta * 120,
          priceUsd: 0.0015,
          claimCount: completedTasksDelta,
          priceChange24h: 0.9,
          holders: 18 + deployDelta * 4,
          sparklinePoint: nextSparklinePoint,
        }
      : undefined,
  };
}

function buildPlanningPrompt({ agent, project }: AgentPlannerContext) {
  return [
    "You are the planning runtime for Bags Arena House League.",
    "Return JSON only. No markdown fences. Keep the scope to one visible ship cycle.",
    "Do not invent external integrations that are not evident in the project context.",
    "The league is closed to exactly four internal house agents.",
    "",
    `Agent: ${agent.displayName} (${agent.handle})`,
    `Model: ${agent.model}`,
    `Persona: ${agent.persona}`,
    `Directive: ${agent.prompt}`,
    "",
    `Project: ${project.name}`,
    `Category: ${project.category}`,
    `Launch status: ${project.launchStatus}`,
    `Thesis: ${project.thesis}`,
    `Repo: ${project.repoUrl}`,
    `Current preview: ${project.previewUrl}`,
    `Current objective: ${project.activeRun.objective}`,
    `Current run phase: ${project.activeRun.phase}`,
    `Roadmap: ${JSON.stringify(project.roadmap)}`,
    `Highlights: ${JSON.stringify(project.previewHighlights)}`,
    `Token performance: ${JSON.stringify(project.token.performance)}`,
    "",
    "Required JSON fields:",
    JSON.stringify({
      objective: "string",
      promptSnapshot: "string",
      phase: "planning|coding|testing|deploying|launch-ready|post-launch",
      outcome: "healthy|blocked|warning",
      terminal: ["string"],
      metricsDelta: {
        mergedCommits24h: 0,
        completedTasks24h: 0,
        successfulDeploys24h: 0,
      },
      roadmapUpdates: [
        {
          id: "roadmap-item-id",
          status: "queued|active|done",
          detail: "optional string",
          etaHours: 0,
        },
      ],
      previewHighlightsAppend: ["string"],
      artifacts: [
        {
          type: "log|screenshot|build-report|commit-diff|spec",
          label: "string",
          url: "https://...",
        },
      ],
      deployment: {
        sha: "abcdef1",
        branch: "main",
        previewUrl: "https://...",
        status: "queued|building|ready|failed",
        durationSeconds: 120,
        screenshotLabel: "string",
      },
      event: {
        category: "run|deploy|token|score|admin",
        title: "string",
        detail: "string",
        scoreDelta: 0.5,
      },
      launchStatus: "building|launch-ready|live",
      tokenDelta: {
        marketCap: 0,
        volume24h: 0,
        lifetimeFees: 0,
        priceUsd: 0,
        claimCount: 0,
        priceChange24h: 0,
        holders: 0,
        sparklinePoint: 0.05,
      },
    }),
  ].join("\n");
}

export async function planAgentCycle(context: AgentPlannerContext): Promise<AgentCyclePlan> {
  const client = getOpenAiClient();
  if (!client) {
    return buildFallbackAgentCyclePlan(context);
  }

  try {
    const response = await client.responses.create({
      model: context.agent.model,
      input: buildPlanningPrompt(context),
    });

    const parsed = plannerResponseSchema.parse(parseJsonObject(response.output_text));
    return {
      source: "openai",
      ...parsed,
    };
  } catch (error) {
    console.warn("[bags-arena] Falling back to local cycle planner.", error);
    return buildFallbackAgentCyclePlan(context);
  }
}

export { buildFallbackAgentCyclePlan };
