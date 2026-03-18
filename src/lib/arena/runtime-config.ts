import type { HouseAgent, TokenLaunch } from "@/lib/arena/types";
import { env } from "@/lib/env";

function readWalletMap() {
  if (!env.arenaAgentWalletsJson) {
    return {} as Record<string, string>;
  }

  try {
    return JSON.parse(env.arenaAgentWalletsJson) as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
}

function resolveAgentWalletAddress(agent: Pick<HouseAgent, "id" | "slug" | "walletAddress">) {
  const walletMap = readWalletMap();

  return walletMap[agent.id] ?? walletMap[agent.slug] ?? agent.walletAddress;
}

export function applyAgentRuntimeConfig(agent: HouseAgent): HouseAgent {
  return {
    ...agent,
    walletAddress: resolveAgentWalletAddress(agent),
  };
}

export function applyTokenRuntimeConfig(
  token: TokenLaunch,
  agent: Pick<HouseAgent, "walletAddress">,
): TokenLaunch {
  return {
    ...token,
    creatorWallet: agent.walletAddress,
    partnerKey: env.partnerWallet || token.partnerKey,
  };
}
