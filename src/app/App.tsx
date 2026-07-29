import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from '../navigation/RootNavigator';
import {
  SettingsPreferencesProvider,
} from '../features/settings/state/SettingsPreferencesContext';
import {
  useAppLocationLifecycle,
} from '../hooks/useAppLocationLifecycle';

export default function App() {
  useAppLocationLifecycle();

  return (
    <SafeAreaProvider>
      <SettingsPreferencesProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SettingsPreferencesProvider>
    </SafeAreaProvider>
  );
}
