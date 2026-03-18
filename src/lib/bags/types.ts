export interface LaunchDraftInput {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  creatorWallet: string;
  partnerWallet?: string;
  initialBuyLamports: number;
}

export interface LaunchDraft {
  tokenMint: string;
  metadataUrl: string;
  configKey: string;
  launchTransactionBase64: string;
}
