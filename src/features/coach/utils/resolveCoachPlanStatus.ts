import type {
  RunningRecord,
} from '../../../types';
import type {
  WeeklyCoachPlan,
  WeeklyPlanItem,
} from '../types/coach.types';
import {
  calculateWeeklyRunningStats,
  getCurrentWeekStartMs,
} from '../../records/utils/weeklyRunningStats';

const DAY_OFFSET_BY_LABEL:
  Readonly<Record<string, number>> = {
    월요일: 0,
    화요일: 1,
    수요일: 2,
    목요일: 3,
    금요일: 4,
    토요일: 5,
    일요일: 6,
  };

const DAY_MS = 24 * 60 * 60 * 1_000;

function isPlanItemCompleted(
  item: WeeklyPlanItem,
  records: readonly RunningRecord[],
  weekStartMs: number,
): boolean {
  const dayOffset =
    DAY_OFFSET_BY_LABEL[item.dayLabel];

  if (dayOffset === undefined) {
    return false;
  }

  const dayStartMs =
    weekStartMs + dayOffset * DAY_MS;
  const dayEndMs = dayStartMs + DAY_MS;
  const targetDistanceM =
    item.distanceKm * 1_000;

  return records.some(
    (record) =>
      record.startedAtMs >=
        dayStartMs &&
      record.startedAtMs < dayEndMs &&
      record.distanceM >=
        targetDistanceM,
  );
}

export function resolveCoachPlanFromRecords(
  preset: WeeklyCoachPlan,
  records: readonly RunningRecord[],
  nowMs = Date.now(),
): WeeklyCoachPlan {
  const weekStartMs =
    getCurrentWeekStartMs(nowMs);
  const weeklyStats =
    calculateWeeklyRunningStats(
      records,
      nowMs,
    );

  return {
    ...preset,
    weekKey: new Date(weekStartMs)
      .toISOString()
      .slice(0, 10),
    completedDistanceKm:
      weeklyStats.completedKm,
    goalAchieved:
      weeklyStats.completedKm >=
      preset.targetDistanceKm,
    items: preset.items.map(
      (item) => ({
        ...item,
        status:
          isPlanItemCompleted(
            item,
            records,
            weekStartMs,
          )
            ? 'completed'
            : 'scheduled',
      }),
    ),
  };
}
