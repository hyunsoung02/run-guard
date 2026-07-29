import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import type {
  PropsWithChildren,
} from 'react';

import {
  DEFAULT_SETTINGS_PREFERENCES,
} from '../data/defaultSettingsPreferences';
import type {
  RunningProfileSettings,
  SettingsPreferences,
  SettingsPreferencesContextValue,
  VoiceGuideIntervalKm,
  VoiceGuideSettings,
} from '../types/settingsPreferences';

const STORAGE_KEY =
  '@run_guard/settings_preferences_v1';

type SettingsAction =
  | {
      type: 'hydrate';
      preferences: SettingsPreferences;
    }
  | {
      type: 'profile';
      profile: RunningProfileSettings;
    }
  | {
      type: 'voiceGuide';
      voiceGuide: VoiceGuideSettings;
    }
  | {
      type: 'reset';
    };

function reducer(
  state: SettingsPreferences,
  action: SettingsAction,
): SettingsPreferences {
  switch (action.type) {
    case 'hydrate':
      return action.preferences;
    case 'profile':
      return {
        ...state,
        profile: action.profile,
      };
    case 'voiceGuide':
      return {
        ...state,
        voiceGuide: action.voiceGuide,
      };
    case 'reset':
      return DEFAULT_SETTINGS_PREFERENCES;
  }
}

function isVoiceInterval(
  value: unknown,
): value is VoiceGuideIntervalKm {
  return value === 0.5 ||
    value === 1 ||
    value === 2;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null
  );
}

function isSettingsPreferences(
  value: unknown,
): value is SettingsPreferences {
  if (!isRecord(value)) {
    return false;
  }

  const profile = value.profile;
  const voiceGuide = value.voiceGuide;

  return (
    isRecord(profile) &&
    typeof profile.age === 'number' &&
    typeof profile.heightCm === 'number' &&
    typeof profile.weightKg === 'number' &&
    isRecord(voiceGuide) &&
    typeof voiceGuide.enabled === 'boolean' &&
    typeof voiceGuide.turnGuidanceEnabled ===
      'boolean' &&
    typeof voiceGuide.remainingDistanceEnabled ===
      'boolean' &&
    typeof voiceGuide.paceGuidanceEnabled ===
      'boolean' &&
    isVoiceInterval(voiceGuide.intervalKm)
  );
}

export const SettingsPreferencesContext =
  createContext<
    SettingsPreferencesContextValue | undefined
  >(undefined);

export function SettingsPreferencesProvider({
  children,
}: PropsWithChildren) {
  const [preferences, dispatch] = useReducer(
    reducer,
    DEFAULT_SETTINGS_PREFERENCES,
  );
  const [isHydrated, setIsHydrated] =
    useState(false);

  useEffect(() => {
    let isActive = true;

    async function hydrate() {
      try {
        const storedValue =
          await AsyncStorage.getItem(
            STORAGE_KEY,
          );
        const parsed: unknown =
          storedValue === null
            ? null
            : JSON.parse(storedValue);

        if (
          isActive &&
          isSettingsPreferences(parsed)
        ) {
          dispatch({
            type: 'hydrate',
            preferences: {
              profile: {
                age: parsed.profile.age,
                heightCm:
                  parsed.profile.heightCm,
                weightKg:
                  parsed.profile.weightKg,
              },
              voiceGuide: {
                enabled:
                  parsed.voiceGuide.enabled,
                turnGuidanceEnabled:
                  parsed.voiceGuide
                    .turnGuidanceEnabled,
                remainingDistanceEnabled:
                  parsed.voiceGuide
                    .remainingDistanceEnabled,
                paceGuidanceEnabled:
                  parsed.voiceGuide
                    .paceGuidanceEnabled,
                intervalKm:
                  parsed.voiceGuide
                    .intervalKm,
              },
            },
          });
        }
      } catch (error) {
        console.warn(
          '설정 불러오기 실패:',
          error,
        );
      } finally {
        if (isActive) {
          setIsHydrated(true);
        }
      }
    }

    hydrate();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(preferences),
    ).catch((error: unknown) => {
      console.warn(
        '설정 저장 실패:',
        error,
      );
    });
  }, [isHydrated, preferences]);

  const value = useMemo(
    (): SettingsPreferencesContextValue => ({
      preferences,
      isHydrated,
      updateProfile: (profile) => {
        dispatch({
          type: 'profile',
          profile,
        });
      },
      updateVoiceGuide: (voiceGuide) => {
        dispatch({
          type: 'voiceGuide',
          voiceGuide,
        });
      },
      resetSettings: () => {
        dispatch({ type: 'reset' });
      },
    }),
    [isHydrated, preferences],
  );

  return (
    <SettingsPreferencesContext.Provider
      value={value}
    >
      {children}
    </SettingsPreferencesContext.Provider>
  );
}
