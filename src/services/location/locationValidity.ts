import type {
  LocationPoint,
} from '../../types/location';

export const LOCATION_MAX_AGE_MS =
  60_000;

export const MAX_ACCEPTABLE_ACCURACY_M =
  50;

export function isLocationUsable(
  location:
    | LocationPoint
    | null
    | undefined,
  nowMs = Date.now(),
): boolean {
  if (!location) {
    return false;
  }

  const {
    latitude,
    longitude,
    timestampMs,
    accuracyM,
  } = location;

  return (
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    Number.isFinite(timestampMs) &&
    timestampMs > 0 &&
    nowMs - timestampMs >= 0 &&
    nowMs - timestampMs <=
      LOCATION_MAX_AGE_MS &&
    accuracyM !== null &&
    Number.isFinite(accuracyM) &&
    accuracyM >= 0 &&
    accuracyM <=
      MAX_ACCEPTABLE_ACCURACY_M
  );
}
