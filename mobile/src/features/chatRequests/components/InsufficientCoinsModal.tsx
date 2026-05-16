import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import SecondaryButton from '@core/components/SecondaryButton';
import { inr } from '@core/utils/formatters';

export type InsufficientCoinsModalProps = {
  visible: boolean;
  femaleName: string;
  coinCost: number;
  currentBalance: number;
  /** Suggested top-up — the smallest package that closes the gap. */
  topUpCoins: number;
  topUpInr: number;
  onCancel: () => void;
  onTopUp: () => void;
  onGoToWallet: () => void;
};

function WalletIcon(): React.ReactElement {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24">
      <Path
        d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
        fill={AppColors.warning}
      />
    </Svg>
  );
}

/** Shown when the male tries to send a request without enough coins. */
function InsufficientCoinsModal({
  visible,
  femaleName,
  coinCost,
  currentBalance,
  topUpCoins,
  topUpInr,
  onCancel,
  onTopUp,
  onGoToWallet,
}: InsufficientCoinsModalProps): React.ReactElement {
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
            <View style={styles.iconCircle}>
              <WalletIcon />
            </View>
            <Text style={styles.title}>Not Enough Coins</Text>
            <Text style={styles.body2}>
              {`You need ${coinCost} coins to chat with ${femaleName}, but you only have ${currentBalance} coins.`}
            </Text>

            <View style={styles.suggestionCard}>
              <Text style={styles.suggestionLabel}>QUICK TOP-UP</Text>
              <View style={styles.suggestionRow}>
                <Text
                  style={styles.suggestionAmount}
                >{`${topUpCoins} coins for ${inr(topUpInr)}`}</Text>
                <PrimaryButton label="Buy Now" onPress={onTopUp} fullWidth={false} />
              </View>
            </View>

            <View style={styles.actions}>
              <View style={styles.actionHalf}>
                <SecondaryButton label="Cancel" onPress={onCancel} />
              </View>
              <View style={styles.actionHalf}>
                <PrimaryButton label="Go to Wallet" onPress={onGoToWallet} />
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
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.md,
  },
  body2: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
    textAlign: 'center',
    marginTop: AppSpacing.sm,
  },
  suggestionCard: {
    width: '100%',
    backgroundColor: AppColors.primarySubtle,
    borderRadius: AppRadii.md,
    padding: AppSpacing.sm + 4,
    marginTop: AppSpacing.md,
  },
  suggestionLabel: {
    ...AppTypography.labelSmall,
    color: AppColors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: AppSpacing.sm,
  },
  suggestionAmount: {
    ...AppTypography.bodyLarge,
    color: AppColors.primaryDark,
    fontWeight: '700',
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    marginTop: AppSpacing.lg,
    gap: AppSpacing.sm,
  },
  actionHalf: { flex: 1 },
});

export default InsufficientCoinsModal;
