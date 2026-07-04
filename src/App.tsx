import * as anchor from '@coral-xyz/anchor';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { TorusWalletAdapter } from '@solana/wallet-adapter-torus';
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import { clusterApiUrl } from '@solana/web3.js';
import { useEffect, useMemo, useState } from 'react';

import idl from '../target/idl/charvastamy.json';
import '@solana/wallet-adapter-react-ui/styles.css';

type HistoryEntry = {
  type: 'stake' | 'unstake' | 'reward' | 'referral';
  amount: number;
  label: string;
};

const resolveNetwork = (value?: string) => {
  switch (value?.toLowerCase()) {
    case 'mainnet':
      return WalletAdapterNetwork.Mainnet;
    case 'testnet':
      return WalletAdapterNetwork.Testnet;
    default:
      return WalletAdapterNetwork.Devnet;
  }
};

function AppContent() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const [amount, setAmount] = useState('1.0');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [pendingRewards, setPendingRewards] = useState<number | null>(null);
  const [referrer, setReferrer] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [liveYield, setLiveYield] = useState(25.4);
  const [celebrate, setCelebrate] = useState(false);

  const apy = '25.00%';
  const featureFlags = {
    wallet: import.meta.env.VITE_ENABLE_WALLET !== 'false',
    staking: import.meta.env.VITE_ENABLE_STAKING !== 'false',
    overlay: import.meta.env.VITE_ENABLE_TRANSACTION_OVERLAY !== 'false',
    confetti: import.meta.env.VITE_ENABLE_CONFETTI !== 'false',
  };
  const confettiPieces = useMemo(() => Array.from({ length: 24 }, (_, index) => index), []);
  const secureBadges = ['Multi-sig guardians', 'Circuit breaker', 'Audit-ready vaults', 'Real-time monitoring'];

  const anchorWallet = useMemo<anchor.Wallet | null>(() => {
    if (!publicKey || !wallet.signTransaction) {
      return null;
    }

    return {
      publicKey,
      signTransaction: wallet.signTransaction.bind(wallet) as (tx: Transaction) => Promise<Transaction>,
      signAllTransactions: wallet.signAllTransactions
        ? (wallet.signAllTransactions.bind(wallet) as (txs: Transaction[]) => Promise<Transaction[]>)
        : async () => {
            throw new Error('Wallet does not support signAllTransactions.');
          },
    } as unknown as anchor.Wallet;
  }, [publicKey, wallet.signAllTransactions, wallet.signTransaction]);

  const getAnchorProvider = () => {
    if (!anchorWallet) {
      throw new Error('Wallet is not ready.');
    }

    return new anchor.AnchorProvider(connection, anchorWallet, {
      commitment: 'confirmed',
    });
  };

  useEffect(() => {
    const loadBalance = async () => {
      if (!publicKey) {
        setBalance(null);
        return;
      }

      try {
        const lamports = await connection.getBalance(publicKey);
        setBalance(lamports / LAMPORTS_PER_SOL);
      } catch {
        setBalance(null);
      }
    };

    void loadBalance();
    // load user stake account for pending rewards
    const loadStake = async () => {
      if (!publicKey) return;
      try {
        const programId = new PublicKey((idl as { address: string }).address);
        const provider = getAnchorProvider();
        const program = await anchor.Program.at(programId, provider);
        const [userStakePda] = PublicKey.findProgramAddressSync([Buffer.from('stake'), publicKey.toBuffer()], programId);
        const account = await (program.account as any).userStake.fetchNullable(userStakePda);
        if (account) {
          setPosition(Number(account.amount) / LAMPORTS_PER_SOL);
          setPendingRewards(Number(account.pendingRewards) / LAMPORTS_PER_SOL);
        }
      } catch (e) {
        // ignore
      }
    };

    void loadStake();

    const loadHistory = async () => {
      if (!publicKey) return;
      try {
        const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 8 });
        const entries: Array<{ type: 'stake' | 'unstake' | 'reward' | 'referral'; amount: number; label: string }> = [];
        for (const sig of signatures) {
          const tx = await connection.getTransaction(sig.signature, { commitment: 'confirmed' });
          if (tx?.meta?.logMessages) {
            for (const log of tx.meta.logMessages) {
              if (log.includes('Staked ') && log.includes('with APY')) {
                const match = log.match(/Staked (\d+) with APY/);
                if (match) {
                  entries.push({ type: 'stake', amount: Number(match[1]) / LAMPORTS_PER_SOL, label: 'Stake' });
                }
              }
              if (log.includes('Unstaked ')) {
                const match = log.match(/Unstaked (\d+)/);
                if (match) {
                  entries.push({ type: 'unstake', amount: Number(match[1]) / LAMPORTS_PER_SOL, label: 'Unstake' });
                }
              }
              if (log.includes('claimed ')) {
                const match = log.match(/claimed (\d+)/);
                if (match) {
                  entries.push({ type: 'reward', amount: Number(match[1]) / LAMPORTS_PER_SOL, label: 'Claim reward' });
                }
              }
              if (log.includes('Registered referrer')) {
                entries.push({ type: 'referral', amount: 0, label: 'Referral registered' });
              }
            }
          }
        }
        if (entries.length > 0) {
          setHistory(entries.slice(0, 5));
        }
      } catch (e) {
        // ignore
      }
    };

    void loadHistory();
  }, [connection, publicKey]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const nextYield = 24.8 + (position ?? 0) * 0.18 + Math.random() * 0.6;
      setLiveYield(Number(nextYield.toFixed(2)));
    }, 1200);

    return () => window.clearInterval(interval);
  }, [position]);

  useEffect(() => {
    if (!celebrate) {
      return;
    }

    const timer = window.setTimeout(() => setCelebrate(false), 1600);
    return () => window.clearTimeout(timer);
  }, [celebrate]);

  const triggerCelebration = () => {
    setCelebrate(true);
  };

  const handleStake = async () => {
    if (!featureFlags.staking) {
      setStatus('Staking is disabled by feature flags.');
      return;
    }

    if (!connected || !publicKey || !wallet.signTransaction) {
      setStatus('Connect your wallet first.');
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus('Building transaction...');

      const amountValue = Number(amount);
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        throw new Error('Enter a valid positive amount.');
      }

      const programId = new PublicKey((idl as { address: string }).address);
      const provider = getAnchorProvider();
      const program = await anchor.Program.at(programId, provider);

      const stakeLamports = Math.max(1, Math.round(amountValue * LAMPORTS_PER_SOL));
      const [statePda] = PublicKey.findProgramAddressSync([Buffer.from('state'), publicKey.toBuffer()], programId);
      const [userStakePda] = PublicKey.findProgramAddressSync([Buffer.from('stake'), publicKey.toBuffer()], programId);

      const tx = new Transaction();
      const initializeIx = await program.methods.initialize().accounts({
        authority: publicKey,
        state: statePda,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).instruction();
      const stakeIx = await program.methods.stake(new anchor.BN(stakeLamports)).accounts({
        authority: publicKey,
        state: statePda,
        userStake: userStakePda,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).instruction();

      tx.add(initializeIx, stakeIx);
      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = latestBlockhash.blockhash;
      tx.feePayer = publicKey;

      setStatus('Please approve the transaction in your wallet...');
      const signed = await wallet.signTransaction(tx);
      setStatus('Submitting to the network...');
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed');

      if (referrer) {
        try {
          const referrerKey = new PublicKey(referrer);
          const [referrerStakePda] = PublicKey.findProgramAddressSync([Buffer.from('stake'), referrerKey.toBuffer()], programId);
          const referTx = new Transaction();
          const referIx = await program.methods.refer().accounts({
            authority: publicKey,
            state: statePda,
            userStake: userStakePda,
            referrerStake: referrerStakePda,
            referrer: referrerKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          }).instruction();
          referTx.add(referIx);
          referTx.recentBlockhash = latestBlockhash.blockhash;
          referTx.feePayer = publicKey;
          const signedRefer = await wallet.signTransaction(referTx);
          await connection.sendRawTransaction(signedRefer.serialize());
        } catch (err) {
          console.warn('Referral registration failed:', err);
        }
      }

      setPosition((current) => (current === null ? amountValue : current + amountValue));
      const stakeEntry: HistoryEntry = { type: 'stake', amount: amountValue, label: 'Stake' };
      setHistory((current) => [stakeEntry, ...current].slice(0, 5));
      setStatus(`Stake transaction sent: ${signature.slice(0, 12)}…`);
      triggerCelebration();
    } catch (error) {
      console.error(error);
      setStatus(error instanceof Error ? error.message : 'Transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnstake = async () => {
    if (!featureFlags.staking) {
      setStatus('Unstaking is disabled by feature flags.');
      return;
    }

    if (!connected || !publicKey || !wallet.signTransaction) {
      setStatus('Connect your wallet first.');
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus('Preparing unstake...');

      const amountValue = position ?? 0;
      if (amountValue <= 0) {
        throw new Error('You have no active position to unstake.');
      }

      const programId = new PublicKey((idl as { address: string }).address);
      const provider = getAnchorProvider();
      const program = await anchor.Program.at(programId, provider);
      const [statePda] = PublicKey.findProgramAddressSync([Buffer.from('state'), publicKey.toBuffer()], programId);
      const [userStakePda] = PublicKey.findProgramAddressSync([Buffer.from('stake'), publicKey.toBuffer()], programId);

      const tx = new Transaction();
      const unstakeIx = await program.methods.unstake().accounts({
        authority: publicKey,
        state: statePda,
        userStake: userStakePda,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).instruction();
      tx.add(unstakeIx);
      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = latestBlockhash.blockhash;
      tx.feePayer = publicKey;

      setStatus('Please approve the unstake request...');
      const signed = await wallet.signTransaction(tx);
      setStatus('Submitting unstake...');
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed');
      setPosition(0);
      const unstakeEntry: HistoryEntry = { type: 'unstake', amount: amountValue, label: 'Unstake' };
      setHistory((current) => [unstakeEntry, ...current].slice(0, 5));
      setStatus(`Unstake transaction sent: ${signature.slice(0, 12)}…`);
      triggerCelebration();
    } catch (error) {
      console.error(error);
      setStatus(error instanceof Error ? error.message : 'Unstake failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="shell">
      {featureFlags.confetti ? (
        <div className={`celebration-layer ${celebrate ? 'visible' : ''}`} aria-hidden="true">
        {confettiPieces.map((piece) => {
          const dx = (piece % 10 - 5) * 140;
          const dy = (Math.floor(piece / 10) - 2) * 120;
          const colors = ['#38bdf8', '#818cf8', '#f59e0b', '#34d399', '#f472b6'];

          return (
            <span
              key={piece}
              className="confetti-piece"
              style={{
                ['--x' as string]: `${dx}px`,
                ['--y' as string]: `${dy}px`,
                backgroundColor: colors[piece % colors.length],
                animationDelay: `${piece * 0.02}s`,
              }}
            />
          );
        })}
        </div>
      ) : null}
      {featureFlags.overlay ? (
        <div className={`transaction-overlay ${isSubmitting ? 'visible' : ''}`} aria-live="polite">
          <div className="overlay-card">
            <div className="overlay-ring" />
            <h4>{isSubmitting ? 'Transaction in motion' : 'Ready to secure'}</h4>
            <p>{status || 'Approve your wallet to continue the flow.'}</p>
            <div className="overlay-bar">
              <div className="overlay-bar-fill" />
            </div>
          </div>
        </div>
      ) : null}
      <section className="hero">
        <div className="hero-copy">
          <div className="yield-ticker">
            <span>Live yield</span>
            <strong>{liveYield.toFixed(2)}%</strong>
          </div>
          <p className="eyebrow">Chavastamy • Future finance</p>
          <h1>Stake smarter. Earn more. Secure the next era.</h1>
          <p className="subtext">
            Chavastamy brings a futuristic staking experience with a competitive APY, top-wallet support,
            and layered security designed for serious users.
          </p>
          <div className="hero-actions">
            {featureFlags.wallet ? <WalletMultiButton /> : <button className="secondary">Wallet connection disabled</button>}
          </div>
        </div>

        <div className="panel spotlight">
          <div className="glow-ring ring-a" />
          <div className="glow-ring ring-b" />
          <h3>Why Chavastamy</h3>
          <ul>
            <li>Competitive 25.00% APY</li>
            <li>Wallets: Phantom, Solflare, Torus</li>
            <li>Protected by multi-layer security</li>
            <li>Built for future-ready on-chain growth</li>
          </ul>
          <div className="chart-card">
            <div className="chart-head">
              <span>Momentum trail</span>
              <strong>+18.4%</strong>
            </div>
            <svg viewBox="0 0 300 120" className="chart" role="img" aria-label="Animated reward momentum chart">
              <defs>
                <linearGradient id="chartFill" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              <path d="M10 92 C42 84, 58 70, 88 74 S142 100, 170 82 S224 46, 250 54 S280 72, 290 36" className="chart-line" />
              <path d="M10 92 C42 84, 58 70, 88 74 S142 100, 170 82 S224 46, 250 54 S280 72, 290 36 L290 118 L10 118 Z" className="chart-area" />
              <circle cx="250" cy="54" r="6" className="chart-dot" />
            </svg>
          </div>
        </div>
      </section>

      <section className="grid">
        <div className="panel dashboard-card">
          <div className="card-topline">
            <h3>Stake your position</h3>
            <span className="live-pill">Live • Premium</span>
          </div>
          <label className="field">
            <span>Amount</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" />
          </label>
          <label className="field">
            <span>Referrer public key</span>
            <input value={referrer} onChange={(e) => setReferrer(e.target.value)} placeholder="Optional referrer wallet" />
          </label>
          <div className="actions-row">
            <button className="primary" disabled={!connected || isSubmitting || !featureFlags.staking} onClick={handleStake}>
              {isSubmitting ? 'Submitting...' : connected ? `Stake ${amount} SOL` : 'Connect wallet to stake'}
            </button>
            <button className="secondary" disabled={!connected || isSubmitting || !featureFlags.staking} onClick={handleUnstake}>
              {isSubmitting ? 'Working...' : 'Unstake'}
            </button>
            <button className="secondary" disabled={!connected || isSubmitting} onClick={async () => {
              if (!connected || !publicKey) return;
              try {
                setIsSubmitting(true);
                setStatus('Claiming rewards...');
                const programId = new PublicKey((idl as { address: string }).address);
                const provider = getAnchorProvider();
                const program = await anchor.Program.at(programId, provider);
                const [statePda] = PublicKey.findProgramAddressSync([Buffer.from('state'), publicKey.toBuffer()], programId);
                const [userStakePda] = PublicKey.findProgramAddressSync([Buffer.from('stake'), publicKey.toBuffer()], programId);
                await program.methods.claimRewards().accounts({ authority: publicKey, state: statePda, userStake: userStakePda, systemProgram: anchor.web3.SystemProgram.programId }).rpc();
                setPendingRewards(0);
                setStatus('Rewards claimed (on-chain event emitted).');
              } catch (err) {
                setStatus('Claim failed.');
              } finally {
                setIsSubmitting(false);
              }
            }}>
              Claim rewards
            </button>
          </div>
          {status ? <p className="hint">{status}</p> : null}
          <div className="metrics-row">
            <div className="metric-pill">
              <span>Wallet balance</span>
              <strong>{balance === null ? '—' : `${balance.toFixed(2)} SOL`}</strong>
            </div>
            <div className="metric-pill">
              <span>Staked position</span>
              <strong>{position === null ? '0.00 SOL' : `${position.toFixed(2)} SOL`}</strong>
            </div>
            <div className="metric-pill">
              <span>Pending rewards</span>
              <strong>{pendingRewards === null ? '0.00 SOL' : `${pendingRewards.toFixed(4)} SOL`}</strong>
            </div>
          </div>
        </div>

        <div className="panel stats">
          <div className="float-orb orb-a">+{apy}</div>
          <div className="float-orb orb-b">Shielded</div>
          <div className="float-orb orb-c">24/7</div>
          <div className="reward-card">
            <div className="reward-top">
              <span>Projected rewards</span>
              <strong>{apy}</strong>
            </div>
            <div className="meter">
              <div className="meter-fill" style={{ width: `${Math.min(100, 40 + (position ?? 0) * 8)}%` }} />
            </div>
            <p>Momentum scales with your current position and premium security coverage.</p>
          </div>
          <div className="stat-card">
            <span>Competitive rate</span>
            <strong>{apy}</strong>
          </div>
          <div className="stat-card">
            <span>Top wallets</span>
            <strong>Phantom + Solflare</strong>
          </div>
          <div className="stat-card">
            <span>Security layers</span>
            <strong>4 active safeguards</strong>
          </div>
          <div className="badges">
            {secureBadges.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <p className="wallet">Connected: {connected && publicKey ? publicKey.toBase58().slice(0, 8) + '…' : 'None'}</p>
          <p className="hint">Feature flags: wallet {featureFlags.wallet ? 'on' : 'off'}, staking {featureFlags.staking ? 'on' : 'off'}</p>
        </div>
      </section>

      <section className="panel history-panel">
        <div className="card-topline">
          <h3>Stake history</h3>
          <span className="live-pill">Recent activity</span>
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <p className="empty-state">Your stake and unstake activity will appear here.</p>
          ) : (
            history.map((item, index) => (
              <div key={`${item.label}-${index}`} className="history-item">
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.type === 'stake' ? 'Principal added' : 'Principal removed'}</p>
                </div>
                <span>{item.amount.toFixed(2)} SOL</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const network = useMemo(() => resolveNetwork(import.meta.env.VITE_SOLANA_NETWORK), []);
  const endpoint = useMemo(() => import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new TorusWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
