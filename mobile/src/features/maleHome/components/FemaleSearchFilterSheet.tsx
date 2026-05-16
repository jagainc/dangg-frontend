import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import BottomSheet from '@core/components/BottomSheet';
import PrimaryButton from '@core/components/PrimaryButton';
import SecondaryButton from '@core/components/SecondaryButton';

import AvailabilityToggle from '@features/femaleHome/components/AvailabilityToggle';

import {
  type FemaleFilters,
  type PriceFilter,
  type RatingFilter,
  type SortBy,
  useFemaleFiltersStore,
} from '../store/femaleFiltersStore';

import FilterChip from './FilterChip';

export type FemaleSearchFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
};

type AgePreset = { label: string; min: number; max: number };

const AGE_PRESETS: ReadonlyArray<AgePreset> = [
  { label: '18-25', min: 18, max: 25 },
  { label: '25-30', min: 25, max: 30 },
  { label: '30-35', min: 30, max: 35 },
  { label: '35+', min: 35, max: 99 },
];

const RATING_OPTIONS: ReadonlyArray<{ value: RatingFilter; label: string }> = [
  { value: 'any', label: 'Any' },
  { value: '3plus', label: '3+ stars' },
  { value: '4plus', label: '4+ stars' },
  { value: '4_5plus', label: '4.5+ stars' },
];

const PRICE_OPTIONS: ReadonlyArray<{ value: PriceFilter; label: string }> = [
  { value: 'any', label: 'Any' },
  { value: 'le50', label: '≤ 50 coins' },
  { value: '51to100', label: '51-100 coins' },
  { value: '100plus', label: '100+ coins' },
];

const SORT_OPTIONS: ReadonlyArray<{ value: SortBy; label: string }> = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price', label: 'Lowest Price' },
  { value: 'active', label: 'Most Active' },
];

/**
 * Filter & Sort sheet for the Male Home browse grid. Edits are local until
 * "Apply Filters" — then a single `applyAll` write to the store updates the
 * grid.
 */
function FemaleSearchFilterSheet({
  visible,
  onClose,
}: FemaleSearchFilterSheetProps): React.ReactElement {
  const current = useFemaleFiltersStore();
  const apply = useFemaleFiltersStore(s => s.applyAll);
  const resetStore = useFemaleFiltersStore(s => s.reset);

  // Local mirror of the filter state, edited until Apply.
  const [draft, setDraft] = useState<FemaleFilters>({
    quick: current.quick,
    onlineOnly: current.onlineOnly,
    ageMin: current.ageMin,
    ageMax: current.ageMax,
    rating: current.rating,
    price: current.price,
    sortBy: current.sortBy,
  });

  const handleApply = (): void => {
    apply(draft);
    onClose();
  };

  const handleReset = (): void => {
    resetStore();
    onClose();
  };

  const activeAgePreset = AGE_PRESETS.find(p => p.min === draft.ageMin && p.max === draft.ageMax);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Filter & Sort">
      <Section title="Online status">
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Show only online</Text>
          <AvailabilityToggle
            value={draft.onlineOnly}
            onValueChange={v => setDraft(d => ({ ...d, onlineOnly: v }))}
          />
        </View>
      </Section>

      <Section title="Age range">
        <View style={styles.chipRow}>
          {AGE_PRESETS.map(p => (
            <FilterChip
              key={p.label}
              label={p.label}
              active={activeAgePreset?.label === p.label}
              onPress={() => setDraft(d => ({ ...d, ageMin: p.min, ageMax: p.max }))}
            />
          ))}
        </View>
      </Section>

      <Section title="Rating">
        <View style={styles.chipRow}>
          {RATING_OPTIONS.map(o => (
            <FilterChip
              key={o.value}
              label={o.label}
              active={draft.rating === o.value}
              onPress={() => setDraft(d => ({ ...d, rating: o.value }))}
            />
          ))}
        </View>
      </Section>

      <Section title="Price range">
        <View style={styles.chipRow}>
          {PRICE_OPTIONS.map(o => (
            <FilterChip
              key={o.value}
              label={o.label}
              active={draft.price === o.value}
              onPress={() => setDraft(d => ({ ...d, price: o.value }))}
            />
          ))}
        </View>
      </Section>

      <Section title="Sort by">
        <View style={styles.radioCol}>
          {SORT_OPTIONS.map(o => {
            const active = draft.sortBy === o.value;
            return (
              <Pressable
                key={o.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => setDraft(d => ({ ...d, sortBy: o.value }))}
                style={styles.radioRow}
              >
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={styles.radioLabel}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <View style={styles.actions}>
        <View style={styles.actionHalf}>
          <SecondaryButton label="Reset" onPress={handleReset} />
        </View>
        <View style={styles.actionHalf}>
          <PrimaryButton label="Apply Filters" onPress={handleApply} />
        </View>
      </View>
    </BottomSheet>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: AppSpacing.md },
  sectionTitle: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: AppSpacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: AppSpacing.xs,
  },
  toggleLabel: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppSpacing.xs,
  },
  radioCol: { gap: AppSpacing.xs },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    paddingVertical: AppSpacing.xs,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: AppColors.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.primary,
  },
  radioLabel: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
  },
  actions: {
    flexDirection: 'row',
    gap: AppSpacing.sm,
    marginTop: AppSpacing.sm,
    paddingTop: AppSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.divider,
  },
  actionHalf: { flex: 1 },
});

export default FemaleSearchFilterSheet;
