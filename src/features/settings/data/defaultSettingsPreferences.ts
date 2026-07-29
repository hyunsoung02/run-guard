import type {
  SettingsPreferences,
} from '../types/settingsPreferences';

export const DEFAULT_SETTINGS_PREFERENCES = {
  profile: {
    age: 25,
    heightCm: 175,
    weightKg: 70,
  },
  voiceGuide: {
    enabled: true,
    turnGuidanceEnabled: true,
    remainingDistanceEnabled: true,
    paceGuidanceEnabled: true,
    intervalKm: 1,
  },
} satisfies SettingsPreferences;
