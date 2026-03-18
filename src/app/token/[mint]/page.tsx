import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

import { Sparkline } from "@/components/arena/sparkline";
import { StatusTicker } from "@/components/arena/status-ticker";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";
import {
  countRoadmapItemsByStatus,
  formatRelativeTime,
  formatUsd,
  isProjectLive,
} from "@/lib/utils";

export default async function TokenPage({
  params,
}: {
  params: Promise<{ mint: string }>;
}) {
  const { mint } = await params;
  const [snapshot, token] = await Promise.all([
    arenaRepository.getSnapshot(),
    arenaRepository.getTokenByMint(mint),
  ]);

  if (!token) {
    notFound();
  }

  const project = snapshot.projects.find((candidate) => candidate.token.mint === mint)!;
  const isLive = isProjectLive(project);

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={snapshot.season.slug} />
      <StatusTicker
        items={[
          { status: project.launchStatus, label: `${project.name} token track` },
          { status: isLive ? "live" : "building", label: token.symbol },
        ]}
      />
      <main className="ui-shell pb-24 pt-8">
        <section className="ui-board paper-grid reveal-up rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="ui-kicker">{isLive ? "Bags token" : "Token launch goal"}</p>
              <h1 className="ui-title mt-3 text-4xl sm:text-6xl">
                {token.name} ({token.symbol})
              </h1>
              <p className="ui-subtitle mt-5 max-w-3xl text-base sm:text-lg">
                {isLive
                  ? token.description
                  : `${token.description} This token is still gated behind product milestones and operator approval.`}
              </p>
            </div>
            {isLive ? (
              <Link href={token.bagsUrl} className="ui-button-primary">
                View on Bags
                <ExternalLink className="size-4" />
              </Link>
            ) : (
              <Link href={`/project/${project.slug}`} className="ui-button-secondary">
                Open project
                <ExternalLink className="size-4" />
              </Link>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="ui-panel reveal-up reveal-delay-1 rounded-[1.85rem] p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">Token surface</p>
                <h2 className="ui-title mt-3 text-3xl">
                  {isLive ? `${project.name} performance` : `${project.name} launch readiness`}
                </h2>
              </div>
              <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Updated {formatRelativeTime(token.performance.updatedAt)}
              </span>
            </div>

            {isLive ? (
              <>
                <Sparkline values={token.performance.sparkline} stroke="var(--accent-strong)" />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="ui-stat">
                    <p className="ui-stat-label">Market cap</p>
                    <p className="ui-stat-value">{formatUsd(token.performance.marketCap)}</p>
                  </div>
                  <div className="ui-stat">
                    <p className="ui-stat-label">24h volume</p>
                    <p className="ui-stat-value">{formatUsd(token.performance.volume24h)}</p>
                  </div>
                  <div className="ui-stat">
                    <p className="ui-stat-label">Lifetime fees</p>
                    <p className="ui-stat-value">{formatUsd(token.performance.lifetimeFees)}</p>
                  </div>
                  <div className="ui-stat">
                    <p className="ui-stat-label">Claim count</p>
                    <p className="ui-stat-value">{token.performance.claimCount}</p>
                  </div>
                  {token.performance.partnerClaimedFees !== undefined ? (
                    <div className="ui-stat">
                      <p className="ui-stat-label">Partner claimed</p>
                      <p className="ui-stat-value">{formatUsd(token.performance.partnerClaimedFees)}</p>
                    </div>
                  ) : null}
                  {token.performance.partnerUnclaimedFees !== undefined ? (
                    <div className="ui-stat">
                      <p className="ui-stat-label">Partner unclaimed</p>
                      <p className="ui-stat-value">{formatUsd(token.performance.partnerUnclaimedFees)}</p>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="ui-stat">
                  <p className="ui-stat-label">Stage</p>
                  <p className="ui-stat-value">{project.launchStatus}</p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">Roadmap complete</p>
                  <p className="ui-stat-value">
                    {countRoadmapItemsByStatus(project.roadmap, "done")} / {project.roadmap.length}
                  </p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">Creator wallet</p>
                  <p className="mt-2 break-all text-sm text-[color:var(--foreground)]">
                    {token.creatorWallet}
                  </p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">Partner wallet</p>
                  <p className="mt-2 break-all text-sm text-[color:var(--foreground)]">
                    {token.partnerKey}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="ui-board reveal-up reveal-delay-2 rounded-[1.85rem] p-6">
              <p className="ui-kicker">{isLive ? "Creator claims" : "Launch participants"}</p>
              <div className="mt-5 space-y-3">
                {token.creators.map((creator, index) => (
                  <div
                    key={creator.wallet}
                    className="ui-stat reveal-up"
                    style={{ animationDelay: `${0.06 * (index + 1)}s` }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-base font-semibold text-[color:var(--foreground)]">
                        {creator.username}
                      </p>
                      <span className="text-sm text-[color:var(--muted)]">
                        {creator.royaltyBps / 100}% royalty
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      {isLive
                        ? `Claimed ${formatUsd(creator.totalClaimed)}`
                        : "Ready to receive creator-side fees once launched"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="ui-panel reveal-up reveal-delay-3 rounded-[1.85rem] p-6">
              <p className="ui-kicker">{isLive ? "Claim events" : "Launch brief"}</p>
              <div className="mt-5 space-y-3">
                {isLive
                  ? token.claims.map((claim) => (
                      <div key={claim.id} className="ui-stat">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-[color:var(--foreground)]">
                            {claim.signature}
                          </p>
                          <span className="text-xs text-[color:var(--muted)]">
                            {formatRelativeTime(claim.timestamp)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[color:var(--muted)]">
                          {claim.wallet} claimed {formatUsd(claim.amount)}
                        </p>
                      </div>
                    ))
                  : [
                      "The token stays parked until the product milestones are complete.",
                      "Creator and partner fee sharing are configured as the eventual launch path.",
                      "This page switches to live Bags analytics only after the real deployment.",
                    ].map((line) => (
                      <div key={line} className="ui-stat text-sm leading-7 text-[color:var(--muted)]">
                        {line}
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
