import type {
  LngLat,
} from '../../map/data/runningRoute';
import {
  MAX_ACCEPTABLE_ACCURACY_M,
} from '../../../services/location/locationValidity';

const EARTH_RADIUS_M = 6_371_000;

type CoordinateObject = {
  latitude?: unknown;
  longitude?: unknown;
  lat?: unknown;
  lng?: unknown;
};

function normalizeCoordinateValues(
  longitude: unknown,
  latitude: unknown,
): LngLat | null {
  if (
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90
  ) {
    return [longitude, latitude];
  }

  return null;
}

export function normalizeCoordinate(
  point: unknown,
): LngLat | null {
  if (Array.isArray(point)) {
    const [longitude, latitude] =
      point;

    return normalizeCoordinateValues(
      longitude,
      latitude,
    );
  }

  if (
    point === null ||
    typeof point !== 'object'
  ) {
    return null;
  }

  const coordinate =
    point as CoordinateObject;
  const longitude =
    coordinate.longitude ??
    coordinate.lng;
  const latitude =
    coordinate.latitude ??
    coordinate.lat;

  return normalizeCoordinateValues(
    longitude,
    latitude,
  );
}

export function normalizeRouteCoordinates(
  points: readonly unknown[],
): LngLat[] {
  return points.flatMap((point) => {
    const coordinate =
      normalizeCoordinate(point);

    return coordinate === null
      ? []
      : [coordinate];
  });
}

function hasAcceptableAccuracy(
  point: unknown,
): boolean {
  if (
    point === null ||
    typeof point !== 'object' ||
    Array.isArray(point) ||
    !('accuracyM' in point)
  ) {
    return true;
  }

  const accuracyM = (
    point as {
      accuracyM?: unknown;
    }
  ).accuracyM;

  return (
    typeof accuracyM === 'number' &&
    Number.isFinite(accuracyM) &&
    accuracyM >= 0 &&
    accuracyM <=
      MAX_ACCEPTABLE_ACCURACY_M
  );
}

export function normalizeTrackedRouteCoordinates(
  points: readonly unknown[],
): LngLat[] {
  return normalizeRouteCoordinates(
    points.filter(
      hasAcceptableAccuracy,
    ),
  );
}

export function getRouteDistanceM(
  coordinates: readonly LngLat[],
): number {
  let distanceM = 0;

  for (
    let index = 1;
    index < coordinates.length;
    index += 1
  ) {
    const [previousLongitude, previousLatitude] =
      coordinates[index - 1];
    const [longitude, latitude] =
      coordinates[index];
    const latitudeDelta =
      toRadians(
        latitude -
          previousLatitude,
      );
    const longitudeDelta =
      toRadians(
        longitude -
          previousLongitude,
      );
    const previousLatitudeRadians =
      toRadians(previousLatitude);
    const latitudeRadians =
      toRadians(latitude);
    const haversine =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(
        previousLatitudeRadians,
      ) *
        Math.cos(latitudeRadians) *
        Math.sin(
          longitudeDelta / 2,
        ) **
          2;
    const normalizedHaversine =
      Math.min(
        1,
        Math.max(0, haversine),
      );

    distanceM +=
      2 *
      EARTH_RADIUS_M *
      Math.atan2(
        Math.sqrt(
          normalizedHaversine,
        ),
        Math.sqrt(
          1 -
            normalizedHaversine,
        ),
      );
  }

  return distanceM;
}

export function isRenderableActualRoute(
  coordinates: readonly LngLat[],
  minimumDistanceM: number,
): boolean {
  return (
    coordinates.length >= 2 &&
    getRouteDistanceM(coordinates) >=
      minimumDistanceM
  );
}

function toRadians(
  degrees: number,
): number {
  return (degrees * Math.PI) / 180;
}
