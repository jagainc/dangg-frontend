import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import { logger } from '@core/utils/logger';

import {
  type AppNotification,
  listNotifications,
  markAllRead,
  markRead,
} from '../api/notificationApi';
import NotificationItem from '../components/NotificationItem';

/**
 * Notifications inbox. Mark-all-read is in the AppBar; individual taps
 * mark a row as read with an optimistic update. Pull-to-refresh re-fetches.
 */
function NotificationsScreen(): React.ReactElement {
  const [items, setItems] = useState<ReadonlyArray<AppNotification>>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      setItems(await listNotifications());
    } catch (e) {
      logger.error('NotificationsScreen.load failed', e);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleMarkAllRead = useCallback((): void => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    markAllRead().catch(e => logger.warn('markAllRead failed', e));
  }, []);

  const handleTapItem = useCallback((id: string): void => {
    setItems(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    markRead(id).catch(e => logger.warn('markRead failed', e));
  }, []);

  const hasUnread = items.some(n => !n.read);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar
        title="Notifications"
        actions={
          hasUnread ? (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={handleMarkAllRead}>
              <Text style={styles.markAll}>Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={AppColors.primary}
            colors={[AppColors.primary]}
          />
        }
      >
        {items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Svg width={48} height={48} viewBox="0 0 24 24">
                <Path
                  d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
                  fill={AppColors.primary}
                />
              </Svg>
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyBody}>
              You'll see chat requests, payments, and updates here.
            </Text>
          </View>
        ) : (
          items.map(item => (
            <Pressable key={item.id} onPress={() => handleTapItem(item.id)}>
              <NotificationItem item={item} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: { paddingBottom: AppSpacing.xl, backgroundColor: AppColors.surface },
  markAll: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
  },
  empty: {
    alignItems: 'center',
    padding: AppSpacing.xl,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
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

export default NotificationsScreen;
