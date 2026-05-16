import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { type MaleAppStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'ChatRequestAccepted'>;

function CheckIcon(): React.ReactElement {
  return (
    <Svg width={80} height={80} viewBox="0 0 24 24">
      <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill={AppColors.success} />
    </Svg>
  );
}

/**
 * Transitional screen confirming the female accepted. Auto-routes to the
 * Phase 2 chat session placeholder after 2 seconds. Back disabled so the
 * user doesn't slip back into the waiting screen.
 */
function ChatRequestAcceptedScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('MaleTabs', { screen: 'Home' });
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <CheckIcon />
        </View>
        <Text style={styles.title}>Request Accepted!</Text>
        <Text style={styles.subtitle}>She's ready to chat</Text>
        <View style={styles.spinnerRow}>
          <ActivityIndicator color={AppColors.primary} />
          <Text style={styles.spinnerText}>Starting chat…</Text>
        </View>
        <Text style={styles.phase2}>
          The active chat experience ships in Phase 2 — returning you to Home for now.
        </Text>
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
  subtitle: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.xs,
  },
  spinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    marginTop: AppSpacing.xl,
  },
  spinnerText: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
  },
  phase2: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.md,
    fontStyle: 'italic',
  },
});

export default ChatRequestAcceptedScreen;
