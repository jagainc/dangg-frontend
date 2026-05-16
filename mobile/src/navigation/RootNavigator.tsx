import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useIsAuthenticated, useSessionRole } from '@store/sessionStore';

import { UserRole } from '@app-types/domain';

import AuthNavigator from './AuthNavigator';
import ChatNavigator from './ChatNavigator';
import FemaleAppStack from './FemaleAppStack';
import MaleAppStack from './MaleAppStack';
import { type RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Top-level switcher.
 *
 * Reads session + role from Zustand:
 *   * No session  → Auth flow (splash → onboarding → signup/login).
 *   * Session + female → FemaleAppStack (tabs + push-able secondary screens).
 *   * Session + male  → MaleTabs.
 *
 * Chat navigator is registered so any post-auth flow can push into it.
 */
function RootNavigator(): React.ReactElement {
  const authed = useIsAuthenticated();
  const role = useSessionRole();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!authed ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : role === UserRole.Female ? (
        <Stack.Screen name="FemaleApp" component={FemaleAppStack} />
      ) : (
        <Stack.Screen name="MaleApp" component={MaleAppStack} />
      )}
      <Stack.Screen name="Chat" component={ChatNavigator} />
    </Stack.Navigator>
  );
}

export default RootNavigator;
