/**
 * Earnings + transactions data for the female Earnings dashboard.
 *
 * DEV_MODE returns realistic mock balances and a 15-item transaction list
 * spanning the last month. Production hits the `payouts` + `transactions`
 * tables.
 */
import { Env } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { AppException } from '@core/network/apiException';
import { getSupabaseClient } from '@core/network/supabaseClient';

import { type Trend } from '../../femaleHome/api/femaleHomeApi';

export type EarningsBalance = {
  availableInr: number;
  pendingPayoutInr: number | null;
  monthEarningsInr: number;
  monthTrend: Trend;
  lifetimeEarningsInr: number;
};

export type TransactionKind = 'earning' | 'payout' | 'refund';
export type TransactionStatus = 'completed' | 'processing' | 'failed';

export type Transaction = {
  id: string;
  kind: TransactionKind;
  title: string;
  subtitle: string;
  amountInr: number;
  status: TransactionStatus;
  occurredAt: Date;
};

export type TransactionFilter = 'all' | 'earning' | 'payout' | 'refund';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const MOCK_BALANCE: EarningsBalance = {
  availableInr: 4567.5,
  pendingPayoutInr: 2000,
  monthEarningsInr: 12340,
  monthTrend: { kind: 'up', label: '+18% vs last month' },
  lifetimeEarningsInr: 89250,
};

function makeMockTransactions(): ReadonlyArray<Transaction> {
  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;
  return [
    {
      id: 't1',
      kind: 'earning',
      title: 'Chat with Rahul S.',
      subtitle: 'Today · 18 min',
      amountInr: 125,
      status: 'completed',
      occurredAt: new Date(now - 1000 * 60 * 47),
    },
    {
      id: 't2',
      kind: 'earning',
      title: 'Chat with Vikram M.',
      subtitle: 'Today · 12 min',
      amountInr: 90,
      status: 'completed',
      occurredAt: new Date(now - 1000 * 60 * 180),
    },
    {
      id: 't3',
      kind: 'payout',
      title: 'Payout to bank ••5432',
      subtitle: 'Yesterday · processing',
      amountInr: 2000,
      status: 'processing',
      occurredAt: new Date(now - day),
    },
    {
      id: 't4',
      kind: 'earning',
      title: 'Chat with Aryan K.',
      subtitle: '2 days ago · 6 min',
      amountInr: 30,
      status: 'completed',
      occurredAt: new Date(now - day * 2),
    },
    {
      id: 't5',
      kind: 'earning',
      title: 'Chat with Sahil R.',
      subtitle: '3 days ago · 22 min',
      amountInr: 165,
      status: 'completed',
      occurredAt: new Date(now - day * 3),
    },
    {
      id: 't6',
      kind: 'earning',
      title: 'Chat with Karan B.',
      subtitle: '4 days ago · 11 min',
      amountInr: 80,
      status: 'completed',
      occurredAt: new Date(now - day * 4),
    },
    {
      id: 't7',
      kind: 'payout',
      title: 'Payout to bank ••5432',
      subtitle: '5 days ago · completed',
      amountInr: 5000,
      status: 'completed',
      occurredAt: new Date(now - day * 5),
    },
    {
      id: 't8',
      kind: 'earning',
      title: 'Chat with Anonymous',
      subtitle: '6 days ago · 9 min',
      amountInr: 60,
      status: 'completed',
      occurredAt: new Date(now - day * 6),
    },
    {
      id: 't9',
      kind: 'refund',
      title: 'Refund · disputed chat',
      subtitle: '1 week ago',
      amountInr: 75,
      status: 'completed',
      occurredAt: new Date(now - day * 7),
    },
    {
      id: 't10',
      kind: 'earning',
      title: 'Chat with Rohan P.',
      subtitle: '1 week ago · 14 min',
      amountInr: 110,
      status: 'completed',
      occurredAt: new Date(now - day * 7),
    },
    {
      id: 't11',
      kind: 'earning',
      title: 'Chat with Akash V.',
      subtitle: '10 days ago · 7 min',
      amountInr: 45,
      status: 'completed',
      occurredAt: new Date(now - day * 10),
    },
    {
      id: 't12',
      kind: 'payout',
      title: 'Payout to UPI ramesh@upi',
      subtitle: '2 weeks ago · completed',
      amountInr: 3500,
      status: 'completed',
      occurredAt: new Date(now - day * 14),
    },
    {
      id: 't13',
      kind: 'earning',
      title: 'Chat with Aman J.',
      subtitle: '2 weeks ago · 19 min',
      amountInr: 140,
      status: 'completed',
      occurredAt: new Date(now - day * 16),
    },
    {
      id: 't14',
      kind: 'earning',
      title: 'Chat with Dev S.',
      subtitle: '3 weeks ago · 5 min',
      amountInr: 30,
      status: 'completed',
      occurredAt: new Date(now - day * 20),
    },
    {
      id: 't15',
      kind: 'payout',
      title: 'Payout to bank ••5432',
      subtitle: '1 month ago · completed',
      amountInr: 8000,
      status: 'completed',
      occurredAt: new Date(now - day * 30),
    },
  ];
}

