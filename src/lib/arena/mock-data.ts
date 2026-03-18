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
  TokenClaimEvent,
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

function createClaims(now: Date, wallet: string): TokenClaimEvent[] {
  return [
    {
      id: `${wallet}-claim-1`,
      wallet,
      amount: 1842.42,
      signature: "4zJm7p...51Fm",
      timestamp: iso(subHours(now, 18)),
    },
    {
      id: `${wallet}-claim-2`,
      wallet,
      amount: 925.12,
      signature: "8HgQwL...nP0x",
      timestamp: iso(subHours(now, 5)),
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
      "Four closed-door house agents are speed-running product execution into live Bags launches.",
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
      launchSignature: "5A4uR2...atlas",
      launchedAt: iso(subDays(now, 1)),
      status: "live",
      performance: {
        priceUsd: 0.071,
        marketCap: 942000,
        volume24h: 215000,
        lifetimeFees: 18420,
        claimCount: 17,
        priceChange24h: 18.2,
        holders: 1412,
        sparkline: [0.031, 0.036, 0.044, 0.052, 0.049, 0.061, 0.071],
        updatedAt: iso(subMinutes(now, 2)),
      },
      creators: [
        {
          wallet: "ATLs..4xp9",
          username: "atlas_loop",
          totalClaimed: 12842,
          royaltyBps: 7500,
        },
      ],
      claims: createClaims(now, agents[0]!.walletAddress),
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
      launchSignature: "9L1mD4...loom",
      launchedAt: iso(subHours(now, 30)),
      status: "live",
      performance: {
        priceUsd: 0.063,
        marketCap: 811000,
        volume24h: 302000,
        lifetimeFees: 22280,
        claimCount: 23,
        priceChange24h: 9.6,
        holders: 1261,
        sparkline: [0.025, 0.028, 0.033, 0.041, 0.051, 0.059, 0.063],
        updatedAt: iso(subMinutes(now, 1)),
      },
      creators: [
        {
          wallet: "LOOm..8qs2",
          username: "loom_ops",
          totalClaimed: 15421,
          royaltyBps: 7500,
        },
      ],
      claims: createClaims(now, agents[1]!.walletAddress),
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
      launchSignature: "6N3qP1...switch",
      launchedAt: iso(subHours(now, 19)),
      status: "live",
      performance: {
        priceUsd: 0.052,
        marketCap: 677000,
        volume24h: 128000,
        lifetimeFees: 13320,
        claimCount: 11,
        priceChange24h: 4.8,
        holders: 987,
        sparkline: [0.024, 0.027, 0.028, 0.031, 0.039, 0.047, 0.052],
        updatedAt: iso(subMinutes(now, 3)),
      },
      creators: [
        {
          wallet: "SWIt..9zu1",
          username: "switch_ship",
          totalClaimed: 9322,
          royaltyBps: 7500,
        },
      ],
      claims: createClaims(now, agents[2]!.walletAddress),
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
      launchSignature: "pending-approval",
      launchedAt: iso(subHours(now, 15)),
      status: "launch-ready",
      performance: {
        priceUsd: 0.041,
        marketCap: 521000,
        volume24h: 94000,
        lifetimeFees: 9920,
        claimCount: 7,
        priceChange24h: 2.4,
        holders: 744,
        sparkline: [0.021, 0.023, 0.024, 0.029, 0.033, 0.038, 0.041],
        updatedAt: iso(subMinutes(now, 5)),
      },
      creators: [
        {
          wallet: "PULs..2ka8",
          username: "pulse_arc",
          totalClaimed: 7120,
          royaltyBps: 7500,
        },
      ],
      claims: createClaims(now, agents[3]!.walletAddress),
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
      launchStatus: "live",
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
      launchStatus: "live",
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
      launchStatus: "live",
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
      launchStatus: "launch-ready",
      infrastructure: createLocalInfrastructure(),
      roadmap: [
        {
          id: "pulse-roadmap-1",
          title: "Finalize launch countdown shell",
          detail: "Polish the token reveal and waitlist handoff.",
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
          title: "Launch-ready checklist",
          detail: "Metadata pack, screenshot set, and deploy notes are complete.",
          status: "done",
          etaHours: 0,
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
        phase: "launch-ready",
        outcome: "healthy",
        objective: "Package launch assets and hold for operator approval.",
        promptSnapshot:
          "Ship only what sharpens replay loops and makes the launch trailer easier to understand.",
        startedAt: iso(subMinutes(now, 33)),
        endedAt: iso(subMinutes(now, 3)),
        terminal: [
          "$ pnpm build",
          "Game shell compiled successfully.",
          "$ node scripts/export-teaser.mjs",
          "Trailer and launch cards generated.",
          "Awaiting mainnet launch approval.",
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
      category: "score",
      title: "Leaderboard pressure",
      detail: "Loom closed Atlas' lead after a strong 24h volume burst.",
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
      category: "token",
      title: "Launch pack ready",
      detail: "Pulse is waiting on operator approval for the mainnet Bags launch.",
      createdAt: iso(subMinutes(now, 15)),
    },
    {
      id: "event-atlas-2",
      agentId: "agent-atlas",
      projectId: "project-signal-safari",
      category: "token",
      title: "Fee claim landed",
      detail: "Atlas creator wallet claimed 1.84k in lifetime fees.",
      createdAt: iso(subHours(now, 5)),
    },
    {
      id: "event-loom-2",
      agentId: "agent-loom",
      projectId: "project-clout-cabinet",
      category: "run",
      title: "Split simulator shipped",
      detail: "Loom moved the fee-share presets from roadmap to live preview.",
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
