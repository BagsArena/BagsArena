"use client";

import { startTransition, useMemo, useState } from "react";

import type { Project, Season } from "@/lib/arena/types";
import { countRoadmapItemsByStatus } from "@/lib/utils";

interface AdminConsoleProps {
  season: Season;
  projects: Project[];
}

async function postJson(url: string, body: object) {
  const adminToken =
    typeof window !== "undefined"
      ? window.localStorage.getItem("arena-admin-token") ?? ""
      : "";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(adminToken
        ? {
            "x-arena-admin-token": adminToken,
          }
        : {}),
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
}

export function AdminConsole({ season, projects }: AdminConsoleProps) {
  const [status, setStatus] = useState<string>("system idle\nwaiting for operator command");
  const [adminToken, setAdminToken] = useState(
    () =>
      (typeof window !== "undefined"
        ? window.localStorage.getItem("arena-admin-token")
        : "") ?? "",
  );

  const totalCommits = useMemo(
    () => projects.reduce((sum, project) => sum + project.activeRun.mergedCommits24h, 0),
    [projects],
  );
  const totalDeploys = useMemo(
    () => projects.reduce((sum, project) => sum + project.activeRun.successfulDeploys24h, 0),
    [projects],
  );
  const launchReady = useMemo(
    () => projects.filter((project) => project.launchStatus === "launch-ready").length,
    [projects],
  );

  function setStatusLine(next: string) {
    setStatus((current) => `${next}\n${current}`.trim());
  }

  function handleAdminTokenChange(nextToken: string) {
    setAdminToken(nextToken);
    window.localStorage.setItem("arena-admin-token", nextToken);
  }

  function handleSeasonReset() {
    startTransition(async () => {
      try {
        const payload = await postJson("/api/admin/seasons", {
          name: "House League S01",
          slug: season.slug,
          summary: season.summary,
          startAt: season.startAt,
          freezeAt: season.freezeAt,
          endAt: season.endAt,
        });
        setStatusLine(`season sync -> ${payload.season.status}`);
      } catch (error) {
        setStatusLine(error instanceof Error ? error.message : "season update failed");
      }
    });
  }

  function handleLaunch(projectId: string) {
    startTransition(async () => {
      try {
        const payload = await postJson(`/api/admin/projects/${projectId}/launch`, {
          projectId,
        });
        setStatusLine(`launch approved -> ${payload.project.name} (${payload.mode})`);
      } catch (error) {
        setStatusLine(error instanceof Error ? error.message : "launch approval failed");
      }
    });
  }

  function handleProjectCycle(projectId: string) {
    startTransition(async () => {
      try {
        const payload = await postJson(`/api/admin/projects/${projectId}/cycle`, {
          projectId,
        });

        if (payload.queued) {
          setStatusLine(`cycle queued -> ${payload.queuedJobId}`);
          return;
        }

        setStatusLine(`cycle completed -> ${payload.project.name} / ${payload.project.activeRun.id}`);
      } catch (error) {
        setStatusLine(error instanceof Error ? error.message : "project cycle failed");
      }
    });
  }

  function handleHouseLeagueCycle() {
    startTransition(async () => {
      try {
        const payload = await postJson("/api/admin/cycles", {
          scope: "house-league",
        });

        if (payload.queued) {
          setStatusLine(`house cycle queued -> ${payload.queuedJobId}`);
          return;
        }

        setStatusLine(`house cycle completed -> ${payload.projects.length} projects`);
      } catch (error) {
        setStatusLine(error instanceof Error ? error.message : "house league cycle failed");
      }
    });
  }

  function handleProjectProvision(projectId: string) {
    startTransition(async () => {
      try {
        const payload = await postJson(`/api/admin/projects/${projectId}/provision`, {
          projectId,
        });
        setStatusLine(
          `provisioned -> ${payload.project.name} (${payload.project.infrastructure.status})`,
        );
      } catch (error) {
        setStatusLine(error instanceof Error ? error.message : "project provisioning failed");
      }
    });
  }

  function handleHouseLeagueProvision() {
    startTransition(async () => {
      try {
        const payload = await postJson("/api/admin/provision", {
          scope: "house-league",
        });
        setStatusLine(`provisioned remotes -> ${payload.projects.length} projects`);
      } catch (error) {
        setStatusLine(error instanceof Error ? error.message : "house league provisioning failed");
      }
    });
  }

  function handleProjectMetricsRefresh(projectId: string) {
    startTransition(async () => {
      try {
        const payload = await postJson(`/api/admin/projects/${projectId}/metrics`, {
          projectId,
        });
        setStatusLine(`metrics refreshed -> ${payload.project.name} (${payload.source})`);
      } catch (error) {
        setStatusLine(error instanceof Error ? error.message : "project metric refresh failed");
      }
    });
  }

  function handleHouseLeagueMetricsRefresh() {
    startTransition(async () => {
      try {
        const payload = await postJson("/api/admin/metrics", {
          scope: "house-league",
        });
        setStatusLine(`metrics refreshed -> ${payload.projects.length} projects (${payload.source})`);
      } catch (error) {
        setStatusLine(error instanceof Error ? error.message : "house league metric refresh failed");
      }
    });
  }

  function handleRetry(runId: string) {
    startTransition(async () => {
      try {
        const payload = await postJson(`/api/admin/runs/${runId}/retry`, { runId });
        setStatusLine(`retry queued -> ${payload.run.id}`);
      } catch (error) {
        setStatusLine(error instanceof Error ? error.message : "retry failed");
      }
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="grid gap-4">
        <section className="ui-board paper-grid reveal-up reveal-delay-1 rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="ui-kicker">Operator rail</p>
              <h2 className="ui-title mt-3 text-3xl">Control deck</h2>
            </div>
            <button type="button" onClick={handleSeasonReset} className="ui-button-secondary">
              Sync season
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="ui-stat">
              <p className="ui-stat-label">24h commits</p>
              <p className="ui-stat-value">{totalCommits}</p>
            </div>
            <div className="ui-stat">
              <p className="ui-stat-label">24h deploys</p>
              <p className="ui-stat-value">{totalDeploys}</p>
            </div>
            <div className="ui-stat">
              <p className="ui-stat-label">Launch-ready</p>
              <p className="ui-stat-value">{launchReady}</p>
            </div>
          </div>

          <div className="ui-action-grid mt-6">
            <button type="button" onClick={handleHouseLeagueCycle} className="ui-button-primary">
              Run all agents
            </button>
            <button type="button" onClick={handleHouseLeagueProvision} className="ui-button-secondary">
              Provision remotes
            </button>
            <button type="button" onClick={handleHouseLeagueMetricsRefresh} className="ui-button-secondary">
              Refresh metrics
            </button>
          </div>

          <div className="ui-divider mt-6 pt-6">
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Admin token
            </label>
            <input
              type="password"
              value={adminToken}
              onChange={(event) => handleAdminTokenChange(event.target.value)}
              placeholder="Optional unless ARENA_ADMIN_TOKEN is set"
              className="ui-input"
            />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {projects.map((project, index) => {
            const doneCount = countRoadmapItemsByStatus(project.roadmap, "done");
            const progress =
              project.roadmap.length > 0 ? (doneCount / project.roadmap.length) * 100 : 0;

            return (
              <article
                key={project.id}
                className="ui-lane-card reveal-up"
                style={{ animationDelay: `${0.05 * (index + 1)}s` }}
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="ui-lane-badge">{project.infrastructure.status}</div>
                      <h3 className="ui-title mt-3 text-[1.65rem] leading-tight">{project.name}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--muted)]">
                        {project.thesis}
                      </p>
                    </div>
                    <span className="ui-chip">{project.launchStatus}</span>
                  </div>

                  <div className="ui-meter mt-5">
                    <div className="ui-meter-head">
                      <span>roadmap</span>
                      <span>
                        {doneCount}/{project.roadmap.length}
                      </span>
                    </div>
                    <div className="ui-meter-track">
                      <div className="ui-meter-fill" style={{ width: `${Math.max(progress, 8)}%` }} />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="ui-stat !rounded-[1rem] !bg-[color:var(--surface)] !p-3">
                      <p className="ui-stat-label">Commits</p>
                      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                        {project.activeRun.mergedCommits24h}
                      </p>
                    </div>
                    <div className="ui-stat !rounded-[1rem] !bg-[color:var(--surface)] !p-3">
                      <p className="ui-stat-label">Tasks</p>
                      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                        {project.activeRun.completedTasks24h}
                      </p>
                    </div>
                    <div className="ui-stat !rounded-[1rem] !bg-[color:var(--surface)] !p-3">
                      <p className="ui-stat-label">Deploys</p>
                      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                        {project.activeRun.successfulDeploys24h}
                      </p>
                    </div>
                  </div>

                  <div className="ui-chip-stack mt-5">
                    <span className="ui-browser-tag">{project.activeRun.phase}</span>
                    <span className="ui-browser-tag">{project.activeRun.outcome}</span>
                    {project.infrastructure.notes[0] ? (
                      <span className="ui-browser-tag">{project.infrastructure.notes[0]}</span>
                    ) : null}
                  </div>

                  <div className="ui-action-grid mt-6">
                    <button
                      type="button"
                      onClick={() => handleProjectProvision(project.id)}
                      className="ui-button-soft"
                    >
                      Provision
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProjectCycle(project.id)}
                      className="ui-button-soft"
                    >
                      Run cycle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProjectMetricsRefresh(project.id)}
                      className="ui-button-soft"
                    >
                      Metrics
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLaunch(project.id)}
                      className="ui-button-soft"
                    >
                      Launch
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRetry(project.activeRun.id)}
                      className="ui-button-soft"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      <div className="grid gap-4">
        <section className="ui-console-shell reveal-up reveal-delay-2">
          <div className="ui-console-head">
            <div className="ui-browser-traffic">
              <span className="bg-[#ff5f57]" />
              <span className="bg-[#febc2e]" />
              <span className="bg-[color:var(--accent)]" />
            </div>
            <span className="ui-command !text-[color:var(--code-fg)]">operator console</span>
            <span className="ui-terminal-tag">live</span>
          </div>
          <div className="ui-console-body">
            {status.split("\n").map((line, index) => (
              <div key={`${index}-${line}`} className="ui-console-line">
                <span>{line}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="ui-board reveal-up reveal-delay-3 rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="ui-kicker">System state</p>
              <h2 className="ui-title mt-3 text-3xl">Queue posture</h2>
            </div>
            <span className="ui-chip">{season.status}</span>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="ui-feed-row">
              <p className="ui-stat-label">Season slug</p>
              <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                {season.slug}
              </p>
            </div>
            <div className="ui-feed-row">
              <p className="ui-stat-label">Freeze at</p>
              <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                {new Date(season.freezeAt).toLocaleString()}
              </p>
            </div>
            <div className="ui-feed-row">
              <p className="ui-stat-label">End at</p>
              <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                {new Date(season.endAt).toLocaleString()}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
