import type { HouseAgent, Project, TaskStatus } from "@/lib/arena/types";

interface ManagedProjectState {
  project: Project;
  agent: HouseAgent;
}

function escapeMarkup(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderRoadmapBadge(status: TaskStatus) {
  if (status === "done") {
    return "Done";
  }

  if (status === "active") {
    return "Active";
  }

  return "Queued";
}

function renderPackageJson(project: Project) {
  return JSON.stringify(
    {
      name: project.slug,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        lint: "node scripts/lint.mjs",
        test: "node --test scripts/test.mjs",
        build: "node scripts/build.mjs",
      },
    },
    null,
    2,
  );
}

function renderReadme({ project, agent }: ManagedProjectState) {
  return `# ${project.name}

${project.thesis}

## Agent

- Name: ${agent.displayName}
- Handle: ${agent.handle}
- Persona: ${agent.persona}
- Model: ${agent.model}

## Product Thesis

${project.thesis}

## Launch Status

${project.launchStatus}

## Local Commands

\`\`\`bash
npm run lint
npm run test
npm run build
\`\`\`
`;
}

function renderChangelog(project: Project) {
  return `# Changelog

## ${new Date().toISOString()}

- Initialized managed workspace for ${project.name}.
`;
}

function renderStyles() {
  return `:root {
  color-scheme: dark;
  --bg: #081220;
  --panel: rgba(13, 20, 39, 0.88);
  --accent: #f97316;
  --accent-2: #fb7185;
  --text: #f7fafc;
  --muted: #9ca3af;
  --line: rgba(255, 255, 255, 0.12);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background:
    radial-gradient(circle at top, rgba(249, 115, 22, 0.24), transparent 28rem),
    linear-gradient(160deg, #040814 0%, #0a1324 100%);
  color: var(--text);
}

main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 48px 24px 72px;
}

.hero,
.panel {
  border: 1px solid var(--line);
  border-radius: 28px;
  background: var(--panel);
  backdrop-filter: blur(18px);
}

.hero {
  padding: 32px;
}

.hero-grid,
.grid {
  display: grid;
  gap: 20px;
}

.hero-grid {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.grid {
  margin-top: 24px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--muted);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  font-size: 12px;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  font-size: clamp(2.4rem, 6vw, 4.8rem);
  margin-bottom: 16px;
}

.lede {
  font-size: 1.1rem;
  line-height: 1.8;
  max-width: 56rem;
}

.stat {
  padding: 16px 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.stat-label {
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 11px;
}

.stat-value {
  font-size: 1.7rem;
  margin-top: 10px;
}

.panel {
  padding: 24px;
}

ul {
  padding-left: 18px;
  line-height: 1.8;
}

.roadmap-item {
  padding: 16px 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.roadmap-meta {
  color: var(--muted);
  font-size: 0.82rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.footer {
  margin-top: 24px;
  color: var(--muted);
  font-size: 0.92rem;
}
`;
}

function renderBuildScript() {
  return `import { promises as fs } from "node:fs";
import path from "node:path";

function escapeMarkup(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const root = process.cwd();
const data = JSON.parse(
  await fs.readFile(path.join(root, "data", "project.json"), "utf8"),
);
const changelog = await fs.readFile(path.join(root, "CHANGELOG.md"), "utf8");
const styles = await fs.readFile(path.join(root, "src", "styles.css"), "utf8");

const roadmap = data.roadmap
  .map(
    (item) => \`<div class="roadmap-item"><div class="roadmap-meta">\${escapeMarkup(item.status)} / ETA \${escapeMarkup(item.etaHours)}h</div><h3>\${escapeMarkup(item.title)}</h3><p>\${escapeMarkup(item.detail)}</p></div>\`,
  )
  .join("");

const highlights = data.previewHighlights
  .map((item) => \`<li>\${escapeMarkup(item)}</li>\`)
  .join("");

const terminal = data.activeRun.terminal
  .map((line) => \`<li>\${escapeMarkup(line)}</li>\`)
  .join("");

const html = \`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>\${escapeMarkup(data.name)}</title>
    <style>\${styles}</style>
  </head>
  <body>
    <main>
      <section class="hero">
        <p class="eyebrow">\${escapeMarkup(data.agent.displayName)} / \${escapeMarkup(data.category)}</p>
        <h1>\${escapeMarkup(data.name)}</h1>
        <p class="lede">\${escapeMarkup(data.thesis)}</p>
        <div class="hero-grid">
          <div class="stat">
            <div class="stat-label">Launch status</div>
            <div class="stat-value">\${escapeMarkup(data.launchStatus)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Token</div>
            <div class="stat-value">\${escapeMarkup(data.token.symbol)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Current objective</div>
            <div class="stat-value">\${escapeMarkup(data.activeRun.objective)}</div>
          </div>
        </div>
      </section>
      <div class="grid">
        <section class="panel">
          <p class="eyebrow">Highlights</p>
          <h2>What the agent just shipped</h2>
          <ul>\${highlights}</ul>
        </section>
        <section class="panel">
          <p class="eyebrow">Runtime</p>
          <h2>Latest terminal summary</h2>
          <ul>\${terminal}</ul>
        </section>
      </div>
      <section class="panel" style="margin-top: 24px;">
        <p class="eyebrow">Roadmap</p>
        <h2>Queued and active work</h2>
        <div class="grid">\${roadmap}</div>
      </section>
      <section class="panel" style="margin-top: 24px;">
        <p class="eyebrow">Changelog</p>
        <pre style="white-space: pre-wrap; line-height: 1.65; font-family: Consolas, monospace;">\${escapeMarkup(changelog)}</pre>
      </section>
      <p class="footer">Built by Bags Arena House League.</p>
    </main>
  </body>
</html>\`;

await fs.mkdir(path.join(root, "dist"), { recursive: true });
await fs.writeFile(path.join(root, "dist", "index.html"), html, "utf8");
await fs.writeFile(
  path.join(root, "dist", "summary.json"),
  JSON.stringify(
    {
      name: data.name,
      objective: data.activeRun.objective,
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
  "utf8",
);
console.log("Build complete for", data.name);
`;
}

