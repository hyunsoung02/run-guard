import type {
  AiCoachPlanSummary,
  AiCoachRunnerLevel,
} from '../types/aiCoachPlan';

export const AI_COACH_RUNNER_LEVEL_LABELS:
  Record<AiCoachRunnerLevel, string> = {
    beginner: '초급 러너',
    intermediate: '중급 러너',
    advanced: '상급 러너',
    custom: '맞춤 러너',
  };

export function createRuleBasedCoachPlanSummary(
  runnerLevel:
    | AiCoachRunnerLevel
    | null,
): AiCoachPlanSummary {
  const resolvedLevel =
    runnerLevel ?? 'beginner';
  const planByLevel:
    Record<
      Exclude<
        AiCoachRunnerLevel,
        'custom'
      >,
      Pick<
        AiCoachPlanSummary,
        | 'weeklyGoalKm'
        | 'weeklyRecommendedRunCount'
        | 'recommendedDistanceKm'
      >
    > = {
    beginner: {
      weeklyGoalKm: 15,
      weeklyRecommendedRunCount: 3,
      recommendedDistanceKm: 5,
    },
    intermediate: {
      weeklyGoalKm: 25,
      weeklyRecommendedRunCount: 3,
      recommendedDistanceKm: 7,
    },
    advanced: {
      weeklyGoalKm: 40,
      weeklyRecommendedRunCount: 3,
      recommendedDistanceKm: 10,
    },
  };
  const plan =
    resolvedLevel === 'custom'
      ? planByLevel.beginner
      : planByLevel[resolvedLevel];

  return {
    runnerLevel: resolvedLevel,
    ...plan,
    planMessage: `${AI_COACH_RUNNER_LEVEL_LABELS[resolvedLevel]} 기준 규칙으로 주 ${plan.weeklyRecommendedRunCount}회, 총 ${plan.weeklyGoalKm}km를 추천합니다.`,
  };
}
