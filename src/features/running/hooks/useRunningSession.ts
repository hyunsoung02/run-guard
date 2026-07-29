import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import * as Location from 'expo-location';

import {
  selectActiveSession,
  selectAveragePaceSecondsPerKm,
  selectRemainingDistanceM,
  useRunningStore,
} from '../../../stores/useRunningStore';
import type {
  RunningStoreState,
} from '../../../stores/useRunningStore';
import type {
  LocationPoint,
  RunningSessionStatus,
} from '../../../types';
import {
  formatRunningPace,
  getRunningDistanceKm,
} from '../utils/runningSessionCalculations';

export type RunningSessionData = {
  sessionId: string | null;
  status: RunningSessionStatus;
  targetDistanceM: number;
  distanceM: number;
  remainingDistanceM: number;
  elapsedSeconds: number;
  averagePaceSecondsPerKm:
    | number
    | null;
  currentHeartRateBpm:
    | number
    | null;
  actualRoute: LocationPoint[];
  locationTrackingStatus:
    LocationTrackingStatus;
  locationErrorMessage: string | null;

  /*
   * 기존 RunningLiveStats 표시 형식을 유지하기 위한 UI 변환 값입니다.
   */
  heartRate: number | null;
  pace: string;
  distanceKm: number;
};

export type RunningSessionActions =
  Pick<
    RunningStoreState,
    | 'prepareSession'
    | 'startSession'
    | 'pauseSession'
    | 'resumeSession'
    | 'finishSession'
  >;

export type UseRunningSessionResult =
  RunningSessionData &
    RunningSessionActions;

const EMPTY_ROUTE_POINTS:
  LocationPoint[] = [];

const MAX_ACCEPTABLE_LOCATION_ACCURACY_M =
  50;
const MAX_PLAUSIBLE_RUNNING_SPEED_MPS =
  15;
const MIN_MEANINGFUL_MOVEMENT_M = 2;
const MAX_LOCATION_GAP_MS = 10_000;
const LOCATION_STALE_AFTER_MS = 15_000;
const LOCATION_WARNING_VISIBLE_MS = 4_000;

export type LocationTrackingStatus =
  | 'idle'
  | 'requesting-permission'
  | 'locating'
  | 'active'
  | 'permission-denied'
  | 'services-disabled'
  | 'weak-signal'
  | 'error';

function getNullableGpsValue(
  value: number | null,
): number | null {
  return value !== null &&
    Number.isFinite(value)
    ? value
    : null;
}

function getNullableNonNegativeGpsValue(
  value: number | null,
): number | null {
  return value !== null &&
    Number.isFinite(value) &&
    value >= 0
    ? value
    : null;
}

function getNullableHeadingValue(
  value: number | null,
): number | null {
  return value !== null &&
    Number.isFinite(value) &&
    value >= 0 &&
    value < 360
    ? value
    : null;
}

function createLocationPoint(
  location: Location.LocationObject,
): LocationPoint | null {
  const {
    accuracy,
    altitude,
    heading,
    latitude,
    longitude,
    speed,
  } = location.coords;

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isFinite(
      location.timestamp,
    ) ||
    location.timestamp <= 0 ||
    accuracy === null ||
    !Number.isFinite(accuracy) ||
    accuracy < 0 ||
    accuracy >
      MAX_ACCEPTABLE_LOCATION_ACCURACY_M
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
    timestampMs: location.timestamp,
    accuracyM: accuracy,
    altitudeM:
      getNullableGpsValue(altitude),
    speedMps:
      getNullableNonNegativeGpsValue(
        speed,
      ),
    headingDeg:
      getNullableHeadingValue(
        heading,
      ),
  };
}

function hasSameCoordinates(
  first: LocationPoint,
  second: LocationPoint,
): boolean {
  return (
    first.latitude ===
      second.latitude &&
    first.longitude ===
      second.longitude
  );
}

