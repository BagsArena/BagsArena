import type { ArenaRepository } from "@/lib/arena/repository";
import { arenaRepository } from "@/lib/arena/repository";
import type {
  CreatorStat,
  Project,
  TokenClaimEvent,
  TokenPerformance,
} from "@/lib/arena/types";
import type {
  BagsGateway,
  BagsPartnerClaimStats,
  BagsTokenMarketStats,
} from "@/lib/bags/client";
import { createBagsGateway } from "@/lib/bags/client";
import { env, hasLiveBagsConfig } from "@/lib/env";
import { formatUsd } from "@/lib/utils";

interface RefreshDependencies {
  repository?: ArenaRepository;
  gateway?: BagsGateway;
}

export interface RefreshProjectTokenAnalyticsResult {
  project: Project;
  source: "demo" | "bags";
}

function buildClaimId(event: TokenClaimEvent, index: number) {
  return `${event.signature}-${index}`;
}

function mergeCreators(...groups: CreatorStat[][]) {
  const merged = new Map<string, CreatorStat>();

  for (const group of groups) {
    for (const creator of group) {
      const existing = merged.get(creator.wallet);
      merged.set(creator.wallet, {
        wallet: creator.wallet,
        username: creator.username || existing?.username || "bags-creator",
        totalClaimed: creator.totalClaimed ?? existing?.totalClaimed ?? 0,
        royaltyBps: creator.royaltyBps || existing?.royaltyBps || 0,
      });
    }
  }

  return [...merged.values()].sort((left, right) => right.totalClaimed - left.totalClaimed);
}

function buildSparkline(existing: number[], nextPrice: number) {
  const base = existing.length > 0 ? existing.slice(-11) : [nextPrice];
  return [...base, nextPrice].slice(-12);
}

function computeDemoDrift(project: Project) {
  const seed = [...project.slug].reduce((sum, character) => {
    return sum + character.charCodeAt(0);
  }, 0);
  const minuteBucket = Math.floor(Date.now() / 60000);
  const wave = Math.sin((minuteBucket + seed) / 4);
  const drift = wave * 0.025;

  return {
    priceUsd: Number((project.token.performance.priceUsd * (1 + drift)).toFixed(6)),
    marketCap: Math.max(
      0,
      Number((project.token.performance.marketCap * (1 + drift * 1.8)).toFixed(2)),
    ),
    volume24h: Math.max(
      0,
      Number((project.token.performance.volume24h * (1 + Math.abs(drift) * 1.4)).toFixed(2)),
    ),
    priceChange24h: Number((project.token.performance.priceChange24h + drift * 100).toFixed(2)),
    holders: Math.max(0, Math.round(project.token.performance.holders + drift * 40)),
  } satisfies BagsTokenMarketStats;
}

function normalizeClaimEvents(claims: TokenClaimEvent[]) {
  return claims.slice(0, 12).map((claim, index) => ({
    ...claim,
    id: claim.id || buildClaimId(claim, index),
  }));
}

function normalizeVolume24h(
  marketStats: BagsTokenMarketStats | null,
  fallback: number,
) {
  if (marketStats?.volume24h === undefined || Number.isNaN(marketStats.volume24h)) {
    return fallback;
  }

  return Math.max(0, Number(marketStats.volume24h));
}

function buildPerformancePatch(args: {
  project: Project;
  lifetimeFees: number;
  marketStats: BagsTokenMarketStats | null;
  partnerStats: BagsPartnerClaimStats | null;
  claims: TokenClaimEvent[];
  now: string;
}) {
  const { project, lifetimeFees, marketStats, partnerStats, claims, now } = args;
  const current = project.token.performance;
  const fallbackMarket = env.arenaDemoMode ? computeDemoDrift(project) : null;
  const effectiveMarket = marketStats ?? fallbackMarket;
  const priceUsd = effectiveMarket?.priceUsd ?? current.priceUsd;

  return {
    priceUsd,
    marketCap: effectiveMarket?.marketCap ?? current.marketCap,
    volume24h: normalizeVolume24h(effectiveMarket, current.volume24h),
    lifetimeFees,
    claimCount: claims.length > 0 ? Math.max(current.claimCount, claims.length) : current.claimCount,
    priceChange24h: effectiveMarket?.priceChange24h ?? current.priceChange24h,
    holders: effectiveMarket?.holders ?? current.holders,
    sparkline: buildSparkline(current.sparkline, priceUsd),
    ...(partnerStats
      ? {
          partnerClaimedFees: partnerStats.claimedFees,
          partnerUnclaimedFees: partnerStats.unclaimedFees,
        }
      : {}),
    updatedAt: now,
  } satisfies Partial<TokenPerformance> & { updatedAt: string };
}

