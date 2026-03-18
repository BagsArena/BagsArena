import { BagsSDK } from "@bagsfm/bags-sdk";
import { Connection, PublicKey } from "@solana/web3.js";

import { arenaRepository } from "@/lib/arena/repository";
import type { CreatorStat, TokenClaimEvent } from "@/lib/arena/types";
import { env, hasLiveBagsConfig } from "@/lib/env";
import type { LaunchDraft, LaunchDraftInput } from "@/lib/bags/types";

export interface BagsTokenMarketStats {
  priceUsd?: number;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
  holders?: number;
}

export interface BagsPartnerClaimStats {
  claimedFees: number;
  unclaimedFees: number;
}

export interface BagsGateway {
  getTokenLifetimeFees(mint: string): Promise<number>;
  getTokenClaimStats(mint: string): Promise<CreatorStat[]>;
  getTokenCreators(mint: string): Promise<CreatorStat[]>;
  getTokenClaimEvents(mint: string, limit?: number): Promise<TokenClaimEvent[]>;
  getTokenMarketStats(mint: string): Promise<BagsTokenMarketStats | null>;
  getPartnerClaimStats(partner: string): Promise<BagsPartnerClaimStats | null>;
  prepareLaunchDraft(input: LaunchDraftInput): Promise<LaunchDraft>;
}

class MockBagsGateway implements BagsGateway {
  async getTokenLifetimeFees(mint: string) {
    return (await arenaRepository.getTokenByMint(mint))?.performance.lifetimeFees ?? 0;
  }

  async getTokenClaimStats(mint: string) {
    return (await arenaRepository.getTokenByMint(mint))?.creators ?? [];
  }

  async getTokenCreators(mint: string) {
    return (await arenaRepository.getTokenByMint(mint))?.creators ?? [];
  }

  async getTokenClaimEvents(mint: string) {
    return (await arenaRepository.getTokenByMint(mint))?.claims ?? [];
  }

  async getTokenMarketStats(mint: string) {
    const token = await arenaRepository.getTokenByMint(mint);

    if (!token) {
      return null;
    }

    return {
      priceUsd: token.performance.priceUsd,
      marketCap: token.performance.marketCap,
      volume24h: token.performance.volume24h,
      priceChange24h: token.performance.priceChange24h,
      holders: token.performance.holders,
    } satisfies BagsTokenMarketStats;
  }

  async getPartnerClaimStats(partner: string) {
    const snapshot = await arenaRepository.getSnapshot();
    const matchingTokens = snapshot.projects.filter((project) => project.token.partnerKey === partner);
    const lifetimeFees = matchingTokens.reduce(
      (sum, project) => sum + project.token.performance.lifetimeFees,
      0,
    );

    return {
      claimedFees: Number((lifetimeFees * 0.12).toFixed(2)),
      unclaimedFees: Number((lifetimeFees * 0.03).toFixed(2)),
    } satisfies BagsPartnerClaimStats;
  }

  async prepareLaunchDraft(input: LaunchDraftInput) {
    return {
      tokenMint: `mock-${input.symbol.toLowerCase()}-mint`,
      metadataUrl: `https://metadata.bags.fm/${input.symbol.toLowerCase()}.json`,
      configKey: "MockConfigKey111111111111111111111111111111",
      launchTransactionBase64: Buffer.from(
        JSON.stringify({
          name: input.name,
          symbol: input.symbol,
          creatorWallet: input.creatorWallet,
          partnerWallet: input.partnerWallet,
        }),
      ).toString("base64"),
    };
  }
}

class LiveBagsGateway implements BagsGateway {
  private sdk: BagsSDK;

  constructor() {
    this.sdk = new BagsSDK(
      env.bagsApiKey,
      new Connection(env.solanaRpcUrl, "confirmed"),
      "confirmed",
    );
  }

  async getTokenLifetimeFees(mint: string) {
    return this.sdk.state.getTokenLifetimeFees(new PublicKey(mint));
  }

