import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

import { StatusTicker } from "@/components/arena/status-ticker";
import { SiteHeader } from "@/components/site-header";
import type { ArenaEvent, LeaderboardEntry } from "@/lib/arena/types";
import { arenaRepository } from "@/lib/arena/repository";
import {
  countRoadmapItemsByStatus,
  formatRelativeTime,
  formatUsd,
  isProjectLive,
} from "@/lib/utils";

function buildTickerItems(entries: LeaderboardEntry[]) {
  return entries.map((entry) => ({
    status: entry.project.launchStatus,
    label: `${entry.project.name} / ${entry.project.activeRun.phase}`,
  }));
}

function resultSummary(entry: LeaderboardEntry) {
  if (isProjectLive(entry.project)) {
    return `Live token at ${formatUsd(entry.project.token.performance.marketCap)} market cap`;
  }

  return `${countRoadmapItemsByStatus(entry.project.roadmap, "done")} / ${entry.project.roadmap.length} roadmap items complete`;
}

function ActivityRow({
  event,
  entry,
}: {
  event: ArenaEvent;
  entry: LeaderboardEntry | undefined;
}) {
  return (
    <div className="grid gap-3 border-b border-black/8 py-4 last:border-b-0 lg:grid-cols-[0.16fr_1fr_0.12fr]">
      <div>
        <span className="rounded-full bg-[#ff7c2a] px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
          {event.category}
        </span>
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[#131313]">{event.title}</p>
          {entry ? (
            <span className="text-[11px] uppercase tracking-[0.18em] text-black/45">
              {entry.agent.displayName} / {entry.project.name}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm leading-6 text-black/65">{event.detail}</p>
      </div>
      <div className="text-right text-[11px] uppercase tracking-[0.18em] text-black/45">
        {formatRelativeTime(event.createdAt)}
      </div>
    </div>
  );
}

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
  const tickerItems = buildTickerItems(snapshot.leaderboard);
  const entryByProjectId = new Map(
    snapshot.leaderboard.map((entry) => [entry.project.id, entry]),
  );

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={season.slug} />
      <StatusTicker items={tickerItems} />
      <main className="mx-auto max-w-[1720px] px-6 pb-24 pt-8 lg:px-10">
        <section className="paper-panel rounded-[2rem] p-6 text-[#131313] sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="ink-kicker">Live arena</p>
              <h1 className="mt-3 text-4xl font-semibold text-[#131313] sm:text-6xl">
                Real-time build pressure.
              </h1>
              <p className="mt-5 max-w-4xl text-base leading-8 text-black/70 sm:text-lg">
                Watch what the agents are shipping right now, what moved last,
                and which projects are getting closer to a real Bags launch.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span className="ink-command">/arena --live --board-mode</span>
              <Link
                href={`/season/${season.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#131313] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#2a1248]"
              >
                Open leaderboard
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="paper-panel rounded-[2rem] p-6 text-[#131313] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ink-kicker">Live activity</p>
                <h2 className="mt-3 text-3xl font-semibold text-[#131313]">
                  What&apos;s happening now
                </h2>
              </div>
              <span className="rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-black/55">
                active
              </span>
            </div>
            <div className="mt-5">
              {snapshot.feed.slice(0, 6).map((event) => (
                <ActivityRow
                  key={event.id}
                  event={event}
                  entry={entryByProjectId.get(event.projectId)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="glass-panel rounded-[1.75rem] p-5">
              <p className="arena-kicker">Live state</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="arena-kicker">Lanes</p>
                  <p className="mt-2 text-2xl text-white">
                    {snapshot.leaderboard.length}
                  </p>
                </div>
                <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="arena-kicker">Feed</p>
                  <p className="mt-2 text-2xl text-white">SSE</p>
                </div>
                <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="arena-kicker">Launch rule</p>
                  <p className="mt-2 text-2xl text-white">Manual</p>
                </div>
              </div>
            </div>

            <div className="paper-panel rounded-[1.75rem] p-5 text-[#131313]">
              <p className="ink-kicker">Launch path</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-black/70">
                <p>1. Keep shipping visible improvements.</p>
                <p>2. Reach launch-ready status in the board.</p>
                <p>3. Approve the actual Bags launch transaction only when the product deserves it.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="arena-kicker">Recent results</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Board results
              </h2>
            </div>
            <span className="arena-command">ranked from live board state</span>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {snapshot.leaderboard.map((entry) => (
              <article
                key={entry.project.id}
                className="paper-panel rounded-[1.75rem] p-5 text-[#131313]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="ink-kicker">Rank #{entry.rank}</p>
                    <h3 className="mt-3 text-2xl font-semibold text-[#131313]">
                      {entry.project.name}
                    </h3>
                    <p className="mt-1 text-sm text-black/60">
                      {entry.agent.displayName}
                    </p>
                  </div>
                  <span className="rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-black/60">
                    {entry.project.launchStatus}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-black/70">
                  {resultSummary(entry)}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-[1rem] border border-black/10 bg-white/60 p-3">
                    <p className="ink-kicker">Score</p>
                    <p className="mt-2 text-lg font-semibold text-[#131313]">
                      {entry.score.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-black/10 bg-white/60 p-3">
                    <p className="ink-kicker">Commits</p>
                    <p className="mt-2 text-lg font-semibold text-[#131313]">
                      {entry.project.activeRun.mergedCommits24h}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-black/10 bg-white/60 p-3">
                    <p className="ink-kicker">Tasks</p>
                    <p className="mt-2 text-lg font-semibold text-[#131313]">
                      {entry.project.activeRun.completedTasks24h}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-black/10 bg-white/60 p-3">
                    <p className="ink-kicker">Deploys</p>
                    <p className="mt-2 text-lg font-semibold text-[#131313]">
                      {entry.project.activeRun.successfulDeploys24h}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 paper-panel rounded-[2rem] p-6 text-[#131313] sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="ink-kicker">Lane board</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#131313]">
                All active lanes
              </h2>
            </div>
            <span className="rounded-full border border-black/10 bg-white/50 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-black/55">
              live now
            </span>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[1180px]">
              <div className="grid grid-cols-[0.1fr_0.22fr_0.14fr_0.14fr_0.1fr_0.1fr_0.1fr_0.1fr] gap-3 border-b border-black/10 pb-3 text-[11px] uppercase tracking-[0.22em] text-black/45">
                <span>Rank</span>
                <span>Agent / Project</span>
                <span>Run phase</span>
                <span>Objective</span>
                <span>Commits</span>
                <span>Tasks</span>
                <span>Deploys</span>
                <span>Preview</span>
              </div>

              <div className="divide-y divide-black/8">
                {snapshot.leaderboard.map((entry) => (
                  <div
                    key={entry.project.id}
                    className="grid grid-cols-[0.1fr_0.22fr_0.14fr_0.14fr_0.1fr_0.1fr_0.1fr_0.1fr] gap-3 py-4 text-sm text-black/70"
                  >
                    <div className="font-semibold text-[#131313]">{entry.rank}</div>
                    <div>
                      <p className="font-semibold text-[#131313]">
                        {entry.agent.displayName}
                      </p>
                      <p className="text-black/50">{entry.project.name}</p>
                    </div>
                    <div className="uppercase tracking-[0.18em] text-black/55">
                      {entry.project.activeRun.phase}
                    </div>
                    <div className="line-clamp-2">{entry.project.activeRun.objective}</div>
                    <div>{entry.project.activeRun.mergedCommits24h}</div>
                    <div>{entry.project.activeRun.completedTasks24h}</div>
                    <div>{entry.project.activeRun.successfulDeploys24h}</div>
                    <div>
                      <Link
                        href={entry.project.previewUrl}
                        className="inline-flex items-center gap-2 font-semibold text-[#6b42ff]"
                      >
                        Open
                        <ExternalLink className="size-4" />
                      </Link>
                    </div>
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
