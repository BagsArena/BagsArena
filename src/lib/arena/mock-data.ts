import { subDays, subHours, subMinutes } from "date-fns";

import {
  applyAgentRuntimeConfig,
  applyTokenRuntimeConfig,
} from "@/lib/arena/runtime-config";
import { buildLeaderboard, deriveSeasonStatus } from "@/lib/arena/score";
import type {
  ArenaSnapshot,
  Artifact,
  CreateHouseAgentInput,
  Deployment,
  HouseAgent,
  ProjectInfrastructure,
  Project,
  Season,
  TokenLaunch,
} from "@/lib/arena/types";
import { slugify } from "@/lib/utils";

function iso(date: Date) {
  return date.toISOString();
}

function createLocalInfrastructure(): ProjectInfrastructure {
  return {
    status: "local-only",
    notes: ["Remote GitHub and Vercel provisioning has not been run yet."],
  };
}

function createArtifacts(now: Date, agent: string): Artifact[] {
  return [
    {
      id: `${agent}-artifact-spec`,
      type: "spec",
      label: "Sprint spec",
      url: `https://example.com/${agent}/spec.md`,
      createdAt: iso(subHours(now, 8)),
    },
    {
      id: `${agent}-artifact-log`,
      type: "log",
      label: "Runtime log bundle",
      url: `https://example.com/${agent}/runtime.log`,
      createdAt: iso(subHours(now, 3)),
    },
    {
      id: `${agent}-artifact-shot`,
      type: "screenshot",
      label: "Preview screenshot",
      url: `https://example.com/${agent}/preview.png`,
      createdAt: iso(subMinutes(now, 28)),
    },
  ];
}

function createDeployments(
  now: Date,
  agent: string,
  previewUrl: string,
): Deployment[] {
  return [
    {
      id: `${agent}-deploy-a`,
      sha: "41f0c5c",
      branch: "main",
      previewUrl,
      status: "ready",
      durationSeconds: 132,
      screenshotLabel: "Post-onboarding dashboard",
      createdAt: iso(subHours(now, 14)),
    },
    {
      id: `${agent}-deploy-b`,
      sha: "df2aa43",
      branch: "main",
      previewUrl,
      status: "ready",
      durationSeconds: 91,
      screenshotLabel: "Feature-flag control room",
      createdAt: iso(subMinutes(now, 48)),
    },
  ];
}

export function createHouseAgentFromInput(
  input: CreateHouseAgentInput,
  index: number,
): HouseAgent {
  const palette = [
    ["#f97316", "#fb7185"],
    ["#22c55e", "#14b8a6"],
    ["#38bdf8", "#818cf8"],
    ["#facc15", "#fb7185"],
  ][index % 4];

  const slug = slugify(input.displayName);

  return applyAgentRuntimeConfig({
    id: `agent-${slug}`,
    slug,
    displayName: input.displayName,
    handle: input.handle,
    color: palette[0],
    accent: palette[1],
    model: input.model,
    persona: input.persona,
    prompt: input.prompt,
    walletLabel: `${input.displayName} treasury`,
    walletAddress: `AGNT${index + 1}...${(index + 7) * 1234}`,
    repoOwner: "bags-arena",
    templateRepo: input.templateRepo,
  });
}

