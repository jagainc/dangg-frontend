import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { inr } from '@core/utils/formatters';

import { type Transaction } from '../api/earningsApi';

export type TransactionItemProps = {
  item: Transaction;
};

function relativeShort(date: Date): string {
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function iconArrowDown(color: string): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" fill={color} />
    </Svg>
  );
}

function iconArrowUp(color: string): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" fill={color} />
    </Svg>
  );
}

function iconReplay(color: string): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
        fill={color}
      />
    </Svg>
  );
}

type Visual = {
  bgColor: string;
  iconColor: string;
  amountColor: string;
  amountPrefix: string;
  renderIcon: (color: string) => React.ReactElement;
};

function visualFor(item: Transaction): Visual {
  switch (item.kind) {
    case 'earning':
      return {
        bgColor: AppColors.successLight,
        iconColor: AppColors.success,
        amountColor: AppColors.success,
        amountPrefix: '+',
        renderIcon: iconArrowDown,
      };
    case 'payout':
      return {
        bgColor: AppColors.warningLight,
        iconColor: AppColors.warning,
        amountColor: AppColors.onSurface,
        amountPrefix: '-',
        renderIcon: iconArrowUp,
      };
    case 'refund':
      return {
        bgColor: AppColors.errorLight,
        iconColor: AppColors.error,
        amountColor: AppColors.onSurface,
        amountPrefix: '-',
        renderIcon: iconReplay,
      };
  }
}

/** Row in the Earnings transaction list. */
function TransactionItem({ item }: TransactionItemProps): React.ReactElement {
  const visual = useMemo(() => visualFor(item), [item]);
  const time = useMemo(() => relativeShort(item.occurredAt), [item.occurredAt]);

  return (
    <View style={styles.row}>
      <View style={[styles.iconCircle, { backgroundColor: visual.bgColor }]}>
        {visual.renderIcon(visual.iconColor)}
      </View>
      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {`${item.subtitle} · ${time}`}
        </Text>
      </View>
      <Text style={[styles.amount, { color: visual.amountColor }]}>
        {`${visual.amountPrefix}${inr(item.amountInr)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.divider,
    gap: AppSpacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1 },
  title: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
  },
  subtitle: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  amount: {
    ...AppTypography.bodyLarge,
    fontWeight: '600',
  },
});

export default TransactionItem;
