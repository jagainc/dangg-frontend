import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import TextButton from '@core/components/TextButton';

import { type MaleAppStackParamList } from '@navigation/types';

import { useWalletStore } from '@features/wallet/store/walletStore';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'ChatRequestTimeout'>;

const REFUND_AMOUNT = 50;

function ClockIcon(): React.ReactElement {
  return (
    <Svg width={80} height={80} viewBox="0 0 24 24">
      <Path
        d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
        fill={AppColors.warning}
      />
    </Svg>
  );
}

function CheckBadge(): React.ReactElement {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill={AppColors.success} />
    </Svg>
  );
}

/** Outcome screen when the female doesn't respond before expiry. */
function ChatRequestTimeoutScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const credit = useWalletStore(s => s.credit);

  useEffect(() => {
    credit(REFUND_AMOUNT);
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [credit]);

  const goHome = (): void => {
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <ClockIcon />
        </View>
        <Text style={styles.title}>No Response</Text>
        <Text style={styles.subtitle}>She didn't respond in time</Text>
        <View style={styles.refundBox}>
          <CheckBadge />
          <Text style={styles.refundText}>{`${REFUND_AMOUNT} coins refunded to your wallet`}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Try Someone Else" onPress={goHome} />
        <TextButton label="Back to Home" onPress={goHome} />
      </View>
    </SafeAreaView>
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
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...AppTypography.headlineLarge,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.lg,
  },
  subtitle: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.xs,
  },
  refundBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.xs,
    marginTop: AppSpacing.lg,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    backgroundColor: AppColors.successLight,
    borderRadius: AppRadii.md,
  },
  refundText: {
    ...AppTypography.bodyMedium,
    color: AppColors.success,
    fontWeight: '600',
  },
  footer: {
    padding: AppSpacing.md,
    gap: AppSpacing.xs,
    alignItems: 'center',
  },
});

export default ChatRequestTimeoutScreen;
