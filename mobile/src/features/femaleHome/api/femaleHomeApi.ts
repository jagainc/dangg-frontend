/**
 * Female home dashboard data.
 *
 * DEV_MODE returns realistic mock data so the screen looks populated without
 * a backend. Production calls the females view + the recent_activity view.
 */
import { Env } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { getSupabaseClient } from '@core/network/supabaseClient';

export type Trend = { kind: 'up' | 'down' | 'flat'; label: string };

export type HomeStats = {
  todayEarningsInr: number;
  weekEarningsInr: number;
  chatsToday: number;
  ratingAvg: number;
  ratingCount: number;
  todayTrend: Trend;
  weekTrend: Trend;
};

export type Availability = {
  online: boolean;
  lastToggledAt: Date;
};

export type RecentActivityKind = 'chatCompleted' | 'paymentReceived' | 'ratingReceived';

export type RecentActivity = {
  id: string;
  kind: RecentActivityKind;
  actorName: string;
  actorAvatarUrl: string | null;
  description: string;
  amountInr: number | null;
  ratingValue: number | null;
  occurredAt: Date;
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const MOCK_STATS: HomeStats = {
  todayEarningsInr: 1234,
  weekEarningsInr: 8750,
  chatsToday: 23,
  ratingAvg: 4.8,
  ratingCount: 156,
  todayTrend: { kind: 'up', label: '+12% vs yesterday' },
  weekTrend: { kind: 'up', label: '+5%' },
};

const MOCK_ACTIVITY: ReadonlyArray<RecentActivity> = [
  {
    id: 'a1',
    kind: 'paymentReceived',
    actorName: 'Rahul S.',
    actorAvatarUrl: null,
    description: 'Sent you 50 coins',
    amountInr: 125,
    ratingValue: null,
    occurredAt: new Date(Date.now() - 1000 * 60 * 8),
  },
  {
    id: 'a2',
    kind: 'chatCompleted',
    actorName: 'Vikram M.',
    actorAvatarUrl: null,
    description: 'Chat ended · 18 min',
    amountInr: 90,
    ratingValue: null,
    occurredAt: new Date(Date.now() - 1000 * 60 * 47),
  },
  {
    id: 'a3',
    kind: 'ratingReceived',
    actorName: 'Anonymous User',
    actorAvatarUrl: null,
    description: 'Rated your chat 5 stars',
    amountInr: null,
    ratingValue: 5,
    occurredAt: new Date(Date.now() - 1000 * 60 * 120),
  },
  {
    id: 'a4',
    kind: 'paymentReceived',
    actorName: 'Aryan K.',
    actorAvatarUrl: null,
    description: 'Sent you 30 coins',
    amountInr: 75,
    ratingValue: null,
    occurredAt: new Date(Date.now() - 1000 * 60 * 180),
  },
  {
    id: 'a5',
    kind: 'chatCompleted',
    actorName: 'Sahil R.',
    actorAvatarUrl: null,
    description: 'Chat ended · 6 min',
    amountInr: 30,
    ratingValue: null,
    occurredAt: new Date(Date.now() - 1000 * 60 * 360),
  },
];

/** Aggregated stats for the Home dashboard cards. */
export async function getHomeStats(): Promise<HomeStats> {
  if (Env.devMode) {
    await sleep(400);
    return MOCK_STATS;
  }
  const { data, error } = await getSupabaseClient().rpc('female_home_stats');
  if (error) {
    throw mapSupabaseError(error);
  }
  return data as HomeStats;
}

/** Current availability flag + when the user last toggled it. */
export async function getAvailability(): Promise<Availability> {
  if (Env.devMode) {
    await sleep(200);
    return { online: false, lastToggledAt: new Date(Date.now() - 1000 * 60 * 5) };
  }
  const { data, error } = await getSupabaseClient()
    .from('females')
    .select('is_online, last_toggled_at')
    .single();
  if (error) {
    throw mapSupabaseError(error);
  }
  return {
    online: Boolean((data as { is_online?: boolean }).is_online),
    lastToggledAt: new Date((data as { last_toggled_at?: string }).last_toggled_at ?? Date.now()),
  };
}

/** Flip availability on or off. Optimistic UI updates the toggle immediately. */
export async function setAvailability(online: boolean): Promise<void> {
  if (Env.devMode) {
    await sleep(300);
    return;
  }
  const { error } = await getSupabaseClient()
    .from('females')
    .update({ is_online: online, last_toggled_at: new Date().toISOString() })
    .eq('id', 'self');
  if (error) {
    throw mapSupabaseError(error);
  }
}

/** Last ~5 user-facing events for the Recent Activity feed. */
export async function getRecentActivity(): Promise<ReadonlyArray<RecentActivity>> {
  if (Env.devMode) {
    await sleep(400);
    return MOCK_ACTIVITY;
  }
  const { data, error } = await getSupabaseClient().rpc('female_recent_activity', { limit_: 5 });
  if (error) {
    throw mapSupabaseError(error);
  }
  return data as RecentActivity[];
}

/** Unread-notification count for the bell badge. */
export async function getUnreadNotificationCount(): Promise<number> {
  if (Env.devMode) {
    await sleep(100);
    return 3;
  }
  const { count, error } = await getSupabaseClient()
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false);
  if (error) {
    throw mapSupabaseError(error);
  }
  return count ?? 0;
}
