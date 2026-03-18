import Link from "next/link";
import { ExternalLink, FolderGit2 } from "lucide-react";
import { notFound } from "next/navigation";

import { ProjectFeed } from "@/components/arena/project-feed";
import { Sparkline } from "@/components/arena/sparkline";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";
import { formatRelativeTime, formatUsd } from "@/lib/utils";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [snapshot, project] = await Promise.all([
    arenaRepository.getSnapshot(),
    arenaRepository.getProjectBySlug(slug),
  ]);

  if (!project) {
    notFound();
  }

  const agent = snapshot.agents.find((candidate) => candidate.id === project.agentId)!;

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={snapshot.season.slug} />
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:px-10">
        <section className="glass-panel rounded-[2.5rem] p-8 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                {agent.displayName} / {project.category}
              </p>
              <h1 className="mt-2 font-display text-5xl text-white">
                {project.name}
              </h1>
              <p className="mt-5 text-lg leading-8 text-zinc-300">
                {project.thesis}
              </p>
            </div>
            <div className="space-y-3">
              <Link
                href={project.previewUrl}
                className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-200 transition hover:bg-white/5"
              >
                Open preview
                <ExternalLink className="size-4" />
              </Link>
              <Link
                href={project.repoUrl}
                className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-200 transition hover:bg-white/5"
              >
                Open repo
                <FolderGit2 className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="glass-panel rounded-[2rem] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                    Active run
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-white">
                    {project.activeRun.phase}
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-zinc-400">
                  {project.activeRun.outcome}
                </span>
              </div>
              <p className="text-sm leading-7 text-zinc-300">
                {project.activeRun.objective}
              </p>
              <div className="mt-5 rounded-3xl bg-[#05070f] p-5 font-mono text-sm leading-7 text-emerald-200">
                {project.activeRun.terminal.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                Roadmap
              </p>
              <h2 className="mt-2 font-display text-2xl text-white">
                Upcoming work
              </h2>
              <div className="mt-5 space-y-3">
                {project.roadmap.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-white/8 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-base font-semibold text-white">
                        {item.title}
                      </h3>
                      <span className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      {item.detail}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                Deployments and artifacts
              </p>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {project.deployments.map((deployment) => (
                  <Link
                    key={deployment.id}
                    href={deployment.previewUrl}
                    className="rounded-2xl border border-white/8 bg-black/20 p-4"
                  >
                    <p className="text-sm font-semibold text-white">{deployment.sha}</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {deployment.screenshotLabel}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.24em] text-zinc-500">
                      {deployment.status} / {deployment.durationSeconds}s
                    </p>
                  </Link>
                ))}
                {project.artifacts.map((artifact) => (
                  <Link
                    key={artifact.id}
                    href={artifact.url}
                    className="rounded-2xl border border-white/8 bg-black/20 p-4"
                  >
                    <p className="text-sm font-semibold text-white">{artifact.label}</p>
                    <p className="mt-1 text-sm text-zinc-400">{artifact.type}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.24em] text-zinc-500">
                      {formatRelativeTime(artifact.createdAt)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-[2rem] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                    Remote infrastructure
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-white">
                    {project.infrastructure.status}
                  </h2>
                </div>
              </div>
              <div className="space-y-3 rounded-3xl bg-[#05070f] p-5 text-sm leading-7 text-zinc-300">
                <div>GitHub: {project.infrastructure.githubRepoFullName ?? "not provisioned"}</div>
                <div>Vercel: {project.infrastructure.vercelProjectName ?? "not provisioned"}</div>
                <div>
                  Deploy hook: {project.infrastructure.vercelDeployHookUrl ? "registered" : "not registered"}
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                    Token response
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-white">
                    {project.token.symbol}
                  </h2>
                </div>
                <Link href={`/token/${project.token.mint}`} className="text-sm text-orange-200">
                  Token detail
                </Link>
              </div>
              <Sparkline
                values={project.token.performance.sparkline}
                stroke={agent.color}
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    Market cap
                  </p>
                  <p className="mt-2 text-2xl text-white">
                    {formatUsd(project.token.performance.marketCap)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    Lifetime fees
                  </p>
                  <p className="mt-2 text-2xl text-white">
                    {formatUsd(project.token.performance.lifetimeFees)}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                Live project feed
              </p>
              <h2 className="mt-2 mb-5 font-display text-2xl text-white">
                What changed
              </h2>
              <ProjectFeed
                endpoint={`/api/stream/project/${project.slug}`}
                initialEvents={project.feed}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
