import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  AI_COACH_RUNNER_LEVEL_LABELS,
} from '../../coach/data/coachPlanSummary';
import type {
  AiCoachPlanSummary,
} from '../../coach/types/aiCoachPlan';
import type {
  WeeklyRunningProgress,
} from '../../records/types/weeklyRunningProgress';
import {
  GoalProgressSummary,
} from './GoalProgressSummary';

type RunningGoalOverviewProps = {
  aiCoachPlan: AiCoachPlanSummary;
  weeklyProgress: WeeklyRunningProgress;
};

export function RunningGoalOverview({
  aiCoachPlan,
  weeklyProgress,
}: RunningGoalOverviewProps) {
  return (
    <ScrollView
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      <Text style={styles.intro}>
        규칙 기반 코치가 제안한 이번 주 러닝
        목표입니다.
      </Text>

      <View style={styles.summary}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>
            현재 러너 등급
          </Text>
          <Text style={styles.levelValue}>
            {
              AI_COACH_RUNNER_LEVEL_LABELS[
                aiCoachPlan.runnerLevel
              ]
            }
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>
            주간 추천 목표
          </Text>
          <Text style={styles.metricValue}>
            {aiCoachPlan.weeklyGoalKm}km
          </Text>
        </View>
      </View>

      <GoalProgressSummary
        completedKm={
          weeklyProgress.completedKm
        }
        weeklyGoalKm={
          aiCoachPlan.weeklyGoalKm
        }
      />

      <View style={styles.recommendations}>
        <View style={styles.recommendation}>
          <Text style={styles.metricLabel}>
            주간 추천 횟수
          </Text>
          <Text style={styles.metricValue}>
            주{' '}
            {
              aiCoachPlan
                .weeklyRecommendedRunCount
            }
            회
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.recommendation}>
          <Text style={styles.metricLabel}>
            1회 추천 거리
          </Text>
          <Text style={styles.metricValue}>
            {
              aiCoachPlan
                .recommendedDistanceKm
            }
            km
          </Text>
        </View>
      </View>

      <View style={styles.message}>
        <Text style={styles.messageTitle}>
          코치 추천 기준
        </Text>
        <Text style={styles.messageText}>
          {aiCoachPlan.planMessage}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 48,
  },
  intro: {
    marginBottom: 20,
    color: '#555555',
    fontSize: 15,
    lineHeight: 22,
  },
  summary: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D8D8',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    color: '#777777',
    fontSize: 13,
    fontWeight: '500',
  },
  levelValue: {
    marginTop: 8,
    color: '#7EAC00',
    fontSize: 20,
    fontWeight: '700',
  },
  metricValue: {
    marginTop: 8,
    color: '#111111',
    fontSize: 19,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 38,
    backgroundColor: '#D8D8D8',
  },
  recommendations: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D8D8',
  },
  recommendation: {
    flex: 1,
    alignItems: 'center',
  },
  message: {
    marginTop: 22,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#EBEBEB',
  },
  messageTitle: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
  messageText: {
    marginTop: 9,
    color: '#555555',
    fontSize: 14,
    lineHeight: 21,
  },
});
