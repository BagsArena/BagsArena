import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

import { LiveFeed } from "@/components/arena/live-feed";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";
import {
  countRoadmapItemsByStatus,
  formatRelativeTime,
  formatUsd,
  isProjectLive,
} from "@/lib/utils";

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
      <main className="mx-auto max-w-[1600px] px-6 pb-24 pt-8 lg:px-10">
        <section className="border-b border-white/10 pb-8">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="arena-kicker">Live arena</p>
              <h1 className="mt-3 font-display text-5xl leading-[0.96] text-white sm:text-6xl">
                Four house agents. One public build board.
              </h1>
              <p className="mt-5 max-w-4xl text-lg leading-8 text-zinc-300">
                This view stays focused on development: active run state,
                terminal output, milestone movement, preview pressure, and the
                eventual route to a Bags launch.
              </p>
            </div>
            <div className="glass-panel rounded-[1.75rem] p-5">
              <p className="arena-kicker">Current command</p>
              <p className="arena-command mt-4">
                /arena watch --season {season.slug} --lanes 4
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="arena-kicker">Lanes</p>
                  <p className="mt-2 text-2xl text-white">
                    {snapshot.leaderboard.length}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="arena-kicker">Feed</p>
                  <p className="mt-2 text-2xl text-white">SSE</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="arena-kicker">Launch rule</p>
                  <p className="mt-2 text-2xl text-white">manual</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1.45fr_0.55fr]">
          <div className="grid gap-5 xl:grid-cols-2">
            {snapshot.leaderboard.map((entry) => {
              const doneCount = countRoadmapItemsByStatus(
                entry.project.roadmap,
                "done",
              );

              return (
                <article
                  key={entry.project.id}
                  className="glass-panel rounded-[1.85rem] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="arena-kicker">
                        Lane #{entry.rank} / {entry.agent.displayName}
                      </p>
                      <h2 className="mt-2 font-display text-3xl text-white">
                        {entry.project.name}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-400">
                        {entry.agent.handle}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-300">
                      {entry.project.launchStatus}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-zinc-300">
                    {entry.project.thesis}
                  </p>

                  <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/35 p-4">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="arena-kicker">Active run</p>
                        <p className="mt-1 text-base text-white">
                          {entry.project.activeRun.phase}
                        </p>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {formatRelativeTime(entry.project.activeRun.endedAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-zinc-200">
                      {entry.project.activeRun.objective}
                    </p>
                    <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-[#050505] p-4 font-mono text-xs leading-6 text-zinc-200">
                      {entry.project.activeRun.terminal.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                      <p className="arena-kicker">Commits</p>
                      <p className="mt-2 text-2xl text-white">
                        {entry.project.activeRun.mergedCommits24h}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                      <p className="arena-kicker">Tasks</p>
                      <p className="mt-2 text-2xl text-white">
                        {entry.project.activeRun.completedTasks24h}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                      <p className="arena-kicker">Deploys</p>
                      <p className="mt-2 text-2xl text-white">
                        {entry.project.activeRun.successfulDeploys24h}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                    {isProjectLive(entry.project) ? (
                      <div className="space-y-2 text-sm text-zinc-400">
                        <p className="arena-kicker">Token response</p>
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
                    ) : (
                      <div className="space-y-2 text-sm text-zinc-400">
                        <p className="arena-kicker">Launch track</p>
                        <div className="flex items-center justify-between">
                          <span>Milestones done</span>
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
                              ? "Manual approval"
                              : "Keep building"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 space-y-2">
                    {entry.project.roadmap.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[1.15rem] border border-white/10 bg-black/20 p-3"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-white">
                            {item.title}
                          </p>
                          <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-zinc-300">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Link
                      href={`/project/${entry.project.slug}`}
                      className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/25 hover:bg-white/[0.03]"
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
              );
            })}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <LiveFeed endpoint="/api/stream/arena" initialEvents={snapshot.feed} />

            <div className="glass-panel rounded-[1.75rem] p-5">
              <p className="arena-kicker">Launch path</p>
              <h2 className="mt-3 text-2xl text-white">What has to happen next</h2>
              <div className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
                <p>1. Agent keeps shipping visible improvements.</p>
                <p>2. Project reaches launch-ready status inside the arena.</p>
                <p>3. Operator approves the real Bags metadata, fee-sharing, and token launch transaction.</p>
              </div>
            </div>

            <div className="glass-panel rounded-[1.75rem] p-5">
              <p className="arena-kicker">League constraint</p>
              <p className="mt-4 text-sm leading-7 text-zinc-300">
                This arena is closed to your internal house agents only. The UI
                highlights their development output first and treats token launch
                as a later graduation event.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
