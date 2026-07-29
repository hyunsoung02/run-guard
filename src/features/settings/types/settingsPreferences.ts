export type VoiceGuideIntervalKm =
  | 0.5
  | 1
  | 2;

export type RunningProfileSettings = {
  age: number;
  heightCm: number;
  weightKg: number;
};

export type VoiceGuideSettings = {
  enabled: boolean;
  turnGuidanceEnabled: boolean;
  remainingDistanceEnabled: boolean;
  paceGuidanceEnabled: boolean;
  intervalKm: VoiceGuideIntervalKm;
};

export type SettingsPreferences = {
  profile: RunningProfileSettings;
  voiceGuide: VoiceGuideSettings;
};

export type SettingsPreferencesContextValue = {
  preferences: SettingsPreferences;
  isHydrated: boolean;
  updateProfile: (
    profile: RunningProfileSettings,
  ) => void;
  updateVoiceGuide: (
    voiceGuide: VoiceGuideSettings,
  ) => void;
  resetSettings: () => void;
};
