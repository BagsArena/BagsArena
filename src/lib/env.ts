function stripProtocol(value: string) {
  return value.replace(/^https?:\/\//, "");
}

function resolveAppUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicitUrl) {
    return explicitUrl;
  }

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProductionUrl) {
    return `https://${stripProtocol(vercelProductionUrl)}`;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${stripProtocol(vercelUrl)}`;
  }

  return "http://localhost:3000";
}

export const env = {
  arenaDemoMode:
    process.env.NEXT_PUBLIC_ARENA_DEMO === "1" ||
    process.env.NEXT_PUBLIC_ARENA_DEMO === undefined,
  appUrl: resolveAppUrl(),
  bagsApiKey: process.env.BAGS_API_KEY ?? "",
  solanaRpcUrl:
    process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  vercelToken: process.env.VERCEL_TOKEN ?? "",
  vercelTeamId: process.env.VERCEL_TEAM_ID ?? "",
  vercelTeamSlug: process.env.VERCEL_TEAM_SLUG ?? "",
  vercelApiBaseUrl: process.env.VERCEL_API_BASE_URL ?? "https://api.vercel.com",
  githubToken: process.env.GITHUB_TOKEN ?? "",
  githubOwner: process.env.GITHUB_OWNER ?? "",
  githubOwnerType: process.env.GITHUB_OWNER_TYPE ?? "",
  githubRepoPrivate: process.env.GITHUB_REPO_PRIVATE !== "0",
  githubApiBaseUrl: process.env.GITHUB_API_BASE_URL ?? "https://api.github.com",
  arenaExecutorMode: process.env.ARENA_EXECUTOR_MODE ?? "workspace",
  arenaWorkspaceRoot: process.env.ARENA_WORKSPACE_ROOT ?? "",
  vercelDeployHooksJson: process.env.ARENA_VERCEL_DEPLOY_HOOKS_JSON ?? "",
  arenaAdminToken: process.env.ARENA_ADMIN_TOKEN ?? "",
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET ?? "",
  vercelWebhookSecret: process.env.VERCEL_WEBHOOK_SECRET ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
  partnerWallet: process.env.BAGS_PARTNER_WALLET ?? "",
  bagsInitialBuyLamports: Number(process.env.BAGS_INITIAL_BUY_LAMPORTS ?? "25000000"),
  arenaAgentWalletsJson: process.env.ARENA_AGENT_WALLETS_JSON ?? "",
  arenaAgentPrivateKeysJson: process.env.ARENA_AGENT_PRIVATE_KEYS_JSON ?? "",
  arenaCycleIntervalMinutes: Number(process.env.ARENA_CYCLE_INTERVAL_MINUTES ?? "15"),
  arenaMetricsIntervalMinutes: Number(process.env.ARENA_METRICS_INTERVAL_MINUTES ?? "5"),
};

export const hasLiveBagsConfig = Boolean(env.bagsApiKey && env.solanaRpcUrl);
