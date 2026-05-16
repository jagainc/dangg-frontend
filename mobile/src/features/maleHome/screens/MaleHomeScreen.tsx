import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import Avatar from '@core/components/Avatar';
import PaginationLoader from '@core/components/PaginationLoader';
import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION } from '@core/config/constants';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import { useSessionStore } from '@store/sessionStore';

import { fetchWalletSnapshot } from '@features/wallet/api/walletApi';
import { useCoinBalance } from '@features/wallet/store/walletStore';

import {
  type AvailableFemale,
  browseFemales,
  listFavorites,
  toggleFavorite,
} from '../api/maleHomeApi';
import AvailableFemaleCard from '../components/AvailableFemaleCard';
import FemaleSearchFilterSheet from '../components/FemaleSearchFilterSheet';
import FilterChip from '../components/FilterChip';
import { type QuickFilter, useFemaleFiltersStore } from '../store/femaleFiltersStore';

type Nav = NativeStackNavigationProp<MaleAppStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_HORIZONTAL_PADDING = AppSpacing.md;
const GRID_GAP = AppSpacing.sm + 4;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;
const PAGE_SIZE = 20;

const QUICK_FILTERS: ReadonlyArray<{ value: QuickFilter; label: string; showDot?: boolean }> = [
  { value: 'all', label: 'All' },
  { value: 'online', label: 'Online', showDot: true },
  { value: 'new', label: 'New' },
  { value: 'topRated', label: 'Highly Rated' },
  { value: 'favorites', label: 'Favorites' },
];

function CoinIcon({ size, color }: { size: number; color: string }): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} fill={color} />
      <Path
        d="M14.5 9.5h-3v1.5h1.25c.55 0 1 .45 1 1s-.45 1-1 1H11v1.5h1.75c.55 0 1 .45 1 1s-.45 1-1 1H9.5v1.5h3v-1c.97-.18 1.75-.99 1.75-2 0-.74-.4-1.39-1-1.74.6-.35 1-1 1-1.74 0-1.1-.9-2-2-2H9.5V8h5v1.5z"
        fill={AppColors.surface}
      />
    </Svg>
  );
}

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

function FilterIcon(): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A1 1 0 0 0 18.95 4H5.04a1 1 0 0 0-.79 1.61z"
        fill={AppColors.primary}
      />
    </Svg>
  );
}

function SearchOffIcon(): React.ReactElement {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24">
      <Path
        d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
        fill={AppColors.primary}
      />
    </Svg>
  );
}

