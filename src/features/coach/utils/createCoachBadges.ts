import type {
  RunningRecord,
} from '../../../types';
import type {
  CoachBadgeSlotData,
} from '../types/coachBadge';

const TOTAL_BADGE_COUNT = 100;

function formatEarnedDate(
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
  ].join('-');
}

export function createCoachBadgesFromRecords(
  records: readonly RunningRecord[],
): CoachBadgeSlotData[] {
  const completedRecords =
    records
      .filter(
        (record) =>
          record.completedTarget,
      )
      .sort(
        (first, second) =>
          first.endedAtMs -
          second.endedAtMs,
      );

  return Array.from(
    {
      length: TOTAL_BADGE_COUNT,
    },
    (_, index) => {
      const badgeIndex = index + 1;
      const earnedRecord =
        completedRecords[index];

      return {
        id: `coach-badge-${badgeIndex}`,
        index: badgeIndex,
        earned:
          earnedRecord !== undefined,
        ...(earnedRecord
          ? {
              earnedAt:
                formatEarnedDate(
                  earnedRecord.endedAtMs,
                ),
            }
          : {}),
      };
    },
  );
}
