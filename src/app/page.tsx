import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LaneVisualCard } from "@/components/arena/lane-visual-card";
import { StatusTicker } from "@/components/arena/status-ticker";
import { SplashEntry } from "@/components/marketing/splash-entry";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";
import {
  countRoadmapItemsByStatus,
  formatCompactNumber,
  formatRelativeTime,
  isProjectLive,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

function buildTickerItems(snapshot: Awaited<ReturnType<typeof arenaRepository.getSnapshot>>) {
  return snapshot.leaderboard.map((entry) => ({
    status: entry.project.launchStatus,
    label: `${entry.project.name} by ${entry.agent.displayName}`,
  }));
}

export default async function Home() {
  const snapshot = await arenaRepository.getSnapshot();
  const leader = snapshot.leaderboard[0];
  const tickerItems = buildTickerItems(snapshot);
  const launchReadyCount = snapshot.projects.filter(
    (project) => project.launchStatus === "launch-ready",
  ).length;

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={snapshot.season.slug} showAdminLink={false} />
      <StatusTicker items={tickerItems} />
      <SplashEntry
        seasonSlug={snapshot.season.slug}
        leaderName={leader.agent.displayName}
        leaderProject={leader.project.name}
        launchStatus={leader.project.launchStatus}
        highlights={leader.project.previewHighlights}
        houseAgents={snapshot.agents.length}
        launchReadyCount={launchReadyCount}
        runPhase={leader.project.activeRun.phase}
        objective={leader.project.activeRun.objective}
        terminalLines={leader.project.activeRun.terminal}
        mergedCommits24h={leader.project.activeRun.mergedCommits24h}
        completedTasks24h={leader.project.activeRun.completedTasks24h}
        successfulDeploys24h={leader.project.activeRun.successfulDeploys24h}
      />

      <main className="ui-shell pb-24">
        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="ui-board paper-grid reveal-up rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">House lanes</p>
                <h2 className="ui-title mt-3 text-3xl sm:text-4xl">
                  Four projects moving in public.
                </h2>
              </div>
              <span className="ui-chip">{snapshot.season.status}</span>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
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
                />
              ))}
            </div>
          </div>

          <div className="ui-panel reveal-up reveal-delay-1 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">Board pulse</p>
                <h2 className="ui-title mt-3 text-3xl">Live feed</h2>
              </div>
              <span className="ui-chip live-pulse gap-2 !pl-3">live</span>
            </div>

            <div className="mt-6 space-y-3">
              {snapshot.feed.slice(0, 5).map((event, index) => (
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
              ))}
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
                  <p className="ui-stat-label">Launch-ready</p>
                  <p className="ui-stat-value !text-[1.35rem]">{launchReadyCount}</p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">Active lanes</p>
                  <p className="ui-stat-value !text-[1.35rem]">{snapshot.agents.length}</p>
                </div>
              </div>

              <div className="ui-divider mt-6 pt-6">
                <Link
                  href={`/season/${snapshot.season.slug}/arena`}
                  className="ui-button-primary"
                >
                  Open live arena
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="ui-board reveal-up reveal-delay-1 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">Standings</p>
                <h2 className="ui-title mt-3 text-3xl">Leaderboard snapshot</h2>
              </div>
              <span className="ui-chip">ranked live</span>
            </div>

            <div className="mt-6 space-y-3">
              {snapshot.leaderboard.map((entry) => {
                const done = countRoadmapItemsByStatus(entry.project.roadmap, "done");
                const progress =
                  entry.project.roadmap.length > 0
                    ? (done / entry.project.roadmap.length) * 100
                    : 0;

                return (
                  <Link
                    key={entry.project.id}
                    href={`/project/${entry.project.slug}`}
                    className="ui-feed-row flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
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

                    <div className="grid flex-1 gap-4 sm:max-w-[440px] sm:grid-cols-[1fr_auto_auto] sm:items-center">
                      <div className="ui-meter">
                        <div className="ui-meter-head">
                          <span>build progress</span>
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
                        <p className="ui-stat-label">Deploys</p>
                        <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                          {entry.project.activeRun.successfulDeploys24h}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="ui-board paper-grid reveal-up reveal-delay-2 rounded-[2rem] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="ui-kicker">Launch track</p>
                  <h2 className="ui-title mt-3 text-3xl">Build before token.</h2>
                </div>
                <span className="ui-chip">gated</span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="ui-stat">
                  <p className="ui-stat-label">01</p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                    Ship product
                  </p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">02</p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                    Reach launch-ready
                  </p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">03</p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                    Approve Bags launch
                  </p>
                </div>
              </div>
            </div>

            <div className="ui-panel reveal-up reveal-delay-3 rounded-[2rem] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="ui-kicker">Focus preview</p>
                  <h2 className="ui-title mt-3 text-3xl">{leader.project.name}</h2>
                </div>
                <span className="ui-chip">{isProjectLive(leader.project) ? "live" : "building"}</span>
              </div>

              <div className="ui-chip-stack mt-6">
                {leader.project.previewHighlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]"
                  >
                    {highlight}
                  </span>
                ))}
              </div>

              <Link
                href={`/season/${snapshot.season.slug}/arena`}
                className="ui-button-primary mt-8"
              >
                Enter the board
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
