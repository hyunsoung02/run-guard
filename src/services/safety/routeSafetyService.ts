import type {
  MapCoordinate,
  OldmanAccidentRiskPoint,
} from './oldmanAccidentService';

export type SafetyEvaluationStatus =
  | 'idle'
  | 'loading'
  | 'available'
  | 'unavailable';

export type WarningSeverity =
  | 'high'
  | 'medium'
  | 'low';

export type RouteWarningPoint = {
  id: string;
  coordinate: MapCoordinate;
  name: string;
  distanceFromRouteM: number;
  accidentCount: number;
  deathCount?: number;
  seriousInjuryCount?: number;
  severity: WarningSeverity;
};

export type RouteSafetyGrade =
  | 'safe'
  | 'good'
  | 'caution'
  | 'danger';

export type RouteSafetyEvaluation = {
  status: SafetyEvaluationStatus;
  score: number | null;
  grade: RouteSafetyGrade | null;
  warningPoints: RouteWarningPoint[];
  evaluatedAt: number | null;
};

type EvaluateRouteSafetyParams = {
  routeCoordinates: readonly MapCoordinate[];
  accidentZones: readonly OldmanAccidentRiskPoint[];
  evaluatedAt?: number | null;
};

const EARTH_RADIUS_M = 6_371_000;
const WARNING_DISTANCE_LIMIT_M = 200;

const toRadians = (degrees: number): number =>
  (degrees * Math.PI) / 180;

const isValidCoordinate = (
  coordinate: readonly number[] | undefined,
): coordinate is MapCoordinate => {
  if (
    !coordinate ||
    coordinate.length < 2
  ) {
    return false;
  }

  const [longitude, latitude] =
    coordinate;

  return (
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90
  );
};

const toNonNegativeNumber = (
  value: unknown,
): number => {
  const parsed =
    typeof value === 'number'
      ? value
      : Number(value);

  return Number.isFinite(parsed)
    ? Math.max(0, parsed)
    : 0;
};

const clamp = (
  value: number,
  minimum: number,
  maximum: number,
): number =>
  Math.min(
    maximum,
    Math.max(minimum, value),
  );

export function getDistanceBetweenCoordinatesM(
  first: readonly [number, number],
  second: readonly [number, number],
): number {
  if (
    !isValidCoordinate(first) ||
    !isValidCoordinate(second)
  ) {
    return Infinity;
  }

  const latitudeDelta = toRadians(
    second[1] - first[1],
  );
  const longitudeDelta = toRadians(
    second[0] - first[0],
  );
  const firstLatitude = toRadians(
    first[1],
  );
  const secondLatitude = toRadians(
    second[1],
  );
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(
        longitudeDelta / 2,
      ) **
        2;

  return (
    2 *
    EARTH_RADIUS_M *
    Math.asin(
      Math.min(
        1,
        Math.sqrt(haversine),
      ),
    )
  );
}

/**
 * 사고 지점을 원점으로 하는 근거리 평면에 경로 구간을 투영한 뒤
 * 선분 위 최근접점을 계산한다.
 */
function getDistanceFromPointToSegmentM(
  point: MapCoordinate,
  segmentStart: MapCoordinate,
  segmentEnd: MapCoordinate,
): number {
  const referenceLatitude =
    toRadians(point[1]);
  const longitudeScale =
    EARTH_RADIUS_M *
    Math.cos(referenceLatitude);
  const latitudeScale =
    EARTH_RADIUS_M;

  const startX =
    toRadians(
      segmentStart[0] - point[0],
    ) * longitudeScale;
  const startY =
    toRadians(
      segmentStart[1] - point[1],
    ) * latitudeScale;
  const endX =
    toRadians(
      segmentEnd[0] - point[0],
    ) * longitudeScale;
  const endY =
    toRadians(
      segmentEnd[1] - point[1],
    ) * latitudeScale;
  const segmentX = endX - startX;
  const segmentY = endY - startY;
  const squaredSegmentLength =
    segmentX ** 2 + segmentY ** 2;

  if (squaredSegmentLength === 0) {
    return getDistanceBetweenCoordinatesM(
      point,
      segmentStart,
    );
  }

  const projectionRatio = clamp(
    -(
      startX * segmentX +
      startY * segmentY
    ) / squaredSegmentLength,
    0,
    1,
  );
  const nearestX =
    startX +
    projectionRatio * segmentX;
  const nearestY =
    startY +
    projectionRatio * segmentY;

  return Math.hypot(
    nearestX,
    nearestY,
  );
}