export function useRunningSession(): UseRunningSessionResult {
  const [
    locationTrackingStatus,
    setLocationTrackingStatus,
  ] =
    useState<LocationTrackingStatus>(
      'idle',
    );
  const [
    locationErrorMessage,
    setLocationErrorMessage,
  ] = useState<string | null>(null);

  const locationWarningTimeoutRef =
    useRef<
      ReturnType<typeof setTimeout> | null
    >(null);

  const clearTemporaryLocationWarning =
    useCallback(() => {
      if (
        locationWarningTimeoutRef.current !==
        null
      ) {
        clearTimeout(
          locationWarningTimeoutRef.current,
        );
        locationWarningTimeoutRef.current =
          null;
      }
    }, []);

  const showTemporaryLocationWarning =
    useCallback(
      (message: string) => {
        clearTemporaryLocationWarning();
        setLocationErrorMessage(message);

        locationWarningTimeoutRef.current =
          setTimeout(() => {
            setLocationErrorMessage(null);
            locationWarningTimeoutRef.current =
              null;
          }, LOCATION_WARNING_VISIBLE_MS);
      },
      [clearTemporaryLocationWarning],
    );

  const activeSession =
    useRunningStore(
      selectActiveSession,
    );
  const remainingDistanceM =
    useRunningStore(
      selectRemainingDistanceM,
    );
  const averagePaceSecondsPerKm =
    useRunningStore(
      selectAveragePaceSecondsPerKm,
    );
  const appendLocationPoint =
    useRunningStore(
      (state) =>
        state.appendLocationPoint,
    );
  const syncElapsedTime =
    useRunningStore(
      (state) =>
        state.syncElapsedTime,
    );
  const prepareSession =
    useRunningStore(
      (state) =>
        state.prepareSession,
    );
  const startSession =
    useRunningStore(
      (state) =>
        state.startSession,
    );
  const pauseSession =
    useRunningStore(
      (state) =>
        state.pauseSession,
    );
  const resumeSession =
    useRunningStore(
      (state) =>
        state.resumeSession,
    );
  const finishSession =
    useRunningStore(
      (state) =>
        state.finishSession,
    );
  const status =
    activeSession?.status ?? 'idle';
  const sessionId =
    activeSession?.id ?? null;

  useEffect(() => {
    if (
      status !== 'running' ||
      sessionId === null
    ) {
      return;
    }

    syncElapsedTime();

    const timer = setInterval(() => {
      syncElapsedTime();
    }, 1000);

    return () => clearInterval(timer);
  }, [
    sessionId,
    status,
    syncElapsedTime,
  ]);

  useEffect(() => {
    if (status !== 'running') {
      clearTemporaryLocationWarning();
      setLocationTrackingStatus('idle');
      setLocationErrorMessage(null);
      return;
    }

    let subscription:
      | Location.LocationSubscription
      | undefined;
    let cancelled = false;
    let previousPoint:
      | LocationPoint
      | null = null;
    let lastValidLocationAtMs =
      Date.now();
    let staleWarningShown = false;
    let accuracyWarningShown = false;
    let staleTimer:
      | ReturnType<typeof setInterval>
      | undefined;

    async function startTracking() {
      try {
        setLocationTrackingStatus(
          'requesting-permission',
        );
        setLocationErrorMessage(null);

        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (cancelled) {
          return;
        }

        if (
          permission.status !==
          Location.PermissionStatus
            .GRANTED
        ) {
          setLocationTrackingStatus(
            'permission-denied',
          );
          setLocationErrorMessage(
            '위치 권한이 없어 거리를 측정할 수 없습니다. 아래 종료 버튼으로 러닝을 종료해 주세요.',
          );
          return;
        }

        const servicesEnabled =
          await Location.hasServicesEnabledAsync();

        if (cancelled) {
          return;
        }

        if (!servicesEnabled) {
          setLocationTrackingStatus(
            'services-disabled',
          );
          setLocationErrorMessage(
            '위치 서비스가 꺼져 있습니다. GPS를 켜거나 아래 종료 버튼으로 러닝을 종료해 주세요.',
          );
          return;
        }

        setLocationTrackingStatus(
          'locating',
        );
        setLocationErrorMessage(
          'GPS 위치를 찾고 있습니다.',
        );
        lastValidLocationAtMs =
          Date.now();

        staleTimer = setInterval(() => {
          if (
            cancelled ||
            staleWarningShown ||
            Date.now() -
              lastValidLocationAtMs <=
              LOCATION_STALE_AFTER_MS
          ) {
            return;
          }

          staleWarningShown = true;

          setLocationTrackingStatus(
            'weak-signal',
          );
          showTemporaryLocationWarning(
            'GPS 위치가 15초 이상 갱신되지 않았습니다. 하늘이 보이는 곳에서 잠시 기다려 주세요.',
          );
        }, 3_000);

        const nextSubscription =
          await Location.watchPositionAsync(
            {
              accuracy:
                Location.Accuracy.High,
              distanceInterval: 5,
              timeInterval: 1000,
            },
            (location) => {
              if (cancelled) {
                return;
              }

              const currentSession =
                useRunningStore.getState()
                  .activeSession;

              if (
                currentSession === null ||
                currentSession.id !==
                  sessionId ||
                currentSession.status !==
                  'running'
              ) {
                return;
              }

              const accuracy =
                location.coords.accuracy;

              if (
                accuracy === null ||
                !Number.isFinite(
                  accuracy,
                ) ||
                accuracy >
                  MAX_ACCEPTABLE_LOCATION_ACCURACY_M
              ) {
                setLocationTrackingStatus(
                  'weak-signal',
                );

                if (!accuracyWarningShown) {
                  accuracyWarningShown =
                    true;
                  showTemporaryLocationWarning(
                    'GPS 정확도가 부족합니다. 하늘이 보이는 곳에서 잠시 기다려 주세요.',
                  );
                }

                return;
              }

              const point =
                createLocationPoint(
                  location,
                );

              if (point === null) {
                setLocationTrackingStatus(
                  'error',
                );
                setLocationErrorMessage(
                  '유효한 위치 정보를 받지 못했습니다.',
                );
                return;
              }

              lastValidLocationAtMs =
                Date.now();
              staleWarningShown = false;
              accuracyWarningShown = false;

              clearTemporaryLocationWarning();
              setLocationTrackingStatus(
                'active',
              );
              setLocationErrorMessage(null);

              if (
                previousPoint === null
              ) {
                appendLocationPoint(
                  point,
                  0,
                );
                previousPoint = point;
                return;
              }

              if (
                hasSameCoordinates(
                  previousPoint,
                  point,
                )
              ) {
                previousPoint = point;
                return;
              }

              const elapsedMs =
                point.timestampMs -
                previousPoint.timestampMs;

              if (
                !Number.isFinite(
                  elapsedMs,
                ) ||
                elapsedMs <= 0
              ) {
                return;
              }

              if (
                elapsedMs >
                MAX_LOCATION_GAP_MS
              ) {
                appendLocationPoint(
                  point,
                  0,
                );
                previousPoint = point;
                return;
              }

              const segmentDistanceM =
                getRunningDistanceKm(
                  previousPoint,
                  point,
                ) * 1000;
              const measuredSpeedMps =
                segmentDistanceM /
                (elapsedMs / 1000);

              if (
                !Number.isFinite(
                  segmentDistanceM,
                ) ||
                !Number.isFinite(
                  measuredSpeedMps,
                )
              ) {
                return;
              }

              if (
                measuredSpeedMps >
                  MAX_PLAUSIBLE_RUNNING_SPEED_MPS
              ) {
                return;
              }

              if (
                segmentDistanceM <
                MIN_MEANINGFUL_MOVEMENT_M
              ) {
                appendLocationPoint(
                  point,
                  0,
                );
                previousPoint = point;
                return;
              }

              appendLocationPoint(
                point,
                segmentDistanceM,
              );
              previousPoint = point;
            },
          );

        if (cancelled) {
          nextSubscription.remove();
          return;
        }

        subscription =
          nextSubscription;
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }

        setLocationTrackingStatus(
          'error',
        );
        setLocationErrorMessage(
          error instanceof Error &&
            error.message
            ? `위치 구독에 실패했습니다: ${error.message}`
            : '위치 구독에 실패했습니다. GPS 상태를 확인해 주세요.',
        );
      }
    }

    void startTracking();

    return () => {
      cancelled = true;

      if (staleTimer) {
        clearInterval(staleTimer);
      }

      clearTemporaryLocationWarning();
      subscription?.remove();
    };
  }, [
    appendLocationPoint,
    clearTemporaryLocationWarning,
    sessionId,
    showTemporaryLocationWarning,
    status,
  ]);

  return useMemo(() => {
    const distanceM =
      activeSession?.distanceM ?? 0;
    const distanceKm =
      distanceM / 1000;
    const elapsedSeconds =
      activeSession?.elapsedSeconds ??
      0;
    const currentHeartRateBpm =
      activeSession
        ?.currentHeartRateBpm ??
      null;

    return {
      sessionId,
      status,
      targetDistanceM:
        activeSession
          ?.targetDistanceM ?? 0,
      distanceM,
      remainingDistanceM,
      elapsedSeconds,
      averagePaceSecondsPerKm,
      currentHeartRateBpm,
      actualRoute:
        activeSession?.actualRoute ??
        EMPTY_ROUTE_POINTS,
      locationTrackingStatus,
      locationErrorMessage,

      heartRate:
        currentHeartRateBpm,
      pace: formatRunningPace(
        distanceKm,
        elapsedSeconds,
      ),
      distanceKm,
      prepareSession,
      startSession,
      pauseSession,
      resumeSession,
      finishSession,
    };
  }, [
    activeSession,
    averagePaceSecondsPerKm,
    finishSession,
    locationErrorMessage,
    locationTrackingStatus,
    pauseSession,
    prepareSession,
    remainingDistanceM,
    resumeSession,
    sessionId,
    startSession,
    status,
  ]);
}