function renderLintScript() {
  return `import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const data = JSON.parse(
  await fs.readFile(path.join(root, "data", "project.json"), "utf8"),
);

if (!data.name || !data.slug) {
  throw new Error("Project identity is incomplete.");
}

if (!Array.isArray(data.previewHighlights) || data.previewHighlights.length === 0) {
  throw new Error("Preview highlights must not be empty.");
}

if (!Array.isArray(data.roadmap) || data.roadmap.length === 0) {
  throw new Error("Roadmap must contain at least one item.");
}

const roadmapIds = new Set(data.roadmap.map((item) => item.id));
if (roadmapIds.size !== data.roadmap.length) {
  throw new Error("Roadmap ids must be unique.");
}

console.log("Lint clean for", data.name);
`;
}

function renderTestScript() {
  return `import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";

const data = JSON.parse(
  await fs.readFile(path.join(process.cwd(), "data", "project.json"), "utf8"),
);

test("project data exposes a live objective", () => {
  assert.equal(typeof data.activeRun.objective, "string");
  assert.ok(data.activeRun.objective.length > 10);
});

test("roadmap keeps at least one visible task", () => {
  const hasVisibleTask = data.roadmap.some(
    (item) => item.status === "active" || item.status === "queued",
  );

  assert.ok(
    hasVisibleTask || data.launchStatus === "launch-ready" || data.launchStatus === "live",
  );
});
`;
}

function renderFeatureDoc({ project, agent }: ManagedProjectState) {
  return `# ${project.name} House-League Workspace

## Agent

${agent.displayName} (${agent.handle})

## Current Objective

${project.activeRun.objective}

## Prompt Snapshot

${project.activeRun.promptSnapshot}
`;
}

export function createManagedProjectFiles(state: ManagedProjectState) {
  return {
    "package.json": renderPackageJson(state.project),
    "README.md": renderReadme(state),
    "CHANGELOG.md": renderChangelog(state.project),
    "data/project.json": JSON.stringify(
      {
        id: state.project.id,
        slug: state.project.slug,
        name: state.project.name,
        thesis: state.project.thesis,
        category: state.project.category,
        launchStatus: state.project.launchStatus,
        previewHighlights: state.project.previewHighlights,
        roadmap: state.project.roadmap,
        token: {
          symbol: state.project.token.symbol,
          mint: state.project.token.mint,
        },
        agent: {
          displayName: state.agent.displayName,
          handle: state.agent.handle,
          persona: state.agent.persona,
        },
        activeRun: state.project.activeRun,
      },
      null,
      2,
    ),
    "docs/current-cycle.md": renderFeatureDoc(state),
    "scripts/build.mjs": renderBuildScript(),
    "scripts/lint.mjs": renderLintScript(),
    "scripts/test.mjs": renderTestScript(),
    "src/styles.css": renderStyles(),
  };
}

export function renderScreenshotSvg({ project, agent }: ManagedProjectState, caption: string) {
  const roadmap = project.roadmap
    .slice(0, 3)
    .map(
      (item, index) =>
        `<text x="44" y="${210 + index * 34}" fill="#cbd5e1" font-size="18">${escapeMarkup(renderRoadmapBadge(item.status))}: ${escapeMarkup(item.title)}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1280" y2="720" gradientUnits="userSpaceOnUse">
      <stop stop-color="${agent.color}" stop-opacity="0.28" />
      <stop offset="1" stop-color="#050b17" />
    </linearGradient>
  </defs>
  <rect width="1280" height="720" rx="36" fill="#020611" />
  <rect x="18" y="18" width="1244" height="684" rx="28" fill="url(#bg)" stroke="rgba(255,255,255,0.14)" />
  <text x="44" y="86" fill="#94a3b8" font-size="18" letter-spacing="3">${escapeMarkup(agent.displayName.toUpperCase())} / ${escapeMarkup(project.category.toUpperCase())}</text>
  <text x="44" y="152" fill="#f8fafc" font-size="54" font-family="Segoe UI">${escapeMarkup(project.name)}</text>
  <text x="44" y="194" fill="#e2e8f0" font-size="24">${escapeMarkup(caption)}</text>
  ${roadmap}
  <rect x="44" y="476" width="1192" height="160" rx="24" fill="#020611" fill-opacity="0.42" stroke="rgba(255,255,255,0.12)" />
  <text x="68" y="518" fill="#94a3b8" font-size="18">Current objective</text>
  <text x="68" y="560" fill="#f8fafc" font-size="28">${escapeMarkup(project.activeRun.objective)}</text>
  <text x="68" y="616" fill="#cbd5e1" font-size="22">${escapeMarkup(project.thesis)}</text>
</svg>`;
}
