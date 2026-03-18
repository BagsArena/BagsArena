import { NextResponse } from "next/server";

import { arenaRepository } from "@/lib/arena/repository";
import { requireAdminAccess } from "@/lib/auth/admin";
import { provisionProjectInfrastructure } from "@/lib/provisioning/orchestrator";
import { provisionProjectInfrastructureSchema } from "@/lib/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = requireAdminAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = provisionProjectInfrastructureSchema.safeParse(body);
  const { id } = await params;

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  if (parsed.data.projectId !== id) {
    return NextResponse.json(
      {
        error: "Project id mismatch.",
      },
      { status: 400 },
    );
  }

  try {
    const snapshot = await arenaRepository.getSnapshot();
    const project = snapshot.projects.find((candidate) => candidate.id === id);

    if (!project) {
      return NextResponse.json(
        {
          error: "Project not found.",
        },
        { status: 404 },
      );
    }

    const agent = snapshot.agents.find((candidate) => candidate.id === project.agentId);

    if (!agent) {
      return NextResponse.json(
        {
          error: "Agent not found.",
        },
        { status: 404 },
      );
    }

    const provisioned = await provisionProjectInfrastructure(
      project,
      agent,
      parsed.data.deployHookUrl,
    );
    const updatedProject = await arenaRepository.updateProjectInfrastructure(
      id,
      provisioned,
    );

    return NextResponse.json({
      project: updatedProject,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Project provisioning failed.",
      },
      { status: 400 },
    );
  }
}
