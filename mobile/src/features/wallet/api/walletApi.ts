/**
 * Male wallet API — balance, purchases, transactions.
 * DEV_MODE returns realistic mocks; production hits Supabase + Razorpay webhook.
 */
import { Env } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { getSupabaseClient } from '@core/network/supabaseClient';

import { COIN_PACKAGES, type CoinPackage, getPackageById, totalCoinsFor } from '../constants';
import { useWalletStore } from '../store/walletStore';

export type WalletTransactionKind = 'purchase' | 'chat' | 'refund';
export type WalletTransactionStatus = 'completed' | 'processing' | 'failed';

export type WalletTransaction = {
  id: string;
  kind: WalletTransactionKind;
  title: string;
  subtitle: string;
  /** Signed in COINS — positive credits, negative debits. */
  coinDelta: number;
  status: WalletTransactionStatus;
  occurredAt: Date;
};

export type WalletTransactionFilter = 'all' | 'purchase' | 'chat' | 'refund';

export type PaymentOutcome =
  | { ok: true; transactionId: string; coinsAdded: number; bonusCoins: number; newBalance: number }
  | { ok: false; reason: string };

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const MOCK_STARTING_BALANCE = 350;

let initialized = false;

/** Initial fetch of the male's wallet snapshot — call once at login. */
export async function fetchWalletSnapshot(): Promise<{
  coinBalance: number;
  totalCoinsPurchased: number;
  chatsStarted: number;
}> {
  if (Env.devMode) {
    await sleep(200);
    if (!initialized) {
      useWalletStore.getState().setBalance(MOCK_STARTING_BALANCE);
      useWalletStore.getState().setTotals({ totalCoinsPurchased: 1500, chatsStarted: 24 });
      initialized = true;
    }
    const s = useWalletStore.getState();
    return {
      coinBalance: s.coinBalance,
      totalCoinsPurchased: s.totalCoinsPurchased,
      chatsStarted: s.chatsStarted,
    };
  }
  const { data, error } = await getSupabaseClient().rpc('male_wallet_snapshot');
  if (error) {
    throw mapSupabaseError(error);
  }
  return data as { coinBalance: number; totalCoinsPurchased: number; chatsStarted: number };
}

/** Returns the static coin-package catalogue. Same shape in dev + prod. */
export function listPackages(): ReadonlyArray<CoinPackage> {
  return COIN_PACKAGES;
}

/**
 * Simulates a payment via Razorpay. DEV_MODE branches on the `outcome`
 * parameter (set by the dev-tools buttons on the processing screen).
 * Production will be replaced by a real RazorpayCheckout.open() flow.
 */
export async function processPayment(
  packageId: string,
  outcome: 'success' | 'failure' = 'success',
): Promise<PaymentOutcome> {
  const pkg = getPackageById(packageId);
  if (!pkg) {
    return { ok: false, reason: 'Unknown package' };
  }
  if (Env.devMode) {
    await sleep(900);
    if (outcome === 'failure') {
      const reasons = [
        'Payment was cancelled',
        'Insufficient funds',
        'Network error',
        'Bank declined the transaction',
      ];
      const pick = reasons[Math.floor(Math.random() * reasons.length)] ?? 'Payment failed';
      return { ok: false, reason: pick };
    }
    const coinsAdded = totalCoinsFor(pkg);
    useWalletStore.getState().credit(coinsAdded);
    const newBalance = useWalletStore.getState().coinBalance;
    return {
      ok: true,
      transactionId: `dev-txn-${Date.now()}`,
      coinsAdded,
      bonusCoins: pkg.bonusCoins,
      newBalance,
    };
  }
  // Real Razorpay flow lives outside this stub — wire when SDK is added.
  throw new Error('processPayment production path not yet wired');
}

