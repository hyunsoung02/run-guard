import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';

import type {
  LngLat,
} from '../features/map/data/runningRoute';
import {
  isValidPaceSample,
} from '../features/running/utils/runningSessionCalculations';
import type {
  LocationPoint,
  RunningRecord,
  RunningSession,
} from '../types';

export interface RunningStoreState {
  activeSession: RunningSession | null;
  records: RunningRecord[];
  hasHydrated: boolean;

  prepareSession: (
    targetDistanceM: number,
    plannedRoute?: readonly LngLat[],
  ) => void;
  startSession: (
    startedAtMs?: number,
  ) => void;
  appendLocationPoint: (
    point: LocationPoint,
    segmentDistanceM?: number,
  ) => void;
  syncElapsedTime: (
    nowMs?: number,
  ) => void;
  setCurrentHeartRate: (
    heartRateBpm: number | null,
  ) => void;
  pauseSession: (
    pausedAtMs?: number,
  ) => void;
  resumeSession: (
    resumedAtMs?: number,
  ) => void;
  finishSession: (
    endedAtMs?: number,
  ) => RunningRecord | null;
  clearActiveSession: () => void;
  removeRecord: (
    recordId: string,
  ) => void;
  clearRecords: () => void;
  setHasHydrated: (
    hasHydrated: boolean,
  ) => void;
}

type PersistedRunningStoreState =
  Pick<
    RunningStoreState,
    'records'
  >;

let sessionIdSequence = 0;

function createSessionId(): string {
  sessionIdSequence += 1;

  return [
    'running',
    Date.now().toString(36),
    sessionIdSequence.toString(36),
    Math.random()
      .toString(36)
      .slice(2, 10),
  ].join('-');
}

function resolveTimestampMs(
  timestampMs: number | undefined,
): number {
  return timestampMs !== undefined &&
    Number.isFinite(timestampMs)
    ? timestampMs
    : Date.now();
}

function calculateElapsedSeconds(
  session: RunningSession,
  nowMs: number,
): number {
  if (session.startedAtMs === null) {
    return 0;
  }

  const currentPauseDurationMs =
    session.status === 'paused' &&
    session.pausedAtMs !== null
      ? Math.max(
          nowMs -
            session.pausedAtMs,
          0,
        )
      : 0;
  const elapsedMs = Math.max(
    nowMs -
      session.startedAtMs -
      session.pausedDurationMs -
      currentPauseDurationMs,
    0,
  );

  return Math.floor(
    elapsedMs / 1000,
  );
}

