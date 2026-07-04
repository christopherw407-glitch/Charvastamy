#!/usr/bin/env node

const { PublicKey } = require('@solana/web3.js');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("Missing TELEGRAM_BOT_TOKEN. Set it before starting the bot.");
  process.exit(1);
}

const apiBase = `https://api.telegram.org/bot${token}`;
const appUrl = process.env.CHARVASTAMY_APP_URL || "http://localhost:3000";
const programId =
  process.env.CHARVASTAMY_PROGRAM_ID ||
  "FCFnNNwPf2Ej1Eub1k4mctfdXvcoWZNRZ81FgyBh6Yjc";
const network = process.env.SOLANA_NETWORK || "devnet";
const apy = process.env.CHARVASTAMY_APY || "24.5%";
const rpc = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const ZERO_PUBLIC_KEY = new PublicKey(Buffer.alloc(32)).toBase58();

async function telegram(method, payload = {}) {
  const response = await fetch(`${apiBase}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.description || `Telegram API error for ${method}`);
  }
  return data.result;
}

async function sendMessage(chatId, text, extra = {}) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra,
  });
}

function formatSol(lamports) {
  return `${Number(lamports) / 1e9} SOL`;
}

async function getStakeAccount(pubkey) {
  const walletKey = new PublicKey(pubkey);
  const programKey = new PublicKey(programId);
  const [stakePda] = await PublicKey.findProgramAddress([
    Buffer.from("stake"),
    walletKey.toBuffer(),
  ],
  programKey);

  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getAccountInfo",
      params: [stakePda.toBase58(), { encoding: "base64" }],
    }),
  });

  const json = await res.json();
  const value = json.result?.value;
  if (!value || !Array.isArray(value.data) || !value.data[0]) {
    return null;
  }

  const buffer = Buffer.from(value.data[0], "base64");
  if (buffer.length < 105) {
    return null;
  }

  let offset = 8;
  const authority = new PublicKey(buffer.slice(offset, offset + 32));
  offset += 32;
  const amount = Number(buffer.readBigUInt64LE(offset));
  offset += 8;
  const startedAt = Number(buffer.readBigInt64LE(offset));
  offset += 8;
  const rateBps = Number(buffer.readBigUInt64LE(offset));
  offset += 8;
  const bump = buffer.readUInt8(offset);
  offset += 1;
  const referrer = new PublicKey(buffer.slice(offset, offset + 32));
  offset += 32;
  const pendingRewards = Number(buffer.readBigUInt64LE(offset));

  return {
    stakePda: stakePda.toBase58(),
    authority: authority.toBase58(),
    amount,
    startedAt,
    rateBps,
    bump,
    referrer: referrer.toBase58(),
    pendingRewards,
  };
}

function parseHistoryEntry(tx) {
  if (!tx?.meta?.logMessages?.length) return null;

  const logs = tx.meta.logMessages;
  for (const log of logs) {
    if (log.includes("Staked ") && log.includes("with APY")) {
      const match = log.match(/Staked (\d+) with APY/);
      if (match) {
        return {
          type: "stake",
          label: "Stake",
          amount: Number(match[1]) / 1e9,
        };
      }
    }
    if (log.includes("Unstaked ")) {
      const match = log.match(/Unstaked (\d+)/);
      if (match) {
        return {
          type: "unstake",
          label: "Unstake",
          amount: Number(match[1]) / 1e9,
        };
      }
    }
    if (log.includes("claimed ") && log.includes("rewards")) {
      const match = log.match(/claimed (\d+)/);
      if (match) {
        return {
          type: "reward",
          label: "Claim reward",
          amount: Number(match[1]) / 1e9,
        };
      }
    }
    if (log.includes("Registered referrer")) {
      return {
        type: "referral",
        label: "Referral registered",
        amount: 0,
      };
    }
  }
  return null;
}

function buildStatsText() {
  return [
    "Charvastamy staking bot ⚡",
    "",
    `Program ID: <code>${programId}</code>`,
    `Network: ${network}`,
    `Competitive APY: ${apy}`,
    `Dashboard: ${appUrl}`,
    "",
    "Use /help to see available commands.",
  ].join("\n");
}

async function handleUpdate(update) {
  if (!update.message) {
    return;
  }

  const message = update.message;
  const chatId = message.chat.id;
  const text = message.text || "";

  if (!text.startsWith("/")) {
    await sendMessage(
      chatId,
      "Send /start, /stats, /app, or /help to interact with Charvastamy."
    );
    return;
  }

  const command = text.split(" ")[0].toLowerCase();

  if (command === "/start") {
    const intro = [
      "Welcome to Charvastamy 🚀",
      "",
      "This bot can keep you informed about the staking program and point you to the dashboard.",
      "",
      "Commands:",
      "/stats - program and network details",
      "/app - open the dashboard",
      "/stake <wallet> - show on-chain stake info",
      "/wallet <wallet> - show wallet balance and stake summary",
      "/claim <wallet> - show claimable rewards",
      "/refer <referrerWallet> - generate a referral stake link",
      "/help - show this help",
    ].join("\n");
    await sendMessage(chatId, intro);
    return;
  }

  if (command === "/stats") {
    await sendMessage(chatId, buildStatsText());
    return;
  }

  if (command === "/app") {
    await sendMessage(chatId, `Open the dashboard here: ${appUrl}`);
    return;
  }

  if (command === "/help") {
    await sendMessage(
      chatId,
      [
        "Available commands:",
        "/start - welcome message",
        "/stats - current staking details",
        "/app - open the Charvastamy dashboard",
        "/stake <wallet> - show on-chain stake info",
        "/wallet <wallet> - show wallet balance and stake summary",
        "/claim <wallet> - show claimable rewards",
        "/refer <referrerWallet> - generate a referral stake link",
        "/refer-status <wallet> - check a wallet's current referrer",
        "/mystake <wallet> - open a wallet dashboard link",
        "/balance <wallet> - get SOL balance",
        "/history <wallet> - recent Solana tx history",
        "/help - show this list",
      ].join("\n")
    );
    return;
  }

  if (command === "/stake") {
    const parts = text.split(" ");
    const pubkey = parts[1];
    if (!pubkey) {
      await sendMessage(
        chatId,
        "Usage: /stake <walletPubkey> — retrieve on-chain stake account details."
      );
      return;
    }
    try {
      const stake = await getStakeAccount(pubkey);
      if (!stake) {
        await sendMessage(chatId, `No active stake account found for ${pubkey}`);
        return;
      }
      const startedAt = stake.startedAt > 0 ? new Date(stake.startedAt * 1000).toUTCString() : "Unknown";
      const referrer = stake.referrer === ZERO_PUBLIC_KEY ? "None" : stake.referrer;
      await sendMessage(
        chatId,
        [
          `Stake account: <code>${stake.stakePda}</code>`,
          `Owner: <code>${stake.authority}</code>`,
          `Amount: <strong>${formatSol(stake.amount)}</strong>`,
          `Pending rewards: <strong>${formatSol(stake.pendingRewards)}</strong>`,
          `Rate: <strong>${stake.rateBps / 100}%</strong>`,
          `Started: <strong>${startedAt}</strong>`,
          `Referrer: <code>${referrer}</code>`,
        ].join("\n")
      );
    } catch (e) {
      await sendMessage(chatId, `Error fetching stake info: ${e.message}`);
    }
    return;
  }

  if (command === "/wallet") {
    const parts = text.split(" ");
    const pubkey = parts[1];
    if (!pubkey) {
      await sendMessage(chatId, "Usage: /wallet <walletPubkey> — show balance and stake summary.");
      return;
    }
    try {
      const balanceRes = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [pubkey],
        }),
      });
      const balanceJson = await balanceRes.json();
      const lamports = balanceJson.result?.value ?? 0;
      const stake = await getStakeAccount(pubkey);
      const stakeLine = stake
        ? `Stake: ${formatSol(stake.amount)} • rewards ${formatSol(stake.pendingRewards)}`
        : "Stake: none";
      await sendMessage(
        chatId,
        [
          `Wallet: <code>${pubkey}</code>`,
          `Balance: <strong>${formatSol(lamports)}</strong>`,
          stakeLine,
          `Dashboard: ${appUrl.replace(/\/$/, "")}/?pubkey=${encodeURIComponent(pubkey)}`,
        ].join("\n")
      );
    } catch (e) {
      await sendMessage(chatId, `Error fetching wallet info: ${e.message}`);
    }
    return;
  }

  if (command === "/refer") {
    const parts = text.split(" ");
    const referrer = parts[1];
    if (!referrer) {
      await sendMessage(
        chatId,
        "Usage: /refer <referrerWallet> — build a referral stake link."
      );
      return;
    }
    try {
      const url = `${appUrl.replace(/\/$/, "")}/?referrer=${encodeURIComponent(referrer)}`;
      await sendMessage(
        chatId,
        [
          `Referral wallet: <code>${referrer}</code>`,
          `Use this link to stake with referral rewards:`,
          url,
          "Open the link and paste the same referrer address in the stake form if needed.",
        ].join("\n")
      );
    } catch (e) {
      await sendMessage(chatId, `Error building referral link: ${e.message}`);
    }
    return;
  }

  if (command === "/refer-status") {
    const parts = text.split(" ");
    const pubkey = parts[1];
    if (!pubkey) {
      await sendMessage(chatId, "Usage: /refer-status <walletPubkey> — show the wallet's current referrer.");
      return;
    }
    try {
      const stake = await getStakeAccount(pubkey);
      if (!stake) {
        await sendMessage(chatId, `No stake account found for ${pubkey}`);
        return;
      }
      const referrer = stake.referrer === ZERO_PUBLIC_KEY ? "None set" : stake.referrer;
      await sendMessage(
        chatId,
        [
          `Wallet: <code>${pubkey}</code>`,
          `Current referrer: <code>${referrer}</code>`,
          `Stake amount: <strong>${formatSol(stake.amount)}</strong>`,
          `Pending rewards: <strong>${formatSol(stake.pendingRewards)}</strong>`,
        ].join("\n")
      );
    } catch (e) {
      await sendMessage(chatId, `Error fetching referrer status: ${e.message}`);
    }
    return;
  }

  if (command === "/mystake") {
    const parts = text.split(" ");
    const pubkey = parts[1];
    if (!pubkey) {
      await sendMessage(
        chatId,
        "Usage: /mystake <walletPubkey> — open the stake dashboard for that wallet."
      );
      return;
    }
    const safeUrl = `${appUrl.replace(/\/$/, "")}/?pubkey=${encodeURIComponent(
      pubkey
    )}`;
    await sendMessage(chatId, `Open your stake dashboard: ${safeUrl}`);
    return;
  }

  if (command === "/claim") {
    const parts = text.split(" ");
    const pubkey = parts[1];
    if (!pubkey) {
      await sendMessage(chatId, "Usage: /claim <walletPubkey> — show claimable rewards.");
      return;
    }
    try {
      const stake = await getStakeAccount(pubkey);
      if (!stake) {
        await sendMessage(chatId, `No stake account found for ${pubkey}`);
        return;
      }
      await sendMessage(
        chatId,
        [
          `Wallet: <code>${pubkey}</code>`,
          `Claimable rewards: <strong>${formatSol(stake.pendingRewards)}</strong>`,
          `Stake amount: <strong>${formatSol(stake.amount)}</strong>`,
          `Stake account: <code>${stake.stakePda}</code>`,
          `Dashboard: ${appUrl.replace(/\/$/, "")}/?pubkey=${encodeURIComponent(pubkey)}`,
        ].join("\n")
      );
    } catch (e) {
      await sendMessage(chatId, `Error fetching claimable rewards: ${e.message}`);
    }
    return;
  }

  if (command === "/history") {
    const parts = text.split(" ");
    const pubkey = parts[1];
    if (!pubkey) {
      await sendMessage(chatId, "Usage: /history <walletPubkey>");
      return;
    }
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getSignaturesForAddress",
          params: [pubkey, { limit: 6 }],
        }),
      });
      const j = await res.json();
      const signatures = j.result || [];
      if (!signatures.length) {
        await sendMessage(chatId, `No recent transactions found for ${pubkey}`);
        return;
      }

      const entries = [];
      for (const sig of signatures) {
        try {
          const txRes = await fetch(rpc, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "getTransaction",
              params: [sig.signature, { commitment: "confirmed" }],
            }),
          });
          const txJson = await txRes.json();
          const parsed = parseHistoryEntry(txJson.result);
          if (parsed) {
            entries.push(`${sig.signature.slice(0, 8)}… | ${parsed.label} | ${parsed.amount.toFixed(4)} SOL`);
          } else {
            entries.push(`${sig.signature.slice(0, 8)}… | ${sig.err ? "error" : "confirmed"} | slot ${sig.slot}`);
          }
        } catch {
          entries.push(`${sig.signature.slice(0, 8)}… | slot ${sig.slot}`);
        }
      }

      await sendMessage(chatId, `Recent activity for ${pubkey}:\n` + entries.join("\n"));
    } catch (e) {
      await sendMessage(chatId, `Error fetching history: ${e.message}`);
    }
    return;
  }

  await sendMessage(chatId, "Unknown command. Try /help.");
}

async function main() {
  const botInfo = await telegram("getMe");
  console.log(`Telegram bot started as @${botInfo.username}`);

  let offset = 0;
  while (true) {
    try {
      const updates = await telegram("getUpdates", { offset, timeout: 30 });
      for (const update of updates) {
        offset = update.update_id + 1;
        handleUpdate(update).catch((error) => {
          console.error("Failed to handle update:", error);
        });
      }
    } catch (error) {
      console.error("Polling error:", error);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

main().catch((error) => {
  console.error("Bot failed to start:", error);
  process.exit(1);
});