function makeMockTransactions(): ReadonlyArray<WalletTransaction> {
  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;
  return [
    {
      id: 'wx1',
      kind: 'chat',
      title: 'Chat with Priya S.',
      subtitle: 'Today · 10:23 PM',
      coinDelta: -50,
      status: 'completed',
      occurredAt: new Date(now - 1000 * 60 * 30),
    },
    {
      id: 'wx2',
      kind: 'purchase',
      title: 'Purchased 100 coins',
      subtitle: '₹100 via UPI',
      coinDelta: 100,
      status: 'completed',
      occurredAt: new Date(now - 1000 * 60 * 90),
    },
    {
      id: 'wx3',
      kind: 'chat',
      title: 'Chat with Anjali M.',
      subtitle: 'Yesterday · 8:14 PM',
      coinDelta: -75,
      status: 'completed',
      occurredAt: new Date(now - day),
    },
    {
      id: 'wx4',
      kind: 'refund',
      title: 'Refund — request expired',
      subtitle: 'Yesterday · 7:55 PM',
      coinDelta: 50,
      status: 'completed',
      occurredAt: new Date(now - day - 1000 * 60 * 20),
    },
    {
      id: 'wx5',
      kind: 'purchase',
      title: 'Purchased 500 coins',
      subtitle: '₹500 via Card · +75 bonus',
      coinDelta: 575,
      status: 'completed',
      occurredAt: new Date(now - day * 2),
    },
    {
      id: 'wx6',
      kind: 'chat',
      title: 'Chat with Sneha R.',
      subtitle: '2 days ago · 11:02 PM',
      coinDelta: -100,
      status: 'completed',
      occurredAt: new Date(now - day * 2 - 1000 * 60 * 60),
    },
    {
      id: 'wx7',
      kind: 'chat',
      title: 'Chat with Riya P.',
      subtitle: '3 days ago · 9:34 PM',
      coinDelta: -50,
      status: 'completed',
      occurredAt: new Date(now - day * 3),
    },
    {
      id: 'wx8',
      kind: 'purchase',
      title: 'Purchased 250 coins',
      subtitle: '₹250 via UPI · +25 bonus',
      coinDelta: 275,
      status: 'completed',
      occurredAt: new Date(now - day * 5),
    },
    {
      id: 'wx9',
      kind: 'chat',
      title: 'Chat with Neha K.',
      subtitle: '6 days ago · 7:11 PM',
      coinDelta: -75,
      status: 'completed',
      occurredAt: new Date(now - day * 6),
    },
    {
      id: 'wx10',
      kind: 'refund',
      title: 'Refund — request declined',
      subtitle: '1 week ago',
      coinDelta: 50,
      status: 'completed',
      occurredAt: new Date(now - day * 7),
    },
    {
      id: 'wx11',
      kind: 'chat',
      title: 'Chat with Tanya V.',
      subtitle: '1 week ago · 10:48 PM',
      coinDelta: -50,
      status: 'completed',
      occurredAt: new Date(now - day * 7 - 1000 * 60 * 60),
    },
    {
      id: 'wx12',
      kind: 'purchase',
      title: 'Purchased 1000 coins',
      subtitle: '₹1000 via UPI · +200 bonus',
      coinDelta: 1200,
      status: 'completed',
      occurredAt: new Date(now - day * 10),
    },
    {
      id: 'wx13',
      kind: 'chat',
      title: 'Chat with Kavya N.',
      subtitle: '2 weeks ago · 11:30 PM',
      coinDelta: -100,
      status: 'completed',
      occurredAt: new Date(now - day * 14),
    },
    {
      id: 'wx14',
      kind: 'chat',
      title: 'Chat with Pooja D.',
      subtitle: '3 weeks ago · 8:21 PM',
      coinDelta: -50,
      status: 'completed',
      occurredAt: new Date(now - day * 21),
    },
    {
      id: 'wx15',
      kind: 'purchase',
      title: 'Purchased 100 coins',
      subtitle: '₹100 via UPI',
      coinDelta: 100,
      status: 'completed',
      occurredAt: new Date(now - day * 28),
    },
  ];
}

/** Transaction history, optionally filtered. */
export async function listTransactions(
  filter: WalletTransactionFilter = 'all',
): Promise<ReadonlyArray<WalletTransaction>> {
  if (Env.devMode) {
    await sleep(300);
    const all = makeMockTransactions();
    return filter === 'all' ? all : all.filter(t => t.kind === filter);
  }
  let query = getSupabaseClient()
    .from('male_transactions')
    .select('*')
    .order('occurred_at', { ascending: false });
  if (filter !== 'all') {
    query = query.eq('kind', filter);
  }
  const { data, error } = await query;
  if (error) {
    throw mapSupabaseError(error);
  }
  return (data ?? []) as WalletTransaction[];
}
