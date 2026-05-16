import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { type CoinPackage, type CoinPackageTag } from '../constants';

export type CoinPackageCardProps = {
  pkg: CoinPackage;
  selected: boolean;
  onPress: () => void;
};

const TAG_LABEL: Record<CoinPackageTag, string> = {
  popular: 'POPULAR',
  bestDeal: 'BEST DEAL',
  maxValue: 'MAX VALUE',
};

function CoinIcon({ size, color }: { size: number; color: string }): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} fill={color} />
      <Path
        d="M14.5 9.5h-3v1.5h1.25c.55 0 1 .45 1 1s-.45 1-1 1H11v1.5h1.75c.55 0 1 .45 1 1s-.45 1-1 1H9.5v1.5h3v-1c.97-.18 1.75-.99 1.75-2 0-.74-.4-1.39-1-1.74.6-.35 1-1 1-1.74 0-1.1-.9-2-2-2H9.5V8h5v1.5z"
        fill={AppColors.surface}
      />
    </Svg>
  );
}

/** Selectable card for a coin package in the Wallet grid. */
function CoinPackageCard({ pkg, selected, onPress }: CoinPackageCardProps): React.ReactElement {
  const totalCoins = pkg.baseCoins + pkg.bonusCoins;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        AppShadows.e1,
        selected ? styles.cardSelected : styles.cardUnselected,
        pressed && styles.cardPressed,
      ]}
    >
      {pkg.tag ? (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{TAG_LABEL[pkg.tag]}</Text>
        </View>
      ) : null}
      <View style={styles.iconWrap}>
        <CoinIcon size={32} color={AppColors.primary} />
      </View>
      <Text style={styles.coins}>{`${totalCoins} coins`}</Text>
      {pkg.bonusCoins > 0 ? (
        <Text style={styles.bonus}>{`+${pkg.bonusCoins} BONUS`}</Text>
      ) : (
        <View style={styles.bonusSpacer} />
      )}
      <Text style={styles.price}>{`₹${pkg.priceInr}`}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.md,
    padding: AppSpacing.md,
    alignItems: 'center',
    borderWidth: 2,
  },
  cardSelected: { borderColor: AppColors.primary },
  cardUnselected: { borderColor: AppColors.transparent },
  cardPressed: { opacity: 0.92 },
  tag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: AppRadii.sm,
  },
  tagText: {
    ...AppTypography.labelSmall,
    color: AppColors.onPrimary,
    fontWeight: '700',
  },
  iconWrap: { marginBottom: AppSpacing.xs },
  coins: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  bonus: {
    ...AppTypography.labelSmall,
    color: AppColors.success,
    fontWeight: '700',
    marginTop: 2,
  },
  bonusSpacer: { height: 16 },
  price: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
    marginTop: AppSpacing.xs,
  },
});

export default CoinPackageCard;