function firstNameFromSession(fullName: string | undefined): string {
  if (!fullName) {
    return 'there';
  }
  return fullName.split(/\s+/)[0] ?? fullName;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

/**
 * Male Home — the browse-females surface. 2-column FlashList grid, header
 * with greeting + coin pill + bell, quick filter chip row, favorites
 * carousel, infinite scroll, pull-to-refresh.
 */
function MaleHomeScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const sessionName = useSessionStore(s => s.session?.user.user_metadata?.name);
  const firstName = firstNameFromSession(sessionName);

  const coinBalance = useCoinBalance();
  const filters = useFemaleFiltersStore();
  const setQuick = useFemaleFiltersStore(s => s.setQuick);
  const activeFilterCount = useFemaleFiltersStore(s => s.activeCount)();

  const [items, setItems] = useState<ReadonlyArray<AvailableFemale>>([]);
  const [favorites, setFavorites] = useState<ReadonlyArray<AvailableFemale>>([]);
  const [totalOnline, setTotalOnline] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const filtersSnapshot = useMemo(
    () => ({
      quick: filters.quick,
      onlineOnly: filters.onlineOnly,
      ageMin: filters.ageMin,
      ageMax: filters.ageMax,
      rating: filters.rating,
      price: filters.price,
      sortBy: filters.sortBy,
    }),
    [
      filters.quick,
      filters.onlineOnly,
      filters.ageMin,
      filters.ageMax,
      filters.rating,
      filters.price,
      filters.sortBy,
    ],
  );

  const loadFirstPage = useCallback(async (): Promise<void> => {
    try {
      const {
        items: page,
        hasMore: more,
        totalOnline: online,
      } = await browseFemales(filtersSnapshot, PAGE_SIZE, 0);
      setItems(page);
      setHasMore(more);
      setTotalOnline(online);
    } catch (e) {
      logger.warn('browseFemales failed', e);
    }
  }, [filtersSnapshot]);

  const loadFavorites = useCallback(async (): Promise<void> => {
    try {
      setFavorites(await listFavorites());
    } catch (e) {
      logger.warn('listFavorites failed', e);
    }
  }, []);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  useFocusEffect(
    useCallback(() => {
      fetchWalletSnapshot().catch(e => logger.warn('Wallet snapshot failed', e));
    }, []),
  );

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await Promise.all([loadFirstPage(), loadFavorites()]);
    setRefreshing(false);
  }, [loadFavorites, loadFirstPage]);

  const handleEndReached = useCallback(async (): Promise<void> => {
    if (loadingMore || !hasMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const { items: more, hasMore: stillMore } = await browseFemales(
        filtersSnapshot,
        PAGE_SIZE,
        items.length,
      );
      setItems(prev => [...prev, ...more]);
      setHasMore(stillMore);
    } catch (e) {
      logger.warn('browseFemales pagination failed', e);
    } finally {
      setLoadingMore(false);
    }
  }, [filtersSnapshot, hasMore, items.length, loadingMore]);

  const handleToggleFavorite = useCallback(
    async (femaleId: string): Promise<void> => {
      const flip = (list: ReadonlyArray<AvailableFemale>): ReadonlyArray<AvailableFemale> =>
        list.map(f => (f.id === femaleId ? { ...f, isFavorited: !f.isFavorited } : f));
      setItems(prev => flip(prev));
      try {
        const nowFavorited = await toggleFavorite(femaleId);
        // Reconcile: if the server disagrees with our optimistic flip, correct.
        setItems(prev =>
          prev.map(f => (f.id === femaleId ? { ...f, isFavorited: nowFavorited } : f)),
        );
        void loadFavorites();
      } catch (e) {
        logger.warn('toggleFavorite failed', e);
        setItems(prev => flip(prev));
      }
    },
    [loadFavorites],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AvailableFemale>): React.ReactElement => (
      <View style={styles.cardWrap}>
        <AvailableFemaleCard
          female={item}
          width={CARD_WIDTH}
          onPress={() => navigation.navigate('FemaleProfilePreview', { femaleId: item.id })}
          onToggleFavorite={() => {
            void handleToggleFavorite(item.id);
          }}
        />
      </View>
    ),
    [handleToggleFavorite, navigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{`Hi, ${firstName}`}</Text>
          <Text style={styles.subgreeting}>Find your match</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to wallet"
            hitSlop={6}
            onPress={() => navigation.navigate('MaleTabs', { screen: 'Wallet' })}
            style={styles.coinPill}
          >
            <CoinIcon size={16} color={AppColors.primary} />
            <Text style={styles.coinPillText}>{String(coinBalance)}</Text>
          </Pressable>
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
      </View>

      <View style={styles.chipRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          {QUICK_FILTERS.map(f => (
            <FilterChip
              key={f.value}
              label={f.label}
              active={filters.quick === f.value}
              onPress={() => setQuick(f.value)}
              leadingDotColor={f.showDot ? AppColors.onlineGreen : undefined}
            />
          ))}
        </ScrollView>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter and sort"
          onPress={() => setFilterSheetOpen(true)}
          style={styles.filterIconWrap}
          hitSlop={8}
        >
          <FilterIcon />
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{String(activeFilterCount)}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <FlashList<AvailableFemale>
        data={items}
        keyExtractor={f => f.id}
        renderItem={renderItem}
        numColumns={2}
        estimatedItemSize={Math.round((CARD_WIDTH * 5) / 4 + GRID_GAP)}
        contentContainerStyle={styles.gridContent}
        onEndReached={() => {
          void handleEndReached();
        }}
        onEndReachedThreshold={0.2}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
            tintColor={AppColors.primary}
            colors={[AppColors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {favorites.length > 0 ? (
              <View style={styles.favSection}>
                <View style={styles.favHeader}>
                  <Text style={styles.favTitle}>Your Favorites</Text>
                  <Pressable hitSlop={8} accessibilityRole="link" onPress={() => undefined}>
                    <Text style={styles.favSeeAll}>See all</Text>
                  </Pressable>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={favorites}
                  keyExtractor={f => f.id}
                  contentContainerStyle={styles.favListContent}
                  renderItem={({ item }) => (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        navigation.navigate('FemaleProfilePreview', { femaleId: item.id })
                      }
                      style={styles.favItem}
                    >
                      <View style={styles.favAvatarRing}>
                        <Avatar
                          uri={item.imageUrl}
                          size={72}
                          initials={initialsFromName(item.name)}
                        />
                      </View>
                      {item.isOnline ? <View style={styles.favStatusDot} /> : null}
                      <Text style={styles.favName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>
            ) : null}

            <View style={styles.availableHeader}>
              <Text style={styles.availableTitle}>Available Now</Text>
              <Text style={styles.availableCount}>{`(${totalOnline} online)`}</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <SearchOffIcon />
            </View>
            <Text style={styles.emptyTitle}>No one available right now</Text>
            <Text style={styles.emptyBody}>Check back in a few minutes</Text>
          </View>
        }
        ListFooterComponent={
          items.length > 0 ? <PaginationLoader isLoading={loadingMore} hasMore={hasMore} /> : null
        }
      />

      <FemaleSearchFilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

const BOTTOM_CLEAR = BOTTOM_NAV_HEIGHT + FAB_PROTRUSION + AppSpacing.lg;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.sm,
  },
  headerLeft: { flex: 1 },
  greeting: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
  },
  subgreeting: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.xs },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.primarySubtle,
    height: 32,
    paddingHorizontal: AppSpacing.sm + 4,
    borderRadius: AppRadii.full,
  },
  coinPillText: {
    ...AppTypography.labelLarge,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  bellWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: AppSpacing.md,
    marginTop: AppSpacing.sm,
  },
  chipScroll: { paddingHorizontal: AppSpacing.md, gap: AppSpacing.xs, alignItems: 'center' },
  filterIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: AppSpacing.xs,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    ...AppTypography.labelSmall,
    color: AppColors.onPrimary,
    fontWeight: '700',
  },
  favSection: { marginTop: AppSpacing.md },
  favHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.md,
  },
  favTitle: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
  },
  favSeeAll: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
  },
  favListContent: {
    paddingHorizontal: AppSpacing.md,
    gap: AppSpacing.sm,
    paddingTop: AppSpacing.sm,
  },
  favItem: { width: 88, alignItems: 'center', position: 'relative' },
  favAvatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: AppColors.primary,
  },
  favStatusDot: {
    position: 'absolute',
    bottom: 24,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.onlineGreen,
    borderWidth: 2,
    borderColor: AppColors.background,
  },
  favName: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurface,
    marginTop: 4,
    textAlign: 'center',
  },
  availableHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: AppSpacing.md,
    marginTop: AppSpacing.lg,
    marginBottom: AppSpacing.sm,
    gap: 6,
  },
  availableTitle: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
  },
  availableCount: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
  },
  gridContent: { paddingHorizontal: GRID_HORIZONTAL_PADDING, paddingBottom: BOTTOM_CLEAR },
  cardWrap: {
    marginBottom: GRID_GAP,
    marginRight: GRID_GAP / 2,
    marginLeft: GRID_GAP / 2,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.xl,
  },
  emptyIcon: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: AppColors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
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

export default MaleHomeScreen;
