import {
  useMemo,
} from 'react';
import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  StyleSheet,
  View,
} from 'react-native';

import {
  createRuleBasedCoachPlanSummary,
} from '../features/coach/data/coachPlanSummary';
import {
  calculateWeeklyRunningStats,
} from '../features/records/utils/weeklyRunningStats';
import {
  RunningGoalOverview,
} from '../features/settings/components/RunningGoalOverview';
import {
  SettingsHeader,
} from '../features/settings/components/SettingsHeader';
import type {
  RootStackParamList,
} from '../navigation/types';
import {
  useCoachStore,
} from '../stores/useCoachStore';
import {
  useRunningStore,
} from '../stores/useRunningStore';

type RunningGoalScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'RunningGoal'
  >;

export function RunningGoalScreen({
  navigation,
}: RunningGoalScreenProps) {
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
  const weeklyProgress = useMemo(
    () =>
      calculateWeeklyRunningStats(
        records,
      ),
    [records],
  );

  return (
    <View style={styles.screen}>
      <SettingsHeader
        backAccessibilityLabel="메뉴 화면으로 돌아가기"
        onPressBack={() =>
          navigation.goBack()
        }
        title="러닝 목표"
      />
      <RunningGoalOverview
        aiCoachPlan={
          plan
        }
        weeklyProgress={
          weeklyProgress
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
