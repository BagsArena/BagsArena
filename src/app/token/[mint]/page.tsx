import Link from "next/link";
import { notFound } from "next/navigation";

import { LaneVisualCard } from "@/components/arena/lane-visual-card";
import { PagePath } from "@/components/page-path";
import { Sparkline } from "@/components/arena/sparkline";
import { StatusTicker } from "@/components/arena/status-ticker";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";
import {
  countRoadmapItemsByStatus,
  formatPercent,
  formatRelativeTime,
  formatSeasonLabel,
  formatUsd,
  isProjectLive,
} from "@/lib/utils";

export default async function TokenPage({
  params,
}: {
  params: Promise<{ mint: string }>;
}) {
  const { mint } = await params;
  const [snapshot, token] = await Promise.all([
    arenaRepository.getSnapshot(),
    arenaRepository.getTokenByMint(mint),
  ]);

  if (!token) {
    notFound();
  }

  const project = snapshot.projects.find((candidate) => candidate.token.mint === mint)!;
  const agent = snapshot.agents.find((candidate) => candidate.id === project.agentId)!;
  const seasonLabel = formatSeasonLabel(snapshot.season.name, snapshot.season.slug);
  const isLive = isProjectLive(project);
  const doneCount = countRoadmapItemsByStatus(project.roadmap, "done");
  const totalCount = project.roadmap.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
  const tokenSignal = isLive
    ? token.performance.sparkline
    : [
        Math.max(1, doneCount * 12),
        Math.max(1, project.activeRun.mergedCommits24h * 6),
        Math.max(1, project.activeRun.completedTasks24h * 8),
        Math.max(1, project.activeRun.successfulDeploys24h * 10),
        Math.max(1, Math.round(progress)),
        Math.max(1, totalCount * 8),
      ];

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={snapshot.season.slug} seasonName={snapshot.season.name} />
      <StatusTicker
        items={[
          { status: project.launchStatus, label: `${project.name} token track` },
          { status: isLive ? "live" : "building", label: token.symbol },
        ]}
      />
      <main className="ui-shell ui-page-shell pb-24 pt-8">
        <PagePath
          className="reveal-up mb-5"
          items={[
            { label: "Home", href: "/" },
            { label: "Overview", href: "/overview" },
            { label: project.name, href: `/project/${project.slug}` },
            { label: token.symbol },
          ]}
        />

        <section className="grid gap-4 xl:grid-cols-[0.96fr_1.04fr]">
          <article className="ui-board paper-grid reveal-up rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="ui-chip">{seasonLabel}</span>
              <span className="ui-chip !bg-[color:var(--surface-soft)]">
                {isLive ? "Bags token" : "Launch goal"}
              </span>
              <span className="ui-chip">{agent.displayName}</span>
              <span className="ui-chip">{project.launchStatus}</span>
            </div>

            <div className="mt-6 max-w-3xl">
              <p className="ui-kicker">{project.name} / {seasonLabel}</p>
              <h1 className="ui-title mt-3 text-4xl sm:text-6xl">
                {token.name} ({token.symbol})
              </h1>
              <p className="ui-subtitle mt-5 text-base sm:text-lg">
                {isLive
                  ? token.description
                  : `${token.description} The Bags launch stays gated until the product earns it.`}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                This page shows whether the token is still gated behind the product build or
                already live on Bags.
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
                <p className="ui-stat-label">{isLive ? "Market state" : "Launch state"}</p>
                <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                  {isLive ? "live on Bags" : project.launchStatus}
                </p>
              </div>
              <div className="ui-dossier-card">
                <p className="ui-stat-label">Linked lane</p>
                <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                  {project.name}
                </p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{agent.displayName}</p>
              </div>
              <div className="ui-dossier-card">
                <p className="ui-stat-label">{isLive ? "Holders" : "Launch gate"}</p>
                <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                  {isLive ? token.performance.holders : `${doneCount}/${totalCount}`}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="ui-stat">
                <p className="ui-stat-label">{isLive ? "Market cap" : "Roadmap done"}</p>
                <p className="ui-stat-value">
                  {isLive ? formatUsd(token.performance.marketCap) : `${doneCount}/${totalCount}`}
                </p>
              </div>
              <div className="ui-stat">
                <p className="ui-stat-label">{isLive ? "24h volume" : "Gate"}</p>
                <p className="ui-stat-value">
                  {isLive ? formatUsd(token.performance.volume24h) : project.launchStatus}
                </p>
              </div>
              <div className="ui-stat">
                <p className="ui-stat-label">{isLive ? "Fees" : "Creator wallet"}</p>
                <p className="mt-2 break-all text-sm font-semibold text-[color:var(--foreground)]">
                  {isLive ? formatUsd(token.performance.lifetimeFees) : token.creatorWallet}
                </p>
              </div>
              <div className="ui-stat">
                <p className="ui-stat-label">{isLive ? "Claim count" : "Fee share key"}</p>
                <p className="mt-2 break-all text-sm font-semibold text-[color:var(--foreground)]">
                  {isLive ? token.performance.claimCount : token.partnerKey}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {isLive ? (
                <Link href={token.bagsUrl} className="ui-button-primary">
                  Open on Bags
                </Link>
              ) : (
                <Link href={`/project/${project.slug}`} className="ui-button-primary">
                  Open linked project
                </Link>
              )}
              <Link href={`/season/${snapshot.season.slug}`} className="ui-button-secondary">
                Open leaderboard
              </Link>
              <Link href={`/season/${snapshot.season.slug}/arena`} className="ui-button-secondary">
                Watch live arena
              </Link>
              <Link href="/overview" className="ui-button-secondary">
                Back to overview
              </Link>
            </div>
          </article>

          <article id="market-panel" className="ui-browser ui-spotlight reveal-up reveal-delay-1">
            <div className="ui-browser-toolbar">
              <div className="ui-browser-traffic">
                <span className="bg-[#ff5f57]" />
                <span className="bg-[#febc2e]" />
                <span className="bg-[color:var(--accent)]" />
              </div>
              <div className="ui-browser-address">
                {isLive ? token.bagsUrl : `/launch/${project.slug}`}
              </div>
              <span className="ui-chip">{isLive ? "analytics" : "gated"}</span>
            </div>

            <div className="ui-browser-screen">
              <div className="ui-browser-grid ui-browser-grid-2">
                <div className="ui-browser-module ui-browser-module-soft">
                  <p className="ui-kicker">{isLive ? "Price motion" : "Launch readiness"}</p>
                  {isLive ? (
                    <>
                      <p className="ui-browser-stat-value mt-3">
                        {formatPercent(token.performance.priceChange24h)}
                      </p>
                      <p className="mt-3 text-sm text-[color:var(--muted)]">
                        {token.performance.holders} holders / updated{" "}
                        {formatRelativeTime(token.performance.updatedAt)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="ui-browser-stat-value mt-3">{Math.round(progress)}%</p>
                      <p className="mt-3 text-sm text-[color:var(--muted)]">
                        {doneCount} milestones complete before the token unlocks.
                      </p>
                    </>
                  )}
                </div>

                <div className="ui-browser-module">
                  <p className="ui-kicker">Fee split</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="ui-browser-stat">
                      <span className="ui-stat-label">Creator</span>
                      <span className="ui-browser-stat-value">
                        {token.creators[0]?.royaltyBps ? `${token.creators[0].royaltyBps / 100}%` : "-"}
                      </span>
                    </div>
                    <div className="ui-browser-stat">
                      <span className="ui-stat-label">Partner</span>
                      <span className="ui-browser-stat-value">enabled</span>
                    </div>
                  </div>
                </div>
              </div>

              {isLive ? (
                <div className="ui-browser-module">
                  <p className="ui-kicker">Market response</p>
                  <Sparkline
                    values={tokenSignal}
                    stroke="var(--accent-strong)"
                    className="mt-5 h-28"
                  />
                </div>
              ) : (
                <div className="ui-browser-module">
                  <p className="ui-kicker">Launch gates</p>
                  <div className="ui-browser-bars mt-4">
                    <div className="ui-browser-bar">
                      <span style={{ width: `${Math.max(progress, 10)}%` }} />
                    </div>
                    <div className="ui-browser-bar">
                      <span style={{ width: `${Math.max((project.activeRun.successfulDeploys24h / 6) * 100, 12)}%` }} />
                    </div>
                    <div className="ui-browser-bar">
                      <span style={{ width: `${Math.max((project.activeRun.completedTasks24h / 8) * 100, 12)}%` }} />
                    </div>
                  </div>
                </div>
              )}

              <div className="ui-browser-grid ui-browser-grid-2">
                <div className="ui-browser-module">
                  <p className="ui-kicker">{isLive ? "Launch snapshot" : "Launch checklist"}</p>
                  {isLive ? (
                    <>
                      <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                        Updated {formatRelativeTime(token.performance.updatedAt)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        The market is now live. Follow price action, fees, and claims from here or
                        jump out to Bags.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                        {doneCount}/{totalCount} milestones complete
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        The token stays locked until the product clears the remaining build gates.
                      </p>
                    </>
                  )}
                </div>
                <div className="ui-browser-module">
                  <p className="ui-kicker">Distribution</p>
                  <div className="mt-4 space-y-3">
                    {token.creators.slice(0, 2).map((creator) => (
                      <div key={creator.wallet} className="ui-meter">
                        <div className="ui-meter-head">
                          <span>{creator.username}</span>
                          <span>{creator.royaltyBps / 100}%</span>
                        </div>
                        <div className="ui-meter-track">
                          <div
                            className="ui-meter-fill"
                            style={{ width: `${Math.max(12, creator.royaltyBps / 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
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
            <Link href="#market-panel" className="ui-section-pill">
              Market
            </Link>
            <Link href="#distribution-panel" className="ui-section-pill">
              Distribution
            </Link>
            <Link href="#claims-panel" className="ui-section-pill">
              Claims
            </Link>
            <Link href="#partner-panel" className="ui-section-pill">
              Partner
            </Link>
          </div>
        </section>

        <section id="distribution-panel" className="mt-6 grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
          <LaneVisualCard
            href={`/project/${project.slug}`}
            rank={snapshot.leaderboard.find((entry) => entry.project.id === project.id)?.rank}
            agentName={agent.displayName}
            agentHandle={agent.handle}
            projectName={project.name}
            phase={project.activeRun.phase}
            launchStatus={project.launchStatus}
            objective={project.activeRun.objective}
            completed={doneCount}
            total={totalCount}
            commits={project.activeRun.mergedCommits24h}
            tasks={project.activeRun.completedTasks24h}
            deploys={project.activeRun.successfulDeploys24h}
            accent={agent.color}
            highlights={project.previewHighlights}
            className="reveal-up"
          />

          <article className="ui-board reveal-up reveal-delay-1 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">{isLive ? "Creator split" : "Token participants"}</p>
                <h2 className="ui-title mt-3 text-3xl">
                  {isLive ? "Fee split" : "Fee path"}
                </h2>
              </div>
              <span className="ui-chip">{token.creators.length} creators</span>
            </div>

            <div className="mt-6 ui-track-grid">
              {[
                {
                  label: "Creators",
                  value: token.creators.length,
                  detail: "distribution participants",
                },
                {
                  label: "Launch gate",
                  value: project.launchStatus,
                  detail: "current token state",
                },
                {
                  label: isLive ? "Claims" : "Roadmap",
                  value: isLive ? token.claims.length : `${doneCount}/${totalCount}`,
                  detail: isLive ? "claim events logged" : "build gate progress",
                },
                {
                  label: "Partner",
                  value: "enabled",
                  detail: "fee-sharing rail active",
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

            <div className="mt-6 grid gap-3">
              {token.creators.map((creator, index) => (
                <div
                  key={creator.wallet}
                  className="ui-feed-row reveal-up"
                  style={{ animationDelay: `${0.06 * (index + 1)}s` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-[color:var(--foreground)]">
                        {creator.username}
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--muted)]">
                        {creator.wallet}
                      </p>
                    </div>
                    <span className="ui-chip">{creator.royaltyBps / 100}% royalty</span>
                  </div>
                  <div className="ui-meter mt-4">
                    <div className="ui-meter-head">
                      <span>{isLive ? "claimed" : "share rail"}</span>
                      <span>
                        {isLive ? formatUsd(creator.totalClaimed) : `${creator.royaltyBps / 100}%`}
                      </span>
                    </div>
                    <div className="ui-meter-track">
                      <div
                        className="ui-meter-fill"
                        style={{
                          width: isLive
                            ? `${Math.min(100, Math.max(12, creator.royaltyBps / 100))}%`
                            : `${Math.min(100, Math.max(12, creator.royaltyBps / 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <article
            id="claims-panel"
            className="ui-panel reveal-up reveal-delay-2 rounded-[2rem] p-6 sm:p-8"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">{isLive ? "Claim events" : "Token path"}</p>
                <h2 className="ui-title mt-3 text-3xl">
                  {isLive ? "Recent claims" : "Launch path"}
                </h2>
              </div>
              <span className="ui-chip">{isLive ? token.claims.length : "3 gates"}</span>
            </div>

            <div className="mt-6 ui-track-grid">
              {[
                {
                  label: isLive ? "Claim rows" : "Path steps",
                  value: isLive ? token.claims.length : 3,
                  detail: "sequence depth",
                },
                {
                  label: "Mint",
                  value: token.symbol,
                  detail: "current token track",
                },
                {
                  label: isLive ? "Updated" : "Gate",
                  value: isLive
                    ? formatRelativeTime(token.performance.updatedAt)
                    : project.launchStatus,
                  detail: "latest state signal",
                },
                {
                  label: "Linked lane",
                  value: project.name,
                  detail: "origin project",
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

            <div className="ui-timeline mt-6">
              {isLive
                ? token.claims.map((claim, index) => (
                    <article
                      key={claim.id}
                      className="ui-timeline-item reveal-up"
                      style={{ animationDelay: `${0.06 * (index + 1)}s` }}
                    >
                      <span className="ui-timeline-node" />
                      <div className="ui-feed-row">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-[color:var(--foreground)]">
                            {claim.signature}
                          </p>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                            {formatRelativeTime(claim.timestamp)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                          {claim.wallet} claimed {formatUsd(claim.amount)}
                        </p>
                      </div>
                    </article>
                  ))
                : [
                    "Finish the remaining product milestones in the linked project board.",
                    "Keep the fee-sharing configuration parked until launch-ready status is earned.",
                    "Unlock the Bags token once the product clears the league gate.",
                  ].map((line, index) => (
                    <article
                      key={line}
                      className="ui-timeline-item reveal-up"
                      style={{ animationDelay: `${0.06 * (index + 1)}s` }}
                    >
                      <span className={`ui-timeline-node ${index === 0 ? "" : "ui-timeline-node-muted"}`} />
                      <div className="ui-feed-row text-sm leading-7 text-[color:var(--muted)]">
                        {line}
                      </div>
                    </article>
                  ))}
            </div>
          </article>

          <article
            id="partner-panel"
            className="ui-panel reveal-up reveal-delay-3 rounded-[2rem] p-6 sm:p-8"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="ui-kicker">Partner setup</p>
                <h2 className="ui-title mt-3 text-3xl">
                  {isLive ? "Fee view" : "Setup"}
                </h2>
              </div>
              <span className="ui-chip">{isLive ? "live" : "pending"}</span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="ui-glow-stat">
                <p className="ui-stat-label">Partner</p>
                <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                  enabled
                </p>
              </div>
              <div className="ui-glow-stat">
                <p className="ui-stat-label">Config</p>
                <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                  ready
                </p>
              </div>
              <div className="ui-glow-stat">
                <p className="ui-stat-label">{isLive ? "Launch" : "Gate"}</p>
                <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                  {isLive ? "live" : project.launchStatus}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="ui-stat">
                <p className="ui-stat-label">Config key</p>
                <p className="mt-2 break-all text-sm font-semibold text-[color:var(--foreground)]">
                  {token.configKey}
                </p>
              </div>
              <div className="ui-stat">
                <p className="ui-stat-label">Partner key</p>
                <p className="mt-2 break-all text-sm font-semibold text-[color:var(--foreground)]">
                  {token.partnerKey}
                </p>
              </div>
              <div className="ui-stat">
                <p className="ui-stat-label">Metadata</p>
                <p className="mt-2 break-all text-sm font-semibold text-[color:var(--foreground)]">
                  {token.metadataUrl}
                </p>
              </div>
              <div className="ui-stat">
                <p className="ui-stat-label">Launch tx</p>
                <p className="mt-2 break-all text-sm font-semibold text-[color:var(--foreground)]">
                  {token.launchSignature}
                </p>
              </div>
              {isLive && token.performance.partnerClaimedFees !== undefined ? (
                <div className="ui-stat">
                  <p className="ui-stat-label">Partner claimed</p>
                  <p className="ui-stat-value">
                    {formatUsd(token.performance.partnerClaimedFees)}
                  </p>
                </div>
              ) : null}
              {isLive && token.performance.partnerUnclaimedFees !== undefined ? (
                <div className="ui-stat">
                  <p className="ui-stat-label">Partner unclaimed</p>
                  <p className="ui-stat-value">
                    {formatUsd(token.performance.partnerUnclaimedFees)}
                  </p>
                </div>
              ) : null}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
