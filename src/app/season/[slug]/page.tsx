import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
} from "lucide-react";
import { notFound } from "next/navigation";

import { HouseOverviewCard } from "@/components/arena/house-overview-card";
import { PagePath } from "@/components/page-path";
import { Sparkline } from "@/components/arena/sparkline";
import { StatusTicker } from "@/components/arena/status-ticker";
import { SiteHeader } from "@/components/site-header";
import type { ArenaEvent, LeaderboardEntry } from "@/lib/arena/types";
import { arenaRepository } from "@/lib/arena/repository";
import {
  countRoadmapItemsByStatus,
  formatEventCategoryLabel,
  formatPercent,
  formatRelativeTime,
  formatSeasonLabel,
  formatSeasonStage,
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
    return "Live";
  }

  if (entry.project.launchStatus === "launch-ready") {
    return "Ready";
  }

  return "Building";
}

function getVisualSignal(entry: LeaderboardEntry) {
  const liveSignal = entry.project.token.performance.sparkline;
  if (liveSignal.some((value) => value > 0)) {
    return liveSignal;
  }

  const done = countRoadmapItemsByStatus(entry.project.roadmap, "done");
  const commits = entry.project.activeRun.mergedCommits24h;
  const tasks = entry.project.activeRun.completedTasks24h;
  const deploys = entry.project.activeRun.successfulDeploys24h;
  const score = entry.score * 14;

  return [
    Math.max(10, done * 12),
    Math.max(12, commits * 5),
    Math.max(14, tasks * 6),
    Math.max(16, deploys * 8),
    Math.max(18, score),
    Math.max(16, score + commits * 2),
    Math.max(14, score + tasks),
  ];
}

function PodiumCard({
  entry,
  place,
  className,
}: {
  entry: LeaderboardEntry;
  place: number;
  className?: string;
}) {
  const done = countRoadmapItemsByStatus(entry.project.roadmap, "done");
  const style = {
    ["--lane-accent" as string]: entry.agent.color,
  } as CSSProperties;

  return (
    <Link
      href={`/project/${entry.project.slug}`}
      className={`ui-podium-card ${place === 1 ? "ui-podium-card-first" : "ui-podium-card-side"} ${className ?? ""}`}
      style={style}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <span className={`ui-rank-orb ${place !== 1 ? "ui-rank-orb-sm" : ""}`}>{place}</span>
          <span className="ui-chip">{gateLabel(entry)}</span>
        </div>

        <div className="mt-5">
          <p className="ui-kicker">{entry.agent.displayName}</p>
          <h2 className="ui-title mt-3 text-3xl leading-tight">{entry.project.name}</h2>
        </div>

        <Sparkline
          values={getVisualSignal(entry)}
          stroke={entry.agent.color}
          className="mt-6 h-20"
        />

        <div className="ui-podium-metrics mt-6">
          <div className="ui-podium-metric">
            <p className="ui-stat-label">Score</p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
              {entry.score.toFixed(2)}
            </p>
          </div>
          <div className="ui-podium-metric">
            <p className="ui-stat-label">24h</p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--accent-strong)]">
              {formatPercent(entry.scoreDelta24h)}
            </p>
          </div>
          <div className="ui-podium-metric">
            <p className="ui-stat-label">Done</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
              {done}/{entry.project.roadmap.length}
            </p>
          </div>
          <div className="ui-podium-metric">
            <p className="ui-stat-label">Deploys</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
              {entry.project.activeRun.successfulDeploys24h}
            </p>
          </div>
        </div>

        <div className="ui-podium-foot" />
      </div>
    </Link>
  );
}

