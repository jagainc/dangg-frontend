import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import ChatRequestAcceptedScreen from '@features/chatRequests/screens/ChatRequestAcceptedScreen';
import ChatRequestDeclinedScreen from '@features/chatRequests/screens/ChatRequestDeclinedScreen';
import ChatRequestSentScreen from '@features/chatRequests/screens/ChatRequestSentScreen';
import ChatRequestTimeoutScreen from '@features/chatRequests/screens/ChatRequestTimeoutScreen';
import FemaleProfilePreviewScreen from '@features/maleHome/screens/FemaleProfilePreviewScreen';
import NotificationsScreen from '@features/notifications/screens/NotificationsScreen';
import AboutAppScreen from '@features/profile/screens/AboutAppScreen';
import ChangePasswordScreen from '@features/profile/screens/ChangePasswordScreen';
import HelpSupportScreen from '@features/profile/screens/HelpSupportScreen';
import ReportIssueScreen from '@features/profile/screens/ReportIssueScreen';
import SettingsScreen from '@features/profile/screens/SettingsScreen';
import PaymentFailedScreen from '@features/wallet/screens/PaymentFailedScreen';
import PaymentProcessingScreen from '@features/wallet/screens/PaymentProcessingScreen';
import PaymentSuccessScreen from '@features/wallet/screens/PaymentSuccessScreen';

import MaleTabNavigator from './MaleTabNavigator';
import { type MaleAppStackParamList } from './types';

const Stack = createNativeStackNavigator<MaleAppStackParamList>();

/**
 * Male-side app stack: bottom-tabs as the root, plus push-able secondary
 * screens (Female Profile Preview, chat-request flow, payment flow, and
 * the reused profile-menu screens shared with the female stack).
 */
function MaleAppStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="MaleTabs" component={MaleTabNavigator} />
      <Stack.Screen name="FemaleProfilePreview" component={FemaleProfilePreviewScreen} />
      <Stack.Screen name="ChatRequestSent" component={ChatRequestSentScreen} />
      <Stack.Screen
        name="ChatRequestAccepted"
        component={ChatRequestAcceptedScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="ChatRequestDeclined"
        component={ChatRequestDeclinedScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="ChatRequestTimeout"
        component={ChatRequestTimeoutScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="PaymentProcessing"
        component={PaymentProcessingScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="PaymentSuccess"
        component={PaymentSuccessScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="PaymentFailed"
        component={PaymentFailedScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
      <Stack.Screen name="AboutApp" component={AboutAppScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

export default MaleAppStack;
