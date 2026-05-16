import React, { useCallback } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import { APP_NAME, PRIVACY_POLICY_URL, TERMS_URL } from '@core/config/constants';
import { logger } from '@core/utils/logger';

import MenuRow from '../components/MenuRow';

function DescriptionIcon(c: string): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
        fill={c}
      />
    </Svg>
  );
}

function PrivacyIcon(c: string): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
        fill={c}
      />
    </Svg>
  );
}

function CodeIcon(c: string): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"
        fill={c}
      />
    </Svg>
  );
}

/** About page — logo, version, and legal/license links. */
function AboutAppScreen(): React.ReactElement {
  const handleOpen = useCallback((url: string): void => {
    Linking.openURL(url).catch(e => logger.warn('Failed to open link', url, e));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="About" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoLetter}>D</Text>
          </View>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.version}>Version 1.0.0 (1)</Text>
        </View>

        <View style={[styles.menuCard, AppShadows.e1]}>
          <MenuRow
            title="Terms of Service"
            renderIcon={DescriptionIcon}
            onPress={() => handleOpen(TERMS_URL)}
          />
          <MenuRow
            title="Privacy Policy"
            renderIcon={PrivacyIcon}
            onPress={() => handleOpen(PRIVACY_POLICY_URL)}
          />
          <MenuRow
            title="Open-Source Licenses"
            renderIcon={CodeIcon}
            onPress={() => undefined}
            last
          />
        </View>

        <Text style={styles.tagline}>Made with love in India</Text>
        <Text style={styles.copyright}>© 2026 Dangg. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: { padding: AppSpacing.md, paddingBottom: AppSpacing.xl },
  hero: { alignItems: 'center', marginTop: AppSpacing.lg, marginBottom: AppSpacing.xl },
  logo: {
    width: 96,
    height: 96,
    borderRadius: AppRadii.lg,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    ...AppTypography.displayLarge,
    color: AppColors.onPrimary,
  },
  appName: {
    ...AppTypography.displayLarge,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.md,
  },
  version: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    overflow: 'hidden',
  },
  tagline: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.xl,
  },
  copyright: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.xs,
  },
});

export default AboutAppScreen;
