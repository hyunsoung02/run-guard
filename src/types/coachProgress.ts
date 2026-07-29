export type CoachProgress = {
  weekKey: string;

  targetDistanceM: number;
  completedDistanceM: number;

  targetRunCount: number;
  completedRunCount: number;

  earnedBadgeIds: string[];
};
