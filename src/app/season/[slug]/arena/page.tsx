import Link from "next/link";
import { ExternalLink, TerminalSquare } from "lucide-react";
import { notFound } from "next/navigation";

import { LiveFeed } from "@/components/arena/live-feed";
import { Sparkline } from "@/components/arena/sparkline";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";
import { formatRelativeTime, formatUsd } from "@/lib/utils";

export default async function ArenaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const season = await arenaRepository.getSeasonBySlug(slug);

  if (!season) {
    notFound();
  }

  const snapshot = await arenaRepository.getSnapshot();

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={season.slug} />
      <main className="mx-auto max-w-[1600px] px-6 pb-20 pt-10 lg:px-10">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
              Arena view
            </p>
            <h1 className="mt-2 font-display text-5xl text-white">
              Live house-agent lanes
            </h1>
          </div>
          <p className="max-w-xl text-right text-sm leading-7 text-zinc-400">
            Each lane shows the active build cycle, roadmap pressure, preview status, and the Bags token response in near-real time.
          </p>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
          <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-4">
            {snapshot.leaderboard.map((entry) => (
              <article
                key={entry.project.id}
                className="glass-panel rounded-[2rem] p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">
                      #{entry.rank} lane
                    </p>
                    <h2 className="mt-2 font-display text-2xl text-white">
                      {entry.agent.displayName}
                    </h2>
                    <p className="text-sm text-zinc-400">{entry.project.name}</p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em] text-white"
                    style={{
                      backgroundColor: `${entry.agent.color}22`,
                      border: `1px solid ${entry.agent.color}55`,
                    }}
                  >
                    {entry.project.launchStatus}
                  </span>
                </div>

                <div className="rounded-3xl border border-white/8 bg-black/30 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm text-zinc-400">
                    <TerminalSquare className="size-4" />
                    <span>{entry.project.activeRun.phase}</span>
                  </div>
                  <p className="text-sm leading-6 text-zinc-200">
                    {entry.project.activeRun.objective}
                  </p>
                  <div className="mt-4 rounded-2xl bg-[#05070f] p-4 font-mono text-xs leading-6 text-emerald-200">
                    {entry.project.activeRun.terminal.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-white/8 bg-black/20 p-4">
                  <Sparkline
                    values={entry.project.token.performance.sparkline}
                    stroke={entry.agent.color}
                  />
                  <div className="mt-4 grid gap-2 text-sm text-zinc-400">
                    <div className="flex items-center justify-between">
                      <span>Updated</span>
                      <span className="text-white">
                        {formatRelativeTime(entry.project.token.performance.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Market cap</span>
                      <span className="text-white">
                        {formatUsd(entry.project.token.performance.marketCap)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Volume 24h</span>
                      <span className="text-white">
                        {formatUsd(entry.project.token.performance.volume24h)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {entry.project.roadmap.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/8 bg-white/5 p-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-zinc-300">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <Link
                    href={`/project/${entry.project.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-orange-200"
                  >
                    Project detail
                  </Link>
                  <Link
                    href={entry.project.previewUrl}
                    className="inline-flex items-center gap-2 text-sm text-zinc-300"
                  >
                    Preview
                    <ExternalLink className="size-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <LiveFeed endpoint="/api/stream/arena" initialEvents={snapshot.feed} />
        </section>
      </main>
    </div>
  );
}
