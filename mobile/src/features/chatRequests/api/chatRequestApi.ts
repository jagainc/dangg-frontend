/**
 * Incoming chat request lifecycle.
 *
 * `simulateIncoming` is a DEV-only helper triggered by the DEV button on
 * Female Home; in production these requests arrive via Supabase Realtime
 * subscriptions wired up in `App.tsx`.
 */
import { Env } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { getSupabaseClient } from '@core/network/supabaseClient';

import { useChatRequestStore } from '../store/chatRequestStore';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Female accepts an incoming request — opens chat (Phase 2). */
export async function acceptRequest(requestId: string): Promise<void> {
  if (Env.devMode) {
    await sleep(400);
    return;
  }
  const { error } = await getSupabaseClient()
    .from('chat_requests')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', requestId);
  if (error) {
    throw mapSupabaseError(error);
  }
}

/** Female declines an incoming request (or it auto-declines on timeout). */
export async function declineRequest(
  requestId: string,
  reason: 'manual' | 'timeout' = 'manual',
): Promise<void> {
  if (Env.devMode) {
    await sleep(200);
    return;
  }
  const { error } = await getSupabaseClient()
    .from('chat_requests')
    .update({ status: 'declined', decline_reason: reason, responded_at: new Date().toISOString() })
    .eq('id', requestId);
  if (error) {
    throw mapSupabaseError(error);
  }
}

const MOCK_REQUESTERS = [
  { name: 'Vikram M.', coins: 50 },
  { name: 'Aryan K.', coins: 30 },
  { name: 'Rohan P.', coins: 75 },
  { name: 'Sahil R.', coins: 100 },
] as const;

/** DEV-only — push a fake incoming chat request into the store. */
export function simulateIncoming(): void {
  if (!Env.devMode) {
    return;
  }
  const pick = MOCK_REQUESTERS[Math.floor(Math.random() * MOCK_REQUESTERS.length)];
  if (!pick) {
    return;
  }
  useChatRequestStore.getState().setIncoming({
    id: `dev-req-${Date.now()}`,
    requesterName: pick.name,
    requesterAvatarUrl: null,
    coinAmount: pick.coins,
    receivedAt: new Date(),
  });
}
