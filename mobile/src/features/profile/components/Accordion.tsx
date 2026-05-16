import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type AccordionProps = {
  question: string;
  answer: string;
  initiallyOpen?: boolean;
};

function ChevronDown({ color }: { color: string }): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" fill={color} />
    </Svg>
  );
}

/** Click-to-expand FAQ item used by the Help & Support screen. */
function Accordion({
  question,
  answer,
  initiallyOpen = false,
}: AccordionProps): React.ReactElement {
  const [open, setOpen] = useState(initiallyOpen);

  const toggle = (): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(prev => !prev);
  };

  return (
    <View style={[styles.wrap, open && styles.wrapOpen]}>
      <Pressable accessibilityRole="button" onPress={toggle} style={styles.header}>
        <Text style={styles.question}>{question}</Text>
        <View style={[styles.chevron, open && styles.chevronRotated]}>
          <ChevronDown color={AppColors.onSurfaceMuted} />
        </View>
      </Pressable>
      {open ? <Text style={styles.answer}>{answer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.md,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm + 4,
    marginBottom: AppSpacing.sm,
  },
  wrapOpen: { backgroundColor: AppColors.primarySubtle },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  question: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
    flex: 1,
    marginRight: AppSpacing.sm,
  },
  chevron: { transform: [{ rotate: '0deg' }] },
  chevronRotated: { transform: [{ rotate: '180deg' }] },
  answer: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
  },
});

export default Accordion;
