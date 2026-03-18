import {
  ArtifactType as PrismaArtifactType,
  EventCategory as PrismaEventCategory,
  LaunchStatus as PrismaLaunchStatus,
  Prisma,
  RunOutcome as PrismaRunOutcome,
  RunPhase as PrismaRunPhase,
} from "@prisma/client";

import { createMockArenaSnapshot } from "../lib/arena/mock-data";
import { prisma } from "../lib/db";

function toSnakeCase<T extends string>(value: string): T {
  return value.replace(/-/g, "_") as T;
}

function fromLaunchStatus(status: string): PrismaLaunchStatus {
  return toSnakeCase<PrismaLaunchStatus>(status);
}

function fromRunPhase(phase: string): PrismaRunPhase {
  return toSnakeCase<PrismaRunPhase>(phase);
}

function fromRunOutcome(outcome: string): PrismaRunOutcome {
  return outcome as PrismaRunOutcome;
}

function fromArtifactType(type: string): PrismaArtifactType {
  return toSnakeCase<PrismaArtifactType>(type);
}

function fromEventCategory(category: string): PrismaEventCategory {
  return category as PrismaEventCategory;
}

function asJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function main() {
  const snapshot = createMockArenaSnapshot();

  await prisma.$transaction(async (tx) => {
    await tx.arenaEvent.deleteMany();
    await tx.scoreSnapshot.deleteMany();
    await tx.metricSnapshot.deleteMany();
    await tx.tokenLaunch.deleteMany();
    await tx.deployment.deleteMany();
    await tx.artifact.deleteMany();
    await tx.agentRun.deleteMany();
    await tx.project.deleteMany();
    await tx.houseAgent.deleteMany();
    await tx.season.deleteMany();

    await tx.season.create({
      data: {
        id: snapshot.season.id,
        name: snapshot.season.name,
        slug: snapshot.season.slug,
        status: snapshot.season.status,
        summary: snapshot.season.summary,
        startAt: new Date(snapshot.season.startAt),
        freezeAt: new Date(snapshot.season.freezeAt),
        endAt: new Date(snapshot.season.endAt),
      },
    });

    await tx.houseAgent.createMany({
      data: snapshot.agents.map((agent) => ({
        id: agent.id,
        slug: agent.slug,
        displayName: agent.displayName,
        handle: agent.handle,
        color: agent.color,
        accent: agent.accent,
        model: agent.model,
        persona: agent.persona,
        prompt: agent.prompt,
        walletLabel: agent.walletLabel,
        walletAddress: agent.walletAddress,
        repoOwner: agent.repoOwner,
        templateRepo: agent.templateRepo,
      })),
    });

    for (const project of snapshot.projects) {
      await tx.project.create({
        data: {
          id: project.id,
          slug: project.slug,
          name: project.name,
          thesis: project.thesis,
          category: project.category,
          repoUrl: project.repoUrl,
          previewUrl: project.previewUrl,
          launchStatus: fromLaunchStatus(project.launchStatus),
          infrastructure: asJsonValue(project.infrastructure),
          previewNotes: asJsonValue(project.previewHighlights),
          roadmap: asJsonValue(project.roadmap),
          seasonId: project.seasonId,
          agentId: project.agentId,
        },
      });

      await tx.agentRun.create({
        data: {
          id: project.activeRun.id,
          phase: fromRunPhase(project.activeRun.phase),
          outcome: fromRunOutcome(project.activeRun.outcome),
          objective: project.activeRun.objective,
          promptSnapshot: project.activeRun.promptSnapshot,
          terminal: asJsonValue(project.activeRun.terminal),
          mergedCommits24h: project.activeRun.mergedCommits24h,
          completedTasks24h: project.activeRun.completedTasks24h,
          successfulDeploys24h: project.activeRun.successfulDeploys24h,
          startedAt: new Date(project.activeRun.startedAt),
          endedAt: new Date(project.activeRun.endedAt),
          projectId: project.id,
          createdAt: new Date(project.activeRun.startedAt),
        },
      });

      if (project.artifacts.length > 0) {
        await tx.artifact.createMany({
          data: project.artifacts.map((artifact) => ({
            id: artifact.id,
            type: fromArtifactType(artifact.type),
            label: artifact.label,
            url: artifact.url,
            projectId: project.id,
            createdAt: new Date(artifact.createdAt),
          })),
        });
      }

      if (project.deployments.length > 0) {
        await tx.deployment.createMany({
          data: project.deployments.map((deployment) => ({
            id: deployment.id,
            sha: deployment.sha,
            branch: deployment.branch,
            previewUrl: deployment.previewUrl,
            status: deployment.status,
            durationSeconds: deployment.durationSeconds,
            screenshotLabel: deployment.screenshotLabel,
            projectId: project.id,
            createdAt: new Date(deployment.createdAt),
          })),
        });
      }

      await tx.tokenLaunch.create({
        data: {
          id: project.token.id,
          mint: project.token.mint,
          symbol: project.token.symbol,
          name: project.token.name,
          description: project.token.description,
          metadataUrl: project.token.metadataUrl,
          bagsUrl: project.token.bagsUrl,
          configKey: project.token.configKey,
          partnerKey: project.token.partnerKey,
          creatorWallet: project.token.creatorWallet,
          launchSignature: project.token.launchSignature,
          launchedAt: new Date(project.token.launchedAt),
          status: fromLaunchStatus(project.token.status),
          performance: asJsonValue(project.token.performance),
          creators: asJsonValue(project.token.creators),
          claims: asJsonValue(project.token.claims),
          projectId: project.id,
        },
      });

      await tx.metricSnapshot.create({
        data: {
          mint: project.token.mint,
          marketCap: project.token.performance.marketCap,
          volume24h: project.token.performance.volume24h,
          lifetimeFees: project.token.performance.lifetimeFees,
          priceUsd: project.token.performance.priceUsd,
          claimCount: project.token.performance.claimCount,
          recordedAt: new Date(project.token.performance.updatedAt),
        },
      });
    }

    if (snapshot.feed.length > 0) {
      await tx.arenaEvent.createMany({
        data: snapshot.feed.map((event) => ({
          id: event.id,
          category: fromEventCategory(event.category),
          title: event.title,
          detail: event.detail,
          scoreDelta: event.scoreDelta ?? null,
          createdAt: new Date(event.createdAt),
          projectId: event.projectId,
        })),
      });
    }

    if (snapshot.leaderboard.length > 0) {
      await tx.scoreSnapshot.createMany({
        data: snapshot.leaderboard.map((entry) => ({
          seasonId: snapshot.season.id,
          agentId: entry.agent.id,
          score: entry.score,
          marketCap: entry.componentScores.marketCap,
          volume24h: entry.componentScores.volume24h,
          lifetimeFees: entry.componentScores.lifetimeFees,
          shipVelocity: entry.componentScores.shipVelocity,
          recordedAt: new Date(snapshot.generatedAt),
        })),
      });
    }
  });

  console.log("[arena-reset-season] reset database to development-first season snapshot");
}

main()
  .catch((error) => {
    console.error("[arena-reset-season] fatal", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
