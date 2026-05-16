/**
 * Browse-females API for the Male Home screen.
 * DEV_MODE returns 30 mock female profiles with deterministic-but-varied data.
 */
import { Env } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { getSupabaseClient } from '@core/network/supabaseClient';

import { type FemaleFilters } from '../store/femaleFiltersStore';

export type AvailableFemale = {
  id: string;
  name: string;
  age: number;
  rating: number;
  totalChats: number;
  /** Public-facing avatar URL — pravatar/Cloudinary in prod. */
  imageUrl: string;
  isOnline: boolean;
  isNew: boolean;
  isVerified: boolean;
  coinPrice: number;
  averageResponseMinutes: number;
  bio: string;
  /** Indexed lookup for the favorites store. */
  isFavorited: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const NAMES: ReadonlyArray<string> = [
  'Priya',
  'Anjali',
  'Sneha',
  'Riya',
  'Neha',
  'Tanya',
  'Kavya',
  'Pooja',
  'Aishwarya',
  'Divya',
  'Meera',
  'Rhea',
  'Isha',
  'Sanjana',
  'Tara',
  'Nikita',
  'Ananya',
  'Kriti',
  'Shreya',
  'Vidya',
  'Lakshmi',
  'Aditi',
  'Maya',
  'Sara',
  'Diya',
  'Naina',
  'Saanvi',
  'Ira',
  'Ritika',
  'Sia',
];

const BIOS: ReadonlyArray<string> = [
  'Friendly chats welcome! I love deep conversations about life, music, and travel.',
  'Looking for genuine conversations. Available evenings.',
  "Let's talk! I'm into movies, food, and life stories.",
  'Chatty soul. Great listener. Pet lover.',
  'Coffee + conversation = perfect evening.',
  'Foodie, traveler, dreamer. Tell me your story.',
];

/** Deterministic but feels random — same id → same fields every call. */
function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) % 0x7fffffff;
  }
  return Math.abs(h);
}

function mockFemale(index: number, favoritedIds: ReadonlySet<string>): AvailableFemale {
  const id = `f${index}`;
  const h = hash(id);
  const name = NAMES[index % NAMES.length] ?? 'Anon';
  const age = 20 + (h % 13); // 20..32
  const rating = 3.5 + (h % 16) / 10; // 3.5..5.0
  const totalChats = 30 + (h % 300);
  const isOnline = h % 10 < 7; // ~70% online
  const isNew = h % 13 === 0; // ~7.7% new
  const isVerified = h % 4 !== 0; // ~75% verified
  const priceOptions = [50, 50, 50, 75, 100];
  const coinPrice = priceOptions[h % priceOptions.length] ?? 50;
  const averageResponseMinutes = 1 + (h % 8);
  const bio = BIOS[h % BIOS.length] ?? BIOS[0]!;
  // Pravatar offers ~70 unique avatars. Cycle through them.
  const avatarId = (h % 70) + 1;
  const imageUrl = `https://i.pravatar.cc/600?img=${avatarId}`;
  return {
    id,
    name,
    age,
    rating: Math.round(rating * 10) / 10,
    totalChats,
    imageUrl,
    isOnline,
    isNew,
    isVerified,
    coinPrice,
    averageResponseMinutes,
    bio,
    isFavorited: favoritedIds.has(id),
  };
}

/** Local in-memory favorites set (DEV only). Production: a `favorites` table. */
const mockFavorites = new Set<string>(['f2', 'f5', 'f9']);

