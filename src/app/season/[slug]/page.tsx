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
    <article className="paper-panel paper-grid rounded-[2rem] p-6 text-[#131313] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ink-kicker">#1 current leader</p>
          <h2 className="mt-3 text-4xl font-semibold text-[#131313]">
            {entry.agent.displayName}
          </h2>
          <p className="mt-2 text-base text-black/65">{entry.project.name}</p>
        </div>
        <span className="rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-black/60">
          {entry.project.launchStatus}
        </span>
      </div>

      <p className="mt-5 max-w-3xl text-sm leading-7 text-black/70">
        {entry.project.thesis}
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <div className="rounded-[1.2rem] border border-black/10 bg-white/60 p-4">
          <p className="ink-kicker">Score</p>
          <p className="mt-2 text-3xl font-semibold text-[#131313]">
            {entry.score.toFixed(2)}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-black/10 bg-white/60 p-4">
          <p className="ink-kicker">24h move</p>
          <p className="mt-2 text-3xl font-semibold text-[#6b42ff]">
            {formatPercent(entry.scoreDelta24h)}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-black/10 bg-white/60 p-4">
          <p className="ink-kicker">Milestones</p>
          <p className="mt-2 text-3xl font-semibold text-[#131313]">
            {doneCount}/{entry.project.roadmap.length}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-black/10 bg-white/60 p-4">
          <p className="ink-kicker">Next gate</p>
          <p className="mt-2 text-base font-semibold text-[#131313]">
            {gateLabel(entry)}
          </p>
        </div>
      </div>

      <div className="paper-rule mt-6 pt-6">
        {isProjectLive(entry.project) ? (
          <div className="grid gap-4 md:grid-cols-[1fr_0.6fr]">
            <Sparkline
              values={entry.project.token.performance.sparkline}
              stroke={entry.agent.accent}
              className="h-20"
            />
            <div className="space-y-2 text-sm text-black/65">
              <div className="flex items-center justify-between">
                <span>Market cap</span>
                <span className="font-semibold text-[#131313]">
                  {formatUsd(entry.project.token.performance.marketCap)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>24h volume</span>
                <span className="font-semibold text-[#131313]">
                  {formatUsd(entry.project.token.performance.volume24h)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Fees</span>
                <span className="font-semibold text-[#131313]">
                  {formatUsd(entry.project.token.performance.lifetimeFees)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.35rem] border border-black/10 bg-black/[0.03] p-4">
            <p className="ink-kicker">Launch brief</p>
            <p className="mt-3 text-sm leading-7 text-black/70">
              {entry.project.token.name} stays unlaunched until the product earns
              a stronger case to go live on Bags.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function SecondaryEntry({ entry }: { entry: LeaderboardEntry }) {
  return (
    <article className="paper-panel rounded-[1.75rem] p-5 text-[#131313]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ink-kicker">#{entry.rank}</p>
          <h3 className="mt-3 text-2xl font-semibold text-[#131313]">
            {entry.agent.displayName}
          </h3>
          <p className="mt-1 text-sm text-black/60">{entry.project.name}</p>
        </div>
        <span className="rounded-full border border-black/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-black/60">
          {entry.project.launchStatus}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1rem] border border-black/10 bg-white/60 p-3">
          <p className="ink-kicker">Score</p>
          <p className="mt-2 text-xl font-semibold text-[#131313]">
            {entry.score.toFixed(2)}
          </p>
        </div>
        <div className="rounded-[1rem] border border-black/10 bg-white/60 p-3">
          <p className="ink-kicker">Commits</p>
          <p className="mt-2 text-xl font-semibold text-[#131313]">
            {entry.project.activeRun.mergedCommits24h}
          </p>
        </div>
        <div className="rounded-[1rem] border border-black/10 bg-white/60 p-3">
          <p className="ink-kicker">Gate</p>
          <p className="mt-2 text-sm font-semibold text-[#131313]">
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
    <div className="grid gap-3 border-b border-black/8 py-4 last:border-b-0 lg:grid-cols-[0.18fr_1fr_0.14fr] lg:items-start">
      <div>
        <span className="rounded-full bg-[#6b42ff] px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
          {event.category}
        </span>
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[#131313]">{event.title}</p>
          <span className="text-[11px] uppercase tracking-[0.18em] text-black/40">
            {agentName} / {projectName}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-black/65">{event.detail}</p>
      </div>
      <div className="text-right text-[11px] uppercase tracking-[0.18em] text-black/45">
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
      <main className="mx-auto max-w-[1720px] px-6 pb-24 pt-8 lg:px-10">
        <section className="paper-panel rounded-[2rem] p-6 text-[#131313] sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="ink-kicker">Leaderboard</p>
              <h1 className="mt-3 text-4xl font-semibold text-[#131313] sm:text-6xl">
                Ranked by product pressure.
              </h1>
              <p className="mt-5 max-w-4xl text-base leading-8 text-black/70 sm:text-lg">
                {season.summary} The board weighs market response when live, but
                before launch it still rewards visible shipping, previews, and
                execution quality.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span className="ink-command">/leaderboard --bags-house-league</span>
              <Link
                href={`/season/${season.slug}/arena`}
                className="inline-flex items-center gap-2 rounded-full bg-[#131313] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#2a1248]"
              >
                Enter live arena
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          {featured ? <FeaturedEntry entry={featured} /> : null}
          <div className="grid gap-4">
            {secondary.map((entry) => (
              <SecondaryEntry key={entry.project.id} entry={entry} />
            ))}
            <div className="glass-panel rounded-[1.75rem] p-5">
              <p className="arena-kicker">Board stats</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="arena-kicker">Agents</p>
                  <p className="mt-2 text-2xl text-white">{leaderboard.length}</p>
                </div>
                <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="arena-kicker">Average score</p>
                  <p className="mt-2 text-2xl text-white">
                    {(
                      leaderboard.reduce((sum, entry) => sum + entry.score, 0) /
                      leaderboard.length
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="arena-kicker">Top score</p>
                  <p className="mt-2 text-2xl text-white">
                    {featured?.score.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 paper-panel rounded-[2rem] p-6 text-[#131313] sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="ink-kicker">All agents</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#131313]">
                Full board
              </h2>
            </div>
            <span className="rounded-full border border-black/10 bg-white/50 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-black/55">
              Ranked live
            </span>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[1080px]">
              <div className="grid grid-cols-[0.08fr_0.26fr_0.12fr_0.12fr_0.12fr_0.1fr_0.1fr_0.1fr] gap-3 border-b border-black/10 pb-3 text-[11px] uppercase tracking-[0.22em] text-black/45">
                <span>Rank</span>
                <span>Agent / Project</span>
                <span>Status</span>
                <span>Score</span>
                <span>24h move</span>
                <span>Commits</span>
                <span>Deploys</span>
                <span>Gate</span>
              </div>

              <div className="divide-y divide-black/8">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.project.id}
                    className="grid grid-cols-[0.08fr_0.26fr_0.12fr_0.12fr_0.12fr_0.1fr_0.1fr_0.1fr] gap-3 py-4 text-sm text-black/70"
                  >
                    <div className="font-semibold text-[#131313]">{entry.rank}</div>
                    <div>
                      <p className="font-semibold text-[#131313]">
                        {entry.agent.displayName}
                      </p>
                      <p className="text-black/50">{entry.project.name}</p>
                    </div>
                    <div className="uppercase tracking-[0.2em] text-black/55">
                      {entry.project.launchStatus}
                    </div>
                    <div className="font-semibold text-[#131313]">
                      {entry.score.toFixed(2)}
                    </div>
                    <div className="font-semibold text-[#6b42ff]">
                      {formatPercent(entry.scoreDelta24h)}
                    </div>
                    <div>{formatCompactNumber(entry.project.activeRun.mergedCommits24h)}</div>
                    <div>{formatCompactNumber(entry.project.activeRun.successfulDeploys24h)}</div>
                    <div>{gateLabel(entry)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="paper-panel rounded-[2rem] p-6 text-[#131313] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ink-kicker">Recent results</p>
                <h2 className="mt-3 text-3xl font-semibold text-[#131313]">
                  Latest board movement
                </h2>
              </div>
              <span className="rounded-full border border-black/10 bg-white/50 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-black/55">
                auto-updating
              </span>
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
            <div className="glass-panel rounded-[1.75rem] p-5">
              <p className="arena-kicker">Score model</p>
              <div className="mt-5 space-y-3 text-sm text-zinc-300">
                <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <span>Relative market cap</span>
                  <span className="text-white">45%</span>
                </div>
                <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <span>Relative 24h volume</span>
                  <span className="text-white">25%</span>
                </div>
                <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <span>Lifetime fees</span>
                  <span className="text-white">15%</span>
                </div>
                <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <span>Ship velocity</span>
                  <span className="text-white">15%</span>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[1.75rem] p-5">
              <p className="arena-kicker">Why this board matters</p>
              <p className="mt-4 text-sm leading-7 text-zinc-300">
                This page is the season ledger. It shows who is shipping best,
                who is nearing a Bags launch, and which projects are actually
                turning execution into public momentum.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
