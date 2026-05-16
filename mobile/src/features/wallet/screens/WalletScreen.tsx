import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION } from '@core/config/constants';
import { inr } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import FilterChip from '@features/maleHome/components/FilterChip';

import {
  type WalletTransaction,
  type WalletTransactionFilter,
  fetchWalletSnapshot,
  listTransactions,
} from '../api/walletApi';
import CoinPackageCard from '../components/CoinPackageCard';
import CoinPurchaseConfirmModal from '../components/CoinPurchaseConfirmModal';
import SliderTabs from '../components/SliderTabs';
import { COIN_PACKAGES, type CoinPackage, totalCoinsFor } from '../constants';
import { useCoinBalance } from '../store/walletStore';

type Nav = NativeStackNavigationProp<MaleAppStackParamList>;
type WalletTab = 'wallet' | 'transaction';

const TX_FILTERS: ReadonlyArray<{ value: WalletTransactionFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'purchase', label: 'Purchases' },
  { value: 'chat', label: 'Chats' },
  { value: 'refund', label: 'Refunds' },
];

function BellIcon({ withDot }: { withDot: boolean }): React.ReactElement {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
        fill={AppColors.primaryDark}
      />
      {withDot ? <Circle cx={18} cy={6} r={4} fill={AppColors.error} /> : null}
    </Svg>
  );
}

function CoinIconLg({ color }: { color: string }): React.ReactElement {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} fill={color} />
      <Path
        d="M14.5 9.5h-3v1.5h1.25c.55 0 1 .45 1 1s-.45 1-1 1H11v1.5h1.75c.55 0 1 .45 1 1s-.45 1-1 1H9.5v1.5h3v-1c.97-.18 1.75-.99 1.75-2 0-.74-.4-1.39-1-1.74.6-.35 1-1 1-1.74 0-1.1-.9-2-2-2H9.5V8h5v1.5z"
        fill={AppColors.primary}
      />
    </Svg>
  );
}

/**
 * Male Wallet tab with header slider between two sub-views.
 *
 *   * Wallet view — rose gradient balance hero + 6-package grid + sticky buy button.
 *   * Transaction view — filter chips + transaction list.
 *
 * The slider is animated via `SliderTabs` (Reanimated spring on the indicator).
 */
function WalletScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const coinBalance = useCoinBalance();

  const [activeTab, setActiveTab] = useState<WalletTab>('wallet');
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [txFilter, setTxFilter] = useState<WalletTransactionFilter>('all');
  const [transactions, setTransactions] = useState<ReadonlyArray<WalletTransaction>>([]);

  useEffect(() => {
    fetchWalletSnapshot().catch(e => logger.warn('Wallet snapshot failed', e));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWalletSnapshot().catch(e => logger.warn('Wallet snapshot failed', e));
    }, []),
  );

  useEffect(() => {
    if (activeTab !== 'transaction') {
      return;
    }
    listTransactions(txFilter)
      .then(setTransactions)
      .catch(e => logger.warn('Transactions load failed', e));
  }, [activeTab, txFilter]);

  const handleConfirmPurchase = useCallback((): void => {
    if (!selectedPkg) {
      return;
    }
    setConfirmOpen(false);
    navigation.navigate('PaymentProcessing', { packageId: selectedPkg.id });
  }, [navigation, selectedPkg]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={12}
          onPress={() => navigation.navigate('Notifications')}
          style={styles.bellWrap}
        >
          <BellIcon withDot />
        </Pressable>
      </View>

      <View style={styles.sliderWrap}>
        <SliderTabs<WalletTab>
          options={[
            { value: 'wallet', label: 'Wallet' },
            { value: 'transaction', label: 'Transaction' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
      </View>

      {activeTab === 'wallet' ? (
        <WalletView
          coinBalance={coinBalance}
          selectedPkg={selectedPkg}
          onSelectPkg={setSelectedPkg}
          onBuy={() => setConfirmOpen(true)}
        />
      ) : (
        <TransactionView
          filter={txFilter}
          onFilterChange={setTxFilter}
          transactions={transactions}
        />
      )}

      <CoinPurchaseConfirmModal
        visible={confirmOpen}
        pkg={selectedPkg}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmPurchase}
      />
    </SafeAreaView>
  );
}

type WalletViewProps = {
  coinBalance: number;
  selectedPkg: CoinPackage | null;
  onSelectPkg: (pkg: CoinPackage) => void;
  onBuy: () => void;
};

function WalletView({
  coinBalance,
  selectedPkg,
  onSelectPkg,
  onBuy,
}: WalletViewProps): React.ReactElement {
  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.heroCard, AppShadows.e2]}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id="walletHero" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={AppColors.gradientRoseStart} stopOpacity="1" />
                <Stop offset="100%" stopColor={AppColors.gradientRoseEnd} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#walletHero)" />
          </Svg>
          <View style={styles.heroTopRow}>
            <CoinIconLg color={AppColors.surface} />
            <Text style={styles.heroLabel}>Current Balance</Text>
          </View>
          <Text style={styles.heroBalance}>{`${coinBalance} coins`}</Text>
          <Text style={styles.heroEquivalent}>{`≈ ${inr(coinBalance)}`}</Text>
          <Text style={styles.heroHelper}>Buy more to keep chatting</Text>
        </View>

        <Text style={styles.sectionTitle}>Choose a Package</Text>

        <View style={styles.grid}>
          {COIN_PACKAGES.map(pkg => (
            <CoinPackageCard
              key={pkg.id}
              pkg={pkg}
              selected={selectedPkg?.id === pkg.id}
              onPress={() => onSelectPkg(pkg)}
            />
          ))}
        </View>
      </ScrollView>

      {selectedPkg ? (
        <View style={styles.stickyBuy}>
          <PrimaryButton
            label={`Buy ${totalCoinsFor(selectedPkg)} coins for ${inr(selectedPkg.priceInr)}`}
            onPress={onBuy}
          />
        </View>
      ) : null}
    </>
  );
}

