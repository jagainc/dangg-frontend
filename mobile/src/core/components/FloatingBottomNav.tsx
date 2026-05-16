import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import {
  BOTTOM_NAV_HEIGHT,
  FAB_DIAMETER,
  FAB_PROTRUSION,
  NOTCH_DEPTH,
  NOTCH_WIDTH,
} from '@core/config/constants';

const TAB_ICON_SIZE = 24;

/**
 * Builds the SVG path string for the bar — a rectangle with a smooth
 * concave notch carved into the top center.
 *
 * Geometry, with C = width/2, N = NOTCH_WIDTH/2, D = NOTCH_DEPTH, H = bar height:
 *   1. Move to top-left, walk along the top to the start of the left shoulder.
 *   2. Cubic Bezier down into the notch (left side).
 *   3. Cubic Bezier across the rounded bottom of the notch.
 *   4. Cubic Bezier up out of the notch (right side, mirror of step 2).
 *   5. Walk along the top to the top-right, down the right edge, across
 *      the bottom, up the left edge, close.
 */
function buildBarPath(width: number, height: number): string {
  const C = width / 2;
  const N = NOTCH_WIDTH / 2;
  const D = NOTCH_DEPTH;
  return [
    'M 0 0',
    `L ${C - N - 12} 0`,
    `C ${C - N} 0, ${C - N + 4} ${D - 2}, ${C - 16} ${D}`,
    `C ${C - 6} ${D + 4}, ${C + 6} ${D + 4}, ${C + 16} ${D}`,
    `C ${C + N - 4} ${D - 2}, ${C + N} 0, ${C + N + 12} 0`,
    `L ${width} 0`,
    `L ${width} ${height}`,
    `L 0 ${height}`,
    'Z',
  ].join(' ');
}

type IconProps = { active: boolean };

/** Material `account_balance_wallet` rendered inline with react-native-svg. */
function WalletIcon({ active }: IconProps): React.ReactElement {
  const color = active ? AppColors.primary : AppColors.onSurfaceMuted;
  return (
    <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24">
      <Path
        d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
        fill={color}
      />
    </Svg>
  );
}

/** Material `person` icon. */
function PersonIcon({ active }: IconProps): React.ReactElement {
  const color = active ? AppColors.primary : AppColors.onSurfaceMuted;
  return (
    <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24">
      <Path
        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
        fill={color}
      />
    </Svg>
  );
}

/** Material `home` icon, rendered larger for the centered FAB. */
function HomeIcon(): React.ReactElement {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={AppColors.onPrimary} />
    </Svg>
  );
}

type TabButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  onLongPress: () => void;
  renderIcon: (props: IconProps) => React.ReactElement;
};

/** Flank tab (Earnings or Profile) — icon + label + active rose dot. */
function TabButton({
  label,
  active,
  onPress,
  onLongPress,
  renderIcon,
}: TabButtonProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} tab`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
    >
      {renderIcon({ active })}
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      <View style={[styles.activeDot, active ? styles.activeDotOn : styles.activeDotOff]} />
    </Pressable>
  );
}

/**
 * Floating "speed-breaker" bottom navigation.
 *
 * Architecture:
 *   * SVG layer draws the white bar with a concave notch in the top center.
 *   * Two flank tabs (Earnings left, Profile right) sit inside the bar.
 *   * Circular FAB (Home) is absolutely positioned to protrude above the
 *     bar's top edge by `FAB_PROTRUSION`px, sitting in the notch.
 */
function FloatingBottomNav({ state, navigation }: BottomTabBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const barHeight = BOTTOM_NAV_HEIGHT + insets.bottom;
  const path = useMemo(() => buildBarPath(width, barHeight), [barHeight, width]);

  const fabScale = useSharedValue(1);
  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const focusedName = state.routes[state.index]?.name;

  const findRouteKey = (name: string): string | undefined =>
    state.routes.find(r => r.name === name)?.key;

  const handlePress = (routeName: string): void => {
    const key = findRouteKey(routeName);
    if (key === undefined) {
      return;
    }
    const isFocused = focusedName === routeName;
    const event = navigation.emit({
      type: 'tabPress',
      target: key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const handleLongPress = (routeName: string): void => {
    const key = findRouteKey(routeName);
    if (key === undefined) {
      return;
    }
    navigation.emit({ type: 'tabLongPress', target: key });
  };

  const handleFabPress = (): void => {
    fabScale.value = withTiming(0.95, { duration: 80 }, () => {
      fabScale.value = withTiming(1, { duration: 120 });
    });
    handlePress('Home');
  };

  const homeFocused = focusedName === 'Home';
  const earningsFocused = focusedName === 'Earnings';
  const profileFocused = focusedName === 'Profile';

  const fabPositionStyle: ViewStyle = {
    bottom: barHeight - FAB_PROTRUSION,
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={[styles.barLayer, { height: barHeight }]}>
        <Svg width={width} height={barHeight}>
          <Path d={path} fill={AppColors.surface} />
        </Svg>
        <View style={[styles.tabsRow, { paddingBottom: insets.bottom, height: barHeight }]}>
          <View style={styles.tabSlot}>
            <TabButton
              label="Earnings"
              active={earningsFocused}
              onPress={() => handlePress('Earnings')}
              onLongPress={() => handleLongPress('Earnings')}
              renderIcon={WalletIcon}
            />
          </View>
          <View style={styles.notchSpacer} />
          <View style={styles.tabSlot}>
            <TabButton
              label="Profile"
              active={profileFocused}
              onPress={() => handlePress('Profile')}
              onLongPress={() => handleLongPress('Profile')}
              renderIcon={PersonIcon}
            />
          </View>
        </View>
      </View>

      <Animated.View
        style={[
          styles.fabWrapper,
          { left: (width - FAB_DIAMETER) / 2 },
          fabPositionStyle,
          fabAnimStyle,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Home tab"
          accessibilityState={{ selected: homeFocused }}
          onPress={handleFabPress}
          onLongPress={() => handleLongPress('Home')}
          style={({ pressed }) => [
            styles.fab,
            AppShadows.e3,
            { backgroundColor: pressed ? AppColors.primaryDark : AppColors.primary },
            homeFocused && styles.fabFocusedRing,
          ]}
        >
          <HomeIcon />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  barLayer: {
    position: 'relative',
  },
  tabsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notchSpacer: { width: NOTCH_WIDTH },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
  },
  tabLabel: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  tabLabelActive: { color: AppColors.primary },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: AppSpacing.xs,
  },
  activeDotOn: { backgroundColor: AppColors.primary },
  activeDotOff: { backgroundColor: AppColors.transparent },
  fabWrapper: {
    position: 'absolute',
    width: FAB_DIAMETER,
    height: FAB_DIAMETER,
  },
  fab: {
    width: FAB_DIAMETER,
    height: FAB_DIAMETER,
    borderRadius: FAB_DIAMETER / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabFocusedRing: {
    borderWidth: 2,
    borderColor: AppColors.surface,
  },
});

export default FloatingBottomNav;
