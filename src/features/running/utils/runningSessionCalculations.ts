type Coordinate = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_KM = 6371;

export const MIN_VALID_PACE_DISTANCE_M =
  30;

export const RUNNING_PACE_UNAVAILABLE =
  `--'--"`;

export const RUNNING_PACE_UNAVAILABLE_MESSAGE =
  '이동 거리가 짧아 정확한 페이스를 계산할 수 없습니다.';

export function isValidPaceSample(
  distanceM: number,
  elapsedSeconds: number,
): boolean {
  return (
    Number.isFinite(distanceM) &&
    Number.isFinite(elapsedSeconds) &&
    distanceM >=
      MIN_VALID_PACE_DISTANCE_M &&
    elapsedSeconds > 0
  );
}

export function formatRunningPace(
  distanceKm: number,
  elapsedSeconds: number,
): string {
  if (
    !isValidPaceSample(
      distanceKm * 1_000,
      elapsedSeconds,
    )
  ) {
    return RUNNING_PACE_UNAVAILABLE;
  }

  const paceSeconds = Math.round(
    elapsedSeconds / distanceKm,
  );

  if (
    !Number.isFinite(paceSeconds)
  ) {
    return RUNNING_PACE_UNAVAILABLE;
  }

  const minutes = Math.floor(
    paceSeconds / 60,
  );
  const seconds = paceSeconds % 60;

  return `${minutes}' ${seconds.toString().padStart(2, '0')}"`;
}

export function getRunningDistanceKm(
  from: Coordinate,
  to: Coordinate,
): number {
  const latitudeDelta = toRadians(
    to.latitude - from.latitude,
  );
  const longitudeDelta = toRadians(
    to.longitude - from.longitude,
  );
  const fromLatitude = toRadians(
    from.latitude,
  );
  const toLatitude = toRadians(
    to.latitude,
  );
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_KM *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine),
    )
  );
}

function toRadians(
  degrees: number,
): number {
  return (degrees * Math.PI) / 180;
}
