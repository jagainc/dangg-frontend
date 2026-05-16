import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import BottomSheet from '@core/components/BottomSheet';
import ConfirmationDialog from '@core/components/ConfirmationDialog';
import { prefsStorage, PrefsKey } from '@core/storage/prefsStorage';
import { logger } from '@core/utils/logger';

import AvailabilityToggle from '../../femaleHome/components/AvailabilityToggle';
import MenuRow from '../components/MenuRow';

type NotifPrefs = {
  chatRequests: boolean;
  payments: boolean;
  marketing: boolean;
};

const NOTIF_KEYS: Record<keyof NotifPrefs, PrefsKey> = {
  chatRequests: PrefsKey.LastRole, // reuse PrefsKey slot — keys table is sparse; see TODO
  payments: PrefsKey.LanguagePref,
  marketing: PrefsKey.ThemePref,
};

// NOTE: PrefsKey currently exposes a small fixed set. Until it's extended for
// per-toggle notification flags we reuse three existing keys with string
// values "true" / "false". When PrefsKey gains dedicated NotifChatRequests /
// NotifPayments / NotifMarketing entries, switch to those without changing
// the rest of this file.

function readBoolPref(key: PrefsKey, defaultValue: boolean): boolean {
  return prefsStorage.getBool(key, defaultValue);
}

function writeBoolPref(key: PrefsKey, value: boolean): void {
  prefsStorage.setBool(key, value);
}

const LANGUAGES = ['English', 'Hindi'] as const;
const THEMES = ['Light', 'System Default', 'Dark (coming soon)'] as const;

/** Settings — grouped cards of toggle prefs + selection bottom sheets. */
function SettingsScreen(): React.ReactElement {
  const [notif, setNotif] = useState<NotifPrefs>(() => ({
    chatRequests: readBoolPref(NOTIF_KEYS.chatRequests, true),
    payments: readBoolPref(NOTIF_KEYS.payments, true),
    marketing: readBoolPref(NOTIF_KEYS.marketing, false),
  }));
  const [language, setLanguage] = useState<string>(
    () => prefsStorage.getString(PrefsKey.LanguagePref) ?? 'English',
  );
  const [theme, setTheme] = useState<string>(
    () => prefsStorage.getString(PrefsKey.ThemePref) ?? 'System Default',
  );
  const [langSheet, setLangSheet] = useState(false);
  const [themeSheet, setThemeSheet] = useState(false);
  const [downloadDialog, setDownloadDialog] = useState(false);

  const toggleNotif = useCallback((key: keyof NotifPrefs): void => {
    setNotif(prev => {
      const next = { ...prev, [key]: !prev[key] };
      writeBoolPref(NOTIF_KEYS[key], next[key]);
      return next;
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Settings" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.groupLabel}>Notifications</Text>
        <View style={[styles.card, AppShadows.e1]}>
          <ToggleRow
            title="Chat Request Notifications"
            description="Get notified when someone wants to chat"
            value={notif.chatRequests}
            onChange={() => toggleNotif('chatRequests')}
            divider
          />
          <ToggleRow
            title="Payment Notifications"
            description="Get notified when you receive payments"
            value={notif.payments}
            onChange={() => toggleNotif('payments')}
            divider
          />
          <ToggleRow
            title="Marketing Notifications"
            description="News and updates from Dangg"
            value={notif.marketing}
            onChange={() => toggleNotif('marketing')}
          />
        </View>

        <Text style={styles.groupLabel}>Preferences</Text>
        <View style={[styles.card, AppShadows.e1]}>
          <MenuRow title="Language" subtitle={language} onPress={() => setLangSheet(true)} />
          <MenuRow title="Theme" subtitle={theme} onPress={() => setThemeSheet(true)} last />
        </View>

        <Text style={styles.groupLabel}>Privacy</Text>
        <View style={[styles.card, AppShadows.e1]}>
          <MenuRow title="Download My Data" onPress={() => setDownloadDialog(true)} />
          <MenuRow title="Privacy Settings" onPress={() => undefined} last />
        </View>
      </ScrollView>

      <BottomSheet visible={langSheet} onClose={() => setLangSheet(false)} title="Language">
        {LANGUAGES.map(l => (
          <SheetOption
            key={l}
            label={l}
            active={language === l}
            onPress={() => {
              setLanguage(l);
              prefsStorage.setString(PrefsKey.LanguagePref, l);
              setLangSheet(false);
            }}
          />
        ))}
      </BottomSheet>

      <BottomSheet visible={themeSheet} onClose={() => setThemeSheet(false)} title="Theme">
        {THEMES.map(t => (
          <SheetOption
            key={t}
            label={t}
            active={theme === t}
            disabled={t.includes('coming soon')}
            onPress={() => {
              setTheme(t);
              prefsStorage.setString(PrefsKey.ThemePref, t);
              setThemeSheet(false);
            }}
          />
        ))}
      </BottomSheet>

      <ConfirmationDialog
        visible={downloadDialog}
        title="Download your data?"
        body="We'll email you a downloadable archive of your account data within 48 hours."
        confirmLabel="Request"
        cancelLabel="Cancel"
        onCancel={() => setDownloadDialog(false)}
        onConfirm={() => {
          setDownloadDialog(false);
          logger.info('Data download requested (stub)');
        }}
      />
    </SafeAreaView>
  );
}

type ToggleRowProps = {
  title: string;
  description: string;
  value: boolean;
  onChange: () => void;
  divider?: boolean;
};

function ToggleRow({
  title,
  description,
  value,
  onChange,
  divider = false,
}: ToggleRowProps): React.ReactElement {
  return (
    <View style={[styles.toggleRow, divider && styles.toggleRowDivider]}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDesc}>{description}</Text>
      </View>
      <AvailabilityToggle value={value} onValueChange={onChange} />
    </View>
  );
}

type SheetOptionProps = {
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function SheetOption({
  label,
  active,
  disabled = false,
  onPress,
}: SheetOptionProps): React.ReactElement {
  return (
    <View
      style={[
        styles.sheetOption,
        active && styles.sheetOptionActive,
        disabled && styles.sheetOptionDisabled,
      ]}
    >
      <MenuRow title={label} hideChevron onPress={disabled ? () => undefined : onPress} last />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: { padding: AppSpacing.md, paddingBottom: AppSpacing.xl },
  groupLabel: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: AppSpacing.md,
    marginBottom: AppSpacing.sm,
    marginHorizontal: AppSpacing.xs,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.md,
    gap: AppSpacing.md,
  },
  toggleRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.divider,
  },
  toggleText: { flex: 1 },
  toggleTitle: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
  },
  toggleDesc: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  sheetOption: { borderRadius: AppRadii.md, overflow: 'hidden', marginBottom: 4 },
  sheetOptionActive: { backgroundColor: AppColors.primarySubtle },
  sheetOptionDisabled: { opacity: 0.5 },
});

export default SettingsScreen;