  async getTokenClaimStats(mint: string) {
    const creators = await this.sdk.state.getTokenClaimStats(new PublicKey(mint));

    return creators.map((creator) => ({
      wallet: creator.wallet,
      username: creator.username || creator.providerUsername || "bags-creator",
      totalClaimed: Number(creator.totalClaimed),
      royaltyBps: creator.royaltyBps,
    }));
  }

  async getTokenCreators(mint: string) {
    const creators = await this.sdk.state.getTokenCreators(new PublicKey(mint));

    return creators.map((creator) => ({
      wallet: creator.wallet,
      username: creator.username || creator.providerUsername || "bags-creator",
      totalClaimed: 0,
      royaltyBps: creator.royaltyBps,
    }));
  }

  async getTokenClaimEvents(mint: string, limit = 8) {
    const events = await this.sdk.state.getTokenClaimEvents(new PublicKey(mint), {
      limit,
      offset: 0,
    });

    return events.map((event, index) => ({
      id: `${event.signature}-${index}`,
      wallet: event.wallet,
      amount: Number(event.amount),
      signature: event.signature,
      timestamp: new Date(
        event.timestamp < 1_000_000_000_000
          ? event.timestamp * 1000
          : event.timestamp,
      ).toISOString(),
    }));
  }

  async getTokenMarketStats(mint: string) {
    const leaderboard = await this.sdk.state.getTopTokensByLifetimeFees();
    const match = leaderboard.find((entry) => entry.token === mint);

    if (!match?.tokenInfo) {
      return null;
    }

    const volume24h =
      (match.tokenInfo.stats24h?.buyVolume ?? 0) +
      (match.tokenInfo.stats24h?.sellVolume ?? 0);

    return {
      priceUsd: match.tokenInfo.usdPrice,
      marketCap: match.tokenInfo.mcap,
      volume24h: volume24h > 0 ? volume24h : match.tokenLatestPrice?.volumeUSD,
      priceChange24h: match.tokenInfo.stats24h?.priceChange,
      holders: match.tokenInfo.holderCount,
    } satisfies BagsTokenMarketStats;
  }

  async getPartnerClaimStats(partner: string) {
    const stats = await this.sdk.partner.getPartnerConfigClaimStats(
      new PublicKey(partner),
    );

    return {
      claimedFees: Number(stats.claimedFees),
      unclaimedFees: Number(stats.unclaimedFees),
    } satisfies BagsPartnerClaimStats;
  }

  async prepareLaunchDraft(input: LaunchDraftInput) {
    const tokenInfo = await this.sdk.tokenLaunch.createTokenInfoAndMetadata({
      imageUrl: input.imageUrl,
      name: input.name,
      symbol: input.symbol,
      description: input.description,
      website: input.website,
      twitter: input.twitter,
      telegram: input.telegram,
    });

    const tokenMint = new PublicKey(tokenInfo.tokenMint);
    const creatorWallet = new PublicKey(input.creatorWallet);

    const config = await this.sdk.config.createBagsFeeShareConfig({
      feeClaimers: [
        {
          user: creatorWallet,
          userBps: 7500,
        },
      ],
      payer: creatorWallet,
      baseMint: tokenMint,
      partner: input.partnerWallet
        ? new PublicKey(input.partnerWallet)
        : undefined,
    });

    const launchTx = await this.sdk.tokenLaunch.createLaunchTransaction({
      metadataUrl: tokenInfo.tokenMetadata,
      tokenMint,
      launchWallet: creatorWallet,
      initialBuyLamports: input.initialBuyLamports,
      configKey: config.meteoraConfigKey,
    });

    return {
      tokenMint: tokenMint.toBase58(),
      metadataUrl: tokenInfo.tokenMetadata,
      configKey: config.meteoraConfigKey.toBase58(),
      launchTransactionBase64: Buffer.from(launchTx.serialize()).toString(
        "base64",
      ),
    };
  }
}

export function createBagsGateway(): BagsGateway {
  if (!hasLiveBagsConfig || env.arenaDemoMode) {
    return new MockBagsGateway();
  }

  return new LiveBagsGateway();
}
