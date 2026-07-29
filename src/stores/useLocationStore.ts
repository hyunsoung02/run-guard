import * as Location from 'expo-location';
import { create } from 'zustand';

import {
  isLocationUsable,
  LOCATION_MAX_AGE_MS,
  MAX_ACCEPTABLE_ACCURACY_M,
} from '../services/location/locationValidity';
import type {
  LocationPoint,
} from '../types/location';

export type LocationStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error'
  | 'permission-denied';

export interface LocationStoreState {
  currentLocation: LocationPoint | null;
  capturedAtMs: number | null;
  accuracyM: number | null;
  status: LocationStatus;
  errorMessage: string | null;
  initializeLocation: () =>
    Promise<LocationPoint | null>;
  refreshLocation: () =>
    Promise<LocationPoint | null>;
  ensureFreshLocation: () =>
    Promise<LocationPoint | null>;
  clearLocationError: () => void;
}

type LocationRequestOptions = {
  allowPermissionPrompt: boolean;
  preferLastKnownPosition: boolean;
};

let locationRequestPromise:
  | Promise<LocationPoint | null>
  | null = null;

function toLocationPoint(
  location: Location.LocationObject,
): LocationPoint {
  return {
    latitude: location.coords.latitude,
    longitude:
      location.coords.longitude,
    timestampMs: location.timestamp,
    accuracyM:
      location.coords.accuracy,
    altitudeM:
      location.coords.altitude,
    speedMps: location.coords.speed,
    headingDeg:
      location.coords.heading,
  };
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message.trim().length > 0
  ) {
    return error.message;
  }

  return '현재 위치를 확인하지 못했어요. GPS 상태를 확인하고 다시 시도해 주세요.';
}

export const useLocationStore =
  create<LocationStoreState>()(
    (set, get) => {
      async function requestLocation({
        allowPermissionPrompt,
        preferLastKnownPosition,
      }: LocationRequestOptions): Promise<LocationPoint | null> {
        if (locationRequestPromise) {
          return locationRequestPromise;
        }

        locationRequestPromise =
          (async () => {
            try {
              let permission =
                await Location
                  .getForegroundPermissionsAsync();

              if (
                permission.status !==
                  Location.PermissionStatus
                    .GRANTED &&
                allowPermissionPrompt &&
                permission.canAskAgain
              ) {
                set({
                  status: 'loading',
                  errorMessage: null,
                });

                permission =
                  await Location
                    .requestForegroundPermissionsAsync();
              }

              if (
                permission.status ===
                Location.PermissionStatus
                  .UNDETERMINED
              ) {
                set({
                  status: 'idle',
                  errorMessage: null,
                });
                return null;
              }

              if (
                permission.status !==
                Location.PermissionStatus
                  .GRANTED
              ) {
                set({
                  status:
                    'permission-denied',
                  errorMessage:
                    '위치 권한이 없어 현재 위치 기반 코스를 만들 수 없어요.',
                });
                return null;
              }

              set({
                status: 'loading',
                errorMessage: null,
              });

              if (
                preferLastKnownPosition
              ) {
                const lastKnownPosition =
                  await Location
                    .getLastKnownPositionAsync({
                      maxAge:
                        LOCATION_MAX_AGE_MS,
                      requiredAccuracy:
                        MAX_ACCEPTABLE_ACCURACY_M,
                    });
                const lastKnownPoint =
                  lastKnownPosition
                    ? toLocationPoint(
                        lastKnownPosition,
                      )
                    : null;

                if (
                  lastKnownPoint &&
                  isLocationUsable(
                    lastKnownPoint,
                  )
                ) {
                  set({
                    currentLocation:
                      lastKnownPoint,
                    capturedAtMs:
                      lastKnownPoint.timestampMs,
                    accuracyM:
                      lastKnownPoint.accuracyM,
                    status: 'ready',
                    errorMessage: null,
                  });
                  return lastKnownPoint;
                }
              }

              const currentPosition =
                await Location
                  .getCurrentPositionAsync({
                    accuracy:
                      Location.Accuracy.High,
                  });
              const currentPoint =
                toLocationPoint(
                  currentPosition,
                );

              if (
                !isLocationUsable(
                  currentPoint,
                )
              ) {
                set({
                  currentLocation:
                    currentPoint,
                  capturedAtMs:
                    currentPoint.timestampMs,
                  accuracyM:
                    currentPoint.accuracyM,
                  status: 'error',
                  errorMessage:
                    currentPoint.accuracyM ===
                    null
                      ? '위치 정확도를 확인할 수 없어요. 잠시 후 다시 시도해 주세요.'
                      : '현재 위치의 정확도가 낮아요. 탁 트인 곳에서 다시 시도해 주세요.',
                });
                return null;
              }

              set({
                currentLocation:
                  currentPoint,
                capturedAtMs:
                  currentPoint.timestampMs,
                accuracyM:
                  currentPoint.accuracyM,
                status: 'ready',
                errorMessage: null,
              });
              return currentPoint;
            } catch (error: unknown) {
              set({
                status: 'error',
                errorMessage:
                  getErrorMessage(error),
              });
              return null;
            } finally {
              locationRequestPromise =
                null;
            }
          })();

        return locationRequestPromise;
      }

      return {
        currentLocation: null,
        capturedAtMs: null,
        accuracyM: null,
        status: 'idle',
        errorMessage: null,

        initializeLocation: async () => {
          const current =
            get().currentLocation;

          if (
            isLocationUsable(current)
          ) {
            return current;
          }

          return requestLocation({
            allowPermissionPrompt: false,
            preferLastKnownPosition:
              true,
          });
        },

        refreshLocation: () =>
          requestLocation({
            allowPermissionPrompt: false,
            preferLastKnownPosition:
              false,
          }),

        ensureFreshLocation:
          async () => {
            const current =
              get().currentLocation;

            if (
              isLocationUsable(current)
            ) {
              return current;
            }

            if (locationRequestPromise) {
              await locationRequestPromise;

              const sharedResult =
                get().currentLocation;

              if (
                isLocationUsable(
                  sharedResult,
                )
              ) {
                return sharedResult;
              }
            }

            return requestLocation({
              allowPermissionPrompt:
                true,
              preferLastKnownPosition:
                true,
            });
          },

        clearLocationError: () => {
          const state = get();

          if (
            state.status !== 'error'
          ) {
            return;
          }

          set({
            status: isLocationUsable(
              state.currentLocation,
            )
              ? 'ready'
              : 'idle',
            errorMessage: null,
          });
        },
      };
    },
  );

export const selectCurrentLocation = (
  state: LocationStoreState,
) => state.currentLocation;

export const selectLocationStatus = (
  state: LocationStoreState,
) => state.status;

export const selectLocationErrorMessage =
  (state: LocationStoreState) =>
    state.errorMessage;

export const selectInitializeLocation = (
  state: LocationStoreState,
) => state.initializeLocation;

export const selectRefreshLocation = (
  state: LocationStoreState,
) => state.refreshLocation;

export const selectEnsureFreshLocation =
  (state: LocationStoreState) =>
    state.ensureFreshLocation;
