import type {
  RunningRecord,
} from '../../../types';
import type {
  WeeklyRunningProgress,
} from '../types/weeklyRunningProgress';
import {
  isValidPaceSample,
} from '../../running/utils/runningSessionCalculations';

export type WeeklyRunningStats =
  WeeklyRunningProgress & {
    averagePaceSecondsPerKm:
      | number
      | null;
  };

export function getCurrentWeekStartMs(
  nowMs = Date.now(),
): number {
  const date = new Date(nowMs);
  const day = date.getDay();
  const daysSinceMonday =
    day === 0 ? 6 : day - 1;

  date.setHours(0, 0, 0, 0);
  date.setDate(
    date.getDate() -
      daysSinceMonday,
  );

  return date.getTime();
}

export function calculateWeeklyRunningStats(
  records: readonly RunningRecord[],
  nowMs = Date.now(),
): WeeklyRunningStats {
  const weekStartMs =
    getCurrentWeekStartMs(nowMs);
  const weekEndMs =
    weekStartMs +
    7 * 24 * 60 * 60 * 1_000;
  const weeklyRecords =
    records.filter(
      (record) =>
        record.startedAtMs >=
          weekStartMs &&
        record.startedAtMs <
          weekEndMs,
    );
  const totals =
    weeklyRecords.reduce(
      (result, record) => ({
        distanceM:
          result.distanceM +
          Math.max(
            record.distanceM,
            0,
          ),
        durationSeconds:
          result.durationSeconds +
          Math.max(
            record.durationSeconds,
            0,
          ),
      }),
      {
        distanceM: 0,
        durationSeconds: 0,
      },
    );

  return {
    completedKm:
      totals.distanceM / 1_000,
    completedRunCount:
      weeklyRecords.length,
    averagePaceSecondsPerKm:
      isValidPaceSample(
        totals.distanceM,
        totals.durationSeconds,
      )
        ? totals.durationSeconds /
          (totals.distanceM / 1_000)
        : null,
  };
}
