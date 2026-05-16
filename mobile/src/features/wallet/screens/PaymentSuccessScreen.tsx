import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import TextButton from '@core/components/TextButton';
import { inr } from '@core/utils/formatters';

import { type MaleAppStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'PaymentSuccess'>;
type Route = RouteProp<MaleAppStackParamList, 'PaymentSuccess'>;

function CheckIcon(): React.ReactElement {
  return (
    <Svg width={80} height={80} viewBox="0 0 24 24">
      <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill={AppColors.success} />
    </Svg>
  );
}

/** Payment success confirmation with new balance + receipt. */
function PaymentSuccessScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { transactionId, coinsAdded, bonusCoins, amountInr, newBalance } = route.params;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <CheckIcon />
        </View>
        <Text style={styles.title}>Payment Successful!</Text>

        <View style={[styles.receiptCard, AppShadows.e1]}>
          <Text style={styles.coinsAdded}>{`${coinsAdded} coins added`}</Text>
          {bonusCoins > 0 ? <Text style={styles.bonus}>{`+${bonusCoins} bonus coins`}</Text> : null}
          <View style={styles.divider} />
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Amount paid</Text>
            <Text style={styles.receiptValue}>{inr(amountInr)}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Transaction ID</Text>
            <Text style={styles.receiptValueMuted} numberOfLines={1}>
              {transactionId}
            </Text>
          </View>
        </View>

        <Text style={styles.balance}>
          {'New balance: '}
          <Text style={styles.balanceBold}>{`${newBalance} coins`}</Text>
        </Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue Browsing"
          onPress={() => navigation.replace('MaleTabs', { screen: 'Home' })}
        />
        <TextButton
          label="View Wallet"
          onPress={() => navigation.replace('MaleTabs', { screen: 'Wallet' })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.gradientRoseSubtleStart },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...AppTypography.headlineLarge,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.lg,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.md,
    padding: AppSpacing.md,
    marginTop: AppSpacing.lg,
  },
  coinsAdded: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    textAlign: 'center',
  },
  bonus: {
    ...AppTypography.bodyMedium,
    color: AppColors.success,
    textAlign: 'center',
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.divider,
    marginVertical: AppSpacing.sm,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  receiptLabel: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
  },
  receiptValue: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
    fontWeight: '600',
  },
  receiptValueMuted: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    flexShrink: 1,
    marginLeft: AppSpacing.sm,
  },
  balance: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
    marginTop: AppSpacing.lg,
  },
  balanceBold: { fontWeight: '700', color: AppColors.primaryDark },
  footer: {
    padding: AppSpacing.md,
    gap: AppSpacing.xs,
    alignItems: 'center',
  },
});

export default PaymentSuccessScreen;
