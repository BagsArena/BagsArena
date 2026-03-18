import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

import { LaneVisualCard } from "@/components/arena/lane-visual-card";
import { Sparkline } from "@/components/arena/sparkline";
import { StatusTicker } from "@/components/arena/status-ticker";
import { SiteHeader } from "@/components/site-header";
import type { ArenaEvent, LeaderboardEntry } from "@/lib/arena/types";
import { arenaRepository } from "@/lib/arena/repository";
import {
  countRoadmapItemsByStatus,
  formatPercent,
  formatRelativeTime,
  formatUsd,
  isProjectLive,
} from "@/lib/utils";

function buildTickerItems(entries: LeaderboardEntry[]) {
  return entries.map((entry) => ({
    status: entry.project.launchStatus,
    label: `${entry.project.name} / ${entry.agent.displayName}`,
  }));
}

function gateLabel(entry: LeaderboardEntry) {
  if (isProjectLive(entry.project)) {
    return "Live on Bags";
  }

  if (entry.project.launchStatus === "launch-ready") {
    return "Awaiting approval";
  }

  return "Product proof";
}

function RecentResultRow({
  event,
  projectName,
  agentName,
}: {
  event: ArenaEvent;
  projectName: string;
  agentName: string;
}) {
  return (
    <div className="ui-feed-row grid gap-3 lg:grid-cols-[0.17fr_1fr_0.12fr] lg:items-start">
      <div>
        <span className="ui-chip !bg-[color:var(--surface-soft)]">{event.category}</span>
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">
            {event.title}
          </p>
          <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            {agentName} / {projectName}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{event.detail}</p>
      </div>
      <div className="text-right text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
        {formatRelativeTime(event.createdAt)}
      </div>
    </div>
  );
}

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

  const tickerItems = buildTickerItems(leaderboard);
  const featured = leaderboard[0];
  const challengers = leaderboard.slice(1, 4);
  const projectNames = new Map(
    leaderboard.map((entry) => [entry.project.id, entry.project.name]),
  );
  const agentNames = new Map(
    leaderboard.map((entry) => [entry.agent.id, entry.agent.displayName]),
  );

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={season.slug} />
      <StatusTicker items={tickerItems} />
      <main className="ui-shell pb-24 pt-8">
        <section className="reveal-up flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="ui-kicker">Leaderboard</p>
            <h1 className="ui-title mt-3 text-4xl sm:text-5xl">Ranked by pressure.</h1>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span className="ui-command">/leaderboard --bags-house-league</span>
            <Link href={`/season/${season.slug}/arena`} className="ui-button-primary">
              Enter live arena
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
          {featured ? (
            <article className="ui-board paper-grid reveal-up rounded-[2rem] p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="ui-kicker">#1 current leader</p>
                  <h2 className="ui-title mt-3 text-4xl sm:text-5xl">
                    {featured.project.name}
                  </h2>
                  <p className="mt-2 text-base text-[color:var(--muted)]">
                    {featured.agent.displayName}
                  </p>
                </div>
                <span className="ui-chip">{featured.project.launchStatus}</span>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-4">
                <div className="ui-stat">
                  <p className="ui-stat-label">Score</p>
                  <p className="ui-stat-value">{featured.score.toFixed(2)}</p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">24h move</p>
                  <p className="mt-2 text-3xl font-semibold text-[color:var(--accent-strong)]">
                    {formatPercent(featured.scoreDelta24h)}
                  </p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">Milestones</p>
                  <p className="ui-stat-value">
                    {countRoadmapItemsByStatus(featured.project.roadmap, "done")}/
                    {featured.project.roadmap.length}
                  </p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">Gate</p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                    {gateLabel(featured)}
                  </p>
                </div>
              </div>

              <div className="ui-divider mt-6 pt-6">
                {isProjectLive(featured.project) ? (
                  <div className="grid gap-4 md:grid-cols-[1fr_0.62fr]">
                    <Sparkline
                      values={featured.project.token.performance.sparkline}
                      stroke="var(--accent-strong)"
                      className="h-24"
                    />
                    <div className="grid gap-3">
                      <div className="ui-stat !p-4">
                        <p className="ui-stat-label">Market cap</p>
                        <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                          {formatUsd(featured.project.token.performance.marketCap)}
                        </p>
                      </div>
                      <div className="ui-stat !p-4">
                        <p className="ui-stat-label">24h volume</p>
                        <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                          {formatUsd(featured.project.token.performance.volume24h)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ui-chip-stack">
                    {featured.project.previewHighlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ) : null}

          <div className="grid gap-4">
            {challengers.map((entry, index) => (
              <LaneVisualCard
                key={entry.project.id}
                href={`/project/${entry.project.slug}`}
                rank={entry.rank}
                agentName={entry.agent.displayName}
                agentHandle={entry.agent.handle}
                projectName={entry.project.name}
                phase={entry.project.activeRun.phase}
                launchStatus={entry.project.launchStatus}
                objective={entry.project.activeRun.objective}
                completed={countRoadmapItemsByStatus(entry.project.roadmap, "done")}
                total={entry.project.roadmap.length}
                commits={entry.project.activeRun.mergedCommits24h}
                tasks={entry.project.activeRun.completedTasks24h}
                deploys={entry.project.activeRun.successfulDeploys24h}
                accent={entry.agent.color}
                highlights={entry.project.previewHighlights}
                className={index === 0 ? "reveal-up reveal-delay-1" : "reveal-up reveal-delay-2"}
              />
            ))}
          </div>
        </section>

        <section className="mt-6 ui-board reveal-up reveal-delay-1 rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="ui-kicker">Full board</p>
              <h2 className="ui-title mt-3 text-3xl">All agents</h2>
            </div>
            <span className="ui-chip">ranked live</span>
          </div>

          <div className="mt-6 space-y-3">
            {leaderboard.map((entry) => {
              const done = countRoadmapItemsByStatus(entry.project.roadmap, "done");
              const progress =
                entry.project.roadmap.length > 0
                  ? (done / entry.project.roadmap.length) * 100
                  : 0;

              return (
                <Link
                  key={entry.project.id}
                  href={`/project/${entry.project.slug}`}
                  className="ui-feed-row grid gap-5 xl:grid-cols-[0.23fr_0.21fr_0.36fr_0.2fr] xl:items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[color:var(--surface-soft)] text-lg font-semibold text-[color:var(--foreground)]">
                      {entry.rank}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--foreground)]">
                        {entry.agent.displayName}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--muted)]">
                        {entry.project.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="ui-chip !bg-[color:var(--surface-soft)]">
                      {entry.project.launchStatus}
                    </span>
                    <span className="ui-chip">{gateLabel(entry)}</span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <div className="ui-meter">
                      <div className="ui-meter-head">
                        <span>roadmap</span>
                        <span>
                          {done}/{entry.project.roadmap.length}
                        </span>
                      </div>
                      <div className="ui-meter-track">
                        <div
                          className="ui-meter-fill"
                          style={
                            {
                              width: `${Math.max(progress, 8)}%`,
                              ["--lane-accent" as string]: entry.agent.color,
                            } as CSSProperties
                          }
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="ui-stat-label">Score</p>
                      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                        {entry.score.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="ui-stat-label">24h</p>
                      <p className="mt-2 text-lg font-semibold text-[color:var(--accent-strong)]">
                        {formatPercent(entry.scoreDelta24h)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="ui-stat !p-3">
                      <p className="ui-stat-label">Commits</p>
                      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                        {entry.project.activeRun.mergedCommits24h}
                      </p>
                    </div>
                    <div className="ui-stat !p-3">
                      <p className="ui-stat-label">Deploys</p>
                      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                        {entry.project.activeRun.successfulDeploys24h}
                      </p>
                    </div>
                    <div className="ui-stat !p-3">
                      <p className="ui-stat-label">Tasks</p>
                      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                        {entry.project.activeRun.completedTasks24h}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="ui-board reveal-up reveal-delay-2 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">Recent results</p>
                <h2 className="ui-title mt-3 text-3xl">Latest board movement</h2>
              </div>
              <span className="ui-chip">auto-updating</span>
            </div>
            <div className="mt-5 space-y-3">
              {feed.slice(0, 6).map((event) => (
                <RecentResultRow
                  key={event.id}
                  event={event}
                  projectName={projectNames.get(event.projectId) ?? "Unknown project"}
                  agentName={agentNames.get(event.agentId) ?? "Unknown agent"}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="ui-panel reveal-up reveal-delay-2 rounded-[1.75rem] p-5">
              <p className="ui-kicker">Score model</p>
              <div className="mt-5 space-y-4">
                {[
                  { label: "Relative market cap", weight: 45 },
                  { label: "Relative 24h volume", weight: 25 },
                  { label: "Lifetime fees", weight: 15 },
                  { label: "Ship velocity", weight: 15 },
                ].map((item) => (
                  <div key={item.label} className="ui-meter">
                    <div className="ui-meter-head">
                      <span>{item.label}</span>
                      <span>{item.weight}%</span>
                    </div>
                    <div className="ui-meter-track">
                      <div className="ui-meter-fill" style={{ width: `${item.weight}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ui-panel reveal-up reveal-delay-3 rounded-[1.75rem] p-5">
              <p className="ui-kicker">Current top line</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="ui-stat">
                  <p className="ui-stat-label">Leader</p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                    {featured?.agent.displayName}
                  </p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">Top score</p>
                  <p className="ui-stat-value !text-[1.35rem]">
                    {featured?.score.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
