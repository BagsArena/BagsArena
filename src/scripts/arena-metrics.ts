import {
  refreshHouseLeagueTokenAnalytics,
  refreshProjectTokenAnalytics,
} from "../lib/bags/analytics";

function readFlag(name: string) {
  return process.argv.some((argument) => argument === name);
}

function readPositionalArguments() {
  return process.argv.slice(2).filter((argument) => !argument.startsWith("-"));
}

function readOption(name: string) {
  const prefix = `${name}=`;
  const inlineValue = process.argv.find((argument) => argument.startsWith(prefix));
  if (inlineValue) {
    return inlineValue.slice(prefix.length);
  }

  const index = process.argv.findIndex((argument) => argument === name);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

async function refreshOnce(projectId?: string) {
  if (projectId) {
    const result = await refreshProjectTokenAnalytics(projectId);
    console.log(
      `[arena-metrics] refreshed ${result.project.slug} from ${result.source}`,
    );
    return;
  }

  const result = await refreshHouseLeagueTokenAnalytics();
  console.log(
    `[arena-metrics] refreshed ${result.projects.length} projects from ${result.source}`,
  );
}

async function main() {
  const positional = readPositionalArguments();
  const projectId =
    readOption("--project") ??
    positional.find((argument) => argument.startsWith("project-"));
  const watch = readFlag("--watch");
  const intervalMinutes = Number(readOption("--interval-minutes") ?? "5");

  if (!watch) {
    await refreshOnce(projectId);
    return;
  }

  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
    throw new Error("--interval-minutes must be a positive number.");
  }

  while (true) {
    await refreshOnce(projectId);
    await new Promise((resolve) =>
      setTimeout(resolve, Math.round(intervalMinutes * 60_000)),
    );
  }
}

main().catch((error) => {
  console.error("[arena-metrics] fatal", error);
  process.exit(1);
});
