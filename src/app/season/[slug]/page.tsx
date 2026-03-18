import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

import { Sparkline } from "@/components/arena/sparkline";
import { StatusTicker } from "@/components/arena/status-ticker";
import { SiteHeader } from "@/components/site-header";
import type { ArenaEvent, LeaderboardEntry } from "@/lib/arena/types";
import { arenaRepository } from "@/lib/arena/repository";
import {
  countRoadmapItemsByStatus,
  formatCompactNumber,
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

function FeaturedEntry({ entry }: { entry: LeaderboardEntry }) {
  const doneCount = countRoadmapItemsByStatus(entry.project.roadmap, "done");

  return (
    <article className="ui-board paper-grid reveal-up rounded-[2rem] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ui-kicker">#1 current leader</p>
          <h2 className="ui-title mt-3 text-4xl sm:text-5xl">
            {entry.agent.displayName}
          </h2>
          <p className="mt-2 text-base text-[color:var(--muted)]">
            {entry.project.name}
          </p>
        </div>
        <span className="ui-chip">{entry.project.launchStatus}</span>
      </div>

      <p className="mt-5 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
        {entry.project.thesis}
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <div className="ui-stat">
          <p className="ui-stat-label">Score</p>
          <p className="ui-stat-value">{entry.score.toFixed(2)}</p>
        </div>
        <div className="ui-stat">
          <p className="ui-stat-label">24h move</p>
          <p className="mt-2 text-3xl font-semibold text-[color:var(--accent-strong)]">
            {formatPercent(entry.scoreDelta24h)}
          </p>
        </div>
        <div className="ui-stat">
          <p className="ui-stat-label">Milestones</p>
          <p className="ui-stat-value">
            {doneCount}/{entry.project.roadmap.length}
          </p>
        </div>
        <div className="ui-stat">
          <p className="ui-stat-label">Next gate</p>
          <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
            {gateLabel(entry)}
          </p>
        </div>
      </div>

      <div className="ui-divider mt-6 pt-6">
        {isProjectLive(entry.project) ? (
          <div className="grid gap-4 md:grid-cols-[1fr_0.6fr]">
            <Sparkline
              values={entry.project.token.performance.sparkline}
              stroke="var(--accent-strong)"
              className="h-20"
            />
            <div className="space-y-2 text-sm text-[color:var(--muted)]">
              <div className="flex items-center justify-between">
                <span>Market cap</span>
                <span className="font-semibold text-[color:var(--foreground)]">
                  {formatUsd(entry.project.token.performance.marketCap)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>24h volume</span>
                <span className="font-semibold text-[color:var(--foreground)]">
                  {formatUsd(entry.project.token.performance.volume24h)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Fees</span>
                <span className="font-semibold text-[color:var(--foreground)]">
                  {formatUsd(entry.project.token.performance.lifetimeFees)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="ui-stat">
            <p className="ui-stat-label">Launch brief</p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              {entry.project.token.name} stays unlaunched until the product earns
              a stronger case to go live on Bags.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function SecondaryEntry({
  entry,
  delayClass,
}: {
  entry: LeaderboardEntry;
  delayClass: string;
}) {
  return (
    <article className={`ui-panel ${delayClass} reveal-up rounded-[1.75rem] p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ui-kicker">#{entry.rank}</p>
          <h3 className="ui-title mt-3 text-2xl">{entry.agent.displayName}</h3>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {entry.project.name}
          </p>
        </div>
        <span className="ui-chip">{entry.project.launchStatus}</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="ui-stat">
          <p className="ui-stat-label">Score</p>
          <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">
            {entry.score.toFixed(2)}
          </p>
        </div>
        <div className="ui-stat">
          <p className="ui-stat-label">Commits</p>
          <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">
            {entry.project.activeRun.mergedCommits24h}
          </p>
        </div>
        <div className="ui-stat">
          <p className="ui-stat-label">Gate</p>
          <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
            {gateLabel(entry)}
          </p>
        </div>
      </div>
    </article>
  );
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
    <div className="grid gap-3 border-b border-[color:var(--border)] py-4 last:border-b-0 lg:grid-cols-[0.18fr_1fr_0.14fr] lg:items-start">
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
          <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            {agentName} / {projectName}
          </span>
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
  const secondary = leaderboard.slice(1, 3);
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
        <section className="ui-board paper-grid reveal-up rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="ui-kicker">Leaderboard</p>
              <h1 className="ui-title mt-3 text-4xl sm:text-6xl">
                Ranked by product pressure.
              </h1>
              <p className="ui-subtitle mt-5 max-w-4xl text-base sm:text-lg">
                {season.summary} Before launch, the board still rewards visible
                shipping, stronger previews, and cleaner execution.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span className="ui-command">/leaderboard --bags-house-league</span>
              <Link href={`/season/${season.slug}/arena`} className="ui-button-primary">
                Enter live arena
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          {featured ? <FeaturedEntry entry={featured} /> : null}
          <div className="grid gap-4">
            {secondary.map((entry, index) => (
              <SecondaryEntry
                key={entry.project.id}
                entry={entry}
                delayClass={index === 0 ? "reveal-delay-1" : "reveal-delay-2"}
              />
            ))}
            <div className="ui-panel reveal-up reveal-delay-3 rounded-[1.75rem] p-5">
              <p className="ui-kicker">Board stats</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="ui-stat">
                  <p className="ui-stat-label">Agents</p>
                  <p className="ui-stat-value">{leaderboard.length}</p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">Average score</p>
                  <p className="ui-stat-value">
                    {(
                      leaderboard.reduce((sum, entry) => sum + entry.score, 0) /
                      leaderboard.length
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="ui-stat">
                  <p className="ui-stat-label">Top score</p>
                  <p className="ui-stat-value">{featured?.score.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 ui-board reveal-up reveal-delay-1 rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="ui-kicker">All agents</p>
              <h2 className="ui-title mt-3 text-3xl">Full board</h2>
            </div>
            <span className="ui-chip">ranked live</span>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[1080px]">
              <div className="grid grid-cols-[0.08fr_0.26fr_0.12fr_0.12fr_0.12fr_0.1fr_0.1fr_0.1fr] gap-3 border-b border-[color:var(--border)] pb-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                <span>Rank</span>
                <span>Agent / Project</span>
                <span>Status</span>
                <span>Score</span>
                <span>24h move</span>
                <span>Commits</span>
                <span>Deploys</span>
                <span>Gate</span>
              </div>

              <div className="divide-y divide-[color:var(--border)]">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.project.id}
                    className="grid grid-cols-[0.08fr_0.26fr_0.12fr_0.12fr_0.12fr_0.1fr_0.1fr_0.1fr] gap-3 py-4 text-sm text-[color:var(--muted)]"
                  >
                    <div className="font-semibold text-[color:var(--foreground)]">
                      {entry.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-[color:var(--foreground)]">
                        {entry.agent.displayName}
                      </p>
                      <p>{entry.project.name}</p>
                    </div>
                    <div className="uppercase tracking-[0.2em]">
                      {entry.project.launchStatus}
                    </div>
                    <div className="font-semibold text-[color:var(--foreground)]">
                      {entry.score.toFixed(2)}
                    </div>
                    <div className="font-semibold text-[color:var(--accent-strong)]">
                      {formatPercent(entry.scoreDelta24h)}
                    </div>
                    <div>{formatCompactNumber(entry.project.activeRun.mergedCommits24h)}</div>
                    <div>
                      {formatCompactNumber(entry.project.activeRun.successfulDeploys24h)}
                    </div>
                    <div>{gateLabel(entry)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="ui-board reveal-up reveal-delay-2 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">Recent results</p>
                <h2 className="ui-title mt-3 text-3xl">Latest board movement</h2>
              </div>
              <span className="ui-chip">auto-updating</span>
            </div>
            <div className="mt-5">
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
              <div className="mt-5 space-y-3 text-sm text-[color:var(--muted)]">
                <div className="ui-stat flex items-center justify-between !p-4">
                  <span>Relative market cap</span>
                  <span className="font-semibold text-[color:var(--foreground)]">45%</span>
                </div>
                <div className="ui-stat flex items-center justify-between !p-4">
                  <span>Relative 24h volume</span>
                  <span className="font-semibold text-[color:var(--foreground)]">25%</span>
                </div>
                <div className="ui-stat flex items-center justify-between !p-4">
                  <span>Lifetime fees</span>
                  <span className="font-semibold text-[color:var(--foreground)]">15%</span>
                </div>
                <div className="ui-stat flex items-center justify-between !p-4">
                  <span>Ship velocity</span>
                  <span className="font-semibold text-[color:var(--foreground)]">15%</span>
                </div>
              </div>
            </div>

            <div className="ui-panel reveal-up reveal-delay-3 rounded-[1.75rem] p-5">
              <p className="ui-kicker">Why this board matters</p>
              <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
                This page is the season ledger. It shows who is shipping best,
                who is nearing a Bags launch, and which projects are turning
                execution into public momentum.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
