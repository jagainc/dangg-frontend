import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import SecondaryButton from '@core/components/SecondaryButton';
import { inr } from '@core/utils/formatters';

import { type CoinPackage, totalCoinsFor } from '../constants';

export type CoinPurchaseConfirmModalProps = {
  visible: boolean;
  pkg: CoinPackage | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Confirms a coin-package purchase before launching the payment flow. */
function CoinPurchaseConfirmModal({
  visible,
  pkg,
  onCancel,
  onConfirm,
}: CoinPurchaseConfirmModalProps): React.ReactElement | null {
  if (!pkg) {
    return null;
  }
  const total = totalCoinsFor(pkg);
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.scrim}>
        <View style={[styles.card, AppShadows.e3]}>
          <View style={styles.accentStrip} />
          <View style={styles.body}>
            <Text style={styles.title}>Confirm Purchase</Text>

            <View style={styles.summary}>
              <Text style={styles.coins}>{`${pkg.baseCoins} coins`}</Text>
              {pkg.bonusCoins > 0 ? (
                <Text style={styles.bonus}>{`+${pkg.bonusCoins} BONUS`}</Text>
              ) : null}
              <Text style={styles.total}>{`Total: ${total} coins`}</Text>
              <View style={styles.divider} />
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Price</Text>
                <Text style={styles.priceValue}>{inr(pkg.priceInr)}</Text>
              </View>
            </View>

            <Text style={styles.helper}>via Razorpay</Text>

            <View style={styles.actions}>
              <View style={styles.actionHalf}>
                <SecondaryButton label="Cancel" onPress={onCancel} />
              </View>
              <View style={styles.actionHalf}>
                <PrimaryButton label={`Pay ${inr(pkg.priceInr)}`} onPress={onConfirm} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: AppColors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    overflow: 'hidden',
  },
  accentStrip: { height: 4, backgroundColor: AppColors.primary },
  body: { padding: AppSpacing.lg, alignItems: 'center' },
  title: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
    textAlign: 'center',
  },
  summary: {
    width: '100%',
    backgroundColor: AppColors.primarySubtle,
    borderRadius: AppRadii.md,
    padding: AppSpacing.md,
    marginTop: AppSpacing.md,
  },
  coins: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
  },
  bonus: {
    ...AppTypography.labelLarge,
    color: AppColors.success,
    fontWeight: '700',
    marginTop: 2,
  },
  total: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.divider,
    marginVertical: AppSpacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
  },
  priceValue: {
    ...AppTypography.bodyLarge,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  helper: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.md,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    marginTop: AppSpacing.lg,
    gap: AppSpacing.sm,
  },
  actionHalf: { flex: 1 },
});

export default CoinPurchaseConfirmModal;
