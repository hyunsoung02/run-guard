import {
  useContext,
} from 'react';

import {
  SettingsPreferencesContext,
} from '../state/SettingsPreferencesContext';

export function useSettingsPreferences() {
  const context = useContext(
    SettingsPreferencesContext,
  );

  if (context === undefined) {
    throw new Error(
      'useSettingsPreferences는 SettingsPreferencesProvider 안에서 사용해야 합니다.',
    );
  }

  return context;
}
