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

const FLANK_ICON_SIZE = 24;
const FAB_ICON_SIZE = 28;

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

/** Fallback Material `home` icon — used when a Home tab forgets to set tabBarIcon. */
function DefaultHomeIcon({ color, size }: { color: string; size: number }): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={color} />
    </Svg>
  );
}

type TabBarIconFn = (props: { focused: boolean; color: string; size: number }) => React.ReactNode;

function resolveLabel(option: unknown, fallback: string): string {
  if (typeof option === 'string') {
    return option;
  }
  return fallback;
}

function resolveIcon(option: unknown): TabBarIconFn | null {
  return typeof option === 'function' ? (option as TabBarIconFn) : null;
}

type FlankTabProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  onLongPress: () => void;
  renderIcon: TabBarIconFn | null;
};

/** Flank tab (left or right of the FAB) — icon + label + active rose dot. */
function FlankTab({
  label,
  active,
  onPress,
  onLongPress,
  renderIcon,
}: FlankTabProps): React.ReactElement {
  const color = active ? AppColors.primary : AppColors.onSurfaceMuted;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} tab`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
    >
      {renderIcon ? renderIcon({ focused: active, color, size: FLANK_ICON_SIZE }) : null}
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      <View style={[styles.activeDot, active ? styles.activeDotOn : styles.activeDotOff]} />
    </Pressable>
  );
}

/**
 * Floating "speed-breaker" bottom navigation.
 *
 * Role-agnostic: reads each tab's label and icon from `descriptors[route.key].options`
 * (`tabBarLabel`, `tabBarIcon`). The center FAB is identified by route name `'Home'`;
 * the other two tabs flank it as left and right buttons.
 *
 * Architecture:
 *   * SVG layer draws the white bar with a concave notch in the top center.
 *   * Flank tabs sit inside the bar (left + right of the notch spacer).
 *   * Circular FAB is absolutely positioned to protrude above the bar's top
 *     edge by `FAB_PROTRUSION` px, sitting in the notch.
 */
function FloatingBottomNav({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const barHeight = BOTTOM_NAV_HEIGHT + insets.bottom;
  const path = useMemo(() => buildBarPath(width, barHeight), [barHeight, width]);

  const fabScale = useSharedValue(1);
  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const focusedName = state.routes[state.index]?.name;

  const homeRoute = state.routes.find(r => r.name === 'Home');
  const flankRoutes = state.routes.filter(r => r.name !== 'Home');

  const handlePress = (routeName: string, routeKey: string): void => {
    const isFocused = focusedName === routeName;
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const handleLongPress = (routeKey: string): void => {
    navigation.emit({ type: 'tabLongPress', target: routeKey });
  };

  const handleFabPress = (): void => {
    if (!homeRoute) {
      return;
    }
    fabScale.value = withTiming(0.95, { duration: 80 }, () => {
      fabScale.value = withTiming(1, { duration: 120 });
    });
    handlePress(homeRoute.name, homeRoute.key);
  };

  const homeFocused = focusedName === 'Home';

  const fabPositionStyle: ViewStyle = { bottom: barHeight - FAB_PROTRUSION };

  // Render at most one flank on each side. If there are more than two non-Home
  // routes, take the first two — the design assumes exactly 3 tabs.
  const leftRoute = flankRoutes[0];
  const rightRoute = flankRoutes[1];

  const homeOptions = homeRoute ? descriptors[homeRoute.key]?.options : undefined;
  const homeIcon = resolveIcon(homeOptions?.tabBarIcon);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={[styles.barLayer, { height: barHeight }]}>
        <Svg width={width} height={barHeight}>
          <Path d={path} fill={AppColors.surface} />
        </Svg>
        <View style={[styles.tabsRow, { paddingBottom: insets.bottom, height: barHeight }]}>
          <View style={styles.tabSlot}>
            {leftRoute ? (
              <FlankTab
                label={resolveLabel(
                  descriptors[leftRoute.key]?.options.tabBarLabel,
                  leftRoute.name,
                )}
                active={focusedName === leftRoute.name}
                onPress={() => handlePress(leftRoute.name, leftRoute.key)}
                onLongPress={() => handleLongPress(leftRoute.key)}
                renderIcon={resolveIcon(descriptors[leftRoute.key]?.options.tabBarIcon)}
              />
            ) : null}
          </View>
          <View style={styles.notchSpacer} />
          <View style={styles.tabSlot}>
            {rightRoute ? (
              <FlankTab
                label={resolveLabel(
                  descriptors[rightRoute.key]?.options.tabBarLabel,
                  rightRoute.name,
                )}
                active={focusedName === rightRoute.name}
                onPress={() => handlePress(rightRoute.name, rightRoute.key)}
                onLongPress={() => handleLongPress(rightRoute.key)}
                renderIcon={resolveIcon(descriptors[rightRoute.key]?.options.tabBarIcon)}
              />
            ) : null}
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
          onLongPress={homeRoute ? () => handleLongPress(homeRoute.key) : undefined}
          style={({ pressed }) => [
            styles.fab,
            AppShadows.e3,
            { backgroundColor: pressed ? AppColors.primaryDark : AppColors.primary },
            homeFocused && styles.fabFocusedRing,
          ]}
        >
          {homeIcon ? (
            homeIcon({ focused: homeFocused, color: AppColors.onPrimary, size: FAB_ICON_SIZE })
          ) : (
            <DefaultHomeIcon color={AppColors.onPrimary} size={FAB_ICON_SIZE} />
          )}
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
  barLayer: { position: 'relative' },
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