/** Available + pending balances and trend stats for the Earnings hero. */
export async function getEarningsBalance(): Promise<EarningsBalance> {
  if (Env.devMode) {
    await sleep(400);
    return MOCK_BALANCE;
  }
  const { data, error } = await getSupabaseClient().rpc('female_earnings_balance');
  if (error) {
    throw mapSupabaseError(error);
  }
  return data as EarningsBalance;
}

/** Transaction list, optionally filtered by kind. */
export async function listTransactions(
  filter: TransactionFilter = 'all',
): Promise<ReadonlyArray<Transaction>> {
  if (Env.devMode) {
    await sleep(400);
    const all = makeMockTransactions();
    return filter === 'all' ? all : all.filter(t => t.kind === filter);
  }
  let query = getSupabaseClient()
    .from('transactions')
    .select('*')
    .order('occurred_at', { ascending: false });
  if (filter !== 'all') {
    query = query.eq('kind', filter);
  }
  const { data, error } = await query;
  if (error) {
    throw mapSupabaseError(error);
  }
  return (data ?? []) as Transaction[];
}

/** Submits a payout request. Returns the new payout id. */
export async function requestPayout(amountInr: number): Promise<string> {
  if (Env.devMode) {
    await sleep(900);
    return `dev-payout-${Date.now()}`;
  }
  const { data, error } = await getSupabaseClient()
    .from('payouts')
    .insert({ amount_inr: amountInr, status: 'pending' })
    .select('id')
    .single();
  if (error) {
    throw mapSupabaseError(error);
  }
  const id = (data as { id?: string }).id;
  if (!id) {
    throw new AppException('SERVER', 'Payout created without an id');
  }
  return id;
}

/** Updates the saved bank/UPI payout details. */
export async function updatePayoutDetails(payload: {
  kind: 'bank' | 'upi';
  holderName?: string;
  accountNumber?: string;
  ifsc?: string;
  upiId?: string;
}): Promise<void> {
  if (Env.devMode) {
    await sleep(700);
    return;
  }
  const { error } = await getSupabaseClient().from('female_payout_details').upsert(payload);
  if (error) {
    throw mapSupabaseError(error);
  }
}

/** Returns currently-saved payout details for pre-filling the update form. */
export async function getPayoutDetails(): Promise<
  | { kind: 'bank'; holderName: string; accountNumberMasked: string; ifsc: string }
  | { kind: 'upi'; upiId: string }
  | null
> {
  if (Env.devMode) {
    await sleep(200);
    return {
      kind: 'bank',
      holderName: 'Priya Sharma',
      accountNumberMasked: '••••••5432',
      ifsc: 'HDFC0001234',
    };
  }
  const { data, error } = await getSupabaseClient()
    .from('female_payout_details')
    .select('*')
    .maybeSingle();
  if (error) {
    throw mapSupabaseError(error);
  }
  return (data as Awaited<ReturnType<typeof getPayoutDetails>>) ?? null;
}
