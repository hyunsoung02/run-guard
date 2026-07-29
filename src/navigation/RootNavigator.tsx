import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  AiCoachBadgeScreen,
} from '../screens/AiCoachBadgeScreen';

import {
  CoachScreen,
} from '../screens/CoachScreen';

import {
  LoadingScreen,
} from '../screens/LoadingScreen';

import {
  LocationDistanceScreen,
} from '../screens/LocationDistanceScreen';

import {
  LocationSearchScreen,
} from '../screens/LocationSearchScreen';

import {
  MainScreen,
} from '../screens/MainScreen';

import {
  MenuScreen,
} from '../screens/MenuScreen';

import {
  RunningActiveScreen,
} from '../screens/RunningActiveScreen';

import {
  RunningGoalCompleteScreen,
} from '../screens/RunningGoalCompleteScreen';

import {
  RunningRecordSummaryScreen,
} from '../screens/RunningRecordSummaryScreen';

import {
  RunningStartScreen,
} from '../screens/RunningStartScreen';

import {
  RunningGoalScreen,
} from '../screens/RunningGoalScreen';

import {
  RunningProfileScreen,
} from '../screens/RunningProfileScreen';

import {
  SplashScreen,
} from '../screens/SplashScreen';

import {
  VoiceGuideScreen,
} from '../screens/VoiceGuideScreen';

import type {
  RootStackParamList,
} from './types';

const Stack =
  createNativeStackNavigator<
    RootStackParamList
  >();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
      />

      <Stack.Screen
        name="Main"
        component={MainScreen}
      />

      <Stack.Screen
        name="Coach"
        component={CoachScreen}
      />

      <Stack.Screen
        name="Menu"
        component={MenuScreen}
      />

      <Stack.Screen
        name="AiCoachBadge"
        component={AiCoachBadgeScreen}
      />

      <Stack.Screen
        name="RunningProfile"
        component={RunningProfileScreen}
      />

      <Stack.Screen
        name="RunningGoal"
        component={RunningGoalScreen}
      />

      <Stack.Screen
        name="VoiceGuide"
        component={VoiceGuideScreen}
      />

      <Stack.Screen
        name="Loading"
        component={LoadingScreen}
      />

      <Stack.Screen
        name="RunningStart"
        component={RunningStartScreen}
      />

      <Stack.Screen
        name="LocationSearch"
        component={LocationSearchScreen}
      />

      <Stack.Screen
        name="LocationDistance"
        component={LocationDistanceScreen}
      />

      <Stack.Screen
        name="RunningActive"
        component={RunningActiveScreen}
      />

      <Stack.Screen
        name="RunningGoalComplete"
        component={RunningGoalCompleteScreen}
        options={{
          animation: 'fade',
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="RunningRecordSummary"
        component={RunningRecordSummaryScreen}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
    </Stack.Navigator>
  );
}
