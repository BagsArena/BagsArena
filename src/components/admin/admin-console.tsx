"use client";

import { startTransition, useState } from "react";

import type { Project, Season } from "@/lib/arena/types";

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
  const [status, setStatus] = useState<string>("No actions yet.");
  const [adminToken, setAdminToken] = useState(
    () =>
      (typeof window !== "undefined"
        ? window.localStorage.getItem("arena-admin-token")
        : "") ?? "",
  );

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
        setStatus(`Season API responded with ${payload.season.status}.`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Season update failed.");
      }
    });
  }

  function handleLaunch(projectId: string) {
    startTransition(async () => {
      try {
        const payload = await postJson(`/api/admin/projects/${projectId}/launch`, {
          projectId,
        });
        setStatus(
          `Launch approved for ${payload.project.name} using ${payload.mode} mode.`,
        );
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Launch approval failed.");
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
          setStatus(`Project cycle queued as job ${payload.queuedJobId}.`);
          return;
        }

        setStatus(
          `Cycle completed for ${payload.project.name} with run ${payload.project.activeRun.id}.`,
        );
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "Project cycle failed.",
        );
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
          setStatus(`House league cycle queued as job ${payload.queuedJobId}.`);
          return;
        }

        setStatus(
          `House league cycle completed for ${payload.projects.length} projects.`,
        );
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "House league cycle failed.",
        );
      }
    });
  }

  function handleProjectProvision(projectId: string) {
    startTransition(async () => {
      try {
        const payload = await postJson(`/api/admin/projects/${projectId}/provision`, {
          projectId,
        });
        setStatus(
          `Provisioned remotes for ${payload.project.name} (${payload.project.infrastructure.status}).`,
        );
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "Project provisioning failed.",
        );
      }
    });
  }

  function handleHouseLeagueProvision() {
    startTransition(async () => {
      try {
        const payload = await postJson("/api/admin/provision", {
          scope: "house-league",
        });
        setStatus(`Provisioned remotes for ${payload.projects.length} projects.`);
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "House league provisioning failed.",
        );
      }
    });
  }

  function handleProjectMetricsRefresh(projectId: string) {
    startTransition(async () => {
      try {
        const payload = await postJson(`/api/admin/projects/${projectId}/metrics`, {
          projectId,
        });
        setStatus(
          `Refreshed token analytics for ${payload.project.name} from ${payload.source}.`,
        );
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "Project metric refresh failed.",
        );
      }
    });
  }

  function handleHouseLeagueMetricsRefresh() {
    startTransition(async () => {
      try {
        const payload = await postJson("/api/admin/metrics", {
          scope: "house-league",
        });
        setStatus(
          `Refreshed token analytics for ${payload.projects.length} projects from ${payload.source}.`,
        );
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "House league metric refresh failed.",
        );
      }
    });
  }

  function handleRetry(runId: string) {
    startTransition(async () => {
      try {
        const payload = await postJson(`/api/admin/runs/${runId}/retry`, { runId });
        setStatus(`Run ${payload.run.id} has been queued for retry.`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Retry failed.");
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="ui-panel reveal-up reveal-delay-1 rounded-[2rem] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="ui-kicker">Operator rail</p>
            <h2 className="ui-title mt-3 text-3xl">Season and launch controls</h2>
          </div>
          <button type="button" onClick={handleSeasonReset} className="ui-button-secondary">
            Refresh season state
          </button>
        </div>
        <div className="mb-5 flex flex-wrap gap-3">
          <button type="button" onClick={handleHouseLeagueCycle} className="ui-button-primary">
            Run all four house agents
          </button>
          <button type="button" onClick={handleHouseLeagueProvision} className="ui-button-secondary">
            Provision all remotes
          </button>
          <button type="button" onClick={handleHouseLeagueMetricsRefresh} className="ui-button-secondary">
            Refresh all token metrics
          </button>
        </div>
        <div className="ui-stat mb-5">
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
        <div className="space-y-4">
          {projects.map((project, index) => (
            <article
              key={project.id}
              className="ui-stat hover-lift reveal-up"
              style={{ animationDelay: `${0.05 * (index + 1)}s` }}
            >
              <div className="mb-2 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-[color:var(--foreground)]">
                    {project.name}
                  </h3>
                  <p className="text-sm text-[color:var(--muted)]">{project.thesis}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    Infra {project.infrastructure.status}
                  </p>
                </div>
                <div className="ui-chip">{project.launchStatus}</div>
              </div>
              {project.infrastructure.notes.length > 0 ? (
                <p className="mb-3 text-sm text-[color:var(--muted)]">
                  {project.infrastructure.notes[0]}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => handleProjectProvision(project.id)} className="ui-button-soft">
                  Provision remotes
                </button>
                <button type="button" onClick={() => handleProjectCycle(project.id)} className="ui-button-soft">
                  Run autonomous cycle
                </button>
                <button type="button" onClick={() => handleProjectMetricsRefresh(project.id)} className="ui-button-soft">
                  Refresh token metrics
                </button>
                <button type="button" onClick={() => handleLaunch(project.id)} className="ui-button-soft">
                  Approve mainnet launch
                </button>
                <button type="button" onClick={() => handleRetry(project.activeRun.id)} className="ui-button-soft">
                  Retry build cycle
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ui-board reveal-up reveal-delay-2 rounded-[2rem] p-6">
        <p className="ui-kicker">Response log</p>
        <h2 className="ui-title mb-4 mt-3 text-3xl">Console status</h2>
        <div className="ui-code min-h-40 text-sm leading-6">{status}</div>
      </section>
    </div>
  );
}
