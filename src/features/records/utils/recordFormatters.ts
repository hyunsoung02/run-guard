import type {
  RunningRecordPayload,
} from '../../../navigation/types';
import {
  formatDistanceKm,
} from '../../../utils/distanceFormat';
import {
  isValidPaceSample,
  RUNNING_PACE_UNAVAILABLE,
} from '../../running/utils/runningSessionCalculations';

export type RecordMetric = {
  label: string;
  value: string;
};

export function formatDuration(
  totalSeconds: number,
): string {
  const safeSeconds = Math.max(
    0,
    Math.floor(totalSeconds),
  );

  const hours = Math.floor(
    safeSeconds / 3600,
  );

  const minutes = Math.floor(
    (safeSeconds % 3600) / 60,
  );

  const seconds =
    safeSeconds % 60;

  if (hours > 0) {
    return [
      String(hours).padStart(
        2,
        '0',
      ),
      String(minutes).padStart(
        2,
        '0',
      ),
      String(seconds).padStart(
        2,
        '0',
      ),
    ].join(':');
  }

  return [
    String(minutes).padStart(
      2,
      '0',
    ),
    String(seconds).padStart(
      2,
      '0',
    ),
  ].join(':');
}

export function createRecordMetrics(
  record: RunningRecordPayload,
): RecordMetric[] {
  const averagePace =
    isValidPaceSample(
      record.distanceKm * 1_000,
      record.durationSeconds,
    )
      ? record.averagePace.includes(
          '/km',
        )
        ? record.averagePace
        : `${record.averagePace}/km`
      : RUNNING_PACE_UNAVAILABLE;

  return [
    {
      label: '거리',
      value: `${formatDistanceKm(
        record.distanceKm,
      )} KM`,
    },
    {
      label: '평균 페이스',
      value: averagePace,
    },
    {
      label: '시간',
      value: formatDuration(
        record.durationSeconds,
      ),
    },
    {
      label: '심박수',
      value:
        record.heartRate === null
          ? '데이터 없음'
          : `${record.heartRate} BPM`,
    },
    {
      label: '고도',
      value:
        record.elevationM === null
          ? '데이터 없음'
          : `${record.elevationM}m`,
    },
    {
      label: '케이던스',
      value:
        record.cadenceSpm === null
          ? '데이터 없음'
          : `${record.cadenceSpm} SPM`,
    },
  ];
}