type TransactionViewProps = {
  filter: WalletTransactionFilter;
  onFilterChange: (f: WalletTransactionFilter) => void;
  transactions: ReadonlyArray<WalletTransaction>;
};

function TransactionView({
  filter,
  onFilterChange,
  transactions,
}: TransactionViewProps): React.ReactElement {
  return (
    <View style={styles.txWrap}>
      <View style={styles.chipRow}>
        {TX_FILTERS.map(f => (
          <FilterChip
            key={f.value}
            label={f.label}
            active={filter === f.value}
            onPress={() => onFilterChange(f.value)}
          />
        ))}
      </View>

      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Text style={styles.emptyBody}>Your purchases and chats will appear here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.txList}>
          {transactions.map(t => (
            <TxRow key={t.id} item={t} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function TxRow({ item }: { item: WalletTransaction }): React.ReactElement {
  const positive = item.coinDelta > 0;
  const color = useMemo(() => {
    if (item.kind === 'purchase' || item.kind === 'refund') {
      return AppColors.success;
    }
    return AppColors.onSurface;
  }, [item.kind]);
  const sign = positive ? '+' : '';
  return (
    <View style={styles.txRow}>
      <View style={styles.txMiddle}>
        <Text style={styles.txTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.txSubtitle} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color }]}>{`${sign}${item.coinDelta} 🪙`}</Text>
    </View>
  );
}

const BOTTOM_CLEAR = BOTTOM_NAV_HEIGHT + FAB_PROTRUSION + AppSpacing.lg;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.md,
  },
  headerTitle: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
  },
  bellWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  sliderWrap: { paddingHorizontal: AppSpacing.md, marginTop: AppSpacing.sm },
  scroll: { paddingBottom: BOTTOM_CLEAR + 80 },
  heroCard: {
    marginHorizontal: AppSpacing.md,
    marginTop: AppSpacing.md,
    borderRadius: AppRadii.lg,
    padding: AppSpacing.lg,
    overflow: 'hidden',
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.sm },
  heroLabel: {
    ...AppTypography.labelLarge,
    color: AppColors.onPrimary,
    opacity: 0.85,
  },
  heroBalance: {
    ...AppTypography.displayLarge,
    color: AppColors.onPrimary,
    marginTop: 4,
  },
  heroEquivalent: {
    ...AppTypography.bodyMedium,
    color: AppColors.onPrimary,
    opacity: 0.7,
  },
  heroHelper: {
    ...AppTypography.bodySmall,
    color: AppColors.onPrimary,
    opacity: 0.8,
    marginTop: AppSpacing.md,
  },
  sectionTitle: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
    marginHorizontal: AppSpacing.md,
    marginTop: AppSpacing.lg,
    marginBottom: AppSpacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.md,
    rowGap: AppSpacing.sm,
  },
  stickyBuy: {
    position: 'absolute',
    left: AppSpacing.md,
    right: AppSpacing.md,
    bottom: BOTTOM_CLEAR,
  },
  txWrap: { flex: 1 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppSpacing.xs,
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.sm,
  },
  txList: {
    paddingBottom: BOTTOM_CLEAR,
    backgroundColor: AppColors.surface,
    marginTop: AppSpacing.sm,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.divider,
  },
  txMiddle: { flex: 1 },
  txTitle: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
  },
  txSubtitle: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  txAmount: {
    ...AppTypography.bodyLarge,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    padding: AppSpacing.xl,
  },
  emptyTitle: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.md,
  },
  emptyBody: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.xs,
  },
});

export default WalletScreen;
