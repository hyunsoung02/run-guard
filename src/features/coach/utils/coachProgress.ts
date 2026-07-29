export function getCoachProgressPercent(
  completedDistanceKm: number,
  targetDistanceKm: number,
): number {
  if (
    !Number.isFinite(completedDistanceKm) ||
    !Number.isFinite(targetDistanceKm) ||
    targetDistanceKm <= 0
  ) {
    return 0;
  }

  const progressPercent =
    (completedDistanceKm /
      targetDistanceKm) *
    100;

  return Math.min(
    100,
    Math.max(0, progressPercent),
  );
}
