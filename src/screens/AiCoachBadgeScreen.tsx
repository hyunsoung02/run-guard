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
  CoachBadgeContent,
} from '../features/coach/components/CoachBadgeContent';
import {
  createCoachBadgesFromRecords,
} from '../features/coach/utils/createCoachBadges';
import {
  AI_COACH_RUNNER_LEVEL_LABELS,
} from '../features/coach/data/coachPlanSummary';
import {
  SettingsBottomNavigation,
} from '../features/settings/components/SettingsBottomNavigation';
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

type AiCoachBadgeScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'AiCoachBadge'
  >;

export function AiCoachBadgeScreen({
  navigation,
}: AiCoachBadgeScreenProps) {
  const records = useRunningStore(
    (state) => state.records,
  );
  const selectedLevel =
    useCoachStore(
      (state) =>
        state.selectedLevel,
    );
  const badges = useMemo(
    () =>
      createCoachBadgesFromRecords(
        records,
      ),
    [records],
  );
  function handlePressStart() {
    navigation.navigate('Loading', {
      mode: 'course',
    });
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

  return (
    <View style={styles.screen}>
      <SettingsHeader
        backAccessibilityLabel="메뉴 화면으로 돌아가기"
        onPressBack={() =>
          navigation.goBack()
        }
        title="러닝 코치 배지"
      />

      <CoachBadgeContent
        badges={badges}
        levelName={`${
          AI_COACH_RUNNER_LEVEL_LABELS[
            selectedLevel ??
              'beginner'
          ]
        } 배지`}
      />

      <SettingsBottomNavigation
        onPressCoach={
          handlePressCoach
        }
        onPressMenu={() =>
          navigation.goBack()
        }
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
