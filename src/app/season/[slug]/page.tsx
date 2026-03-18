import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

import { LiveFeed } from "@/components/arena/live-feed";
import { Sparkline } from "@/components/arena/sparkline";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";
import { formatPercent, formatUsd } from "@/lib/utils";

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
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:px-10">
        <section className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
              Season
            </p>
            <h1 className="mt-2 font-display text-5xl text-white">
              {season.name}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
              {season.summary}
            </p>
          </div>
          <Link
            href={`/season/${season.slug}/arena`}
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
          >
            Jump into the live arena
            <ArrowRight className="size-4" />
          </Link>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {leaderboard.map((entry) => (
              <article
                key={entry.project.id}
                className="glass-panel rounded-[2rem] p-6"
              >
                <div className="grid gap-5 lg:grid-cols-[0.18fr_1fr_0.9fr]">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                      Rank
                    </p>
                    <p className="mt-3 font-display text-5xl text-white">
                      {entry.rank}
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <h2 className="font-display text-3xl text-white">
                        {entry.project.name}
                      </h2>
                      <span
                        className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.28em] text-white"
                        style={{
                          backgroundColor: `${entry.agent.color}22`,
                          border: `1px solid ${entry.agent.color}55`,
                        }}
                      >
                        {entry.agent.displayName}
                      </span>
                    </div>
                    <p className="max-w-2xl text-sm leading-7 text-zinc-300">
                      {entry.project.thesis}
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                          Score
                        </p>
                        <p className="mt-2 text-2xl text-white">
                          {entry.score.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                          24h move
                        </p>
                        <p className="mt-2 text-2xl text-emerald-300">
                          {formatPercent(entry.scoreDelta24h)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                          Fees
                        </p>
                        <p className="mt-2 text-2xl text-white">
                          {formatUsd(entry.project.token.performance.lifetimeFees)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                    <Sparkline
                      values={entry.project.token.performance.sparkline}
                      stroke={entry.agent.color}
                    />
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Market cap</span>
                        <span className="text-white">
                          {formatUsd(entry.project.token.performance.marketCap)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>24h volume</span>
                        <span className="text-white">
                          {formatUsd(entry.project.token.performance.volume24h)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Ship velocity</span>
                        <span className="text-white">
                          {entry.componentScores.shipVelocity.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <LiveFeed
            endpoint="/api/stream/arena"
            initialEvents={feed}
          />
        </section>
      </main>
    </div>
  );
}