export const useRunningStore =
  create<RunningStoreState>()(
    persist<
      RunningStoreState,
      [],
      [],
      PersistedRunningStoreState
    >(
      (set, get) => ({
        activeSession: null,
        records: [],
        hasHydrated: false,

        prepareSession: (
          targetDistanceM,
          plannedRoute,
        ) => {
          if (
            !Number.isFinite(
              targetDistanceM,
            ) ||
            targetDistanceM <= 0
          ) {
            return;
          }

          set({
            activeSession: {
              id: createSessionId(),
              status: 'ready',
              targetDistanceM,
              distanceM: 0,
              elapsedSeconds: 0,
              startedAtMs: null,
              endedAtMs: null,
              pausedAtMs: null,
              pausedDurationMs: 0,
              currentHeartRateBpm:
                null,
              plannedRoute:
                plannedRoute?.map(
                  (coordinate) => [
                    coordinate[0],
                    coordinate[1],
                  ],
                ) ?? [],
              actualRoute: [],
            },
          });
        },

        startSession: (
          startedAtMs,
        ) => {
          const resolvedStartedAtMs =
            resolveTimestampMs(
              startedAtMs,
            );

          set((state) => {
            const session =
              state.activeSession;

            if (
              session === null ||
              (session.status !==
                'ready' &&
                session.status !==
                  'idle')
            ) {
              return state;
            }

            return {
              activeSession: {
                ...session,
                status: 'running',
                elapsedSeconds: 0,
                startedAtMs:
                  resolvedStartedAtMs,
                endedAtMs: null,
                pausedAtMs: null,
                pausedDurationMs: 0,
              },
            };
          });
        },

        appendLocationPoint: (
          point,
          segmentDistanceM = 0,
        ) => {
          set((state) => {
            const session =
              state.activeSession;

            if (
              session === null ||
              session.status !==
                'running'
            ) {
              return state;
            }

            const distanceIncrementM =
              Number.isFinite(
                segmentDistanceM,
              ) &&
              segmentDistanceM > 0
                ? segmentDistanceM
                : 0;

            return {
              activeSession: {
                ...session,
                distanceM:
                  session.distanceM +
                  distanceIncrementM,
                actualRoute: [
                  ...session.actualRoute,
                  {
                    ...point,
                    sessionElapsedSeconds:
                      calculateElapsedSeconds(
                        session,
                        point.timestampMs,
                      ),
                  },
                ],
              },
            };
          });
        },

        syncElapsedTime: (nowMs) => {
          const resolvedNowMs =
            resolveTimestampMs(nowMs);

          set((state) => {
            const session =
              state.activeSession;

            if (
              session === null ||
              session.startedAtMs ===
                null ||
              (session.status !==
                'running' &&
                session.status !==
                  'paused')
            ) {
              return state;
            }

            return {
              activeSession: {
                ...session,
                elapsedSeconds:
                  calculateElapsedSeconds(
                    session,
                    resolvedNowMs,
                  ),
              },
            };
          });
        },

        setCurrentHeartRate: (
          heartRateBpm,
        ) => {
          if (
            heartRateBpm !== null &&
            (!Number.isFinite(
              heartRateBpm,
            ) ||
              heartRateBpm < 0)
          ) {
            return;
          }

          set((state) => {
            if (
              state.activeSession ===
              null
            ) {
              return state;
            }

            return {
              activeSession: {
                ...state.activeSession,
                currentHeartRateBpm:
                  heartRateBpm,
              },
            };
          });
        },

        pauseSession: (
          pausedAtMs,
        ) => {
          const resolvedPausedAtMs =
            resolveTimestampMs(
              pausedAtMs,
            );

          set((state) => {
            const session =
              state.activeSession;

            if (
              session === null ||
              session.status !==
                'running'
            ) {
              return state;
            }

            return {
              activeSession: {
                ...session,
                status: 'paused',
                pausedAtMs:
                  resolvedPausedAtMs,
              },
            };
          });
        },

        resumeSession: (
          resumedAtMs,
        ) => {
          const resolvedResumedAtMs =
            resolveTimestampMs(
              resumedAtMs,
            );

          set((state) => {
            const session =
              state.activeSession;

            if (
              session === null ||
              session.status !==
                'paused'
            ) {
              return state;
            }

            const pauseDurationMs =
              session.pausedAtMs ===
              null
                ? 0
                : Math.max(
                    resolvedResumedAtMs -
                      session.pausedAtMs,
                    0,
                  );

            return {
              activeSession: {
                ...session,
                status: 'running',
                pausedAtMs: null,
                pausedDurationMs:
                  session.pausedDurationMs +
                  pauseDurationMs,
              },
            };
          });
        },

        finishSession: (
          endedAtMs,
        ) => {
          const state = get();
          const session =
            state.activeSession;

          if (
            session === null ||
            session.startedAtMs ===
              null ||
            session.status ===
              'ready' ||
            session.status ===
              'idle' ||
            session.status ===
              'completed'
          ) {
            return null;
          }

          const resolvedEndedAtMs =
            resolveTimestampMs(
              endedAtMs,
            );
          const currentPauseDurationMs =
            session.status ===
              'paused' &&
            session.pausedAtMs !== null
              ? Math.max(
                  resolvedEndedAtMs -
                    session.pausedAtMs,
                  0,
                )
              : 0;
          const finalPausedDurationMs =
            session.pausedDurationMs +
            currentPauseDurationMs;
          const durationSeconds =
            Math.floor(
              Math.max(
                resolvedEndedAtMs -
                  session.startedAtMs -
                  finalPausedDurationMs,
                0,
              ) / 1000,
            );
          const distanceKm =
            session.distanceM / 1000;
          const averagePaceSecondsPerKm =
            isValidPaceSample(
              session.distanceM,
              durationSeconds,
            )
              ? durationSeconds /
                distanceKm
              : null;
          const record: RunningRecord = {
            id: session.id,
            createdAtMs:
              resolvedEndedAtMs,
            startedAtMs:
              session.startedAtMs,
            endedAtMs:
              resolvedEndedAtMs,
            targetDistanceM:
              session.targetDistanceM,
            distanceM:
              session.distanceM,
            durationSeconds,
            averagePaceSecondsPerKm,
            averageHeartRateBpm:
              session.currentHeartRateBpm,
            caloriesKcal: null,
            elevationGainM: null,
            cadenceSpm: null,
            completedTarget:
              session.distanceM >=
              session.targetDistanceM,
            plannedRoute:
              session.plannedRoute.map(
                (coordinate) => [
                  coordinate[0],
                  coordinate[1],
                ],
              ),
            actualRoute: [
              ...session.actualRoute,
            ],
          };

          set((currentState) => ({
            activeSession: {
              ...session,
              status: 'completed',
              elapsedSeconds:
                durationSeconds,
              endedAtMs:
                resolvedEndedAtMs,
              pausedAtMs: null,
              pausedDurationMs:
                finalPausedDurationMs,
            },
            records: [
              record,
              ...currentState.records,
            ],
          }));

          return record;
        },

        clearActiveSession: () => {
          set({
            activeSession: null,
          });
        },

        removeRecord: (recordId) => {
          set((state) => ({
            records:
              state.records.filter(
                (record) =>
                  record.id !==
                  recordId,
              ),
          }));
        },

        clearRecords: () => {
          set({ records: [] });
        },

        setHasHydrated: (
          hasHydrated,
        ) => {
          set({ hasHydrated });
        },
      }),
      {
        name: '@run_guard/running_v1',
        storage:
          createJSONStorage<PersistedRunningStoreState>(
            () => AsyncStorage,
          ),
        partialize: (
          state,
        ): PersistedRunningStoreState => ({
          records: state.records,
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

export const selectActiveSession = (
  state: RunningStoreState,
) => state.activeSession;

export const selectRunningRecords = (
  state: RunningStoreState,
) => state.records;

export const selectRunningStoreHydrated =
  (state: RunningStoreState) =>
    state.hasHydrated;

export const selectRemainingDistanceM =
  (state: RunningStoreState) => {
    const session =
      state.activeSession;

    if (session === null) {
      return 0;
    }

    return Math.max(
      session.targetDistanceM -
        session.distanceM,
      0,
    );
  };

export const selectRunningProgressRatio =
  (state: RunningStoreState) => {
    const session =
      state.activeSession;

    if (
      session === null ||
      session.targetDistanceM <= 0
    ) {
      return 0;
    }

    return Math.min(
      Math.max(
        session.distanceM /
          session.targetDistanceM,
        0,
      ),
      1,
    );
  };

export const selectDistanceKm = (
  state: RunningStoreState,
) =>
  (state.activeSession?.distanceM ??
    0) / 1000;

export const selectAveragePaceSecondsPerKm =
  (state: RunningStoreState) => {
    const session =
      state.activeSession;

    if (
      session === null ||
      !isValidPaceSample(
        session.distanceM,
        session.elapsedSeconds,
      )
    ) {
      return null;
    }

    return (
      session.elapsedSeconds /
      (session.distanceM / 1000)
    );
  };

export const selectIsRunning = (
  state: RunningStoreState,
) =>
  state.activeSession?.status ===
  'running';

export const selectIsPaused = (
  state: RunningStoreState,
) =>
  state.activeSession?.status ===
  'paused';
