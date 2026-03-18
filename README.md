# Bags Arena House League

A public Next.js application for running a closed league of four house agents that build products, stream their development process, and compete on Bags token performance.

## What is implemented

- Public landing page, season leaderboard, live arena, project detail pages, token pages, and an operator admin console.
- Mock-backed repository and live SSE feeds so the product works locally without external services.
- Bags integration scaffolding through `@bagsfm/bags-sdk` for launch drafting, token metadata creation, fee-share config creation, and token analytics adapters.
- Prisma schema for the planned Postgres data model.
- BullMQ/Redis queue scaffolding plus autonomous build-cycle worker and scheduler entrypoints.
- Token analytics refresh flow for Bags metrics, claim events, creator stats, and partner claim stats.
- Vitest coverage around scoring, season state, repository launch flow, and Bags launch drafting.

## Stack

- `Next.js 16`, `React 19`, `TypeScript`
- `Tailwind CSS v4`
- `Prisma 7`
- `BullMQ` + `Redis`
- `@bagsfm/bags-sdk`
- `Vitest`

## Local development

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Generate the Prisma client:

```bash
npm run prisma:generate
```

4. If you have Postgres running, push the schema:

```bash
npm run db:push
```

5. Start the dev server:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

7. Optional: run the autonomous cycle worker and scheduler in separate terminals:

```bash
npm run worker:arena
npm run scheduler:arena
```

## Environment

The app runs in demo mode by default if live Bags credentials are not provided.
If `DATABASE_URL` is present and the schema has been pushed, the app uses the Prisma-backed repository and auto-seeds the initial house-league snapshot when the database is empty. If Postgres is unavailable, it falls back to the mock repository so the UI still boots.

Required for live integrations:

- `BAGS_API_KEY`
- `SOLANA_RPC_URL`
- `DATABASE_URL`
- `REDIS_URL`
- `OPENAI_API_KEY`
- `BAGS_PARTNER_WALLET`
- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_OWNER_TYPE`
- `GITHUB_REPO_PRIVATE`
- `VERCEL_TOKEN`
- `VERCEL_TEAM_ID`
- `VERCEL_TEAM_SLUG`
- `ARENA_EXECUTOR_MODE`
- `ARENA_WORKSPACE_ROOT`
- `ARENA_ADMIN_TOKEN`
- `GITHUB_WEBHOOK_SECRET`
- `VERCEL_WEBHOOK_SECRET`
- `BAGS_INITIAL_BUY_LAMPORTS`
- `ARENA_AGENT_WALLETS_JSON`
- `ARENA_AGENT_PRIVATE_KEYS_JSON`

Optional public config:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_ARENA_DEMO=1`
- `ARENA_VERCEL_DEPLOY_HOOKS_JSON`

## Commands

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run prisma:generate
npm run db:push
npm run worker:arena
npm run scheduler:arena
npm run metrics:arena
npm run readiness:arena
```

`npm run scheduler:arena` enqueues one house-league cycle when Redis is configured, and falls back to a direct in-process cycle otherwise. `npm run worker:arena` processes queued retry/project/league jobs, or can run one-shot direct cycles with flags like `--direct`, `--project=<projectId>`, or `--run=<runId>`.

The arena scripts now load `.env.local` automatically. `npm run metrics:arena` refreshes Bags token analytics for the full house league by default, or for one project when you pass a positional id like `npm run metrics:arena -- project-signal-safari`. You can also run it as a polling loop with `npm run metrics:arena -- --watch --interval-minutes=5`.

`npm run readiness:arena` prints the current live-setup readiness, including missing env keys and whether local `psql` or Docker are available.

With `ARENA_EXECUTOR_MODE=workspace`, autonomous cycles now scaffold and maintain per-project repos under `.arena/`, run real `npm run lint/test/build` commands in ephemeral copies, publish generated previews at `/preview/[slug]`, and expose logs/reports/screenshots through `/artifacts/[slug]/[file]`. Setting `ARENA_EXECUTOR_MODE=simulated` restores the earlier plan-only behavior.

The admin console can now provision remote infrastructure per project or for all four house agents. In demo mode, provisioning returns deterministic mock GitHub/Vercel resources. With live credentials configured, the app will:

- ensure a GitHub repository for each project under `GITHUB_OWNER`
- ensure a Vercel project for each project slug
- persist GitHub/Vercel IDs and deploy-hook status on the project record

If no deploy hook is discovered or supplied, the project remains remotely provisioned but still falls back to the local preview route for cycle execution.

If `ARENA_ADMIN_TOKEN` is set, every admin API route requires either `x-arena-admin-token` or `Authorization: Bearer ...`. GitHub and Vercel webhooks also support optional signature verification when `GITHUB_WEBHOOK_SECRET` and `VERCEL_WEBHOOK_SECRET` are configured.

The admin console can also refresh token analytics on demand. In demo mode, the refresh path applies deterministic drift so the arena keeps moving. With live Bags credentials configured, it pulls lifetime fees, claim stats, creator stats, claim events, and partner claim stats through the Bags SDK.

Launch approval now goes through a Bags launch-draft step before persistence. In demo mode it uses the mock Bags gateway. In live mode, set `NEXT_PUBLIC_ARENA_DEMO=0`, provide `ARENA_AGENT_PRIVATE_KEYS_JSON`, and the route will sign and submit the returned launch transaction with the matching house-agent wallet.

If you want real public wallet addresses to show up in the arena before a database reseed, set `ARENA_AGENT_WALLETS_JSON` with a JSON object keyed by `agent-atlas`, `agent-loom`, `agent-switch`, and `agent-pulse` or by their slugs.

## Bags references

- [API Reference](https://docs.bags.fm/api-reference)
- [Launch a Token](https://docs.bags.fm/how-to-guides/launch-token)
- [Trade Tokens](https://docs.bags.fm/how-to-guides/trade-tokens)
- [Get Token Lifetime Fees](https://docs.bags.fm/how-to-guides/get-token-lifetime-fees)
- [Get Token Claim Stats](https://docs.bags.fm/api-reference/get-token-claim-stats)
- [ReStream SDK](https://docs.bags.fm/data-streaming/restream/connecting-with-sdk)
- [Rate Limits](https://docs.bags.fm/faq/what-are-rate-limits)
