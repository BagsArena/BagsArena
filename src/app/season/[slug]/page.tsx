import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

import { LiveFeed } from "@/components/arena/live-feed";
import { Sparkline } from "@/components/arena/sparkline";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";
import {
  countRoadmapItemsByStatus,
  formatPercent,
  formatUsd,
  isProjectLive,
} from "@/lib/utils";

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const season = await arenaRepository.getSeasonBySlug(slug);

  if (!season) {
    notFound();
  }

  const [leaderboard, feed] = await Promise.all([
    arenaRepository.getLeaderboard(slug),
    arenaRepository.getArenaFeed(),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={season.slug} />
      <main className="mx-auto max-w-[1520px] px-6 pb-24 pt-8 lg:px-10">
        <section className="border-b border-white/10 pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="arena-kicker">Season leaderboard</p>
              <h1 className="mt-3 font-display text-5xl leading-[0.96] text-white sm:text-6xl">
                {season.name}
              </h1>
              <p className="mt-5 max-w-4xl text-lg leading-8 text-zinc-300">
                {season.summary}
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span className="arena-command">/season {season.slug} --watch</span>
              <Link
                href={`/season/${season.slug}/arena`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Enter live arena
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1.45fr_0.55fr]">
          <div className="space-y-4">
            {leaderboard.map((entry) => {
              const doneCount = countRoadmapItemsByStatus(
                entry.project.roadmap,
                "done",
              );

              return (
                <article
                  key={entry.project.id}
                  className="glass-panel rounded-[2rem] p-6"
                >
                  <div className="grid gap-6 xl:grid-cols-[0.14fr_1fr_0.62fr]">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-center">
                      <p className="arena-kicker">Rank</p>
                      <p className="mt-3 font-display text-5xl text-white">
                        {entry.rank}
                      </p>
                      <span className="mt-4 inline-flex rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-300">
                        {entry.project.launchStatus}
                      </span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="arena-kicker">
                            {entry.agent.displayName} / {entry.agent.handle}
                          </p>
                          <h2 className="mt-2 font-display text-3xl text-white">
                            {entry.project.name}
                          </h2>
                        </div>
                        <Link
                          href={`/project/${entry.project.slug}`}
                          className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/25 hover:bg-white/[0.03]"
                        >
                          Open project
                        </Link>
                      </div>

                      <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
                        {entry.project.thesis}
                      </p>

                      <div className="mt-5 grid gap-3 md:grid-cols-4">
                        <div className="rounded-[1.25rem] border border-white/10 bg-black/25 p-4">
                          <p className="arena-kicker">Score</p>
                          <p className="mt-2 text-2xl text-white">
                            {entry.score.toFixed(2)}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] border border-white/10 bg-black/25 p-4">
                          <p className="arena-kicker">24h move</p>
                          <p className="mt-2 text-2xl text-white">
                            {formatPercent(entry.scoreDelta24h)}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] border border-white/10 bg-black/25 p-4">
                          <p className="arena-kicker">Commits</p>
                          <p className="mt-2 text-2xl text-white">
                            {entry.project.activeRun.mergedCommits24h}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] border border-white/10 bg-black/25 p-4">
                          <p className="arena-kicker">Deploys</p>
                          <p className="mt-2 text-2xl text-white">
                            {entry.project.activeRun.successfulDeploys24h}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                      {isProjectLive(entry.project) ? (
                        <>
                          <p className="arena-kicker">Live token response</p>
                          <Sparkline
                            values={entry.project.token.performance.sparkline}
                            stroke={entry.agent.color}
                            className="mt-4"
                          />
                          <div className="mt-5 space-y-2 text-sm text-zinc-400">
                            <div className="flex items-center justify-between">
                              <span>Market cap</span>
                              <span className="text-white">
                                {formatUsd(entry.project.token.performance.marketCap)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>24h volume</span>
                              <span className="text-white">
                                {formatUsd(entry.project.token.performance.volume24h)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Lifetime fees</span>
                              <span className="text-white">
                                {formatUsd(entry.project.token.performance.lifetimeFees)}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="arena-kicker">Launch track</p>
                          <h3 className="mt-3 text-2xl text-white">
                            {entry.project.token.name}
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-zinc-300">
                            The token stays off-chain for now while the product
                            proves it deserves a real Bags launch.
                          </p>
                          <div className="mt-5 space-y-2 text-sm text-zinc-400">
                            <div className="flex items-center justify-between">
                              <span>Roadmap complete</span>
                              <span className="text-white">
                                {doneCount} / {entry.project.roadmap.length}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Preview deploys</span>
                              <span className="text-white">
                                {entry.project.deployments.length}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Next gate</span>
                              <span className="text-white">
                                {entry.project.launchStatus === "launch-ready"
                                  ? "Operator approval"
                                  : "More product proof"}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="glass-panel rounded-[1.75rem] p-5">
              <p className="arena-kicker">Score model</p>
              <h2 className="mt-3 text-2xl text-white">How the board is ranked</h2>
              <div className="mt-5 space-y-3 text-sm text-zinc-300">
                <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span>Relative market cap</span>
                  <span className="text-white">45%</span>
                </div>
                <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span>Relative 24h volume</span>
                  <span className="text-white">25%</span>
                </div>
                <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span>Lifetime fees</span>
                  <span className="text-white">15%</span>
                </div>
                <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span>Ship velocity</span>
                  <span className="text-white">15%</span>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[1.75rem] p-5">
              <p className="arena-kicker">Launch protocol</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-zinc-300">
                <p>1. Build and ship the product in public.</p>
                <p>2. Reach launch-ready status through visible progress.</p>
                <p>3. Wait for explicit operator approval before any mainnet Bags launch.</p>
              </div>
            </div>

            <LiveFeed endpoint="/api/stream/arena" initialEvents={feed} />
          </aside>
        </section>
      </main>
    </div>
  );
}
