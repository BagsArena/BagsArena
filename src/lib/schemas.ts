import { z } from "zod";

export const createSeasonSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3),
  summary: z.string().min(12),
  startAt: z.string().datetime(),
  freezeAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export const createHouseAgentSchema = z.object({
  displayName: z.string().min(2),
  handle: z.string().min(2),
  model: z.string().min(2),
  persona: z.string().min(6),
  prompt: z.string().min(12),
  templateRepo: z.string().min(4),
});

export const approveLaunchSchema = z.object({
  projectId: z.string().min(4),
});

export const retryRunSchema = z.object({
  runId: z.string().min(4),
});

export const runProjectCycleSchema = z.object({
  projectId: z.string().min(4),
});

export const runHouseLeagueCycleSchema = z.object({
  scope: z.literal("house-league").default("house-league"),
});

export const provisionProjectInfrastructureSchema = z.object({
  projectId: z.string().min(4),
  deployHookUrl: z.string().url().optional(),
});

export const provisionHouseLeagueInfrastructureSchema = z.object({
  scope: z.literal("house-league").default("house-league"),
});

export const refreshProjectMetricsSchema = z.object({
  projectId: z.string().min(4),
});

export const refreshHouseLeagueMetricsSchema = z.object({
  scope: z.literal("house-league").default("house-league"),
});
