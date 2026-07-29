import type {
  RunningSplitPayload,
} from '../../../navigation/types';
import type {
  LocationPoint,
  RunningRecord,
} from '../../../types';
import {
  MIN_VALID_PACE_DISTANCE_M,
  formatRunningPace,
  getRunningDistanceKm,
  isValidPaceSample,
} from '../../running/utils/runningSessionCalculations';

const FULL_SPLIT_DISTANCE_M = 1_000;

type TimedDistanceSample = {
  distanceM: number;
  elapsedSeconds: number;
};

function getElapsedSeconds(
  point: LocationPoint,
  record: RunningRecord,
): number {
  if (
    Number.isFinite(
      point.sessionElapsedSeconds,
    )
  ) {
    return Math.max(
      0,
      point.sessionElapsedSeconds ?? 0,
    );
  }

  return Math.min(
    record.durationSeconds,
    Math.max(
      0,
      (point.timestampMs -
        record.startedAtMs) /
        1_000,
    ),
  );
}

function createSamples(
  record: RunningRecord,
): TimedDistanceSample[] {
  const points =
    record.actualRoute ??
    record.routePoints ??
    [];

  if (points.length === 0) {
    return [];
  }

  let cumulativeDistanceM = 0;
  const samples: TimedDistanceSample[] =
    [
      {
        distanceM: 0,
        elapsedSeconds:
          getElapsedSeconds(
            points[0],
            record,
          ),
      },
    ];

  for (
    let index = 1;
    index < points.length;
    index += 1
  ) {
    const previousPoint =
      points[index - 1];
    const point = points[index];
    const segmentDistanceM =
      getRunningDistanceKm(
        previousPoint,
        point,
      ) * 1_000;

    if (
      !Number.isFinite(
        segmentDistanceM,
      ) ||
      segmentDistanceM < 0
    ) {
      continue;
    }

    cumulativeDistanceM +=
      segmentDistanceM;
    samples.push({
      distanceM:
        cumulativeDistanceM,
      elapsedSeconds:
        getElapsedSeconds(
          point,
          record,
        ),
    });
  }

  return samples;
}

function interpolateElapsedSeconds(
  samples: readonly TimedDistanceSample[],
  targetDistanceM: number,
  fallbackSeconds: number,
): number {
  const nextSampleIndex =
    samples.findIndex(
      (sample) =>
        sample.distanceM >=
        targetDistanceM,
    );

  if (nextSampleIndex <= 0) {
    return Math.max(
      0,
      fallbackSeconds,
    );
  }

  const previous =
    samples[nextSampleIndex - 1];
  const next =
    samples[nextSampleIndex];
  const segmentDistanceM =
    next.distanceM -
    previous.distanceM;
  const ratio =
    segmentDistanceM > 0
      ? Math.min(
          1,
          Math.max(
            0,
            (targetDistanceM -
              previous.distanceM) /
              segmentDistanceM,
          ),
        )
      : 0;

  return (
    previous.elapsedSeconds +
    (next.elapsedSeconds -
      previous.elapsedSeconds) *
      ratio
  );
}

export function createRunningSplits(
  record: RunningRecord,
): RunningSplitPayload[] {
  const safeDistanceM =
    Number.isFinite(record.distanceM)
      ? Math.max(
          0,
          record.distanceM,
        )
      : 0;

  if (
    safeDistanceM <
    MIN_VALID_PACE_DISTANCE_M
  ) {
    return [];
  }

  const samples =
    createSamples(record);
  const fullSplitCount = Math.floor(
    safeDistanceM /
      FULL_SPLIT_DISTANCE_M,
  );
  const splits:
    RunningSplitPayload[] = [];
  let previousSplitEndSeconds = 0;
  let previousPaceSecondsPerKm:
    | number
    | null = null;

  const appendSplit = (
    distanceM: number,
    splitEndDistanceM: number,
    isPartial: boolean,
  ) => {
    const fallbackEndSeconds =
      record.durationSeconds *
      (splitEndDistanceM /
        safeDistanceM);
    const splitEndSeconds =
      interpolateElapsedSeconds(
        samples,
        splitEndDistanceM,
        fallbackEndSeconds,
      );
    const durationSeconds = Math.max(
      0,
      splitEndSeconds -
        previousSplitEndSeconds,
    );
    const distanceKm =
      distanceM / 1_000;
    const hasValidPace =
      isValidPaceSample(
        distanceM,
        durationSeconds,
      );

    if (!hasValidPace) {
      previousSplitEndSeconds =
        splitEndSeconds;
      previousPaceSecondsPerKm =
        null;
      return;
    }

    const paceSecondsPerKm =
      durationSeconds / distanceKm;
    const paceChangeSeconds =
      previousPaceSecondsPerKm !==
        null
        ? Math.round(
            paceSecondsPerKm -
              previousPaceSecondsPerKm,
          )
        : null;

    splits.push({
      distanceKm,
      durationSeconds:
        Math.round(durationSeconds),
      isPartial,
      pace: formatRunningPace(
        distanceKm,
        durationSeconds,
      ),
      change:
        paceChangeSeconds === null ||
        paceChangeSeconds === 0
          ? null
          : `${Math.abs(
              paceChangeSeconds,
            )}초`,
      changeType:
        paceChangeSeconds === null ||
        paceChangeSeconds === 0
          ? null
          : paceChangeSeconds < 0
            ? 'faster'
            : 'slower',
    });

    previousSplitEndSeconds =
      splitEndSeconds;
    previousPaceSecondsPerKm =
      paceSecondsPerKm;
  };

  for (
    let splitIndex = 1;
    splitIndex <= fullSplitCount;
    splitIndex += 1
  ) {
    appendSplit(
      FULL_SPLIT_DISTANCE_M,
      splitIndex *
        FULL_SPLIT_DISTANCE_M,
      false,
    );
  }

  const remainingDistanceM =
    safeDistanceM -
    fullSplitCount *
      FULL_SPLIT_DISTANCE_M;

  if (
    remainingDistanceM >=
    MIN_VALID_PACE_DISTANCE_M
  ) {
    appendSplit(
      remainingDistanceM,
      safeDistanceM,
      true,
    );
  }

  return splits;
}
