export type AiCoachRunnerLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'custom';

export type AiCoachPlanSummary = {
  runnerLevel: AiCoachRunnerLevel;
  weeklyGoalKm: number;
  weeklyRecommendedRunCount: number;
  recommendedDistanceKm: number;
  planMessage: string;
};