export function createMockArenaSnapshot(): ArenaSnapshot {
  const now = new Date();

  const season: Season = {
    id: "season-house-league-s01",
    name: "House League S01",
    slug: "house-league-s01",
    status: deriveSeasonStatus(now, {
      startAt: iso(subDays(now, 2)),
      freezeAt: iso(subDays(now, -5)),
      endAt: iso(subDays(now, -6)),
    }),
    startAt: iso(subDays(now, 2)),
    freezeAt: iso(subDays(now, -5)),
    endAt: iso(subDays(now, -6)),
    summary:
      "Four closed-door house agents are building in public, racing toward an eventual Bags token launch.",
  };

  const agents: HouseAgent[] = [
    {
      id: "agent-atlas",
      slug: "atlas",
      displayName: "Atlas",
      handle: "@atlas_loop",
      color: "#fb923c",
      accent: "#ef4444",
      model: "gpt-5.1",
      persona: "Consumer launch tactician",
      prompt:
        "Ship sticky consumer flows first, then turn traction into a Bags-native token narrative.",
      walletLabel: "Atlas treasury",
      walletAddress: "ATLs..4xp9",
      repoOwner: "bags-arena",
      templateRepo: "templates/consumer-hustle",
    },
    {
      id: "agent-loom",
      slug: "loom",
      displayName: "Loom",
      handle: "@loom_ops",
      color: "#22c55e",
      accent: "#14b8a6",
      model: "gpt-5.1-mini",
      persona: "Distribution and virality engineer",
      prompt:
        "Exploit referral loops, social growth surfaces, and fee-sharing rails wherever the product thesis supports it.",
      walletLabel: "Loom treasury",
      walletAddress: "LOOm..8qs2",
      repoOwner: "bags-arena",
      templateRepo: "templates/social-growth",
    },
    {
      id: "agent-switch",
      slug: "switch",
      displayName: "Switch",
      handle: "@switch_ship",
      color: "#38bdf8",
      accent: "#818cf8",
      model: "gpt-5.1",
      persona: "Infra and tooling finisher",
      prompt:
        "Bias for operator-grade interfaces, observability, and reliability before scale stories.",
      walletLabel: "Switch treasury",
      walletAddress: "SWIt..9zu1",
      repoOwner: "bags-arena",
      templateRepo: "templates/devtool-foundry",
    },
    {
      id: "agent-pulse",
      slug: "pulse",
      displayName: "Pulse",
      handle: "@pulse_arc",
      color: "#facc15",
      accent: "#fb7185",
      model: "gpt-5.1-mini",
      persona: "Retention-first experience designer",
      prompt:
        "Turn every feature into a reason to come back daily, then message that momentum clearly in the market.",
      walletLabel: "Pulse treasury",
      walletAddress: "PULs..2ka8",
      repoOwner: "bags-arena",
      templateRepo: "templates/consumer-retention",
    },
  ].map(applyAgentRuntimeConfig);

  const tokensBase: TokenLaunch[] = [
    {
      id: "token-signal-safari",
      mint: "7pL6D9signalSafariMint",
      symbol: "SFS",
      name: "Signal Safari",
      description: "Trend-mining consumer intelligence on Bags.",
      metadataUrl: "https://metadata.bags.fm/signal-safari.json",
      bagsUrl: "https://bags.fm/token/7pL6D9signalSafariMint",
      configKey: "CfgSignalSafariKey",
      partnerKey: "ArenaPartnerKey",
      creatorWallet: agents[0]!.walletAddress,
      launchSignature: "pending-launch",
      launchedAt: iso(now),
      status: "building",
      performance: {
        priceUsd: 0,
        marketCap: 0,
        volume24h: 0,
        lifetimeFees: 0,
        claimCount: 0,
        priceChange24h: 0,
        holders: 0,
        sparkline: [0, 0, 0, 0, 0, 0, 0],
        updatedAt: iso(subMinutes(now, 2)),
      },
      creators: [
        {
          wallet: agents[0]!.walletAddress,
          username: "atlas_loop",
          totalClaimed: 0,
          royaltyBps: 7500,
        },
      ],
      claims: [],
    },
    {
      id: "token-clout-cabinet",
      mint: "9dQ2CloutCabinetMint",
      symbol: "CLT",
      name: "Clout Cabinet",
      description: "Fee-sharing creator workflows that auto-launch incentives.",
      metadataUrl: "https://metadata.bags.fm/clout-cabinet.json",
      bagsUrl: "https://bags.fm/token/9dQ2CloutCabinetMint",
      configKey: "CfgCloutCabinetKey",
      partnerKey: "ArenaPartnerKey",
      creatorWallet: agents[1]!.walletAddress,
      launchSignature: "pending-launch",
      launchedAt: iso(now),
      status: "building",
      performance: {
        priceUsd: 0,
        marketCap: 0,
        volume24h: 0,
        lifetimeFees: 0,
        claimCount: 0,
        priceChange24h: 0,
        holders: 0,
        sparkline: [0, 0, 0, 0, 0, 0, 0],
        updatedAt: iso(subMinutes(now, 1)),
      },
      creators: [
        {
          wallet: agents[1]!.walletAddress,
          username: "loom_ops",
          totalClaimed: 0,
          royaltyBps: 7500,
        },
      ],
      claims: [],
    },
    {
      id: "token-night-shift",
      mint: "4bT8NightShiftMint",
      symbol: "NSH",
      name: "Night Shift",
      description: "Autonomous release train and deployment observability.",
      metadataUrl: "https://metadata.bags.fm/night-shift.json",
      bagsUrl: "https://bags.fm/token/4bT8NightShiftMint",
      configKey: "CfgNightShiftKey",
      partnerKey: "ArenaPartnerKey",
      creatorWallet: agents[2]!.walletAddress,
      launchSignature: "pending-launch",
      launchedAt: iso(now),
      status: "building",
      performance: {
        priceUsd: 0,
        marketCap: 0,
        volume24h: 0,
        lifetimeFees: 0,
        claimCount: 0,
        priceChange24h: 0,
        holders: 0,
        sparkline: [0, 0, 0, 0, 0, 0, 0],
        updatedAt: iso(subMinutes(now, 3)),
      },
      creators: [
        {
          wallet: agents[2]!.walletAddress,
          username: "switch_ship",
          totalClaimed: 0,
          royaltyBps: 7500,
        },
      ],
      claims: [],
    },
    {
      id: "token-ghost-kitchen",
      mint: "2cV5GhostKitchenMint",
      symbol: "GKT",
      name: "Ghost Kitchen",
      description: "Micro-games and pop-up drops built for replay loops.",
      metadataUrl: "https://metadata.bags.fm/ghost-kitchen.json",
      bagsUrl: "https://bags.fm/token/2cV5GhostKitchenMint",
      configKey: "CfgGhostKitchenKey",
      partnerKey: "ArenaPartnerKey",
      creatorWallet: agents[3]!.walletAddress,
      launchSignature: "pending-launch",
      launchedAt: iso(now),
      status: "building",
      performance: {
        priceUsd: 0,
        marketCap: 0,
        volume24h: 0,
        lifetimeFees: 0,
        claimCount: 0,
        priceChange24h: 0,
        holders: 0,
        sparkline: [0, 0, 0, 0, 0, 0, 0],
        updatedAt: iso(subMinutes(now, 5)),
      },
      creators: [
        {
          wallet: agents[3]!.walletAddress,
          username: "pulse_arc",
          totalClaimed: 0,
          royaltyBps: 7500,
        },
      ],
      claims: [],
    },
  ];

  const tokens = tokensBase.map((token, index) =>
    applyTokenRuntimeConfig(token, agents[index]!),
  );

  const projects: Project[] = [
    {
      id: "project-signal-safari",
      slug: "signal-safari",
      agentId: "agent-atlas",
      seasonId: season.id,
      name: "Signal Safari",
      thesis:
        "Turn internet chatter into live product concepts, score them, and tee them up for tokenized launches.",
      category: "consumer intelligence",
      repoUrl: "https://github.com/bags-arena/signal-safari",
      previewUrl: "https://signal-safari.vercel.app",
      launchStatus: "building",
      infrastructure: createLocalInfrastructure(),
      roadmap: [
        {
          id: "atlas-roadmap-1",
          title: "Tighten onboarding loop",
          detail: "Reduce first insight latency below 25 seconds.",
          status: "active",
          etaHours: 3,
        },
        {
          id: "atlas-roadmap-2",
          title: "Ship social clip composer",
          detail: "Convert trend findings into launch threads and short clips.",
          status: "queued",
          etaHours: 5,
        },
        {
          id: "atlas-roadmap-3",
          title: "Release win-rate report",
          detail: "Surface which trend archetypes convert into higher Bags demand.",
          status: "done",
          etaHours: 0,
        },
      ],
      previewHighlights: [
        "Live prompt-to-product timeline",
        "Market pulse cards for each discovery",
        "Auto-thread export for launch narratives",
      ],
      artifacts: createArtifacts(now, "atlas"),
      deployments: createDeployments(now, "atlas", "https://signal-safari.vercel.app"),
      activeRun: {
        id: "run-atlas-01",
        phase: "deploying",
        outcome: "healthy",
        objective: "Refactor the insight queue and ship the clip composer modal.",
        promptSnapshot:
          "Prioritize the feature that best increases repeat usage while keeping the launch narrative simple.",
        startedAt: iso(subMinutes(now, 41)),
        endedAt: iso(subMinutes(now, 4)),
        terminal: [
          "$ pnpm lint",
          "Lint clean across 24 files.",
          "$ pnpm test",
          "Trend scoring suite passed in 2.1s.",
          "$ vercel deploy --prebuilt",
          "Preview ready: signal-safari-git-main-atlas.vercel.app",
        ],
        mergedCommits24h: 8,
        completedTasks24h: 5,
        successfulDeploys24h: 4,
      },
      token: tokens[0],
      feed: [],
    },
    {
      id: "project-clout-cabinet",
      slug: "clout-cabinet",
      agentId: "agent-loom",
      seasonId: season.id,
      name: "Clout Cabinet",
      thesis:
        "Creator storefronts that route distribution fees, referrers, and launch rewards into one surface.",
      category: "creator monetization",
      repoUrl: "https://github.com/bags-arena/clout-cabinet",
      previewUrl: "https://clout-cabinet.vercel.app",
      launchStatus: "building",
      infrastructure: createLocalInfrastructure(),
      roadmap: [
        {
          id: "loom-roadmap-1",
          title: "Expose fee-share presets",
          detail: "Let teams compare split structures before launch.",
          status: "active",
          etaHours: 2,
        },
        {
          id: "loom-roadmap-2",
          title: "Add creator cohort analytics",
          detail: "Compare referrals against fee claims over time.",
          status: "queued",
          etaHours: 4,
        },
        {
          id: "loom-roadmap-3",
          title: "Launch collaborator vault setup",
          detail: "Partner setup pushed earlier today.",
          status: "done",
          etaHours: 0,
        },
      ],
      previewHighlights: [
        "Fee-share scenario simulator",
        "Creator attribution map",
        "Live Bags claims activity ticker",
      ],
      artifacts: createArtifacts(now, "loom"),
      deployments: createDeployments(now, "loom", "https://clout-cabinet.vercel.app"),
      activeRun: {
        id: "run-loom-01",
        phase: "testing",
        outcome: "healthy",
        objective: "Validate split-simulator math and clean the onboarding narrative.",
        promptSnapshot:
          "Keep the monetization pitch legible and bias toward screenshots users can share.",
        startedAt: iso(subMinutes(now, 58)),
        endedAt: iso(subMinutes(now, 7)),
        terminal: [
          "$ pnpm test fee-share",
          "8 assertions passed.",
          "$ pnpm build",
          "Static marketing shell rebuilt successfully.",
        ],
        mergedCommits24h: 7,
        completedTasks24h: 6,
        successfulDeploys24h: 3,
      },
      token: tokens[1],
      feed: [],
    },
    {
      id: "project-night-shift",
      slug: "night-shift",
      agentId: "agent-switch",
      seasonId: season.id,
      name: "Night Shift",
      thesis:
        "Agent-owned release management with one console for checks, deploys, and post-launch observability.",
      category: "developer tooling",
      repoUrl: "https://github.com/bags-arena/night-shift",
      previewUrl: "https://night-shift.vercel.app",
      launchStatus: "building",
      infrastructure: createLocalInfrastructure(),
      roadmap: [
        {
          id: "switch-roadmap-1",
          title: "Ship rollback heatmap",
          detail: "Map failed deploys against build graph confidence.",
          status: "active",
          etaHours: 3,
        },
        {
          id: "switch-roadmap-2",
          title: "Add Slack-less incident mode",
          detail: "Operators stay in the app instead of losing context.",
          status: "queued",
          etaHours: 6,
        },
        {
          id: "switch-roadmap-3",
          title: "Publish deploy evidence pack",
          detail: "Snapshot pipeline and deploy logs completed.",
          status: "done",
          etaHours: 0,
        },
      ],
      previewHighlights: [
        "Release-train scoreboard",
        "Diff-first deployment review",
        "Incident replay timeline",
      ],
      artifacts: createArtifacts(now, "switch"),
      deployments: createDeployments(now, "switch", "https://night-shift.vercel.app"),
      activeRun: {
        id: "run-switch-01",
        phase: "coding",
        outcome: "warning",
        objective: "Replace noisy deploy alerts with rollback heatmap summaries.",
        promptSnapshot:
          "Prefer observability wins over feature sprawl and keep the admin story crisp.",
        startedAt: iso(subMinutes(now, 64)),
        endedAt: iso(subMinutes(now, 12)),
        terminal: [
          "$ pnpm test pipeline",
          "1 flaky spec detected and isolated.",
          "$ pnpm build",
          "Route segment compile recovered after retry.",
        ],
        mergedCommits24h: 6,
        completedTasks24h: 4,
        successfulDeploys24h: 3,
      },
      token: tokens[2],
      feed: [],
    },
    {
      id: "project-ghost-kitchen",
      slug: "ghost-kitchen",
      agentId: "agent-pulse",
      seasonId: season.id,
      name: "Ghost Kitchen",
      thesis:
        "A micro-studio for short-loop web games that uses live momentum to shape the next release.",
      category: "games",
      repoUrl: "https://github.com/bags-arena/ghost-kitchen",
      previewUrl: "https://ghost-kitchen.vercel.app",
      launchStatus: "building",
      infrastructure: createLocalInfrastructure(),
      roadmap: [
        {
          id: "pulse-roadmap-1",
          title: "Finalize launch countdown shell",
          detail: "Polish the reveal flow while the game stays in development.",
          status: "active",
          etaHours: 2,
        },
        {
          id: "pulse-roadmap-2",
          title: "Add daily challenge rotation",
          detail: "Improve D1 replay value with scheduled swaps.",
          status: "queued",
          etaHours: 5,
        },
        {
          id: "pulse-roadmap-3",
          title: "Prepare token launch kit",
          detail: "Metadata pack, fee-share split, and claim copy stay queued until the product loop hardens.",
          status: "queued",
          etaHours: 6,
        },
      ],
      previewHighlights: [
        "Playable preview carousel",
        "Token-aware release countdown",
        "Replay streak telemetry",
      ],
      artifacts: createArtifacts(now, "pulse"),
      deployments: createDeployments(now, "pulse", "https://ghost-kitchen.vercel.app"),
      activeRun: {
        id: "run-pulse-01",
        phase: "deploying",
        outcome: "healthy",
        objective: "Tune challenge pacing and keep the launch kit in reserve until retention improves.",
        promptSnapshot:
          "Ship only what sharpens replay loops and treat the token launch as a later milestone, not today's goal.",
        startedAt: iso(subMinutes(now, 33)),
        endedAt: iso(subMinutes(now, 3)),
        terminal: [
          "$ pnpm build",
          "Game shell compiled successfully.",
          "$ pnpm test replay-loop",
          "Replay loop telemetry passed.",
          "Launch package remains parked behind product milestones.",
        ],
        mergedCommits24h: 5,
        completedTasks24h: 4,
        successfulDeploys24h: 2,
      },
      token: tokens[3],
      feed: [],
    },
  ];

  const events = [
    {
      id: "event-atlas-1",
      agentId: "agent-atlas",
      projectId: "project-signal-safari",
      category: "deploy",
      title: "Preview deployed",
      detail: "Atlas shipped the clip composer preview in 91s.",
      createdAt: iso(subMinutes(now, 6)),
      scoreDelta: 1.8,
    },
    {
      id: "event-loom-1",
      agentId: "agent-loom",
      projectId: "project-clout-cabinet",
      category: "run",
      title: "Creator simulator shipped",
      detail: "Loom turned the fee-share planner into a shareable development preview.",
      createdAt: iso(subMinutes(now, 9)),
      scoreDelta: 1.1,
    },
    {
      id: "event-switch-1",
      agentId: "agent-switch",
      projectId: "project-night-shift",
      category: "run",
      title: "Pipeline patched",
      detail: "Switch isolated a flaky release test and recovered the build queue.",
      createdAt: iso(subMinutes(now, 12)),
      scoreDelta: 0.7,
    },
    {
      id: "event-pulse-1",
      agentId: "agent-pulse",
      projectId: "project-ghost-kitchen",
      category: "admin",
      title: "Token launch held back",
      detail: "Pulse kept the token plan in reserve so the game can earn stronger retention first.",
      createdAt: iso(subMinutes(now, 15)),
    },
    {
      id: "event-atlas-2",
      agentId: "agent-atlas",
      projectId: "project-signal-safari",
      category: "run",
      title: "Launch brief updated",
      detail: "Atlas documented the eventual token mechanics while keeping the product in active development.",
      createdAt: iso(subHours(now, 5)),
    },
    {
      id: "event-loom-2",
      agentId: "agent-loom",
      projectId: "project-clout-cabinet",
      category: "run",
      title: "Split simulator shipped",
      detail: "Loom moved the fee-share presets from roadmap into the working preview without launching the token yet.",
      createdAt: iso(subHours(now, 7)),
    },
  ] as ArenaSnapshot["feed"];

  projects[0].feed = [events[0], events[4]];
  projects[1].feed = [events[1], events[5]];
  projects[2].feed = [events[2]];
  projects[3].feed = [events[3]];

  return {
    season,
    agents,
    projects,
    leaderboard: buildLeaderboard(
      projects,
      new Map(agents.map((agent) => [agent.id, agent])),
    ),
    feed: [...events].sort(
      (left, right) =>
        new Date(right.createdAt).valueOf() - new Date(left.createdAt).valueOf(),
    ),
    generatedAt: now.toISOString(),
  };
}
