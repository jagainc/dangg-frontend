/**
 * Profile data + avatar lifecycle.
 *
 * Avatar uploads go through Cloudinary in production; DEV_MODE returns a
 * stub URL. Password change delegates to `authApi`.
 */
import { Env } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { AppException, AuthException } from '@core/network/apiException';
import { getSupabaseClient } from '@core/network/supabaseClient';

import { useSessionStore } from '@store/sessionStore';

export type Profile = {
  name: string;
  maskedPhone: string;
  avatarUrl: string | null;
  verified: boolean;
  ratingAvg: number;
  totalChats: number;
  daysActive: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function maskPhone(phone: string): string {
  const cleaned = phone.replace(/^\+?91/, '').replace(/\s/g, '');
  if (cleaned.length < 4) {
    return '+91 ••••• •••••';
  }
  return `+91 ••••• ••${cleaned.slice(-3)}`;
}

const MOCK_PROFILE: Profile = {
  name: 'Priya Sharma',
  maskedPhone: maskPhone('9876543210'),
  avatarUrl: null,
  verified: true,
  ratingAvg: 4.8,
  totalChats: 156,
  daysActive: 32,
};

/** Returns the logged-in female's profile snapshot. */
export async function getProfile(): Promise<Profile> {
  if (Env.devMode) {
    await sleep(200);
    const session = useSessionStore.getState().session;
    const phone = session?.user.phone ?? '9876543210';
    return { ...MOCK_PROFILE, maskedPhone: maskPhone(phone) };
  }
  const { data, error } = await getSupabaseClient().from('females').select('*').single();
  if (error) {
    throw mapSupabaseError(error);
  }
  const row = data as {
    name: string;
    phone: string;
    avatar_url: string | null;
    verification_status: string;
    rating_avg: number | null;
    total_chats: number | null;
    days_active: number | null;
  };
  return {
    name: row.name,
    maskedPhone: maskPhone(row.phone),
    avatarUrl: row.avatar_url,
    verified: row.verification_status === 'verified',
    ratingAvg: row.rating_avg ?? 0,
    totalChats: row.total_chats ?? 0,
    daysActive: row.days_active ?? 0,
  };
}

/** Uploads a new avatar image. Returns the public URL stored on the profile. */
export async function updateAvatar(localPath: string): Promise<string> {
  if (Env.devMode) {
    await sleep(1200);
    return `https://dev.dangg.app/avatars/${Date.now()}.jpg`;
  }
  // Real flow: upload to Cloudinary, then patch females.avatar_url.
  throw new AppException('SERVER', `updateAvatar production path not wired: ${localPath}`);
}

/** Clears the avatar URL. */
export async function removeAvatar(): Promise<void> {
  if (Env.devMode) {
    await sleep(500);
    return;
  }
  const { error } = await getSupabaseClient()
    .from('females')
    .update({ avatar_url: null })
    .eq('id', 'self');
  if (error) {
    throw mapSupabaseError(error);
  }
}

/**
 * Updates the user's password. The current password is re-verified server-side
 * via a Supabase RPC because `auth.updateUser` doesn't check the existing one.
 * In DEV_MODE the literal `wrong` simulates failure.
 */
export async function changePassword(current: string, next: string): Promise<void> {
  if (Env.devMode) {
    await sleep(600);
    if (current === 'wrong') {
      throw new AuthException('Current password is incorrect');
    }
    return;
  }
  const { error: verifyErr } = await getSupabaseClient().rpc('verify_current_password', {
    current_password: current,
  });
  if (verifyErr) {
    throw mapSupabaseError(verifyErr);
  }
  const { error } = await getSupabaseClient().auth.updateUser({ password: next });
  if (error) {
    throw mapSupabaseError(error);
  }
}

/** Signs the user out and clears the session store. */
export async function signOut(): Promise<void> {
  if (Env.devMode) {
    useSessionStore.getState().clear();
    return;
  }
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) {
    throw mapSupabaseError(error);
  }
  useSessionStore.getState().clear();
}
