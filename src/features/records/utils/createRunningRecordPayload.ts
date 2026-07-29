import type {
  RunningRecordPayload,
} from '../../../navigation/types';

import type {
  RunningRecord,
} from '../../../types';

import {
  MIN_VALID_PACE_DISTANCE_M,
  formatRunningPace,
} from '../../running/utils/runningSessionCalculations';
import {
  createRunningSplits,
} from './createRunningSplits';
import {
  isRenderableActualRoute,
  normalizeRouteCoordinates,
  normalizeTrackedRouteCoordinates,
} from './recordRouteCoordinates';

function formatRecordDate(
  timestampMs: number,
): string {
  const date = new Date(timestampMs);

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1,
    ).padStart(2, '0'),
    String(date.getDate()).padStart(
      2,
      '0',
    ),
  ].join('.');
}

function formatRecordTime(
  timestampMs: number,
): string {
  const date = new Date(timestampMs);

  return [
    String(date.getHours()).padStart(
      2,
      '0',
    ),
    String(
      date.getMinutes(),
    ).padStart(2, '0'),
    String(
      date.getSeconds(),
    ).padStart(2, '0'),
  ].join(':');
}

export function createRunningRecordPayload(
  record: RunningRecord,
): RunningRecordPayload {
  const distanceKm =
    record.distanceM / 1000;
  const legacyRoute =
    record.routePoints ?? [];
  const storedPlannedRoute =
    normalizeRouteCoordinates(
      record.plannedRoute ?? [],
    );
  const actualRouteCoordinates =
    normalizeTrackedRouteCoordinates(
      record.actualRoute ??
        legacyRoute,
    );
  const hasStoredPlannedRoute =
    storedPlannedRoute.length >= 2;
  const canRenderActualRoute =
    Number.isFinite(
      record.distanceM,
    ) &&
    record.distanceM >=
      MIN_VALID_PACE_DISTANCE_M &&
    isRenderableActualRoute(
      actualRouteCoordinates,
      MIN_VALID_PACE_DISTANCE_M,
    );
  const plannedRouteCoordinates =
    hasStoredPlannedRoute
      ? storedPlannedRoute
      : canRenderActualRoute
        ? actualRouteCoordinates
        : [];
  const actualRouteOverlay =
    hasStoredPlannedRoute &&
    canRenderActualRoute
      ? actualRouteCoordinates
      : [];

  return {
    date: formatRecordDate(
      record.startedAtMs,
    ),
    timeRange: [
      formatRecordTime(
        record.startedAtMs,
      ),
      formatRecordTime(
        record.endedAtMs,
      ),
    ].join(' - '),
    distanceKm,
    averagePace:
      formatRunningPace(
        distanceKm,
        record.durationSeconds,
      ),
    durationSeconds:
      record.durationSeconds,

    heartRate:
      record.averageHeartRateBpm,
    elevationM:
      record.elevationGainM,
    cadenceSpm:
      record.cadenceSpm,
    splits:
      createRunningSplits(record),
    plannedRouteCoordinates:
      plannedRouteCoordinates.map(
        (coordinate) => [
          coordinate[0],
          coordinate[1],
        ],
      ),
    actualRouteCoordinates:
      actualRouteOverlay.map(
        (coordinate) => [
          coordinate[0],
          coordinate[1],
        ],
      ),
    routeCoordinates:
      plannedRouteCoordinates.map(
        (coordinate) => [
          coordinate[0],
          coordinate[1],
        ],
      ),
  };
}
