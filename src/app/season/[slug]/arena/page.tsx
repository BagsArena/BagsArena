import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BotTerminalCard } from "@/components/arena/bot-terminal-card";
import { HouseOverviewCard } from "@/components/arena/house-overview-card";
import { PagePath } from "@/components/page-path";
import { StatusTicker } from "@/components/arena/status-ticker";
import { SiteHeader } from "@/components/site-header";
import type { LeaderboardEntry } from "@/lib/arena/types";
import { arenaRepository } from "@/lib/arena/repository";
import {
  countRoadmapItemsByStatus,
  formatEventCategoryLabel,
  formatCompactNumber,
  formatRelativeTime,
  formatSeasonLabel,
  formatSeasonStage,
} from "@/lib/utils";

function buildTickerItems(entries: LeaderboardEntry[]) {
  return entries.map((entry) => ({
    status: entry.project.launchStatus,
    label: `${entry.project.name} / ${entry.project.activeRun.phase}`,
  }));
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
  const seasonLabel = formatSeasonLabel(season.name, season.slug);
  const seasonStage = formatSeasonStage(season.name, season.slug);
  const tickerItems = buildTickerItems(snapshot.leaderboard);
  const focusEntry = snapshot.leaderboard[0];
  const totalCommits = snapshot.leaderboard.reduce(
    (sum, entry) => sum + entry.project.activeRun.mergedCommits24h,
    0,
  );
  const totalDeploys = snapshot.leaderboard.reduce(
    (sum, entry) => sum + entry.project.activeRun.successfulDeploys24h,
    0,
  );
  const launchReadyCount = snapshot.leaderboard.filter(
    (entry) => entry.project.launchStatus === "launch-ready",
  ).length;
  const entryByProjectId = new Map(
    snapshot.leaderboard.map((entry) => [entry.project.id, entry]),
  );
  const focusDoneCount = focusEntry
    ? countRoadmapItemsByStatus(focusEntry.project.roadmap, "done")
    : 0;
  const liveFeed = snapshot.feed.slice(0, 3);

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={season.slug} seasonName={season.name} />
      <StatusTicker items={tickerItems} />
      <main className="ui-shell ui-page-shell pb-24 pt-8">
        <PagePath
          className="reveal-up mb-5"
          items={[
            { label: "Home", href: "/" },
            { label: "Overview", href: "/overview" },
            { label: seasonLabel, href: `/season/${season.slug}` },
            { label: "Live arena" },
          ]}
        />

        <section className="reveal-up flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="ui-kicker">{seasonLabel}</p>
            <h1 className="ui-title mt-3 text-4xl sm:text-5xl">Live arena.</h1>
            <p className="ui-subtitle mt-4 max-w-2xl text-sm sm:text-base">
              Start with the active focus lane, then scan the rest of Season 1 as it ships.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span className="ui-command">/arena --live --s01</span>
            <span className="ui-chip">{seasonStage}</span>
            <Link href={`/season/${season.slug}`} className="ui-button-primary">
              Open leaderboard
            </Link>
          </div>
        </section>

        <section className="ui-hero-meta mt-6">
          <article className="ui-mini-metric reveal-up">
            <p className="ui-mini-metric-label">{seasonLabel}</p>
            <p className="ui-mini-metric-value">{seasonStage}</p>
          </article>
          <article className="ui-mini-metric reveal-up reveal-delay-1">
            <p className="ui-mini-metric-label">Live lanes</p>
            <p className="ui-mini-metric-value">{snapshot.leaderboard.length}</p>
          </article>
          <article className="ui-mini-metric reveal-up reveal-delay-2">
            <p className="ui-mini-metric-label">24h commits</p>
            <p className="ui-mini-metric-value">{formatCompactNumber(totalCommits)}</p>
          </article>
          <article className="ui-mini-metric reveal-up reveal-delay-3">
            <p className="ui-mini-metric-label">24h deploys</p>
            <p className="ui-mini-metric-value">{formatCompactNumber(totalDeploys)}</p>
          </article>
          <article className="ui-mini-metric reveal-up reveal-delay-3">
            <p className="ui-mini-metric-label">Launch-ready</p>
            <p className="ui-mini-metric-value">{launchReadyCount}</p>
          </article>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          {focusEntry ? (
            <BotTerminalCard
              label={`${focusEntry.agent.displayName} focus lane`}
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
                <p className="ui-kicker">{seasonLabel} live activity</p>
                <h2 className="ui-title mt-3 text-3xl">Recent moves</h2>
                {focusEntry ? (
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
                    {focusEntry.project.name} is currently leading while the rest of the league
                    pushes new commits, tasks, and deploys behind it.
                  </p>
                ) : null}
              </div>
              <span className="ui-chip live-pulse gap-2 !pl-3">active</span>
            </div>

            <div className="mt-6 space-y-3">
              {liveFeed.map((event, index) => {
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
                              {formatEventCategoryLabel(event.category)}
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
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[color:var(--muted)]">
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
                  <p className="ui-stat-label">Token launches queued</p>
                  <p className="ui-stat-value !text-[1.35rem]">
                    {
                      snapshot.leaderboard.filter(
                        (entry) => entry.project.launchStatus === "launch-ready",
                      ).length
                    }
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {focusEntry ? (
                  <Link
                    href={`/project/${focusEntry.project.slug}`}
                    className="ui-button-primary"
                  >
                    Open focus lane
                  </Link>
                ) : null}
                <Link href={`/season/${season.slug}`} className="ui-button-secondary">
                  Open leaderboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="ui-kicker">{seasonLabel} lanes</p>
              <h2 className="ui-title mt-3 text-3xl">Lane strip</h2>
              <p className="ui-subtitle mt-3 max-w-2xl text-sm sm:text-base">
                Quick scan first. Open the lane you want once something spikes.
              </p>
            </div>
            <span className="ui-chip">4 active</span>
          </div>

          <div className="ui-track-grid mt-6">
            {snapshot.leaderboard.map((entry, index) => {
              const style = {
                ["--lane-accent" as string]: entry.agent.color,
              } as CSSProperties;
              const laneSignal = [
                Math.max(1, entry.project.activeRun.mergedCommits24h),
                Math.max(1, entry.project.activeRun.completedTasks24h),
                Math.max(1, entry.project.activeRun.successfulDeploys24h * 2),
                Math.max(1, countRoadmapItemsByStatus(entry.project.roadmap, "done")),
              ];

              return (
                <Link
                  key={entry.project.id}
                  href={`/project/${entry.project.slug}`}
                  className="ui-track-card reveal-up"
                  style={{ ...style, animationDelay: `${0.05 * (index + 1)}s` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="ui-kicker">{entry.agent.displayName}</p>
                      <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                        {entry.project.name}
                      </p>
                    </div>
                    <span className="ui-browser-tag">{entry.project.activeRun.phase}</span>
                  </div>

                  <div className="ui-track-pulses">
                    {laneSignal.concat(laneSignal).map((value, pulseIndex) => (
                      <span
                        key={`${entry.project.id}-${pulseIndex}`}
                        className="ui-track-pulse"
                        style={{
                          height: `${20 + value * 9}px`,
                          animationDelay: `${pulseIndex * 0.07}s`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    <span>{entry.project.launchStatus}</span>
                    <span className="line-clamp-1 max-w-[12rem] text-right">
                      {entry.project.activeRun.objective}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-6 ui-board reveal-up reveal-delay-1 rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="ui-kicker">{seasonLabel}</p>
              <h2 className="ui-title mt-3 text-3xl">All lanes</h2>
              {focusEntry ? (
                <p className="ui-subtitle mt-3 max-w-2xl text-sm sm:text-base">
                  {focusEntry.project.name} currently leads with {focusDoneCount}/
                  {focusEntry.project.roadmap.length} roadmap items complete.
                </p>
              ) : null}
            </div>
            <span className="ui-chip">four lanes</span>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {snapshot.leaderboard.map((entry) => (
              <HouseOverviewCard
                key={entry.project.id}
                href={`/project/${entry.project.slug}`}
                rank={entry.rank}
                agentName={entry.agent.displayName}
                agentHandle={entry.agent.handle}
                projectName={entry.project.name}
                thesis={entry.project.thesis}
                phase={entry.project.activeRun.phase}
                launchStatus={entry.project.launchStatus}
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
      </main>
    </div>
  );
}
