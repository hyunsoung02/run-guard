export type CoachLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced';

export type CoachPlanStatus =
  | 'completed'
  | 'scheduled';

export interface WeeklyPlanItem {
  id: string;
  dayLabel: string;
  distanceKm: number;
  title: string;
  description: string;
  status: CoachPlanStatus;
}

export interface WeeklyCoachPlan {
  weekKey: string;
  level: CoachLevel;
  targetDistanceKm: number;
  completedDistanceKm: number;
  items: WeeklyPlanItem[];
  goalAchieved: boolean;
  badgeRewardCount: 5;
}

export interface CoachLevelDetails {
  label: string;
  title: string;
  selectionDescription: string;
  dashboardDescription: string;
  accentColor: string;
  softColor: string;
}
