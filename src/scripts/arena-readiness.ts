import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

import { env } from "../lib/env";

function checkCommand(name: string) {
  const command = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(command, [name], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  return result.status === 0;
}

function printSection(title: string, rows: Array<[string, boolean]>) {
  console.log(`\n${title}`);

  for (const [label, ok] of rows) {
    console.log(`${ok ? "OK " : "MISS"} ${label}`);
  }
}

function hasValue(value: string) {
  return Boolean(value && value.trim());
}

function main() {
  const infraRows: Array<[string, boolean]> = [
    [".env.local present", existsSync(".env.local")],
    ["DATABASE_URL", hasValue(env.databaseUrl)],
    ["REDIS_URL", hasValue(env.redisUrl)],
    ["GITHUB_TOKEN", hasValue(env.githubToken)],
    ["VERCEL_TOKEN", hasValue(env.vercelToken)],
  ];

  const bagsRows: Array<[string, boolean]> = [
    ["NEXT_PUBLIC_ARENA_DEMO=0", !env.arenaDemoMode],
    ["BAGS_API_KEY", hasValue(env.bagsApiKey)],
    ["SOLANA_RPC_URL", hasValue(env.solanaRpcUrl)],
    ["BAGS_PARTNER_WALLET", hasValue(env.partnerWallet)],
    ["ARENA_AGENT_WALLETS_JSON", hasValue(env.arenaAgentWalletsJson)],
    ["ARENA_AGENT_PRIVATE_KEYS_JSON", hasValue(env.arenaAgentPrivateKeysJson)],
  ];

  const localToolRows: Array<[string, boolean]> = [
    ["psql available", checkCommand("psql")],
    ["docker available", checkCommand("docker")],
  ];

  printSection("Infrastructure", infraRows);
  printSection("Bags mainnet", bagsRows);
  printSection("Local tools", localToolRows);

  const hasMissing = [...infraRows, ...bagsRows].some(([, ok]) => !ok);
  console.log(
    `\nSummary: ${hasMissing ? "missing required live setup values" : "ready for live cutover checks"}.`,
  );
}

main();