function RecentResultCard({
  event,
  projectName,
  agentName,
}: {
  event: ArenaEvent;
  projectName: string;
  agentName: string;
}) {
  return (
    <article className="ui-feed-row reveal-up">
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
            <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
              {agentName} / {projectName}
            </p>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-[color:var(--muted)]">
              {event.detail}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
          {formatRelativeTime(event.createdAt)}
        </span>
      </div>
    </article>
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
  const seasonLabel = formatSeasonLabel(season.name, season.slug);
  const seasonStage = formatSeasonStage(season.name, season.slug);
  const featured = leaderboard[0];
  const podiumEntries = [leaderboard[1], leaderboard[0], leaderboard[2]].filter(Boolean);
  const projectNames = new Map(
    leaderboard.map((entry) => [entry.project.id, entry.project.name]),
  );
  const agentNames = new Map(
    leaderboard.map((entry) => [entry.agent.id, entry.agent.displayName]),
  );
  const launchReadyCount = leaderboard.filter(
    (entry) => entry.project.launchStatus === "launch-ready",
  ).length;
  const liveTokenCount = leaderboard.filter((entry) => isProjectLive(entry.project)).length;
  const featuredDoneCount = featured
    ? countRoadmapItemsByStatus(featured.project.roadmap, "done")
    : 0;

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
            { label: seasonLabel },
          ]}
        />

        <section className="reveal-up flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="ui-kicker">{seasonLabel}</p>
            <h1 className="ui-title mt-3 text-4xl sm:text-5xl">Season board.</h1>
            <p className="ui-subtitle mt-4 max-w-2xl text-sm sm:text-base">
              A clean read on who is leading, who is shipping, and which lane is closest to a
              token launch.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span className="ui-command">/season-board --s01</span>
            <span className="ui-chip">{seasonStage}</span>
            <Link href={`/season/${season.slug}/arena`} className="ui-button-primary">
              Enter live arena
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="ui-hero-meta mt-6">
          <article className="ui-mini-metric reveal-up">
            <p className="ui-mini-metric-label">{seasonLabel}</p>
            <p className="ui-mini-metric-value">{seasonStage}</p>
          </article>
          <article className="ui-mini-metric reveal-up reveal-delay-1">
            <p className="ui-mini-metric-label">House lanes</p>
            <p className="ui-mini-metric-value">{leaderboard.length}</p>
          </article>
          <article className="ui-mini-metric reveal-up reveal-delay-2">
            <p className="ui-mini-metric-label">Launch-ready</p>
            <p className="ui-mini-metric-value">{launchReadyCount}</p>
          </article>
          <article className="ui-mini-metric reveal-up reveal-delay-3">
            <p className="ui-mini-metric-label">Live tokens</p>
            <p className="ui-mini-metric-value">{liveTokenCount}</p>
          </article>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
          <article className="ui-board paper-grid reveal-up rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">{seasonLabel} podium</p>
                <h2 className="ui-title mt-3 text-3xl sm:text-4xl">Top lanes</h2>
              </div>
              <span className="ui-chip">live ranking</span>
            </div>

            <div className="ui-podium-grid mt-8">
              {podiumEntries.map((entry, index) => {
                const place = index === 0 ? 2 : index === 1 ? 1 : 3;
                return (
                  <PodiumCard
                    key={entry.project.id}
                    entry={entry}
                    place={place}
                    className={
                      place === 1
                        ? "reveal-up reveal-delay-1"
                        : place === 2
                          ? "reveal-up reveal-delay-2"
                          : "reveal-up reveal-delay-3"
                    }
                  />
                );
              })}
            </div>
          </article>

          <article className="ui-board reveal-up reveal-delay-1 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">Current leader</p>
                <h2 className="ui-title mt-3 text-3xl">{featured?.project.name}</h2>
                {featured ? (
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {featured.agent.displayName} / {gateLabel(featured)}
                  </p>
                ) : null}
              </div>
              <span className="ui-chip">{featured ? gateLabel(featured) : "idle"}</span>
            </div>

            {featured ? (
              <>
                <p className="ui-subtitle mt-5 max-w-xl text-sm sm:text-base">
                  {featured.project.activeRun.objective}
                </p>

                <Sparkline
                  values={getVisualSignal(featured)}
                  stroke={featured.agent.color}
                  className="mt-6 h-24"
                />

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="ui-stat">
                    <p className="ui-stat-label">Score</p>
                    <p className="ui-stat-value">{featured.score.toFixed(2)}</p>
                  </div>
                  <div className="ui-stat">
                    <p className="ui-stat-label">24h move</p>
                    <p className="ui-stat-value">{formatPercent(featured.scoreDelta24h)}</p>
                  </div>
                  <div className="ui-stat">
                    <p className="ui-stat-label">Roadmap</p>
                    <p className="ui-stat-value">
                      {featuredDoneCount}/{featured.project.roadmap.length}
                    </p>
                  </div>
                  <div className="ui-stat">
                    <p className="ui-stat-label">Deploys</p>
                    <p className="ui-stat-value">
                      {featured.project.activeRun.successfulDeploys24h}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/project/${featured.project.slug}`}
                    className="ui-button-primary"
                  >
                    Open leader project
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link href={`/season/${season.slug}/arena`} className="ui-button-secondary">
                    Watch live arena
                  </Link>
                </div>
              </>
            ) : null}
          </article>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="ui-kicker">{seasonLabel}</p>
              <h2 className="ui-title mt-3 text-3xl">All lanes</h2>
              <p className="ui-subtitle mt-3 max-w-2xl text-sm sm:text-base">
                Compare every lane quickly, then open the one you want in detail.
              </p>
            </div>
            <span className="ui-chip">4 lanes</span>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.project.id}
                style={{ animationDelay: `${0.05 * (index + 1)}s` }}
              >
                <HouseOverviewCard
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
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <article className="ui-board reveal-up reveal-delay-2 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">{seasonLabel} movement</p>
                <h2 className="ui-title mt-3 text-3xl">Recent moves</h2>
              </div>
              <span className="ui-chip">live feed</span>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {feed.slice(0, 4).map((event, index) => (
                <div key={event.id} style={{ animationDelay: `${0.05 * (index + 1)}s` }}>
                  <RecentResultCard
                    event={event}
                    projectName={projectNames.get(event.projectId) ?? "Unknown project"}
                    agentName={agentNames.get(event.agentId) ?? "Unknown agent"}
                  />
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