export function getDistanceFromPointToRouteM(
  point: readonly [number, number],
  routeCoordinates: readonly (readonly [
    number,
    number,
  ])[],
): number {
  if (
    !isValidCoordinate(point) ||
    routeCoordinates.length === 0
  ) {
    return Infinity;
  }

  if (routeCoordinates.length === 1) {
    return getDistanceBetweenCoordinatesM(
      point,
      routeCoordinates[0],
    );
  }

  let minimumDistanceM = Infinity;

  for (
    let index = 0;
    index <
    routeCoordinates.length - 1;
    index += 1
  ) {
    const segmentStart =
      routeCoordinates[index];
    const segmentEnd =
      routeCoordinates[index + 1];

    if (
      !isValidCoordinate(
        segmentStart,
      ) ||
      !isValidCoordinate(segmentEnd)
    ) {
      continue;
    }

    minimumDistanceM = Math.min(
      minimumDistanceM,
      getDistanceFromPointToSegmentM(
        point,
        segmentStart,
        segmentEnd,
      ),
    );
  }

  if (
    Number.isFinite(minimumDistanceM)
  ) {
    return minimumDistanceM;
  }

  for (const coordinate of routeCoordinates) {
    if (!isValidCoordinate(coordinate)) {
      continue;
    }

    minimumDistanceM = Math.min(
      minimumDistanceM,
      getDistanceBetweenCoordinatesM(
        point,
        coordinate,
      ),
    );
  }

  return minimumDistanceM;
}

function getWarningSeverity(
  distanceFromRouteM: number,
): WarningSeverity {
  if (distanceFromRouteM <= 50) {
    return 'high';
  }

  if (distanceFromRouteM <= 100) {
    return 'medium';
  }

  return 'low';
}

function getDistanceDeduction(
  distanceFromRouteM: number,
): number {
  if (distanceFromRouteM <= 50) {
    return 25;
  }

  if (distanceFromRouteM <= 100) {
    return 15;
  }

  return 8;
}

function getGrade(
  score: number,
): RouteSafetyGrade {
  if (score >= 90) {
    return 'safe';
  }

  if (score >= 75) {
    return 'good';
  }

  if (score >= 60) {
    return 'caution';
  }

  return 'danger';
}

function hasUsableRoute(
  routeCoordinates: readonly MapCoordinate[],
): boolean {
  for (
    let index = 0;
    index <
    routeCoordinates.length - 1;
    index += 1
  ) {
    if (
      isValidCoordinate(
        routeCoordinates[index],
      ) &&
      isValidCoordinate(
        routeCoordinates[index + 1],
      )
    ) {
      return true;
    }
  }

  return false;
}

export function evaluateRouteSafety({
  routeCoordinates,
  accidentZones,
  evaluatedAt = null,
}: EvaluateRouteSafetyParams): RouteSafetyEvaluation {
  if (!hasUsableRoute(routeCoordinates)) {
    return {
      status: 'idle',
      score: null,
      grade: null,
      warningPoints: [],
      evaluatedAt: null,
    };
  }

  const warningPoints: RouteWarningPoint[] =
    [];
  const seenIds = new Set<string>();
  const seenCoordinates =
    new Set<string>();

  for (const accidentZone of accidentZones) {
    if (
      !isValidCoordinate(
        accidentZone.coordinate,
      )
    ) {
      continue;
    }

    const coordinateKey = [
      accidentZone.coordinate[0],
      accidentZone.coordinate[1],
    ].join(',');
    const normalizedId =
      String(
        accidentZone.id ?? '',
      ).trim();

    if (
      (normalizedId &&
        seenIds.has(normalizedId)) ||
      seenCoordinates.has(coordinateKey)
    ) {
      continue;
    }

    if (normalizedId) {
      seenIds.add(normalizedId);
    }

    seenCoordinates.add(coordinateKey);

    const distanceFromRouteM =
      getDistanceFromPointToRouteM(
        accidentZone.coordinate,
        routeCoordinates,
      );

    if (
      !Number.isFinite(
        distanceFromRouteM,
      ) ||
      distanceFromRouteM >
        WARNING_DISTANCE_LIMIT_M
    ) {
      continue;
    }

    warningPoints.push({
      id:
        normalizedId ||
        `oldman-${coordinateKey}`,
      coordinate:
        accidentZone.coordinate,
      name: accidentZone.name,
      distanceFromRouteM,
      accidentCount:
        toNonNegativeNumber(
          accidentZone.accidentCount,
        ),
      deathCount:
        toNonNegativeNumber(
          accidentZone.deathCount,
        ),
      seriousInjuryCount:
        toNonNegativeNumber(
          accidentZone.seriousInjuryCount,
        ),
      severity: getWarningSeverity(
        distanceFromRouteM,
      ),
    });
  }

  warningPoints.sort(
    (first, second) =>
      first.distanceFromRouteM -
      second.distanceFromRouteM,
  );

  const totalDeduction =
    warningPoints.reduce(
      (total, warningPoint) => {
        const distanceDeduction =
          getDistanceDeduction(
            warningPoint.distanceFromRouteM,
          );
        const accidentDeduction =
          Math.min(
            warningPoint.accidentCount *
              2,
            10,
          );
        const injuryDeduction =
          Math.min(
            (warningPoint.deathCount ??
              0) *
              5 +
              (warningPoint.seriousInjuryCount ??
                0) *
                2,
            15,
          );
        const pointDeduction =
          Math.min(
            distanceDeduction +
              accidentDeduction +
              injuryDeduction,
            40,
          );

        return total + pointDeduction;
      },
      0,
    );
  const score = clamp(
    Math.round(
      100 - totalDeduction,
    ),
    0,
    100,
  );

  return {
    status: 'available',
    score,
    grade: getGrade(score),
    warningPoints,
    evaluatedAt,
  };
}
