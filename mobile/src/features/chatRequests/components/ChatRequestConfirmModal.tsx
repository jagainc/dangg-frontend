import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import Avatar from '@core/components/Avatar';
import PrimaryButton from '@core/components/PrimaryButton';
import SecondaryButton from '@core/components/SecondaryButton';

export type ChatRequestConfirmModalProps = {
  visible: boolean;
  femaleName: string;
  femaleAvatarUrl: string | null;
  coinCost: number;
  currentBalance: number;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

/**
 * Modal asking the male to confirm a chat request before coins are deducted.
 * Pre-computes the post-spend balance so the user sees exactly what they're
 * committing to.
 */
function ChatRequestConfirmModal({
  visible,
  femaleName,
  femaleAvatarUrl,
  coinCost,
  currentBalance,
  submitting = false,
  onCancel,
  onConfirm,
}: ChatRequestConfirmModalProps): React.ReactElement {
  const afterBalance = Math.max(0, currentBalance - coinCost);

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
            <View style={styles.avatarRing}>
              <Avatar uri={femaleAvatarUrl} size={64} initials={initialsFromName(femaleName)} />
            </View>
            <Text style={styles.title}>{`Send chat request to ${femaleName}?`}</Text>

            <View style={styles.infoCard}>
              <InfoRow label="Cost" value={`${coinCost} coins`} />
              <InfoRow label="Your balance" value={`${currentBalance} coins`} />
              <InfoRow label="After this request" value={`${afterBalance} coins`} muted />
            </View>

            <Text style={styles.helper}>
              Coins are deducted now. If she doesn't accept within 5 minutes, they'll be refunded.
            </Text>

            <View style={styles.actions}>
              <View style={styles.actionHalf}>
                <SecondaryButton label="Cancel" onPress={onCancel} disabled={submitting} />
              </View>
              <View style={styles.actionHalf}>
                <PrimaryButton label="Send Request" onPress={onConfirm} loading={submitting} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}): React.ReactElement {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, muted && styles.infoValueMuted]}>{value}</Text>
    </View>
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
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: AppColors.primary,
  },
  title: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    textAlign: 'center',
    marginTop: AppSpacing.sm,
  },
  infoCard: {
    width: '100%',
    backgroundColor: AppColors.primarySubtle,
    borderRadius: AppRadii.md,
    padding: AppSpacing.sm + 4,
    marginTop: AppSpacing.md,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
  },
  infoValue: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
    fontWeight: '600',
  },
  infoValueMuted: { color: AppColors.onSurfaceMuted, fontWeight: '400' },
  helper: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.sm,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    marginTop: AppSpacing.lg,
    gap: AppSpacing.sm,
  },
  actionHalf: { flex: 1 },
});

export default ChatRequestConfirmModal;