function buildRefreshEvent(
  project: Project,
  performance: Partial<TokenPerformance> & { updatedAt: string },
  source: "demo" | "bags",
) {
  const partnerDetail =
    performance.partnerClaimedFees !== undefined
      ? ` Partner claimed ${formatUsd(performance.partnerClaimedFees)}.`
      : "";

  return {
    category: "token" as const,
    title: "Token analytics refreshed",
    detail:
      `${project.name} refreshed from ${source === "bags" ? "Bags" : "demo"} metrics. ` +
      `Market cap ${formatUsd(performance.marketCap ?? project.token.performance.marketCap)}, ` +
      `24h volume ${formatUsd(performance.volume24h ?? project.token.performance.volume24h)}, ` +
      `lifetime fees ${formatUsd(performance.lifetimeFees ?? project.token.performance.lifetimeFees)}.` +
      partnerDetail,
    scoreDelta: Number(((performance.priceChange24h ?? 0) * 0.04).toFixed(2)),
  };
}

async function getProjectById(repository: ArenaRepository, projectId: string) {
  const snapshot = await repository.getSnapshot();
  const project = snapshot.projects.find((candidate) => candidate.id === projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  return project;
}

export async function refreshProjectTokenAnalytics(
  projectId: string,
  dependencies: RefreshDependencies = {},
): Promise<RefreshProjectTokenAnalyticsResult> {
  const repository = dependencies.repository ?? arenaRepository;
  const gateway = dependencies.gateway ?? createBagsGateway();
  const project = await getProjectById(repository, projectId);
  const source = !env.arenaDemoMode && hasLiveBagsConfig ? "bags" : "demo";

  const [lifetimeFees, claimStats, creators, rawClaims, marketStats, partnerStats] =
    await Promise.all([
      gateway.getTokenLifetimeFees(project.token.mint),
      gateway.getTokenClaimStats(project.token.mint),
      gateway.getTokenCreators(project.token.mint),
      gateway.getTokenClaimEvents(project.token.mint, 12),
      gateway.getTokenMarketStats(project.token.mint),
      project.token.partnerKey
        ? gateway.getPartnerClaimStats(project.token.partnerKey)
        : Promise.resolve(null),
    ]);

  const claims = normalizeClaimEvents(
    rawClaims.length > 0 ? rawClaims : project.token.claims,
  );
  const mergedCreators = mergeCreators(project.token.creators, creators, claimStats);
  const now = new Date().toISOString();
  const performance = buildPerformancePatch({
    project,
    lifetimeFees,
    marketStats,
    partnerStats,
    claims,
    now,
  });

  return {
    project: await repository.updateProjectTokenAnalytics(projectId, {
      performance,
      creators: mergedCreators,
      claims,
      event: buildRefreshEvent(project, performance, source),
    }),
    source,
  };
}

export async function refreshHouseLeagueTokenAnalytics(
  dependencies: RefreshDependencies = {},
) {
  const repository = dependencies.repository ?? arenaRepository;
  const snapshot = await repository.getSnapshot();
  const projects: Project[] = [];

  for (const project of snapshot.projects) {
    const refreshed = await refreshProjectTokenAnalytics(project.id, dependencies);
    projects.push(refreshed.project);
  }

  return {
    source: !env.arenaDemoMode && hasLiveBagsConfig ? "bags" : "demo",
    projects,
    refreshedAt: new Date().toISOString(),
  };
}
