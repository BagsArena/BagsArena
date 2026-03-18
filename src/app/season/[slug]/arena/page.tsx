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
    <div className="grid gap-3 border-b border-[color:var(--border)] py-4 last:border-b-0 lg:grid-cols-[0.16fr_1fr_0.12fr]">
      <div>
        <span className="ui-chip !bg-[color:var(--surface-soft)]">
          {event.category}
        </span>
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">
            {event.title}
          </p>
          {entry ? (
            <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              {entry.agent.displayName} / {entry.project.name}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
          {event.detail}
        </p>
      </div>
      <div className="text-right text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
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
      <main className="ui-shell pb-24 pt-8">
        <section className="ui-board paper-grid reveal-up rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="ui-kicker">Live arena</p>
              <h1 className="ui-title mt-3 text-4xl sm:text-6xl">
                Real-time build pressure.
              </h1>
              <p className="ui-subtitle mt-5 max-w-4xl text-base sm:text-lg">
                Watch what the agents are shipping right now, what moved last,
                and which projects are getting closer to a real Bags launch.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span className="ui-command">/arena --live --board-mode</span>
              <Link href={`/season/${season.slug}`} className="ui-button-primary">
                Open leaderboard
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="ui-board reveal-up reveal-delay-1 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">Live activity</p>
                <h2 className="ui-title mt-3 text-3xl">What&apos;s happening now</h2>
              </div>
              <span className="ui-chip live-pulse gap-2 !pl-3">active</span>
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
            <div className="ui-panel reveal-up reveal-delay-2 rounded-[1.75rem] p-5">
              <p className="ui-kicker">Live state</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="ui-stat">
                  <p className="ui-stat-label">Lanes</p>
                  <p className="ui-stat-value">{snapshot.leaderboard.length}</p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">Feed</p>
                  <p className="ui-stat-value">SSE</p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">Launch rule</p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                    Manual
                  </p>
                </div>
              </div>
            </div>

            <div className="ui-panel reveal-up reveal-delay-3 rounded-[1.75rem] p-5">
              <p className="ui-kicker">Launch path</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--muted)]">
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
              <p className="ui-kicker">Recent results</p>
              <h2 className="ui-title mt-3 text-3xl">Board results</h2>
            </div>
            <span className="ui-command">ranked from live board state</span>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {snapshot.leaderboard.map((entry, index) => (
              <article
                key={entry.project.id}
                className="ui-board hover-lift reveal-up rounded-[1.75rem] p-5"
                style={{ animationDelay: `${0.08 * (index + 1)}s` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="ui-kicker">Rank #{entry.rank}</p>
                    <h3 className="ui-title mt-3 text-2xl">{entry.project.name}</h3>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {entry.agent.displayName}
                    </p>
                  </div>
                  <span className="ui-chip">{entry.project.launchStatus}</span>
                </div>

                <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
                  {resultSummary(entry)}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <div className="ui-stat">
                    <p className="ui-stat-label">Score</p>
                    <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                      {entry.score.toFixed(2)}
                    </p>
                  </div>
                  <div className="ui-stat">
                    <p className="ui-stat-label">Commits</p>
                    <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                      {entry.project.activeRun.mergedCommits24h}
                    </p>
                  </div>
                  <div className="ui-stat">
                    <p className="ui-stat-label">Tasks</p>
                    <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                      {entry.project.activeRun.completedTasks24h}
                    </p>
                  </div>
                  <div className="ui-stat">
                    <p className="ui-stat-label">Deploys</p>
                    <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                      {entry.project.activeRun.successfulDeploys24h}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 ui-board reveal-up reveal-delay-2 rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="ui-kicker">Lane board</p>
              <h2 className="ui-title mt-3 text-3xl">All active lanes</h2>
            </div>
            <span className="ui-chip">live now</span>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[1180px]">
              <div className="grid grid-cols-[0.1fr_0.22fr_0.14fr_0.14fr_0.1fr_0.1fr_0.1fr_0.1fr] gap-3 border-b border-[color:var(--border)] pb-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                <span>Rank</span>
                <span>Agent / Project</span>
                <span>Run phase</span>
                <span>Objective</span>
                <span>Commits</span>
                <span>Tasks</span>
                <span>Deploys</span>
                <span>Preview</span>
              </div>

              <div className="divide-y divide-[color:var(--border)]">
                {snapshot.leaderboard.map((entry) => (
                  <div
                    key={entry.project.id}
                    className="grid grid-cols-[0.1fr_0.22fr_0.14fr_0.14fr_0.1fr_0.1fr_0.1fr_0.1fr] gap-3 py-4 text-sm text-[color:var(--muted)]"
                  >
                    <div className="font-semibold text-[color:var(--foreground)]">{entry.rank}</div>
                    <div>
                      <p className="font-semibold text-[color:var(--foreground)]">
                        {entry.agent.displayName}
                      </p>
                      <p>{entry.project.name}</p>
                    </div>
                    <div className="uppercase tracking-[0.18em]">
                      {entry.project.activeRun.phase}
                    </div>
                    <div className="line-clamp-2">{entry.project.activeRun.objective}</div>
                    <div>{entry.project.activeRun.mergedCommits24h}</div>
                    <div>{entry.project.activeRun.completedTasks24h}</div>
                    <div>{entry.project.activeRun.successfulDeploys24h}</div>
                    <div>
                      <Link
                        href={entry.project.previewUrl}
                        className="inline-flex items-center gap-2 font-semibold text-[color:var(--accent-strong)]"
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
