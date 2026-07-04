# Charvastamy

A Solana Anchor staking app with a React frontend and Telegram bot support.

## Setup

1. Install dependencies:

```bash
cd /home/rollz/charvastamy
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Edit `.env` and set your environment values. Keep this file private and never commit it.

```env
TELEGRAM_BOT_TOKEN=your_token_here
CHARVASTAMY_APP_URL=http://localhost:3000
CHARVASTAMY_PROGRAM_ID=FCFnNNwPf2Ej1Eub1k4mctfdXvcoWZNRZ81FgyBh6Yjc
# On devnet, use the Devnet program ID above.
# On mainnet, update this after deploying to:
# DYYn5KcrpeKfMeoumx9Nz5QLZUtVsFoRUCQsaSAVuF1o
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
CHARVASTAMY_APY=24.5%
```

## Quick start

1. Start the frontend development server:

```bash
npm run start
```

2. In a second terminal, start the Telegram bot:

```bash
npm run bot
```

Then open `http://localhost:3000` to use the dashboard and send bot commands from Telegram.

## Frontend

Run the local app:

```bash
npm run start
```

Build the production bundle:

```bash
npm run app:build
```

Lint/format files:

```bash
npm run lint
```

## Telegram Bot

Start the bot with your `.env` values loaded:

```bash
npm run bot
```

### Bot commands

- `/start` - welcome message
- `/stats` - program and network details
- `/app` - open the dashboard
- `/stake <wallet>` - show on-chain stake account details
- `/wallet <wallet>` - show wallet balance and stake summary
- `/claim <wallet>` - show claimable rewards
- `/refer <referrerWallet>` - generate a referral stake link
- `/refer-status <wallet>` - check the wallet's current referrer
- `/mystake <wallet>` - open the dashboard link for a wallet
- `/balance <wallet>` - get SOL balance
- `/history <wallet>` - view recent transaction history
- `/help` - show available commands

## Program Build & Deploy

Build the Anchor program:

```bash
npm run build
```

Deploy to Devnet:

```bash
npm run deploy:devnet
```

Deploy to Mainnet using the dedicated mainnet program keypair:

```bash
npm run deploy:mainnet
```

After successful mainnet deployment, update `CHARVASTAMY_PROGRAM_ID` in your `.env` to:

```env
CHARVASTAMY_PROGRAM_ID=DYYn5KcrpeKfMeoumx9Nz5QLZUtVsFoRUCQsaSAVuF1o
```

If deployment fails due to funding or cluster issues, use the Solana CLI directly:

```bash
solana program deploy target/deploy/charvastamy.so --program-keypair target/deploy/charvastamy-mainnet-keypair.json --url https://api.mainnet-beta.solana.com
```

## Notes

- The bot uses `process.env.TELEGRAM_BOT_TOKEN`, `process.env.SOLANA_NETWORK`, and `process.env.SOLANA_RPC_URL`.
- The frontend uses `VITE_SOLANA_NETWORK` and `VITE_SOLANA_RPC_URL`.
- Keep `.env` private and do not commit it.

## Environment variables

Use the following variables in your `.env` file or runtime environment:

- `TELEGRAM_BOT_TOKEN` — your Telegram bot API token.
- `CHARVASTAMY_APP_URL` — URL of the frontend dashboard, e.g. `http://localhost:3000`.
- `CHARVASTAMY_PROGRAM_ID` — deployed Anchor program ID.
- `SOLANA_NETWORK` — Solana network name, e.g. `devnet`.
- `SOLANA_RPC_URL` — JSON RPC endpoint for the bot and backend RPC calls.
- `VITE_SOLANA_NETWORK` — network for the frontend build, usually `devnet`.
- `VITE_SOLANA_RPC_URL` — RPC endpoint used by the frontend.
- `CHARVASTAMY_APY` — display APY text used in bot messages.

## Docker

Build and run both services with Docker Compose:

```bash
docker compose up --build
```

Use `.env` or environment variables for the bot token and runtime config.

If you only want the bot:

```bash
docker compose run --rm bot
```

If you only want the frontend:

```bash
docker compose run --rm app
```
