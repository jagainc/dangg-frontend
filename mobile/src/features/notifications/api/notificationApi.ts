/**
 * Notifications inbox API. DEV_MODE returns 12 mixed mock items.
 */
import { Env } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { getSupabaseClient } from '@core/network/supabaseClient';

export type NotificationKind = 'chatRequest' | 'paymentReceived' | 'verificationUpdate' | 'system';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  occurredAt: Date;
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeMockNotifications(): ReadonlyArray<AppNotification> {
  const now = Date.now();
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  return [
    {
      id: 'n1',
      kind: 'chatRequest',
      title: 'Vikram M. wants to chat',
      body: 'Tap to view request before it auto-declines',
      read: false,
      occurredAt: new Date(now - 2 * minute),
    },
    {
      id: 'n2',
      kind: 'paymentReceived',
      title: 'Payment received',
      body: 'Rahul S. sent you ₹125 for an 18-minute chat',
      read: false,
      occurredAt: new Date(now - 35 * minute),
    },
    {
      id: 'n3',
      kind: 'system',
      title: 'Today’s tip',
      body: 'Going online during evenings boosts your earnings by ~30%',
      read: false,
      occurredAt: new Date(now - 4 * hour),
    },
    {
      id: 'n4',
      kind: 'paymentReceived',
      title: 'Payment received',
      body: 'Aryan K. sent you ₹75',
      read: true,
      occurredAt: new Date(now - 8 * hour),
    },
    {
      id: 'n5',
      kind: 'verificationUpdate',
      title: 'Verification approved',
      body: 'You’re verified! You can now go online and receive chat requests',
      read: true,
      occurredAt: new Date(now - day),
    },
    {
      id: 'n6',
      kind: 'chatRequest',
      title: 'Karan B. wants to chat',
      body: 'Request declined automatically after 30 seconds',
      read: true,
      occurredAt: new Date(now - day - 4 * hour),
    },
    {
      id: 'n7',
      kind: 'paymentReceived',
      title: 'Payout completed',
      body: '₹5,000 transferred to bank ••5432',
      read: true,
      occurredAt: new Date(now - 2 * day),
    },
    {
      id: 'n8',
      kind: 'system',
      title: 'Profile picture update',
      body: 'A clear profile photo can help you attract more chats',
      read: true,
      occurredAt: new Date(now - 3 * day),
    },
    {
      id: 'n9',
      kind: 'paymentReceived',
      title: 'Payment received',
      body: 'Sahil R. sent you ₹165',
      read: true,
      occurredAt: new Date(now - 3 * day - hour),
    },
    {
      id: 'n10',
      kind: 'verificationUpdate',
      title: 'Welcome to Dangg',
      body: 'Your account is being set up. Verification usually completes within 48 hours',
      read: true,
      occurredAt: new Date(now - 5 * day),
    },
    {
      id: 'n11',
      kind: 'paymentReceived',
      title: 'Payment received',
      body: 'Anonymous user sent you ₹60',
      read: true,
      occurredAt: new Date(now - 6 * day),
    },
    {
      id: 'n12',
      kind: 'system',
      title: 'Weekly summary',
      body: 'You earned ₹8,750 this week. Great work!',
      read: true,
      occurredAt: new Date(now - 7 * day),
    },
  ];
}

/** Returns all notifications, newest first. */
export async function listNotifications(): Promise<ReadonlyArray<AppNotification>> {
  if (Env.devMode) {
    await sleep(400);
    return makeMockNotifications();
  }
  const { data, error } = await getSupabaseClient()
    .from('notifications')
    .select('*')
    .order('occurred_at', { ascending: false });
  if (error) {
    throw mapSupabaseError(error);
  }
  return (data ?? []) as AppNotification[];
}

/** Mark a single notification as read (optimistic). */
export async function markRead(id: string): Promise<void> {
  if (Env.devMode) {
    await sleep(150);
    return;
  }
  const { error } = await getSupabaseClient()
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) {
    throw mapSupabaseError(error);
  }
}

/** Mark every unread notification as read. */
export async function markAllRead(): Promise<void> {
  if (Env.devMode) {
    await sleep(300);
    return;
  }
  const { error } = await getSupabaseClient()
    .from('notifications')
    .update({ read: true })
    .eq('read', false);
  if (error) {
    throw mapSupabaseError(error);
  }
}
