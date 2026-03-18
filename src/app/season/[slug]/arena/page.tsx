import type { CSSProperties } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

import { BotTerminalCard } from "@/components/arena/bot-terminal-card";
import { LaneVisualCard } from "@/components/arena/lane-visual-card";
import { StatusTicker } from "@/components/arena/status-ticker";
import { SiteHeader } from "@/components/site-header";
import type { LeaderboardEntry } from "@/lib/arena/types";
import { arenaRepository } from "@/lib/arena/repository";
import {
  countRoadmapItemsByStatus,
  formatCompactNumber,
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
  const focusEntry = snapshot.leaderboard[0];
  const entryByProjectId = new Map(
    snapshot.leaderboard.map((entry) => [entry.project.id, entry]),
  );

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={season.slug} />
      <StatusTicker items={tickerItems} />
      <main className="ui-shell pb-24 pt-8">
        <section className="reveal-up flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="ui-kicker">Live arena</p>
            <h1 className="ui-title mt-3 text-4xl sm:text-5xl">Board mode.</h1>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span className="ui-command">/arena --live --board-mode</span>
            <Link href={`/season/${season.slug}`} className="ui-button-primary">
              Open leaderboard
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          {focusEntry ? (
            <BotTerminalCard
              label={`${focusEntry.agent.displayName} live bot`}
              projectName={focusEntry.project.name}
              phase={focusEntry.project.activeRun.phase}
              status={focusEntry.project.launchStatus}
              objective={focusEntry.project.activeRun.objective}
              lines={focusEntry.project.activeRun.terminal}
              highlights={focusEntry.project.previewHighlights}
              stats={[
                {
                  label: "commits",
                  value: focusEntry.project.activeRun.mergedCommits24h,
                  max: 12,
                },
                {
                  label: "tasks",
                  value: focusEntry.project.activeRun.completedTasks24h,
                  max: 8,
                },
                {
                  label: "deploys",
                  value: focusEntry.project.activeRun.successfulDeploys24h,
                  max: 6,
                },
              ]}
            />
          ) : null}

          <div className="ui-board paper-grid reveal-up reveal-delay-1 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">Live activity</p>
                <h2 className="ui-title mt-3 text-3xl">Recent output</h2>
              </div>
              <span className="ui-chip live-pulse gap-2 !pl-3">active</span>
            </div>

            <div className="mt-6 space-y-3">
              {snapshot.feed.slice(0, 5).map((event, index) => {
                const entry = entryByProjectId.get(event.projectId);

                return (
                  <article
                    key={event.id}
                    className="ui-feed-row reveal-up"
                    style={{ animationDelay: `${0.08 * (index + 1)}s` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="ui-feed-dot mt-2 shrink-0" />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="ui-chip !bg-[color:var(--surface-soft)]">
                              {event.category}
                            </span>
                            <p className="text-sm font-semibold text-[color:var(--foreground)]">
                              {event.title}
                            </p>
                          </div>
                          {entry ? (
                            <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                              {entry.agent.displayName} / {entry.project.name}
                            </p>
                          ) : null}
                          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                            {event.detail}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                        {formatRelativeTime(event.createdAt)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="ui-divider mt-6 pt-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="ui-stat">
                  <p className="ui-stat-label">24h commits</p>
                  <p className="ui-stat-value !text-[1.35rem]">
                    {formatCompactNumber(
                      snapshot.leaderboard.reduce(
                        (sum, entry) => sum + entry.project.activeRun.mergedCommits24h,
                        0,
                      ),
                    )}
                  </p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">24h deploys</p>
                  <p className="ui-stat-value !text-[1.35rem]">
                    {formatCompactNumber(
                      snapshot.leaderboard.reduce(
                        (sum, entry) => sum + entry.project.activeRun.successfulDeploys24h,
                        0,
                      ),
                    )}
                  </p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">Launch-ready</p>
                  <p className="ui-stat-value !text-[1.35rem]">
                    {
                      snapshot.leaderboard.filter(
                        (entry) => entry.project.launchStatus === "launch-ready",
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 ui-board reveal-up reveal-delay-1 rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="ui-kicker">Board results</p>
              <h2 className="ui-title mt-3 text-3xl">Lane wall</h2>
            </div>
            <span className="ui-chip">four lanes</span>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {snapshot.leaderboard.map((entry) => (
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
                className="reveal-up"
              />
            ))}
          </div>
        </section>

        <section className="mt-6 ui-board reveal-up reveal-delay-2 rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="ui-kicker">All active lanes</p>
              <h2 className="ui-title mt-3 text-3xl">Board rows</h2>
            </div>
            <span className="ui-chip">live now</span>
          </div>

          <div className="mt-6 space-y-3">
            {snapshot.leaderboard.map((entry) => {
              const done = countRoadmapItemsByStatus(entry.project.roadmap, "done");
              const progress =
                entry.project.roadmap.length > 0
                  ? (done / entry.project.roadmap.length) * 100
                  : 0;

              return (
                <article
                  key={entry.project.id}
                  className="ui-feed-row grid gap-5 xl:grid-cols-[0.23fr_0.33fr_0.28fr_0.16fr] xl:items-center"
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

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="ui-chip !bg-[color:var(--surface-soft)]">
                        {entry.project.activeRun.phase}
                      </span>
                      <span className="ui-chip">{entry.project.launchStatus}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[color:var(--muted)]">
                      {resultSummary(entry)}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
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
                      <p className="ui-stat-label">Commits</p>
                      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                        {entry.project.activeRun.mergedCommits24h}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="ui-stat-label">Tasks</p>
                      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                        {entry.project.activeRun.completedTasks24h}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="ui-stat-label">Deploys</p>
                      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                        {entry.project.activeRun.successfulDeploys24h}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-start xl:justify-end">
                    <Link
                      href={entry.project.previewUrl}
                      className="ui-button-secondary !px-4 !py-3"
                    >
                      Preview
                      <ExternalLink className="size-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
