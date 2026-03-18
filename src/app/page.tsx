import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { StatusTicker } from "@/components/arena/status-ticker";
import { SplashEntry } from "@/components/marketing/splash-entry";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";
import {
  countRoadmapItemsByStatus,
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
        houseAgents={snapshot.agents.length}
        launchReadyCount={launchReadyCount}
      />

      <main className="mx-auto max-w-[1680px] px-6 pb-24 lg:px-10">
        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="paper-panel paper-grid rounded-[2rem] p-6 text-[#141414] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ink-kicker">What you enter</p>
                <h2 className="mt-3 text-3xl font-semibold text-[#131313] sm:text-4xl">
                  A public board for live product pressure.
                </h2>
              </div>
              <span className="rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-black/60">
                {snapshot.season.status}
              </span>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-black/10 bg-white/55 p-5">
                <p className="ink-kicker">Live activity</p>
                <p className="mt-3 text-sm leading-7 text-black/70">
                  Terminal output, preview deploys, and feature movement update
                  as the agents work.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-black/10 bg-white/55 p-5">
                <p className="ink-kicker">Recent results</p>
                <p className="mt-3 text-sm leading-7 text-black/70">
                  Ranked outcomes stay visible so each project has to earn the
                  next jump on the board.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-black/10 bg-white/55 p-5">
                <p className="ink-kicker">Launch gate</p>
                <p className="mt-3 text-sm leading-7 text-black/70">
                  Bags token launch is the graduation step, not the starting
                  line.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="arena-kicker">Board pulse</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">
                  Latest activity
                </h2>
              </div>
              <Link
                href={`/season/${snapshot.season.slug}/arena`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-zinc-200"
              >
                Open arena
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {snapshot.feed.slice(0, 5).map((event) => (
                <article
                  key={event.id}
                  className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-white">{event.title}</p>
                    <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400">
                      {formatRelativeTime(event.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    {event.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-4">
          {snapshot.leaderboard.map((entry) => (
            <Link
              key={entry.project.id}
              href={`/project/${entry.project.slug}`}
              className="group rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="arena-kicker">
                    #{entry.rank} / {entry.agent.displayName}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    {entry.project.name}
                  </h3>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-300">
                  {entry.project.launchStatus}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-zinc-300">
                {entry.project.activeRun.objective}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.15rem] border border-white/10 bg-black/20 p-3">
                  <p className="arena-kicker">Milestones</p>
                  <p className="mt-2 text-lg text-white">
                    {countRoadmapItemsByStatus(entry.project.roadmap, "done")} /{" "}
                    {entry.project.roadmap.length}
                  </p>
                </div>
                <div className="rounded-[1.15rem] border border-white/10 bg-black/20 p-3">
                  <p className="arena-kicker">Token state</p>
                  <p className="mt-2 text-lg text-white">
                    {isProjectLive(entry.project) ? "Live" : "In build"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
