import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";

import type { ArenaRepository } from "@/lib/arena/repository";
import { arenaRepository } from "@/lib/arena/repository";
import type { HouseAgent, Project } from "@/lib/arena/types";
import type { BagsGateway } from "@/lib/bags/client";
import { createBagsGateway } from "@/lib/bags/client";
import type { LaunchDraft } from "@/lib/bags/types";
import { env, hasLiveBagsConfig } from "@/lib/env";

interface LaunchDependencies {
  repository?: ArenaRepository;
  gateway?: BagsGateway;
  connection?: Connection;
}

export interface ApproveProjectLaunchResult {
  project: Project;
  launchDraft: LaunchDraft;
  mode: "demo" | "mainnet";
}

function toAbsoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${env.appUrl}${url}`;
  }

  return `${env.appUrl}/${url.replace(/^\/+/, "")}`;
}

function resolveLaunchImageUrl(project: Project) {
  const screenshot = project.artifacts.find((artifact) => artifact.type === "screenshot");

  if (screenshot?.url) {
    return toAbsoluteUrl(screenshot.url);
  }

  return `${env.appUrl}/preview/${project.slug}`;
}

function readPrivateKeyMap() {
  if (!env.arenaAgentPrivateKeysJson) {
    throw new Error(
      "ARENA_AGENT_PRIVATE_KEYS_JSON is required for live Bags launch signing.",
    );
  }

  try {
    return JSON.parse(env.arenaAgentPrivateKeysJson) as Record<
      string,
      string | number[]
    >;
  } catch (error) {
    throw new Error(
      `ARENA_AGENT_PRIVATE_KEYS_JSON is not valid JSON: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    );
  }
}

function decodeSecretKey(value: string | number[]) {
  if (Array.isArray(value)) {
    return Uint8Array.from(value);
  }

  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    return Uint8Array.from(JSON.parse(trimmed) as number[]);
  }

  return Uint8Array.from(Buffer.from(trimmed, "base64"));
}

function resolveAgentSigner(agent: HouseAgent) {
  const privateKeys = readPrivateKeyMap();
  const rawKey =
    privateKeys[agent.id] ??
    privateKeys[agent.slug] ??
    privateKeys[agent.walletAddress];

  if (!rawKey) {
    throw new Error(`No private key configured for ${agent.displayName}.`);
  }

  const keypair = Keypair.fromSecretKey(decodeSecretKey(rawKey));

  if (
    agent.walletAddress &&
    !agent.walletAddress.includes("..") &&
    keypair.publicKey.toBase58() !== agent.walletAddress
  ) {
    throw new Error(
      `${agent.displayName} signer does not match configured wallet ${agent.walletAddress}.`,
    );
  }

  return keypair;
}

async function signAndSendLaunchDraft(
  launchDraft: LaunchDraft,
  connection: Connection,
  signer: Keypair,
) {
  const transaction = VersionedTransaction.deserialize(
    Buffer.from(launchDraft.launchTransactionBase64, "base64"),
  );

  transaction.sign([signer]);

  const signature = await connection.sendTransaction(transaction, {
    skipPreflight: false,
    maxRetries: 3,
  });
  const confirmation = await connection.confirmTransaction(signature, "confirmed");

  if (confirmation.value.err) {
    throw new Error(
      `Launch transaction ${signature} failed confirmation: ${JSON.stringify(
        confirmation.value.err,
      )}`,
    );
  }

  return signature;
}

async function getProjectAndAgent(repository: ArenaRepository, projectId: string) {
  const snapshot = await repository.getSnapshot();
  const project = snapshot.projects.find((candidate) => candidate.id === projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  const agent = snapshot.agents.find((candidate) => candidate.id === project.agentId);
  if (!agent) {
    throw new Error(`Agent not found for project ${project.name}.`);
  }

  return {
    project,
    agent,
  };
}

export async function approveProjectLaunch(
  projectId: string,
  dependencies: LaunchDependencies = {},
): Promise<ApproveProjectLaunchResult> {
  const repository = dependencies.repository ?? arenaRepository;
  const gateway = dependencies.gateway ?? createBagsGateway();
  const { project, agent } = await getProjectAndAgent(repository, projectId);
  const launchDraft = await gateway.prepareLaunchDraft({
    name: project.token.name,
    symbol: project.token.symbol,
    description: project.token.description,
    imageUrl: resolveLaunchImageUrl(project),
    website: toAbsoluteUrl(project.previewUrl),
    creatorWallet: project.token.creatorWallet || agent.walletAddress,
    partnerWallet: env.partnerWallet || undefined,
    initialBuyLamports: env.bagsInitialBuyLamports,
  });

  if (env.arenaDemoMode || !hasLiveBagsConfig) {
    return {
      project: await repository.approveLaunch(projectId, {
        mint: launchDraft.tokenMint,
        metadataUrl: launchDraft.metadataUrl,
        configKey: launchDraft.configKey,
        bagsUrl: `https://bags.fm/token/${launchDraft.tokenMint}`,
        creatorWallet: project.token.creatorWallet || agent.walletAddress,
      }),
      launchDraft,
      mode: "demo",
    };
  }

  const signer = resolveAgentSigner(agent);
  const connection =
    dependencies.connection ??
    new Connection(env.solanaRpcUrl, "confirmed");
  const signature = await signAndSendLaunchDraft(launchDraft, connection, signer);
  const launchedAt = new Date().toISOString();

  return {
    project: await repository.approveLaunch(projectId, {
      mint: launchDraft.tokenMint,
      metadataUrl: launchDraft.metadataUrl,
      configKey: launchDraft.configKey,
      bagsUrl: `https://bags.fm/token/${launchDraft.tokenMint}`,
      creatorWallet: signer.publicKey.toBase58(),
      launchSignature: signature,
      launchedAt,
    }),
    launchDraft,
    mode: "mainnet",
  };
}
