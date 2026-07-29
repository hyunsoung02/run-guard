import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';

import type {
  CoachLevel,
} from '../features/coach/types/coach.types';

interface CoachStoreState {
  selectedLevel: CoachLevel | null;
  hasHydrated: boolean;
  selectLevel: (level: CoachLevel) => void;
  setHasHydrated: (
    hasHydrated: boolean,
  ) => void;
}

export const useCoachStore =
  create<CoachStoreState>()(
    persist(
      (set) => ({
        selectedLevel: null,
        hasHydrated: false,
        selectLevel: (level) => {
          set({ selectedLevel: level });
        },
        setHasHydrated: (hasHydrated) => {
          set({ hasHydrated });
        },
      }),
      {
        name: '@run_guard/coach_v1',
        storage: createJSONStorage(
          () => AsyncStorage,
        ),
        partialize: (state) => ({
          selectedLevel:
            state.selectedLevel,
        }),
        onRehydrateStorage:
          (stateBeforeHydration) =>
          (rehydratedState) => {
            (
              rehydratedState ??
              stateBeforeHydration
            ).setHasHydrated(true);
          },
      },
    ),
  );
