export type SettingsMenuAction =
  | 'runningProfile'
  | 'runningGoal'
  | 'coachBadge'
  | 'voiceGuide'
  | 'usedData'
  | 'appInfo';

export type SettingsMenuItemData = {
  id: string;
  label: string;
  action: SettingsMenuAction;
};

export type SettingsMenuSectionData = {
  id: string;
  title: string;
  items: SettingsMenuItemData[];
};

export type SettingsUserSummaryData = {
  runnerLevel: string;
  weeklyGoalKm: number;
  weeklyCompletedKm: number;
};
