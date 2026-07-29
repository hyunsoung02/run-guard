import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  getBottomNavigationContentPadding,
} from '../../home/components/BottomNavigation';
import {
  SettingsBottomNavigation,
} from '../../settings/components/SettingsBottomNavigation';
import {
  SettingsHeader,
} from '../../settings/components/SettingsHeader';
import {
  COACH_LEVEL_DETAILS,
  COACH_PLAN_PRESETS,
} from '../data/coachPlans';
import type {
  CoachLevel,
} from '../types/coach.types';
import {
  CurrentLevelCard,
} from './CurrentLevelCard';
import {
  LevelDisplayRow,
} from './LevelDisplayRow';
import {
  WeeklyBadgeCard,
} from './WeeklyBadgeCard';
import {
  WeeklyGoalCard,
} from './WeeklyGoalCard';
import {
  WeeklyPlanCard,
} from './WeeklyPlanCard';
import {
  useRunningStore,
} from '../../../stores/useRunningStore';
import {
  resolveCoachPlanFromRecords,
} from '../utils/resolveCoachPlanStatus';

type CoachDashboardProps = {
  level: CoachLevel;
  onPressBack: () => void;
  onPressCoach: () => void;
  onPressMenu: () => void;
  onPressStart: () => void;
};

export function CoachDashboard({
  level,
  onPressBack,
  onPressCoach,
  onPressMenu,
  onPressStart,
}: CoachDashboardProps) {
  const { width } =
    useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomContentPadding =
    getBottomNavigationContentPadding(
      width,
      insets.bottom,
    );
  const levelDetails =
    COACH_LEVEL_DETAILS[level];
  const records = useRunningStore(
    (state) => state.records,
  );
  const planPreset =
    COACH_PLAN_PRESETS[level];
  const weeklyPlan =
    resolveCoachPlanFromRecords(
      planPreset,
      records,
    );
  const levelTitleColor =
    level === 'beginner'
      ? '#7EAC00'
      : levelDetails.accentColor;

  return (
    <View style={styles.screen}>
      <SettingsHeader
        backAccessibilityLabel="이전 화면으로 돌아가기"
        onPressBack={onPressBack}
        title="러닝 코치"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              bottomContentPadding,
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }
      >
        <View style={styles.content}>
          <Text
            accessibilityRole="header"
            style={[
              styles.levelTitle,
              {
                color:
                  levelTitleColor,
              },
            ]}
          >
            {levelDetails.title}
          </Text>

          <CurrentLevelCard
            accentColor={
              levelDetails.accentColor
            }
            description={
              levelDetails.dashboardDescription
            }
            levelTitle={
              levelDetails.title
            }
            softColor={
              levelDetails.softColor
            }
          />

          <View style={styles.levels}>
            <LevelDisplayRow
              selectedLevel={level}
            />
          </View>

          <Text
            accessibilityRole="header"
            style={styles.sectionTitle}
          >
            이번주 추천 플랜
          </Text>

          <View style={styles.planList}>
            {weeklyPlan.items.map(
              (item) => (
                <WeeklyPlanCard
                  item={item}
                  key={item.id}
                />
              ),
            )}
          </View>

          <View style={styles.goalCard}>
            <WeeklyGoalCard
              accentColor={
                levelDetails.accentColor
              }
              completedDistanceKm={
                weeklyPlan.completedDistanceKm
              }
              targetDistanceKm={
                weeklyPlan.targetDistanceKm
              }
            />
          </View>

          <View style={styles.badgeCard}>
            <WeeklyBadgeCard
              badgeRewardCount={
                weeklyPlan.badgeRewardCount
              }
              goalAchieved={
                weeklyPlan.goalAchieved
              }
            />
          </View>
        </View>
      </ScrollView>

      <SettingsBottomNavigation
        onPressCoach={onPressCoach}
        onPressMenu={onPressMenu}
        onPressStart={onPressStart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  levelTitle: {
    marginBottom: 14,
    fontSize: 26,
    fontWeight: '900',
  },
  levels: {
    marginTop: 18,
  },
  sectionTitle: {
    marginTop: 30,
    marginBottom: 14,
    color: '#111111',
    fontSize: 21,
    fontWeight: '900',
  },
  planList: {
    gap: 12,
  },
  goalCard: {
    marginTop: 18,
  },
  badgeCard: {
    marginTop: 14,
  },
});
