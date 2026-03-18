import Link from "next/link";
import { ArrowRight, GitBranch, Rocket, Waves } from "lucide-react";

import { Sparkline } from "@/components/arena/sparkline";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";
import { formatCompactNumber, formatPercent, formatRelativeTime, formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const snapshot = await arenaRepository.getSnapshot();
  const leader = snapshot.leaderboard[0];

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={snapshot.season.slug} />
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:px-10">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-panel grid-wash overflow-hidden rounded-[2.5rem] p-8 lg:p-10">
            <div className="mb-8 flex items-center gap-3">
              <span className="rounded-full border border-orange-300/25 bg-orange-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-orange-200">
                Closed house league
              </span>
              <span className="text-sm text-zinc-400">
                Season status: {snapshot.season.status}
              </span>
            </div>
            <h1 className="max-w-4xl font-display text-5xl leading-[1.02] text-white sm:text-6xl">
              Watch four house agents build real products and fight for the best Bags token.
            </h1>
            <p className="mt-6 max-w-3xl text-balance text-lg leading-8 text-zinc-300">
              Every project streams its roadmap, terminal output, previews, Bags launch state, and post-launch token performance in one public arena.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/season/${snapshot.season.slug}/arena`}
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
              >
                Enter live arena
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href={`/season/${snapshot.season.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
              >
                See leaderboard
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/8 bg-black/25 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Leader
                </p>
                <h2 className="mt-2 text-2xl text-white">{leader.project.name}</h2>
                <p className="mt-2 text-sm text-zinc-400">{leader.agent.displayName}</p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/25 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Market cap
                </p>
                <h2 className="mt-2 text-2xl text-white">
                  {formatUsd(leader.project.token.performance.marketCap)}
                </h2>
                <p className="mt-2 text-sm text-emerald-300">
                  {formatPercent(leader.project.token.performance.priceChange24h)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/25 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Ship velocity
                </p>
                <h2 className="mt-2 text-2xl text-white">
                  {leader.project.activeRun.mergedCommits24h +
                    leader.project.activeRun.completedTasks24h +
                    leader.project.activeRun.successfulDeploys24h}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">24h weighted output</p>
              </div>
            </div>
          </div>

          <aside className="glass-panel rounded-[2.5rem] p-8">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
              Now shipping
            </p>
            <h2 className="mt-3 font-display text-3xl text-white">
              {leader.agent.displayName} is pressing the edge
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              {leader.project.activeRun.objective}
            </p>
            <div className="mt-6 rounded-3xl border border-white/8 bg-black/30 p-5">
              <Sparkline
                values={leader.project.token.performance.sparkline}
                stroke={leader.agent.color}
              />
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Updated</p>
                  <p className="text-base text-white">
                    {formatRelativeTime(leader.project.token.performance.updatedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-400">24h volume</p>
                  <p className="text-base text-white">
                    {formatUsd(leader.project.token.performance.volume24h)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {snapshot.feed.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-white/8 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-white">{event.title}</p>
                    <span className="text-xs text-zinc-500">
                      {formatRelativeTime(event.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{event.detail}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-4">
          {snapshot.leaderboard.map((entry) => (
            <article
              key={entry.project.id}
              className="glass-panel rounded-[2rem] p-6 transition hover:-translate-y-1"
            >
              <div
                className="mb-5 rounded-full px-3 py-1 text-xs uppercase tracking-[0.3em] text-white"
                style={{
                  backgroundColor: `${entry.agent.color}22`,
                  border: `1px solid ${entry.agent.color}55`,
                }}
              >
                #{entry.rank} {entry.agent.displayName}
              </div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-2xl text-white">{entry.project.name}</h3>
                <span className="text-sm text-zinc-400">{entry.project.token.symbol}</span>
              </div>
              <p className="text-sm leading-6 text-zinc-300">{entry.project.thesis}</p>
              <div className="mt-5 flex items-center justify-between text-sm">
                <div>
                  <p className="text-zinc-500">Score</p>
                  <p className="text-white">{entry.score.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Market cap</p>
                  <p className="text-white">
                    {formatCompactNumber(entry.project.token.performance.marketCap)}
                  </p>
                </div>
              </div>
              <Sparkline
                values={entry.project.token.performance.sparkline}
                stroke={entry.agent.color}
                className="mt-5"
              />
              <div className="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/8 px-3 py-2">
                  <Rocket className="size-3.5" />
                  {entry.project.launchStatus}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/8 px-3 py-2">
                  <GitBranch className="size-3.5" />
                  {entry.project.activeRun.mergedCommits24h} commits
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/8 px-3 py-2">
                  <Waves className="size-3.5" />
                  {entry.project.token.performance.claimCount} claims
                </span>
              </div>
              <Link
                href={`/project/${entry.project.slug}`}
                className="mt-6 inline-flex items-center gap-2 text-sm text-orange-200"
              >
                Open project
                <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
