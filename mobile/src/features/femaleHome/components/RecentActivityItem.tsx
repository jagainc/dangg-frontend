import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import Avatar from '@core/components/Avatar';
import { inr } from '@core/utils/formatters';

import { type RecentActivity } from '../api/femaleHomeApi';

export type RecentActivityItemProps = {
  item: RecentActivity;
};

function relativeTime(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) {
    return 'just now';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) {
    return '?';
  }
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

/** Row in the Female Home Recent Activity list. */
function RecentActivityItem({ item }: RecentActivityItemProps): React.ReactElement {
  const time = useMemo(() => relativeTime(item.occurredAt), [item.occurredAt]);

  return (
    <View style={styles.row}>
      <Avatar uri={item.actorAvatarUrl} size={40} initials={initialsFromName(item.actorName)} />
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {item.actorName}
        </Text>
        <Text style={styles.description} numberOfLines={1}>
          {item.description}
        </Text>
      </View>
      <View style={styles.right}>
        {item.amountInr !== null ? (
          <Text style={styles.amount}>{`+${inr(item.amountInr)}`}</Text>
        ) : null}
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: AppSpacing.sm + 4,
    paddingHorizontal: AppSpacing.md,
    gap: AppSpacing.sm,
  },
  middle: { flex: 1, marginHorizontal: AppSpacing.sm },
  name: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
  },
  description: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  right: { alignItems: 'flex-end' },
  amount: {
    ...AppTypography.bodyMedium,
    color: AppColors.success,
    fontWeight: '600',
  },
  time: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
});

export default RecentActivityItem;
