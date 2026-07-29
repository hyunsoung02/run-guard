import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  CoachDashboard,
} from '../features/coach/components/CoachDashboard';
import {
  CoachHydrationPlaceholder,
} from '../features/coach/components/CoachHydrationPlaceholder';
import {
  CoachLevelSelection,
} from '../features/coach/components/CoachLevelSelection';
import type {
  RootStackParamList,
} from '../navigation/types';
import {
  useCoachStore,
} from '../stores/useCoachStore';

type CoachScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'Coach'
  >;

export function CoachScreen({
  navigation,
}: CoachScreenProps) {
  const selectedLevel =
    useCoachStore(
      (state) =>
        state.selectedLevel,
    );
  const hasHydrated = useCoachStore(
    (state) => state.hasHydrated,
  );
  const selectLevel = useCoachStore(
    (state) => state.selectLevel,
  );

  if (!hasHydrated) {
    return (
      <CoachHydrationPlaceholder />
    );
  }

  const sharedNavigationProps = {
    onPressBack: () =>
      navigation.goBack(),
    onPressCoach: () =>
      navigation.navigate(
        'Coach',
        undefined,
        {
          pop: true,
        },
      ),
    onPressMenu: () =>
      navigation.navigate('Menu'),
    onPressStart: () =>
      navigation.navigate('Loading', {
        mode: 'course',
      }),
  };

  if (selectedLevel === null) {
    return (
      <CoachLevelSelection
        {...sharedNavigationProps}
        onSelectLevel={selectLevel}
      />
    );
  }

  return (
    <CoachDashboard
      {...sharedNavigationProps}
      level={selectedLevel}
    />
  );
}
