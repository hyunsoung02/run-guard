import {
  useMemo,
} from 'react';
import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  Alert,
  StyleSheet,
  View,
} from 'react-native';

import {
  SettingsBottomNavigation,
} from '../features/settings/components/SettingsBottomNavigation';
import {
  SettingsHeader,
} from '../features/settings/components/SettingsHeader';
import {
  SettingsMenuContent,
} from '../features/settings/components/SettingsMenuContent';
import {
  AI_COACH_RUNNER_LEVEL_LABELS,
  createRuleBasedCoachPlanSummary,
} from '../features/coach/data/coachPlanSummary';
import {
  calculateWeeklyRunningStats,
} from '../features/records/utils/weeklyRunningStats';
import {
  SETTINGS_MENU_SECTIONS,
} from '../features/settings/data/settingsMenuItems';
import type {
  SettingsMenuAction,
} from '../features/settings/types/settingsMenu';
import type {
  RootStackParamList,
} from '../navigation/types';
import {
  useCoachStore,
} from '../stores/useCoachStore';
import {
  useRunningStore,
} from '../stores/useRunningStore';

type MenuScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'Menu'
  >;

export function MenuScreen({
  navigation,
}: MenuScreenProps) {
  const selectedLevel =
    useCoachStore(
      (state) =>
        state.selectedLevel,
    );
  const records = useRunningStore(
    (state) => state.records,
  );
  const plan = useMemo(
    () =>
      createRuleBasedCoachPlanSummary(
        selectedLevel,
      ),
    [selectedLevel],
  );
  const weeklyStats = useMemo(
    () =>
      calculateWeeklyRunningStats(
        records,
      ),
    [records],
  );
  function handlePressMenuItem(
    action: SettingsMenuAction,
  ) {
    switch (action) {
      case 'runningProfile':
        navigation.navigate(
          'RunningProfile',
        );
        return;
      case 'runningGoal':
        navigation.navigate('RunningGoal');
        return;
      case 'coachBadge':
        navigation.navigate(
          'AiCoachBadge',
        );
        return;
      case 'voiceGuide':
        navigation.navigate('VoiceGuide');
        return;
      case 'usedData':
      case 'appInfo':
        Alert.alert(
          '준비 중',
          '백엔드 기능 연동 후 제공될 메뉴입니다.',
        );
    }
  }

  function handlePressCoach() {
    navigation.navigate(
      'Coach',
      undefined,
      {
        pop: true,
      },
    );
  }

  function handlePressStart() {
    navigation.navigate('Loading', {
      mode: 'course',
    });
  }

  return (
    <View style={styles.screen}>
      <SettingsHeader
        backAccessibilityLabel="메인 화면으로 돌아가기"
        onPressBack={() =>
          navigation.goBack()
        }
        title="메뉴"
      />

      <SettingsMenuContent
        onPressItem={
          handlePressMenuItem
        }
        sections={
          SETTINGS_MENU_SECTIONS
        }
        userSummary={
          {
            runnerLevel:
              AI_COACH_RUNNER_LEVEL_LABELS[
                plan.runnerLevel
              ],
            weeklyGoalKm:
              plan.weeklyGoalKm,
            weeklyCompletedKm:
              weeklyStats.completedKm,
          }
        }
      />

      <SettingsBottomNavigation
        onPressCoach={
          handlePressCoach
        }
        onPressMenu={() => undefined}
        onPressStart={
          handlePressStart
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
});
