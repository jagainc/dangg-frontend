/** Coin package catalogue. Constants so the same list drives Wallet UI + receipts. */

export type CoinPackageTag = 'popular' | 'bestDeal' | 'maxValue';

export type CoinPackage = {
  id: string;
  /** Display name only — not user-facing copy. */
  name: string;
  baseCoins: number;
  bonusCoins: number;
  priceInr: number;
  tag: CoinPackageTag | null;
};

export const COIN_PACKAGES: ReadonlyArray<CoinPackage> = [
  { id: 'starter', name: 'Starter', baseCoins: 100, bonusCoins: 0, priceInr: 100, tag: null },
  { id: 'basic', name: 'Basic', baseCoins: 250, bonusCoins: 25, priceInr: 250, tag: null },
  {
    id: 'standard',
    name: 'Standard',
    baseCoins: 500,
    bonusCoins: 75,
    priceInr: 500,
    tag: 'popular',
  },
  { id: 'pro', name: 'Pro', baseCoins: 1000, bonusCoins: 200, priceInr: 1000, tag: null },
  {
    id: 'premium',
    name: 'Premium',
    baseCoins: 2000,
    bonusCoins: 500,
    priceInr: 2000,
    tag: 'bestDeal',
  },
  {
    id: 'mega',
    name: 'Mega',
    baseCoins: 5000,
    bonusCoins: 1500,
    priceInr: 5000,
    tag: 'maxValue',
  },
];

export function getPackageById(id: string): CoinPackage | null {
  return COIN_PACKAGES.find(p => p.id === id) ?? null;
}

/** Total coins delivered for a package (base + bonus). */
export function totalCoinsFor(pkg: CoinPackage): number {
  return pkg.baseCoins + pkg.bonusCoins;
}
