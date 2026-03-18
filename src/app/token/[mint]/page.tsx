import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

import { Sparkline } from "@/components/arena/sparkline";
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
  const agent = snapshot.agents.find((candidate) => candidate.id === project.agentId)!;
  const isLive = isProjectLive(project);

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={snapshot.season.slug} />
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:px-10">
        <section className="glass-panel rounded-[2.5rem] p-8 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                {isLive ? "Bags token" : "Token launch goal"}
              </p>
              <h1 className="mt-2 font-display text-5xl text-white">
                {token.name} ({token.symbol})
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
                {isLive
                  ? token.description
                  : `${token.description} This project is still in development and will only launch once the product milestones are complete.`}
              </p>
            </div>
            {isLive ? (
              <Link
                href={token.bagsUrl}
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
              >
                View on Bags
                <ExternalLink className="size-4" />
              </Link>
            ) : (
              <Link
                href={`/project/${project.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-200 transition hover:bg-white/5"
              >
                Open project
                <ExternalLink className="size-4" />
              </Link>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="glass-panel rounded-[2rem] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                  Market curve
                </p>
                <h2 className="mt-2 font-display text-2xl text-white">
                  {isLive ? `${project.name} performance` : `${project.name} launch readiness`}
                </h2>
              </div>
              <span className="text-sm text-zinc-400">
                Updated {formatRelativeTime(token.performance.updatedAt)}
              </span>
            </div>
            {isLive ? (
              <>
                <Sparkline values={token.performance.sparkline} stroke={agent.color} />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                      Market cap
                    </p>
                    <p className="mt-2 text-2xl text-white">
                      {formatUsd(token.performance.marketCap)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                      24h volume
                    </p>
                    <p className="mt-2 text-2xl text-white">
                      {formatUsd(token.performance.volume24h)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                      Lifetime fees
                    </p>
                    <p className="mt-2 text-2xl text-white">
                      {formatUsd(token.performance.lifetimeFees)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                      Claim count
                    </p>
                    <p className="mt-2 text-2xl text-white">
                      {token.performance.claimCount}
                    </p>
                  </div>
                  {token.performance.partnerClaimedFees !== undefined ? (
                    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                        Partner claimed
                      </p>
                      <p className="mt-2 text-2xl text-white">
                        {formatUsd(token.performance.partnerClaimedFees)}
                      </p>
                    </div>
                  ) : null}
                  {token.performance.partnerUnclaimedFees !== undefined ? (
                    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                        Partner unclaimed
                      </p>
                      <p className="mt-2 text-2xl text-white">
                        {formatUsd(token.performance.partnerUnclaimedFees)}
                      </p>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    Stage
                  </p>
                  <p className="mt-2 text-2xl text-white">
                    {project.launchStatus}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    Roadmap complete
                  </p>
                  <p className="mt-2 text-2xl text-white">
                    {countRoadmapItemsByStatus(project.roadmap, "done")} / {project.roadmap.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    Creator wallet
                  </p>
                  <p className="mt-2 break-all text-sm text-white">
                    {token.creatorWallet}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    Partner wallet
                  </p>
                  <p className="mt-2 break-all text-sm text-white">
                    {token.partnerKey}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-[2rem] p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                {isLive ? "Creator claims" : "Launch participants"}
              </p>
              <div className="mt-5 space-y-3">
                {token.creators.map((creator) => (
                  <div
                    key={creator.wallet}
                    className="rounded-2xl border border-white/8 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-base font-semibold text-white">
                        {creator.username}
                      </p>
                      <span className="text-sm text-zinc-400">
                        {creator.royaltyBps / 100}% royalty
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-300">
                      {isLive
                        ? `Claimed ${formatUsd(creator.totalClaimed)}`
                        : "Ready to receive creator-side fees once launched"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                {isLive ? "Claim events" : "Launch brief"}
              </p>
              <div className="mt-5 space-y-3">
                {isLive
                  ? token.claims.map((claim) => (
                      <div
                        key={claim.id}
                        className="rounded-2xl border border-white/8 bg-black/20 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-white">
                            {claim.signature}
                          </p>
                          <span className="text-xs text-zinc-500">
                            {formatRelativeTime(claim.timestamp)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-300">
                          {claim.wallet} claimed {formatUsd(claim.amount)}
                        </p>
                      </div>
                    ))
                  : [
                      "The token stays parked until the product milestones are complete.",
                      "Creator and partner fee sharing are configured as the eventual launch path.",
                      "This page will switch to live Bags analytics after the real deployment.",
                    ].map((line) => (
                      <div
                        key={line}
                        className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm leading-7 text-zinc-300"
                      >
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
