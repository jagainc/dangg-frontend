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

// ---------------------------------------------------------------------------
// Sender-side flow (male initiates).
// ---------------------------------------------------------------------------

export type SentRequestStatus = 'pending' | 'accepted' | 'declined' | 'expired';

/**
 * DEV-only registry of the currently-simulated outcome for each request.
 * The Sent screen polls `getSentRequestStatus`, which reads from this map.
 * Production: read from the chat_requests row directly.
 */
const devSentStatus = new Map<string, SentRequestStatus>();

/** Male initiates a chat request to a female. Returns the new request id. */
export async function sendChatRequest(payload: {
  femaleId: string;
  coinCost: number;
}): Promise<{ requestId: string }> {
  if (Env.devMode) {
    await sleep(500);
    const requestId = `dev-sent-${Date.now()}`;
    devSentStatus.set(requestId, 'pending');
    return { requestId };
  }
  const { data, error } = await getSupabaseClient()
    .from('chat_requests')
    .insert({
      female_id: payload.femaleId,
      coin_cost: payload.coinCost,
      status: 'pending',
    })
    .select('id')
    .single();
  if (error) {
    throw mapSupabaseError(error);
  }
  return { requestId: (data as { id: string }).id };
}

/** Polled by the Sent (waiting) screen. */
export async function getSentRequestStatus(requestId: string): Promise<SentRequestStatus> {
  if (Env.devMode) {
    await sleep(150);
    return devSentStatus.get(requestId) ?? 'pending';
  }
  const { data, error } = await getSupabaseClient()
    .from('chat_requests')
    .select('status')
    .eq('id', requestId)
    .maybeSingle();
  if (error) {
    throw mapSupabaseError(error);
  }
  const status = (data as { status?: string } | null)?.status;
  if (status === 'accepted' || status === 'declined' || status === 'expired') {
    return status;
  }
  return 'pending';
}

/** Male cancels a pending request (refunds coins). */
export async function cancelSentRequest(requestId: string): Promise<void> {
  if (Env.devMode) {
    await sleep(200);
    devSentStatus.set(requestId, 'expired');
    return;
  }
  const { error } = await getSupabaseClient()
    .from('chat_requests')
    .update({ status: 'expired', decline_reason: 'cancelled_by_sender' })
    .eq('id', requestId);
  if (error) {
    throw mapSupabaseError(error);
  }
}

/** DEV-only — flip a sent request to a chosen outcome (for the dev tools button). */
export function simulateSentOutcome(
  requestId: string,
  outcome: Exclude<SentRequestStatus, 'pending'>,
): void {
  if (!Env.devMode) {
    return;
  }
  devSentStatus.set(requestId, outcome);
}
