import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import Card from '@core/components/Card';
import PrimaryButton from '@core/components/PrimaryButton';
import TextField from '@core/components/TextField';
import { AppException, AuthException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';
import { ZodSchemas } from '@core/utils/validators';

import { type FemaleAppStackParamList } from '@navigation/types';

import PasswordStrengthMeter from '../../auth/components/PasswordStrengthMeter';
import { changePassword } from '../api/profileApi';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'ChangePassword'>;

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: ZodSchemas.password,
    confirmNewPassword: z.string().min(1, 'Confirm the new password'),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmNewPassword'],
        message: 'Passwords do not match',
      });
    }
  });

type Input = z.infer<typeof schema>;

/** Standalone change-password form. Reuses the auth `PasswordStrengthMeter`. */
function ChangePasswordScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid },
    watch,
  } = useForm<Input>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const newPasswordValue = watch('newPassword');

  const onSubmit = useCallback(
    async (data: Input): Promise<void> => {
      setCurrentError(null);
      setSubmitError(null);
      try {
        await changePassword(data.currentPassword, data.newPassword);
        navigation.goBack();
      } catch (e) {
        if (e instanceof AuthException) {
          setCurrentError('Current password is incorrect');
        } else if (e instanceof AppException) {
          setSubmitError(e.message);
        } else {
          logger.error('ChangePasswordScreen.submit failed', e);
          setSubmitError('Could not update password, try again');
        }
      }
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Change Password" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card padding={AppSpacing.lg} containerStyle={styles.card}>
            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <TextField
                  label="Current Password"
                  hint="Enter your current password"
                  value={value}
                  onChangeText={t => {
                    onChange(t);
                    setCurrentError(null);
                  }}
                  onBlur={onBlur}
                  passwordToggle
                  autoCapitalize="none"
                  autoCorrect={false}
                  errorText={currentError ?? fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <View>
                  <TextField
                    label="New Password"
                    hint="At least 8 characters with a letter and a number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    passwordToggle
                    autoCapitalize="none"
                    autoCorrect={false}
                    errorText={fieldState.error?.message}
                  />
                  <PasswordStrengthMeter password={newPasswordValue} />
                </View>
              )}
            />
            <Controller
              control={control}
              name="confirmNewPassword"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <TextField
                  label="Confirm New Password"
                  hint="Re-enter the new password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  passwordToggle
                  autoCapitalize="none"
                  autoCorrect={false}
                  errorText={fieldState.error?.message}
                />
              )}
            />
            {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
          </Card>
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            label="Update Password"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={!isValid}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  scroll: { padding: AppSpacing.md, paddingTop: AppSpacing.lg },
  card: { gap: AppSpacing.sm },
  submitError: {
    ...AppTypography.bodyMedium,
    color: AppColors.error,
    textAlign: 'center',
  },
  footer: {
    padding: AppSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.divider,
    backgroundColor: AppColors.background,
  },
});

export default ChangePasswordScreen;
