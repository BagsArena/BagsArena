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
        setStatus(
          `Provisioned remotes for ${payload.projects.length} projects.`,
        );
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
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
              Operator rail
            </p>
            <h2 className="font-display text-2xl text-white">
              Season and launch controls
            </h2>
          </div>
          <button
            type="button"
            onClick={handleSeasonReset}
            className="rounded-full border border-orange-300/35 bg-orange-500/10 px-4 py-2 text-sm text-orange-100 transition hover:bg-orange-500/20"
          >
            Refresh season state
          </button>
        </div>
        <div className="mb-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleHouseLeagueCycle}
            className="rounded-full border border-fuchsia-300/35 bg-fuchsia-500/10 px-4 py-2 text-sm text-fuchsia-100 transition hover:bg-fuchsia-500/20"
          >
            Run all four house agents
          </button>
          <button
            type="button"
            onClick={handleHouseLeagueProvision}
            className="rounded-full border border-amber-300/35 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-500/20"
          >
            Provision all remotes
          </button>
          <button
            type="button"
            onClick={handleHouseLeagueMetricsRefresh}
            className="rounded-full border border-emerald-300/35 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/20"
          >
            Refresh all token metrics
          </button>
        </div>
        <div className="mb-5 rounded-3xl border border-white/8 bg-black/20 p-4">
          <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-zinc-500">
            Admin token
          </label>
          <input
            type="password"
            value={adminToken}
            onChange={(event) => handleAdminTokenChange(event.target.value)}
            placeholder="Optional unless ARENA_ADMIN_TOKEN is set"
            className="w-full rounded-2xl border border-white/10 bg-[#040815] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-300/50"
          />
        </div>
        <div className="space-y-4">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-3xl border border-white/8 bg-black/20 p-5"
            >
              <div className="mb-2 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl text-white">
                    {project.name}
                  </h3>
                  <p className="text-sm text-zinc-400">{project.thesis}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Infra {project.infrastructure.status}
                  </p>
                </div>
                <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-zinc-400">
                  {project.launchStatus}
                </div>
              </div>
              {project.infrastructure.notes.length > 0 ? (
                <p className="mb-3 text-sm text-zinc-500">
                  {project.infrastructure.notes[0]}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleProjectProvision(project.id)}
                  className="rounded-full border border-amber-300/35 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-500/20"
                >
                  Provision remotes
                </button>
                <button
                  type="button"
                  onClick={() => handleProjectCycle(project.id)}
                  className="rounded-full border border-fuchsia-300/35 bg-fuchsia-500/10 px-4 py-2 text-sm text-fuchsia-100 transition hover:bg-fuchsia-500/20"
                >
                  Run autonomous cycle
                </button>
                <button
                  type="button"
                  onClick={() => handleProjectMetricsRefresh(project.id)}
                  className="rounded-full border border-emerald-300/35 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/20"
                >
                  Refresh token metrics
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunch(project.id)}
                  className="rounded-full border border-cyan-300/35 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
                >
                  Approve mainnet launch
                </button>
                <button
                  type="button"
                  onClick={() => handleRetry(project.activeRun.id)}
                  className="rounded-full border border-sky-300/35 bg-sky-500/10 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-500/20"
                >
                  Retry build cycle
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-black/25 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
          Response log
        </p>
        <h2 className="mb-4 font-display text-2xl text-white">Console status</h2>
        <div className="rounded-3xl border border-white/8 bg-[#040815] p-5 font-mono text-sm leading-6 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
          {status}
        </div>
      </section>
    </div>
  );
}