function applyFilters(
  all: ReadonlyArray<AvailableFemale>,
  filters: FemaleFilters,
): ReadonlyArray<AvailableFemale> {
  let out = [...all];

  switch (filters.quick) {
    case 'online':
      out = out.filter(f => f.isOnline);
      break;
    case 'new':
      out = out.filter(f => f.isNew);
      break;
    case 'topRated':
      out = out.filter(f => f.rating >= 4.5);
      break;
    case 'favorites':
      out = out.filter(f => f.isFavorited);
      break;
    case 'all':
      break;
  }

  if (filters.onlineOnly) {
    out = out.filter(f => f.isOnline);
  }
  out = out.filter(f => f.age >= filters.ageMin && f.age <= filters.ageMax);

  switch (filters.rating) {
    case '3plus':
      out = out.filter(f => f.rating >= 3);
      break;
    case '4plus':
      out = out.filter(f => f.rating >= 4);
      break;
    case '4_5plus':
      out = out.filter(f => f.rating >= 4.5);
      break;
    case 'any':
      break;
  }

  switch (filters.price) {
    case 'le50':
      out = out.filter(f => f.coinPrice <= 50);
      break;
    case '51to100':
      out = out.filter(f => f.coinPrice > 50 && f.coinPrice <= 100);
      break;
    case '100plus':
      out = out.filter(f => f.coinPrice > 100);
      break;
    case 'any':
      break;
  }

  switch (filters.sortBy) {
    case 'rating':
      out.sort((a, b) => b.rating - a.rating);
      break;
    case 'price':
      out.sort((a, b) => a.coinPrice - b.coinPrice);
      break;
    case 'active':
      out.sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
      break;
    case 'recent':
    default:
      // Mock data has no `createdAt` — keep the source order.
      break;
  }

  return out;
}

/** Paginated browse list, applying the current Zustand filter snapshot. */
export async function browseFemales(
  filters: FemaleFilters,
  pageSize = 20,
  offset = 0,
): Promise<{ items: ReadonlyArray<AvailableFemale>; hasMore: boolean; totalOnline: number }> {
  if (Env.devMode) {
    await sleep(300);
    const all: AvailableFemale[] = [];
    for (let i = 1; i <= 30; i++) {
      all.push(mockFemale(i, mockFavorites));
    }
    const filtered = applyFilters(all, filters);
    const slice = filtered.slice(offset, offset + pageSize);
    const totalOnline = all.filter(f => f.isOnline).length;
    return { items: slice, hasMore: offset + pageSize < filtered.length, totalOnline };
  }
  // Production: a paginated Supabase RPC respecting filters.
  const { data, error } = await getSupabaseClient().rpc('browse_females', {
    p_filters: filters,
    p_offset: offset,
    p_limit: pageSize,
  });
  if (error) {
    throw mapSupabaseError(error);
  }
  return data as Awaited<ReturnType<typeof browseFemales>>;
}

/** Returns the male's favorited females for the horizontal carousel on Home. */
export async function listFavorites(): Promise<ReadonlyArray<AvailableFemale>> {
  if (Env.devMode) {
    await sleep(150);
    const out: AvailableFemale[] = [];
    for (let i = 1; i <= 30; i++) {
      const f = mockFemale(i, mockFavorites);
      if (f.isFavorited) {
        out.push(f);
      }
    }
    return out;
  }
  const { data, error } = await getSupabaseClient().rpc('male_favorites');
  if (error) {
    throw mapSupabaseError(error);
  }
  return (data ?? []) as AvailableFemale[];
}

/** Toggle a female in/out of the male's favorites. Optimistic by caller. */
export async function toggleFavorite(femaleId: string): Promise<boolean> {
  if (Env.devMode) {
    await sleep(120);
    if (mockFavorites.has(femaleId)) {
      mockFavorites.delete(femaleId);
      return false;
    }
    mockFavorites.add(femaleId);
    return true;
  }
  const { data, error } = await getSupabaseClient().rpc('toggle_favorite', {
    p_female_id: femaleId,
  });
  if (error) {
    throw mapSupabaseError(error);
  }
  return Boolean((data as { favorited?: boolean } | null)?.favorited);
}

/** Fetches a single female profile by id (for Female Profile Preview screen). */
export async function getFemaleById(femaleId: string): Promise<AvailableFemale | null> {
  if (Env.devMode) {
    await sleep(180);
    const idx = Number.parseInt(femaleId.replace(/^f/, ''), 10);
    if (!Number.isFinite(idx) || idx < 1 || idx > 30) {
      return null;
    }
    return mockFemale(idx, mockFavorites);
  }
  const { data, error } = await getSupabaseClient()
    .from('females')
    .select('*')
    .eq('id', femaleId)
    .maybeSingle();
  if (error) {
    throw mapSupabaseError(error);
  }
  return (data as AvailableFemale | null) ?? null;
}
