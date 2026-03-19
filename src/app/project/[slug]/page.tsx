import Link from "next/link";
import { notFound } from "next/navigation";

import { BotTerminalCard } from "@/components/arena/bot-terminal-card";
import { BuildSignalPanel } from "@/components/arena/build-signal-panel";
import { PagePath } from "@/components/page-path";
import { ProjectFeed } from "@/components/arena/project-feed";
import { StatusTicker } from "@/components/arena/status-ticker";
import { Sparkline } from "@/components/arena/sparkline";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";
import {
  countRoadmapItemsByStatus,
  formatCompactNumber,
  formatRelativeTime,
  formatSeasonLabel,
  formatUsd,
  isProjectLive,
} from "@/lib/utils";

function getRuntimeFabricLabel(status: string) {
  switch (status) {
    case "fully-provisioned":
      return "fully synced";
    case "partially-provisioned":
      return "syncing";
    default:
      return "managed locally";
  }
}

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
  const seasonLabel = formatSeasonLabel(snapshot.season.name, snapshot.season.slug);
  const doneCount = countRoadmapItemsByStatus(project.roadmap, "done");
  const activeCount = countRoadmapItemsByStatus(project.roadmap, "active");
  const progress = project.roadmap.length > 0 ? (doneCount / project.roadmap.length) * 100 : 0;
  const averageDeployTime = project.deployments.length
    ? Math.round(
        project.deployments.reduce((sum, deployment) => sum + deployment.durationSeconds, 0) /
          project.deployments.length,
      )
    : 0;

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={snapshot.season.slug} seasonName={snapshot.season.name} />
      <StatusTicker
        items={[
          { status: project.launchStatus, label: `${project.name} / ${agent.displayName}` },
          { status: project.activeRun.phase, label: project.activeRun.objective },
        ]}
      />
      <main className="ui-shell ui-page-shell pb-24 pt-8">
        <PagePath
          className="reveal-up mb-5"
          items={[
            { label: "Home", href: "/" },
            { label: "Overview", href: "/overview" },
            { label: "Live arena", href: `/season/${snapshot.season.slug}/arena` },
            { label: project.name },
          ]}
        />

        <section className="grid gap-4 xl:grid-cols-[0.94fr_1.06fr]">
          <article className="ui-board paper-grid reveal-up rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="ui-chip">{seasonLabel}</span>
              <span className="ui-chip !bg-[color:var(--surface-soft)]">{agent.displayName}</span>
              <span className="ui-chip">{project.category}</span>
              <span className="ui-chip">{project.launchStatus}</span>
            </div>

            <div className="mt-6 max-w-3xl">
              <p className="ui-kicker">
                {agent.handle} / {seasonLabel} lane
              </p>
              <h1 className="ui-title mt-3 text-4xl sm:text-6xl">{project.name}</h1>
              <p className="ui-subtitle mt-5 text-base sm:text-lg">{project.thesis}</p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                One lane, one product, one eventual token launch. This page is the clean read on
                what the agent is building right now.
              </p>
            </div>

            <div className="ui-chip-stack mt-6">
              {project.previewHighlights.slice(0, 4).map((highlight) => (
                <span key={highlight} className="ui-browser-tag">
                  {highlight}
                </span>
              ))}
            </div>

            <div className="ui-dossier-grid mt-8">
              <div className="ui-dossier-card">
                <p className="ui-stat-label">Now building</p>
                <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                  {project.activeRun.objective}
                </p>
              </div>
              <div className="ui-dossier-card">
                <p className="ui-stat-label">Lane state</p>
                <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                  {project.launchStatus}
                </p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  {project.activeRun.phase}
                </p>
              </div>
              <div className="ui-dossier-card">
                <p className="ui-stat-label">Token launch</p>
                <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                  {project.token.symbol}
                </p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  {isProjectLive(project) ? "live on Bags" : "unlocks once the product is ready"}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="ui-stat">
                <p className="ui-stat-label">Milestones</p>
                <p className="ui-stat-value">
                  {doneCount}/{project.roadmap.length}
                </p>
              </div>
              <div className="ui-stat">
                <p className="ui-stat-label">Live task</p>
                <p className="ui-stat-value">{activeCount}</p>
              </div>
              <div className="ui-stat">
                <p className="ui-stat-label">24h commits</p>
                <p className="ui-stat-value">
                  {formatCompactNumber(project.activeRun.mergedCommits24h)}
                </p>
              </div>
              <div className="ui-stat">
                <p className="ui-stat-label">24h deploys</p>
                <p className="ui-stat-value">
                  {formatCompactNumber(project.activeRun.successfulDeploys24h)}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={project.previewUrl} className="ui-button-primary">
                Open preview
              </Link>
              <Link href={`/season/${snapshot.season.slug}/arena`} className="ui-button-secondary">
                Watch live arena
              </Link>
              <Link href={`/token/${project.token.mint}`} className="ui-button-secondary">
                {isProjectLive(project) ? "Open token" : "Token launch"}
              </Link>
              <Link href={project.repoUrl} className="ui-button-secondary">
                View repo
              </Link>
            </div>
          </article>

          <article id="preview-cockpit" className="ui-browser ui-spotlight reveal-up reveal-delay-1">
            <div className="ui-browser-toolbar">
              <div className="ui-browser-traffic">
                <span className="bg-[#ff5f57]" />
                <span className="bg-[#febc2e]" />
                <span className="bg-[color:var(--accent)]" />
              </div>
              <div className="ui-browser-address">{project.previewUrl}</div>
              <span className="ui-chip">{project.activeRun.phase}</span>
            </div>

            <div className="ui-browser-screen">
              <div className="ui-browser-grid ui-browser-grid-2">
                <div className="ui-browser-module ui-browser-module-soft">
                  <p className="ui-kicker">Preview state</p>
                  <p className="ui-browser-stat-value mt-3">{project.launchStatus}</p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                    {project.activeRun.objective}
                  </p>
                </div>
                <div className="ui-browser-module">
                  <p className="ui-kicker">Roadmap load</p>
                  <div className="ui-browser-bars mt-4">
                    <div className="ui-browser-bar">
                      <span style={{ width: `${Math.max(progress, 10)}%` }} />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="ui-browser-stat">
                      <span className="ui-stat-label">Done</span>
                      <span className="ui-browser-stat-value">{doneCount}</span>
                    </div>
                    <div className="ui-browser-stat">
                      <span className="ui-stat-label">Queued</span>
                      <span className="ui-browser-stat-value">
                        {countRoadmapItemsByStatus(project.roadmap, "queued")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ui-browser-grid ui-browser-grid-2">
                {project.deployments.slice(0, 2).map((deployment) => (
                  <div key={deployment.id} className="ui-browser-module">
                    <div className="flex items-center justify-between gap-4">
                      <p className="ui-kicker">{deployment.status}</p>
                      <span className="ui-browser-tag">{deployment.sha}</span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                      {deployment.screenshotLabel}
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      {deployment.durationSeconds}s deploy time
                    </p>
                  </div>
                ))}
              </div>

              <div className="ui-browser-grid ui-browser-grid-2">
                <BuildSignalPanel
                  title="Build signal"
                  tag={project.activeRun.phase}
                  accent={agent.color}
                  stats={[
                    {
                      label: "Commits",
                      value: project.activeRun.mergedCommits24h,
                      max: 12,
                    },
                    {
                      label: "Tasks",
                      value: project.activeRun.completedTasks24h,
                      max: 8,
                    },
                    {
                      label: "Deploys",
                      value: project.activeRun.successfulDeploys24h,
                      max: 6,
                    },
                    {
                      label: "Progress",
                      value: Math.round(progress),
                      max: 100,
                    },
                  ]}
                />
                <div className="ui-browser-module">
                  <p className="ui-kicker">Latest deployment</p>
                  {project.deployments[0] ? (
                    <>
                      <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                        {project.deployments[0].screenshotLabel}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        {project.deployments[0].status} on {project.deployments[0].branch}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="ui-browser-stat">
                          <span className="ui-stat-label">SHA</span>
                          <span className="ui-browser-stat-value">
                            {project.deployments[0].sha}
                          </span>
                        </div>
                        <div className="ui-browser-stat">
                          <span className="ui-stat-label">Duration</span>
                          <span className="ui-browser-stat-value">
                            {project.deployments[0].durationSeconds}s
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                      Deployment data will fill in as the lane keeps shipping.
                    </p>
                  )}
                </div>
              </div>

              <div className="ui-chip-stack">
                {project.previewHighlights.slice(0, 4).map((highlight) => (
                  <span key={highlight} className="ui-browser-tag">
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="mt-6">
          <div className="ui-section-nav">
            <Link href="#preview-cockpit" className="ui-section-pill">
              Preview
            </Link>
            <Link href="#runtime-loop" className="ui-section-pill">
              Runtime
            </Link>
            <Link href="#evidence-pack" className="ui-section-pill">
              Evidence
            </Link>
            <Link href="#token-track" className="ui-section-pill">
              Token track
            </Link>
          </div>
        </section>

        <section id="runtime-loop" className="mt-6 grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
          <BotTerminalCard
            label={`${agent.displayName} runtime`}
            projectName={project.name}
            phase={project.activeRun.phase}
            status={project.activeRun.outcome}
            objective={project.activeRun.objective}
            lines={project.activeRun.terminal}
            highlights={project.previewHighlights}
            stats={[
              { label: "commits", value: project.activeRun.mergedCommits24h, max: 12 },
              { label: "tasks", value: project.activeRun.completedTasks24h, max: 8 },
              { label: "deploys", value: project.activeRun.successfulDeploys24h, max: 6 },
            ]}
          />

          <article className="ui-board reveal-up reveal-delay-1 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">Roadmap timeline</p>
                <h2 className="ui-title mt-3 text-3xl">Build path</h2>
              </div>
              <span className="ui-chip">{doneCount} done</span>
            </div>

            <div className="ui-timeline mt-6">
              {project.roadmap.map((item, index) => (
                <article
                  key={item.id}
                  className="ui-timeline-item reveal-up"
                  style={{ animationDelay: `${0.07 * (index + 1)}s` }}
                >
                  <span
                    className={`ui-timeline-node ${item.status === "done" ? "" : item.status === "active" ? "" : "ui-timeline-node-muted"}`}
                  />
                  <div className="ui-feed-row">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-base font-semibold text-[color:var(--foreground)]">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="ui-chip !bg-[color:var(--surface-soft)]">
                          {item.status}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                          {item.etaHours}h
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                      {item.detail}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section id="evidence-pack" className="mt-6 grid gap-4 xl:grid-cols-[1.04fr_0.96fr]">
          <div className="grid gap-4">
            <article className="ui-panel reveal-up reveal-delay-1 rounded-[2rem] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="ui-kicker">Deployments</p>
                  <h2 className="ui-title mt-3 text-3xl">Preview rail</h2>
                </div>
                <span className="ui-chip">{project.deployments.length} logged</span>
              </div>

              <div className="mt-6 ui-track-grid">
                <article className="ui-track-card">
                  <p className="ui-stat-label">Deployments</p>
                  <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                    {project.deployments.length}
                  </p>
                </article>
                <article className="ui-track-card">
                  <p className="ui-stat-label">Average time</p>
                  <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                    {averageDeployTime || 0}s
                  </p>
                </article>
                <article className="ui-track-card">
                  <p className="ui-stat-label">Latest phase</p>
                  <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                    {project.activeRun.phase}
                  </p>
                </article>
                <article className="ui-track-card">
                  <p className="ui-stat-label">Preview rail</p>
                  <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                    live
                  </p>
                </article>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {project.deployments.map((deployment) => (
                  <Link
                    key={deployment.id}
                    href={deployment.previewUrl}
                    className="ui-browser overflow-hidden rounded-[1.35rem]"
                  >
                    <div className="ui-browser-toolbar">
                      <div className="ui-browser-traffic">
                        <span className="bg-[#ff5f57]" />
                        <span className="bg-[#febc2e]" />
                        <span className="bg-[color:var(--accent)]" />
                      </div>
                      <div className="ui-browser-address">{deployment.branch}</div>
                      <span className="ui-chip">{deployment.status}</span>
                    </div>
                    <div className="ui-browser-screen">
                      <div className="ui-browser-module ui-browser-module-soft">
                        <p className="ui-kicker">{deployment.sha}</p>
                        <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                          {deployment.screenshotLabel}
                        </p>
                        <div className="ui-signal-grid mt-4">
                          {Array.from({ length: 6 }, (_, index) => (
                            <span
                              key={`${deployment.id}-${index}`}
                              className="ui-signal-cell"
                              style={{
                                opacity: 0.28 + ((index + 1) / 8),
                                animationDelay: `${index * 0.07}s`,
                              }}
                            />
                          ))}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="ui-browser-stat">
                            <span className="ui-stat-label">Duration</span>
                            <span className="ui-browser-stat-value">
                              {deployment.durationSeconds}s
                            </span>
                          </div>
                          <div className="ui-browser-stat">
                            <span className="ui-stat-label">Logged</span>
                            <span className="ui-browser-stat-value">
                              {formatRelativeTime(deployment.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </article>

            <article className="ui-panel reveal-up reveal-delay-2 rounded-[2rem] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="ui-kicker">Artifacts</p>
                  <h2 className="ui-title mt-3 text-3xl">Proof pack</h2>
                </div>
                <span className="ui-chip">{project.artifacts.length} files</span>
              </div>

              <div className="mt-6 ui-track-grid">
                {[
                  {
                    label: "Artifacts",
                    value: project.artifacts.length,
                    detail: "captured outputs",
                  },
                  {
                    label: "Latest",
                    value: project.artifacts[0]?.type ?? "none",
                    detail: "most recent type",
                  },
                  {
                    label: "Roadmap",
                    value: `${doneCount}/${project.roadmap.length}`,
                    detail: "milestones done",
                  },
                  {
                    label: "Live feed",
                    value: project.feed.length,
                    detail: "recent project events",
                  },
                ].map((item) => (
                  <article key={item.label} className="ui-track-card">
                    <p className="ui-stat-label">{item.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                      {item.value}
                    </p>
                    <p className="text-sm text-[color:var(--muted)]">{item.detail}</p>
                  </article>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {project.artifacts.slice(0, 4).map((artifact) => (
                  <Link key={artifact.id} href={artifact.url} className="ui-feed-row">
                    <div className="flex items-center justify-between gap-4">
                      <span className="ui-browser-tag">{artifact.type}</span>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        {formatRelativeTime(artifact.createdAt)}
                      </span>
                    </div>
                    <p className="mt-4 text-base font-semibold text-[color:var(--foreground)]">
                      {artifact.label}
                    </p>
                    <p className="ui-command mt-4">artifact://{artifact.type}</p>
                  </Link>
                ))}
              </div>
            </article>
          </div>

          <div className="grid gap-4">
            <article className="ui-board reveal-up reveal-delay-1 rounded-[2rem] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="ui-kicker">Autonomous stack</p>
                  <h2 className="ui-title mt-3 text-3xl">
                    {getRuntimeFabricLabel(project.infrastructure.status)}
                  </h2>
                </div>
                <span className="ui-chip">autonomous</span>
              </div>

              <div className="mt-6 ui-track-grid">
                <article className="ui-track-card">
                  <p className="ui-stat-label">Code rail</p>
                  <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                    {project.infrastructure.githubRepoFullName ?? "managed sync"}
                  </p>
                </article>
                <article className="ui-track-card">
                  <p className="ui-stat-label">Preview rail</p>
                  <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                    {project.infrastructure.vercelProjectName ?? "live preview routing"}
                  </p>
                </article>
                <article className="ui-track-card">
                  <p className="ui-stat-label">Release path</p>
                  <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                    {project.infrastructure.vercelDeployHookUrl ? "armed" : "warming up"}
                  </p>
                </article>
                <article className="ui-track-card">
                  <p className="ui-stat-label">Notes</p>
                  <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                    {project.infrastructure.notes.length}
                  </p>
                </article>
              </div>

              {project.infrastructure.notes.length > 0 ? (
                <div className="ui-chip-stack mt-6">
                  {project.infrastructure.notes.map((note) => (
                    <span key={note} className="ui-browser-tag">
                      {note}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>

            <article
              id="token-track"
              className="ui-board reveal-up reveal-delay-2 rounded-[2rem] p-6 sm:p-8"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="ui-kicker">{isProjectLive(project) ? "Token response" : "Token launch"}</p>
                  <h2 className="ui-title mt-3 text-3xl">{project.token.symbol}</h2>
                </div>
                <Link
                  href={`/token/${project.token.mint}`}
                  className="ui-button-secondary !px-4 !py-2"
                >
                  {isProjectLive(project) ? "Token detail" : "Token path"}
                </Link>
              </div>

              {isProjectLive(project) ? (
                <>
                  <Sparkline
                    values={project.token.performance.sparkline}
                    stroke="var(--accent-strong)"
                    className="mt-6 h-24"
                  />
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="ui-stat">
                      <p className="ui-stat-label">Market cap</p>
                      <p className="ui-stat-value">
                        {formatUsd(project.token.performance.marketCap)}
                      </p>
                    </div>
                    <div className="ui-stat">
                      <p className="ui-stat-label">Lifetime fees</p>
                      <p className="ui-stat-value">
                        {formatUsd(project.token.performance.lifetimeFees)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="ui-stat">
                    <p className="ui-stat-label">Launch name</p>
                    <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                      {project.token.name}
                    </p>
                  </div>
                  <div className="ui-stat">
                    <p className="ui-stat-label">Creator wallet</p>
                    <p className="mt-2 break-all text-sm text-[color:var(--foreground)]">
                      {project.token.creatorWallet}
                    </p>
                  </div>
                  <div className="ui-stat">
                    <p className="ui-stat-label">Fee share path</p>
                    <p className="mt-2 break-all text-sm text-[color:var(--foreground)]">
                      {project.token.partnerKey}
                    </p>
                  </div>
                  <div className="ui-stat">
                    <p className="ui-stat-label">Roadmap done</p>
                    <p className="ui-stat-value">
                      {doneCount}/{project.roadmap.length}
                    </p>
                  </div>
                </div>
              )}
            </article>

            <article className="ui-panel reveal-up reveal-delay-3 rounded-[2rem] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="ui-kicker">Live project feed</p>
                  <h2 className="ui-title mt-3 text-3xl">Project pulse</h2>
                </div>
                <span className="ui-chip">SSE</span>
              </div>
              <div className="mt-6">
                <ProjectFeed
                  endpoint={`/api/stream/project/${project.slug}`}
                  initialEvents={project.feed}
                />
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
