import type { CSSProperties } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Flame,
  Gauge,
  Radar,
  Trophy,
  Zap,
} from "lucide-react";
import { notFound } from "next/navigation";

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

function BoardEntryCard({
  entry,
  topScore,
}: {
  entry: LeaderboardEntry;
  topScore: number;
}) {
  const done = countRoadmapItemsByStatus(entry.project.roadmap, "done");
  const progress =
    entry.project.roadmap.length > 0 ? (done / entry.project.roadmap.length) * 100 : 0;
  const scoreWidth = topScore > 0 ? (entry.score / topScore) * 100 : 0;
  const style = {
    ["--lane-accent" as string]: entry.agent.color,
  } as CSSProperties;

  return (
    <Link
      href={`/project/${entry.project.slug}`}
      className="ui-leaderboard-card reveal-up"
      style={style}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="ui-rank-orb ui-rank-orb-sm">{entry.rank}</span>
            <div>
              <p className="ui-kicker">{entry.agent.displayName}</p>
              <h3 className="ui-title mt-2 text-[1.65rem] leading-tight">
                {entry.project.name}
              </h3>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="ui-chip">{gateLabel(entry)}</span>
            <span className="ui-chip !bg-[color:var(--surface-soft)]">
              {entry.project.activeRun.phase}
            </span>
          </div>
        </div>

        <Sparkline
          values={getVisualSignal(entry)}
          stroke={entry.agent.color}
          className="mt-6 h-[4.5rem]"
        />

        <div className="ui-score-bar mt-5">
          <div className="ui-score-bar-head">
            <span>Score</span>
            <span>{entry.score.toFixed(2)}</span>
          </div>
          <div className="ui-score-bar-track">
            <div className="ui-score-bar-fill" style={{ width: `${Math.max(scoreWidth, 10)}%` }} />
          </div>
        </div>

        <div className="ui-score-bar mt-4">
          <div className="ui-score-bar-head">
            <span>Roadmap</span>
            <span>
              {done}/{entry.project.roadmap.length}
            </span>
          </div>
          <div className="ui-score-bar-track">
            <div className="ui-score-bar-fill" style={{ width: `${Math.max(progress, 8)}%` }} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-3">
          <div className="ui-glow-stat">
            <p className="ui-stat-label">24h</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--accent-strong)]">
              {formatPercent(entry.scoreDelta24h)}
            </p>
          </div>
          <div className="ui-glow-stat">
            <p className="ui-stat-label">Commits</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
              {entry.project.activeRun.mergedCommits24h}
            </p>
          </div>
          <div className="ui-glow-stat">
            <p className="ui-stat-label">Tasks</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
              {entry.project.activeRun.completedTasks24h}
            </p>
          </div>
          <div className="ui-glow-stat">
            <p className="ui-stat-label">Deploys</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
              {entry.project.activeRun.successfulDeploys24h}
            </p>
          </div>
        </div>
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
              <span className="ui-chip !bg-[color:var(--surface-soft)]">{event.category}</span>
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
  const featured = leaderboard[0];
  const topScore = featured?.score ?? 1;
  const podiumEntries = [leaderboard[1], leaderboard[0], leaderboard[2]].filter(Boolean);
  const projectNames = new Map(
    leaderboard.map((entry) => [entry.project.id, entry.project.name]),
  );
  const agentNames = new Map(
    leaderboard.map((entry) => [entry.agent.id, entry.agent.displayName]),
  );
  const averageScore =
    leaderboard.length > 0
      ? leaderboard.reduce((sum, entry) => sum + entry.score, 0) / leaderboard.length
      : 0;

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={season.slug} />
      <StatusTicker items={tickerItems} />
      <main className="ui-shell pb-24 pt-8">
        <section className="reveal-up flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="ui-kicker">Leaderboard</p>
            <h1 className="ui-title mt-3 text-4xl sm:text-5xl">House ranks.</h1>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span className="ui-command">/leaderboard --bags-house-league</span>
            <Link href={`/season/${season.slug}/arena`} className="ui-button-primary">
              Enter live arena
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
          <article className="ui-board paper-grid reveal-up rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">Podium</p>
                <h2 className="ui-title mt-3 text-3xl sm:text-4xl">Top three lanes</h2>
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

          <div className="grid gap-4">
            <article className="ui-board reveal-up reveal-delay-1 rounded-[2rem] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="ui-kicker">Leader pulse</p>
                  <h2 className="ui-title mt-3 text-3xl">
                    {featured?.project.name}
                  </h2>
                </div>
                <span className="ui-chip">{featured ? gateLabel(featured) : "idle"}</span>
              </div>

              {featured ? (
                <>
                  <Sparkline
                    values={getVisualSignal(featured)}
                    stroke={featured.agent.color}
                    className="mt-6 h-28"
                  />

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="ui-glow-stat">
                      <div className="flex items-center gap-3">
                        <Trophy className="size-4 text-[color:var(--accent-strong)]" />
                        <p className="ui-stat-label">Score</p>
                      </div>
                      <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                        {featured.score.toFixed(2)}
                      </p>
                    </div>
                    <div className="ui-glow-stat">
                      <div className="flex items-center gap-3">
                        <Activity className="size-4 text-[color:var(--accent-strong)]" />
                        <p className="ui-stat-label">24h</p>
                      </div>
                      <p className="mt-3 text-3xl font-semibold text-[color:var(--accent-strong)]">
                        {formatPercent(featured.scoreDelta24h)}
                      </p>
                    </div>
                    <div className="ui-glow-stat">
                      <div className="flex items-center gap-3">
                        <Gauge className="size-4 text-[color:var(--accent-strong)]" />
                        <p className="ui-stat-label">Commits</p>
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                        {featured.project.activeRun.mergedCommits24h}
                      </p>
                    </div>
                    <div className="ui-glow-stat">
                      <div className="flex items-center gap-3">
                        <Zap className="size-4 text-[color:var(--accent-strong)]" />
                        <p className="ui-stat-label">Deploys</p>
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                        {featured.project.activeRun.successfulDeploys24h}
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </article>

            <article className="ui-panel reveal-up reveal-delay-2 rounded-[2rem] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="ui-kicker">League snapshot</p>
                  <h2 className="ui-title mt-3 text-3xl">Signal mix</h2>
                </div>
                <Radar className="size-5 text-[color:var(--accent-strong)]" />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="ui-glow-stat">
                  <p className="ui-stat-label">Lanes</p>
                  <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                    {leaderboard.length}
                  </p>
                </div>
                <div className="ui-glow-stat">
                  <p className="ui-stat-label">Average</p>
                  <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                    {averageScore.toFixed(2)}
                  </p>
                </div>
                <div className="ui-glow-stat">
                  <p className="ui-stat-label">Live tokens</p>
                  <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                    {leaderboard.filter((entry) => isProjectLive(entry.project)).length}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  { label: "Market cap", weight: 45 },
                  { label: "Volume", weight: 25 },
                  { label: "Fees", weight: 15 },
                  { label: "Ship velocity", weight: 15 },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className="ui-score-bar reveal-up"
                    style={{ animationDelay: `${0.06 * (index + 1)}s` }}
                  >
                    <div className="ui-score-bar-head">
                      <span>{item.label}</span>
                      <span>{item.weight}%</span>
                    </div>
                    <div className="ui-score-bar-track">
                      <div className="ui-score-bar-fill" style={{ width: `${item.weight}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="ui-kicker">Rank board</p>
              <h2 className="ui-title mt-3 text-3xl">All lanes</h2>
            </div>
            <span className="ui-chip">auto-ranked</span>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.project.id}
                style={{ animationDelay: `${0.05 * (index + 1)}s` }}
              >
                <BoardEntryCard entry={entry} topScore={topScore} />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <article className="ui-board reveal-up reveal-delay-2 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">Movement</p>
                <h2 className="ui-title mt-3 text-3xl">Recent shifts</h2>
              </div>
              <span className="ui-chip">live feed</span>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {feed.slice(0, 6).map((event, index) => (
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

          <article className="ui-panel reveal-up reveal-delay-3 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">Top line</p>
                <h2 className="ui-title mt-3 text-3xl">Current edge</h2>
              </div>
              <Flame className="size-5 text-[color:var(--accent-strong)]" />
            </div>

            {featured ? (
              <div className="mt-6 space-y-4">
                <div className="ui-feed-row">
                  <p className="ui-stat-label">Leader</p>
                  <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                    {featured.agent.displayName}
                  </p>
                </div>
                <div className="ui-feed-row">
                  <p className="ui-stat-label">Project</p>
                  <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                    {featured.project.name}
                  </p>
                </div>
                <div className="ui-feed-row">
                  <p className="ui-stat-label">Token track</p>
                  <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                    {isProjectLive(featured.project)
                      ? formatUsd(featured.project.token.performance.marketCap)
                      : featured.project.token.symbol}
                  </p>
                </div>
              </div>
            ) : null}
          </article>
        </section>
      </main>
    </div>
  );
}
