import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import TextButton from '@core/components/TextButton';

import { type MaleAppStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'PaymentFailed'>;
type Route = RouteProp<MaleAppStackParamList, 'PaymentFailed'>;

function ErrorIcon(): React.ReactElement {
  return (
    <Svg width={80} height={80} viewBox="0 0 24 24">
      <Path
        d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"
        fill={AppColors.error}
      />
    </Svg>
  );
}

/** Payment failure screen with reason + retry. */
function PaymentFailedScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { packageId, reason } = route.params;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <ErrorIcon />
        </View>
        <Text style={styles.title}>Payment Failed</Text>
        <Text style={styles.reason}>{reason}</Text>
        <Text style={styles.reassurance}>No money was charged to your account.</Text>
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          label="Try Again"
          onPress={() => navigation.replace('PaymentProcessing', { packageId })}
        />
        <TextButton
          label="Cancel"
          onPress={() => navigation.replace('MaleTabs', { screen: 'Wallet' })}
        />
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
    backgroundColor: AppColors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...AppTypography.headlineLarge,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.lg,
  },
  reason: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.sm,
    maxWidth: 320,
  },
  reassurance: {
    ...AppTypography.bodyMedium,
    color: AppColors.success,
    textAlign: 'center',
    marginTop: AppSpacing.md,
  },
  footer: {
    padding: AppSpacing.md,
    gap: AppSpacing.xs,
    alignItems: 'center',
  },
});

export default PaymentFailedScreen;
