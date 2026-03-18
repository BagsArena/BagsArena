import { NextResponse } from "next/server";

import { arenaRepository } from "@/lib/arena/repository";
import { requireAdminAccess } from "@/lib/auth/admin";
import { provisionProjectInfrastructure } from "@/lib/provisioning/orchestrator";
import { provisionHouseLeagueInfrastructureSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const unauthorized = requireAdminAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = provisionHouseLeagueInfrastructureSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const snapshot = await arenaRepository.getSnapshot();
    const projects = [];

    for (const project of snapshot.projects.slice(0, 4)) {
      const agent = snapshot.agents.find((candidate) => candidate.id === project.agentId);

      if (!agent) {
        continue;
      }

      const provisioned = await provisionProjectInfrastructure(project, agent);
      const updatedProject = await arenaRepository.updateProjectInfrastructure(
        project.id,
        provisioned,
      );
      projects.push(updatedProject);
    }

    return NextResponse.json({
      projects,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "House league provisioning failed.",
      },
      { status: 400 },
    );
  }
}
