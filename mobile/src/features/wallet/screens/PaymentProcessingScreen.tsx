import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { Env } from '@core/config/env';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import { processPayment } from '../api/walletApi';
import { getPackageById, totalCoinsFor } from '../constants';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'PaymentProcessing'>;
type Route = RouteProp<MaleAppStackParamList, 'PaymentProcessing'>;

/**
 * Payment-in-flight screen.
 *
 * DEV_MODE: kicks off `processPayment(packageId, 'success')` automatically;
 * floating dev-tools buttons let the user force either outcome before the
 * default fires. Production: this is where Razorpay's checkout overlay
 * would be opened.
 */
function PaymentProcessingScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { packageId } = route.params;

  const [running, setRunning] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const finalize = useCallback(
    async (outcome: 'success' | 'failure'): Promise<void> => {
      if (completedRef.current || running) {
        return;
      }
      setRunning(true);
      try {
        const result = await processPayment(packageId, outcome);
        completedRef.current = true;
        if (result.ok) {
          navigation.replace('PaymentSuccess', {
            transactionId: result.transactionId,
            coinsAdded: result.coinsAdded,
            bonusCoins: result.bonusCoins,
            amountInr: getPackageById(packageId)?.priceInr ?? 0,
            newBalance: result.newBalance,
          });
        } else {
          navigation.replace('PaymentFailed', { packageId, reason: result.reason });
        }
      } catch (e) {
        logger.error('Payment finalize failed', e);
        navigation.replace('PaymentFailed', {
          packageId,
          reason: 'Something went wrong, try again',
        });
      }
    },
    [navigation, packageId, running],
  );

  useEffect(() => {
    if (!Env.devMode) {
      // Production: trigger real Razorpay open here.
      void finalize('success');
      return;
    }
    // DEV: auto-resolve success after 2s if user doesn't tap the dev buttons.
    const timer = setTimeout(() => {
      if (!completedRef.current) {
        void finalize('success');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [finalize]);

  const pkg = getPackageById(packageId);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Text style={styles.brand}>razorpay</Text>
        <View style={styles.spinnerWrap}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
        <Text style={styles.title}>Processing payment…</Text>
        <Text style={styles.subtitle}>Please don't close the app</Text>
        {pkg ? (
          <Text style={styles.amount}>{`₹${pkg.priceInr} for ${totalCoinsFor(pkg)} coins`}</Text>
        ) : null}
      </View>

      {Env.devMode ? (
        <View style={styles.devToolsRow}>
          <DevBtn
            label="Simulate Success"
            onPress={() => {
              void finalize('success');
            }}
            variant="success"
          />
          <DevBtn
            label="Simulate Failure"
            onPress={() => {
              void finalize('failure');
            }}
            variant="error"
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

type DevBtnProps = { label: string; onPress: () => void; variant: 'success' | 'error' };

function DevBtn({ label, onPress, variant }: DevBtnProps): React.ReactElement {
  const bg = variant === 'success' ? AppColors.successLight : AppColors.errorLight;
  const fg = variant === 'success' ? AppColors.success : AppColors.error;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.devBtn, { backgroundColor: bg }]}
    >
      <Text style={[styles.devBtnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  brand: {
    ...AppTypography.titleLarge,
    color: AppColors.info,
    letterSpacing: 1,
    fontWeight: '700',
  },
  spinnerWrap: { marginTop: AppSpacing.xl },
  title: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.lg,
  },
  subtitle: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.xs,
  },
  amount: {
    ...AppTypography.bodyLarge,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.md,
  },
  devToolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppSpacing.sm,
    justifyContent: 'center',
    padding: AppSpacing.md,
  },
  devBtn: {
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    borderRadius: AppRadii.full,
  },
  devBtnText: {
    ...AppTypography.labelLarge,
    fontWeight: '700',
  },
});

export default PaymentProcessingScreen;
