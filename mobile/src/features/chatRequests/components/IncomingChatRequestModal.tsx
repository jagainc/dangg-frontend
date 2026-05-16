import React, { useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import Avatar from '@core/components/Avatar';
import PrimaryButton from '@core/components/PrimaryButton';
import SecondaryButton from '@core/components/SecondaryButton';
import { CHAT_REQUEST_AUTO_DECLINE_S } from '@core/config/constants';
import { logger } from '@core/utils/logger';

import { acceptRequest, declineRequest } from '../api/chatRequestApi';
import { useChatRequestStore } from '../store/chatRequestStore';

function formatCountdown(secondsLeft: number): string {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

/**
 * Global incoming chat request modal. Rendered once in `App.tsx`; reads
 * the single-slot `chatRequestStore`. Counts down from 30s and auto-
 * declines on expiry. Backdrop is non-dismissible — user must Accept or
 * Decline (or wait for the auto-decline).
 */
function IncomingChatRequestModal(): React.ReactElement | null {
  const incoming = useChatRequestStore(s => s.incoming);
  const clear = useChatRequestStore(s => s.clear);
  const [secondsLeft, setSecondsLeft] = useState(CHAT_REQUEST_AUTO_DECLINE_S);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!incoming) {
      setSecondsLeft(CHAT_REQUEST_AUTO_DECLINE_S);
      return undefined;
    }
    setSecondsLeft(CHAT_REQUEST_AUTO_DECLINE_S);
    const tick = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [incoming]);

  const autoDecline = useCallback(async (): Promise<void> => {
    if (!incoming || working) {
      return;
    }
    setWorking(true);
    try {
      await declineRequest(incoming.id, 'timeout');
    } catch (e) {
      logger.warn('autoDecline failed', e);
    } finally {
      clear();
      setWorking(false);
    }
  }, [clear, incoming, working]);

  useEffect(() => {
    if (incoming && secondsLeft === 0) {
      void autoDecline();
    }
  }, [autoDecline, incoming, secondsLeft]);

  const handleDecline = useCallback(async (): Promise<void> => {
    if (!incoming || working) {
      return;
    }
    setWorking(true);
    try {
      await declineRequest(incoming.id, 'manual');
    } catch (e) {
      logger.warn('declineRequest failed', e);
    } finally {
      clear();
      setWorking(false);
    }
  }, [clear, incoming, working]);

  const handleAccept = useCallback(async (): Promise<void> => {
    if (!incoming || working) {
      return;
    }
    setWorking(true);
    try {
      await acceptRequest(incoming.id);
    } catch (e) {
      logger.warn('acceptRequest failed', e);
    } finally {
      clear();
      setWorking(false);
    }
  }, [clear, incoming, working]);

  if (!incoming) {
    return null;
  }

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        void handleDecline();
      }}
    >
      <View style={styles.scrim}>
        <View style={[styles.card, AppShadows.e3]}>
          <View style={styles.accentStrip} />
          <View style={styles.body}>
            <Text style={styles.eyebrow}>Incoming Chat Request</Text>
            <View style={styles.avatarRing}>
              <Avatar
                uri={incoming.requesterAvatarUrl}
                size={96}
                initials={initialsFromName(incoming.requesterName)}
              />
            </View>
            <Text style={styles.name}>{incoming.requesterName}</Text>
            <Text style={styles.info}>{`Sending ${incoming.coinAmount} coins for this chat`}</Text>
            <Text style={styles.countdown}>
              {'Auto-declines in '}
              <Text style={styles.countdownBold}>{formatCountdown(secondsLeft)}</Text>
            </Text>
            <View style={styles.actions}>
              <View style={styles.actionHalf}>
                <SecondaryButton
                  label="Decline"
                  onPress={() => {
                    void handleDecline();
                  }}
                />
              </View>
              <View style={styles.actionHalf}>
                <PrimaryButton
                  label="Accept"
                  onPress={() => {
                    void handleAccept();
                  }}
                />
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
  eyebrow: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  avatarRing: {
    marginTop: AppSpacing.md,
    padding: 3,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: AppColors.primary,
  },
  name: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
    textAlign: 'center',
    marginTop: AppSpacing.md,
  },
  info: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  countdown: {
    ...AppTypography.bodyMedium,
    color: AppColors.warning,
    marginTop: AppSpacing.md,
  },
  countdownBold: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    marginTop: AppSpacing.lg,
    gap: AppSpacing.sm,
  },
  actionHalf: { flex: 1 },
});

export default IncomingChatRequestModal;
