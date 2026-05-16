import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

import FloatingBottomNav from '@core/components/FloatingBottomNav';

import EarningsDashboardScreen from '@features/earnings/screens/EarningsDashboardScreen';
import FemaleHomeScreen from '@features/femaleHome/screens/FemaleHomeScreen';
import FemaleProfileScreen from '@features/profile/screens/FemaleProfileScreen';

import { type FemaleTabParamList } from './types';

const Tab = createBottomTabNavigator<FemaleTabParamList>();

/**
 * Female post-auth bottom tabs.
 *
 * Order declared as Earnings → Home → Profile so the centered "speed-breaker"
 * FAB rendered by `FloatingBottomNav` lands on Home. Initial route is Home.
 */
function FemaleTabNavigator(): React.ReactElement {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
      tabBar={props => <FloatingBottomNav {...props} />}
    >
      <Tab.Screen name="Earnings" component={EarningsDashboardScreen} />
      <Tab.Screen name="Home" component={FemaleHomeScreen} />
      <Tab.Screen name="Profile" component={FemaleProfileScreen} />
    </Tab.Navigator>
  );
}

export default FemaleTabNavigator;
