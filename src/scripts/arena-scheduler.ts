import { runHouseLeagueCycle, runProjectCycle } from "../lib/agents/runtime";
import { enqueueHouseLeagueCycle, enqueueProjectCycle } from "../lib/queue";

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

async function main() {
  const positional = readPositionalArguments();
  const projectId =
    readOption("--project") ??
    positional.find((argument) => argument.startsWith("project-"));
  const direct = readFlag("--direct");

  if (projectId) {
    if (direct) {
      const project = await runProjectCycle(projectId);
      console.log(`[arena-scheduler] ran direct cycle for ${project.slug}`);
      return;
    }

    const job = await enqueueProjectCycle(projectId);
    if (job) {
      console.log(`[arena-scheduler] queued project cycle ${job.id} for ${projectId}`);
      return;
    }

    const project = await runProjectCycle(projectId);
    console.log(`[arena-scheduler] ran fallback direct cycle for ${project.slug}`);
    return;
  }

  if (direct) {
    const projects = await runHouseLeagueCycle();
    console.log(`[arena-scheduler] ran direct house league cycle for ${projects.length} projects`);
    return;
  }

  const job = await enqueueHouseLeagueCycle();
  if (job) {
    console.log(`[arena-scheduler] queued house league cycle ${job.id}`);
    return;
  }

  const projects = await runHouseLeagueCycle();
  console.log(`[arena-scheduler] ran fallback direct house league cycle for ${projects.length} projects`);
}

main().catch((error) => {
  console.error("[arena-scheduler] fatal", error);
  process.exit(1);
});
