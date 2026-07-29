import {
  useEffect,
  useRef,
} from 'react';
import {
  AppState,
} from 'react-native';
import type {
  AppStateStatus,
} from 'react-native';

import {
  selectRefreshLocation,
  useLocationStore,
} from '../stores/useLocationStore';

export function useAppLocationLifecycle() {
  const refreshLocation =
    useLocationStore(
      selectRefreshLocation,
    );
  const previousAppStateRef =
    useRef<AppStateStatus>(
      AppState.currentState,
    );

  useEffect(() => {
    const subscription =
      AppState.addEventListener(
        'change',
        (nextAppState) => {
          const previousAppState =
            previousAppStateRef.current;

          previousAppStateRef.current =
            nextAppState;

          if (
            nextAppState ===
              'active' &&
            (previousAppState ===
              'background' ||
              previousAppState ===
                'inactive')
          ) {
            void refreshLocation();
          }
        },
      );

    return () => {
      subscription.remove();
    };
  }, [refreshLocation]);
}
