import type {
  TargetDistanceKm,
} from '../../../navigation/types';

export function getRunningTargetTime(
  targetDistanceKm: TargetDistanceKm,
): string {
  return targetDistanceKm === 7
    ? '41:00'
    : targetDistanceKm === 10
      ? '60:00'
      : '30:00';
}

export function getRunningTargetPace(
  targetDistanceKm: TargetDistanceKm,
): string {
  const targetSeconds =
    targetDistanceKm === 7
      ? 41 * 60
      : targetDistanceKm === 10
        ? 60 * 60
        : 30 * 60;
  const paceSeconds = Math.round(
    targetSeconds /
      targetDistanceKm,
  );
  const minutes = Math.floor(
    paceSeconds / 60,
  );
  const seconds =
    paceSeconds % 60;

  return `${minutes}'${String(
    seconds,
  ).padStart(2, '0')}"`;
}
