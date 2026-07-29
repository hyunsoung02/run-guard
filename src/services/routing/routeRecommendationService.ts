import type {
  LngLat,
  RunningRoute,
  RouteKeyword,
} from '../../features/map/data/runningRoute';
import type {
  OldmanAccidentRiskPoint,
} from '../safety/oldmanAccidentService';
import {
  evaluateRouteSafety,
  getDistanceBetweenCoordinatesM,
} from '../safety/routeSafetyService';
import type {
  RouteSafetyEvaluation,
} from '../safety/routeSafetyService';
import {
  createRunningRoute,
} from './openRouteService';
import type {
  WalkingRouteResult,
} from './openRouteService';

export type RouteCandidateVariant = {
  id: string;
  bearingOffsetDeg: number;
};

export const ROUTE_CANDIDATE_VARIANTS:
  readonly RouteCandidateVariant[] = [
    {
      id: 'candidate-1',
      bearingOffsetDeg: 0,
    },
    {
      id: 'candidate-2',
      bearingOffsetDeg: 120,
    },
    {
      id: 'candidate-3',
      bearingOffsetDeg: 240,
    },
  ];

export type RouteCandidateFailureReason =
  | 'route-request-failed'
  | 'invalid-route'
  | 'invalid-distance'
  | 'duplicate-route'
  | 'unknown';

export type RouteCandidateFailure = {
  candidateId: string;
  reason: RouteCandidateFailureReason;
};

export type RouteRecommendationReasonCode =
  | 'best-balanced'
  | 'safest'
  | 'closest-distance'
  | 'same-safety-closest-distance'
  | 'safety-unavailable-distance-fallback'
  | 'single-candidate'
  | 'fallback-route';

export type RouteRecommendationCandidate = {
  id: string;
  variantIndex: number;
  route: RunningRoute;
  actualDistanceM: number;
  targetDistanceM: number;
  distanceErrorM: number;
  distanceErrorRatio: number;
  distanceAccuracyScore: number;
  safetyEvaluation: RouteSafetyEvaluation;
  recommendationScore: number | null;
};

export type RouteRecommendationResult = {
  status:
    | 'success'
    | 'fallback'
    | 'failed';
  recommendedCandidate:
    | RouteRecommendationCandidate
    | null;
  candidates: RouteRecommendationCandidate[];
  failures: RouteCandidateFailure[];
  failedCandidateCount: number;
  reasonCode:
    | RouteRecommendationReasonCode
    | null;
  reasonText: string;
};

type SafetyDataStatus =
  | 'available'
  | 'unavailable';

type GenerateRecommendedRouteParams = {
  startCoordinate: LngLat;
  targetDistanceM: number;
  keyword?: RouteKeyword;
  waypointCandidates?: readonly LngLat[];
  accidentZones: readonly OldmanAccidentRiskPoint[];
  safetyDataStatus: SafetyDataStatus;
  baseBearingDegrees?: number;
  requestKey?: string;
  signal?: AbortSignal;
};

type CandidateGenerationErrorOptions = {
  reason: RouteCandidateFailureReason;
  cause?: unknown;
};

const EARTH_RADIUS_M = 6_371_000;
const DEFAULT_ROUTE_BEARING_DEGREES = 45;
const SCORE_TIE_EPSILON = 0.01;
const ROUTE_SIGNATURE_SAMPLE_COUNT = 12;
export const ROUTE_DISTANCE_TOLERANCE_M =
  200;
const MAX_GENERATION_ATTEMPTS = 3;
const INITIAL_RADIUS_SCALE = 0.75;

export function isRouteDistanceWithinTolerance(
  targetDistanceM: number,
  actualDistanceM: number,
  toleranceM =
    ROUTE_DISTANCE_TOLERANCE_M,
): boolean {
  return (
    Number.isFinite(
      targetDistanceM,
    ) &&
    targetDistanceM > 0 &&
    Number.isFinite(
      actualDistanceM,
    ) &&
    actualDistanceM > 0 &&
    Number.isFinite(toleranceM) &&
    toleranceM >= 0 &&
    Math.abs(
      actualDistanceM -
        targetDistanceM,
    ) <= toleranceM
  );
}

const REASON_TEXT:
  Record<
    RouteRecommendationReasonCode,
    string
  > = {
    'best-balanced':
      '사고 이력 기반 안전도와 목표 거리 정확도가 가장 균형 잡힌 코스예요.',
    safest:
      '후보 중 사고 이력 기반 안전도가 가장 높은 코스예요.',
    'closest-distance':
      '목표 거리와 가장 가까운 코스예요.',
    'same-safety-closest-distance':
      '안전도가 비슷한 후보 중 목표 거리와 가장 가까운 코스예요.',
    'safety-unavailable-distance-fallback':
      '안전 정보는 확인하지 못했지만 목표 거리와 가장 가까운 코스를 선택했어요.',
    'single-candidate':
      '생성에 성공한 코스 중 이용 가능한 코스를 선택했어요.',
    'fallback-route':
      '추천 후보 생성이 어려워 기본 코스를 표시했어요.',
  };

class CandidateGenerationError extends Error {
  readonly reason: RouteCandidateFailureReason;

  constructor(
    message: string,
    {
      reason,
      cause,
    }: CandidateGenerationErrorOptions,
  ) {
    super(message, {
      cause,
    });
    this.name =
      'CandidateGenerationError';
    this.reason = reason;
  }
}

function clampScore(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, value),
  );
}

function isValidCoordinate(
  coordinate:
    | readonly number[]
    | undefined,
): coordinate is LngLat {
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
}

function hasValidRoute(
  route: RunningRoute,
): boolean {
  return (
    Array.isArray(route.coordinates) &&
    route.coordinates.length >= 2 &&
    route.coordinates.every(
      isValidCoordinate,
    ) &&
    Array.isArray(
      route.navigationSteps,
    ) &&
    route.navigationSteps.length > 0
  );
}

function createUnavailableSafetyEvaluation():
  RouteSafetyEvaluation {
  return {
    status: 'unavailable',
    score: null,
    grade: null,
    warningPoints: [],
    evaluatedAt: null,
  };
}

function throwIfAborted(
  signal: AbortSignal | undefined,
): void {
  if (!signal?.aborted) {
    return;
  }

  const error = new Error(
    '추천 코스 요청이 취소되었습니다.',
  );
  error.name = 'AbortError';
  throw error;
}

function getFailureReason(
  error: unknown,
): RouteCandidateFailureReason {
  return error instanceof
    CandidateGenerationError
    ? error.reason
    : 'route-request-failed';
}

function calculateRouteDistanceM(
  coordinates: readonly LngLat[],
): number {
  let distanceM = 0;

  for (
    let index = 0;
    index < coordinates.length - 1;
    index += 1
  ) {
    const segmentDistanceM =
      getDistanceBetweenCoordinatesM(
        coordinates[index],
        coordinates[index + 1],
      );

    if (
      !Number.isFinite(
        segmentDistanceM,
      )
    ) {
      return Number.NaN;
    }

    distanceM += segmentDistanceM;
  }

  return distanceM;
}

function resolveActualDistanceM(
  routeResult: WalkingRouteResult,
): number {
  if (
    Number.isFinite(
      routeResult.distanceM,
    ) &&
    routeResult.distanceM > 0
  ) {
    return routeResult.distanceM;
  }

  return calculateRouteDistanceM(
    routeResult.route.coordinates,
  );
}

function createSafetyEvaluation(
  route: RunningRoute,
  accidentZones: readonly OldmanAccidentRiskPoint[],
  safetyDataStatus: SafetyDataStatus,
  evaluatedAt: number,
): RouteSafetyEvaluation {
  if (
    safetyDataStatus ===
    'unavailable'
  ) {
    return createUnavailableSafetyEvaluation();
  }

  return evaluateRouteSafety({
    routeCoordinates:
      route.coordinates,
    accidentZones,
    evaluatedAt,
  });
}

function createCandidate({
  id,
  variantIndex,
  routeResult,
  targetDistanceM,
  accidentZones,
  safetyDataStatus,
  evaluatedAt,
}: {
  id: string;
  variantIndex: number;
  routeResult: WalkingRouteResult;
  targetDistanceM: number;
  accidentZones: readonly OldmanAccidentRiskPoint[];
  safetyDataStatus: SafetyDataStatus;
  evaluatedAt: number;
}): RouteRecommendationCandidate {
  if (!hasValidRoute(routeResult.route)) {
    throw new CandidateGenerationError(
      '유효한 경로 좌표가 없습니다.',
      {
        reason: 'invalid-route',
      },
    );
  }

  const actualDistanceM =
    resolveActualDistanceM(routeResult);

  if (
    !Number.isFinite(
      actualDistanceM,
    ) ||
    actualDistanceM <= 0
  ) {
    throw new CandidateGenerationError(
      '유효한 경로 거리가 없습니다.',
      {
        reason: 'invalid-distance',
      },
    );
  }

  const distanceErrorM = Math.abs(
    actualDistanceM -
      targetDistanceM,
  );
  const distanceErrorRatio =
    distanceErrorM / targetDistanceM;
  const distanceAccuracyScore =
    calculateDistanceAccuracyScore(
      targetDistanceM,
      actualDistanceM,
    );
  const safetyEvaluation =
    createSafetyEvaluation(
      routeResult.route,
      accidentZones,
      safetyDataStatus,
      evaluatedAt,
    );

  return {
    id,
    variantIndex,
    route: routeResult.route,
    actualDistanceM,
    targetDistanceM,
    distanceErrorM,
    distanceErrorRatio,
    distanceAccuracyScore,
    safetyEvaluation,
    recommendationScore:
      calculateRecommendationScore(
        safetyEvaluation,
        distanceAccuracyScore,
      ),
  };
}

export function calculateDestinationPoint(
  start: LngLat,
  distanceM: number,
  bearingDegrees: number,
): LngLat {
  const [longitude, latitude] = start;
  const latitudeRadians =
    (latitude * Math.PI) / 180;
  const longitudeRadians =
    (longitude * Math.PI) / 180;
  const bearingRadians =
    (bearingDegrees * Math.PI) / 180;
  const angularDistance =
    distanceM / EARTH_RADIUS_M;
  const destinationLatitude =
    Math.asin(
      Math.sin(latitudeRadians) *
        Math.cos(angularDistance) +
        Math.cos(latitudeRadians) *
          Math.sin(angularDistance) *
          Math.cos(bearingRadians),
    );
  const destinationLongitude =
    longitudeRadians +
    Math.atan2(
      Math.sin(bearingRadians) *
        Math.sin(angularDistance) *
        Math.cos(latitudeRadians),
      Math.cos(angularDistance) -
        Math.sin(latitudeRadians) *
          Math.sin(
            destinationLatitude,
          ),
    );

  return [
    (destinationLongitude * 180) /
      Math.PI,
    (destinationLatitude * 180) /
      Math.PI,
  ];
}

export function calculateDistanceAccuracyScore(
  targetDistanceM: number,
  actualDistanceM: number,
): number {
  if (
    !Number.isFinite(
      targetDistanceM,
    ) ||
    targetDistanceM <= 0 ||
    !Number.isFinite(
      actualDistanceM,
    ) ||
    actualDistanceM <= 0
  ) {
    return 0;
  }

  const distanceErrorRatio =
    Math.abs(
      actualDistanceM -
        targetDistanceM,
    ) / targetDistanceM;

  return clampScore(
    100 -
      distanceErrorRatio * 200,
  );
}

export function calculateRecommendationScore(
  safetyEvaluation: RouteSafetyEvaluation,
  distanceAccuracyScore: number,
): number | null {
  const safetyScore =
    safetyEvaluation.score;

  if (
    safetyEvaluation.status !==
      'available' ||
    safetyScore === null ||
    !Number.isFinite(safetyScore)
  ) {
    return null;
  }

  return clampScore(
    clampScore(safetyScore) * 0.7 +
      clampScore(
        distanceAccuracyScore,
      ) *
        0.3,
  );
}

export function createRouteSignature(
  coordinates: readonly LngLat[],
): string {
  if (coordinates.length === 0) {
    return '';
  }

  const signaturePointCount = Math.min(
    ROUTE_SIGNATURE_SAMPLE_COUNT,
    coordinates.length,
  );
  const signaturePoints: string[] = [];

  for (
    let signaturePointIndex = 0;
    signaturePointIndex <
    signaturePointCount;
    signaturePointIndex += 1
  ) {
    const coordinateIndex =
      signaturePointCount === 1
        ? 0
        : Math.round(
            (signaturePointIndex *
              (coordinates.length -
                1)) /
              (signaturePointCount -
                1),
          );
    const coordinate =
      coordinates[coordinateIndex];

    if (!isValidCoordinate(coordinate)) {
      return '';
    }

    signaturePoints.push(
      `${coordinate[0].toFixed(4)},${coordinate[1].toFixed(4)}`,
    );
  }

  return signaturePoints.join('|');
}

export function rankRouteCandidates(
  candidates: readonly RouteRecommendationCandidate[],
): RouteRecommendationCandidate[] {
  const candidatesWithSafety =
    candidates.filter(
      (candidate) =>
        candidate.safetyEvaluation
          .status ===
          'available' &&
        candidate.recommendationScore !==
          null &&
        Number.isFinite(
          candidate.recommendationScore,
        ),
    );
  const rankedCandidates =
    (
      candidatesWithSafety.length > 0
        ? candidatesWithSafety
        : candidates
    ).slice();

  rankedCandidates.sort(
    (first, second) => {
      if (
        candidatesWithSafety.length ===
        0
      ) {
        const accuracyDifference =
          second.distanceAccuracyScore -
          first.distanceAccuracyScore;

        if (
          Math.abs(
            accuracyDifference,
          ) >= SCORE_TIE_EPSILON
        ) {
          return accuracyDifference;
        }

        const distanceDifference =
          first.distanceErrorM -
          second.distanceErrorM;

        if (
          distanceDifference !== 0
        ) {
          return distanceDifference;
        }

        return first.id.localeCompare(
          second.id,
        );
      }

      const firstScore =
        first.recommendationScore ?? 0;
      const secondScore =
        second.recommendationScore ?? 0;
      const recommendationDifference =
        secondScore - firstScore;

      if (
        Math.abs(
          recommendationDifference,
        ) >= SCORE_TIE_EPSILON
      ) {
        return recommendationDifference;
      }

      const warningDifference =
        first.safetyEvaluation
          .warningPoints.length -
        second.safetyEvaluation
          .warningPoints.length;

      if (warningDifference !== 0) {
        return warningDifference;
      }

      const distanceDifference =
        first.distanceErrorM -
        second.distanceErrorM;

      if (distanceDifference !== 0) {
        return distanceDifference;
      }

      const safetyDifference =
        (second.safetyEvaluation
          .score ?? 0) -
        (first.safetyEvaluation
          .score ?? 0);

      if (safetyDifference !== 0) {
        return safetyDifference;
      }

      return first.id.localeCompare(
        second.id,
      );
    },
  );

  return rankedCandidates;
}

export function selectRecommendedRoute(
  candidates: readonly RouteRecommendationCandidate[],
): RouteRecommendationCandidate | null {
  return (
    rankRouteCandidates(
      candidates,
    )[0] ?? null
  );
}

export function createRouteRecommendationReason(
  candidates: readonly RouteRecommendationCandidate[],
  recommendedCandidate: RouteRecommendationCandidate,
): {
  reasonCode: RouteRecommendationReasonCode;
  reasonText: string;
} {
  let reasonCode:
    RouteRecommendationReasonCode;

  if (
    recommendedCandidate
      .safetyEvaluation.status !==
    'available'
  ) {
    reasonCode =
      'safety-unavailable-distance-fallback';
  } else if (
    candidates.length === 1
  ) {
    reasonCode = 'single-candidate';
  } else {
    const comparableCandidates =
      candidates.filter(
        (candidate) =>
          candidate.safetyEvaluation
            .status === 'available',
      );
    const selectedSafetyScore =
      recommendedCandidate
        .safetyEvaluation.score ?? 0;
    const otherCandidates =
      comparableCandidates.filter(
        (candidate) =>
          candidate.id !==
          recommendedCandidate.id,
      );
    const allSafetyScoresMatch =
      otherCandidates.every(
        (candidate) =>
          Math.abs(
            (candidate
              .safetyEvaluation.score ??
              0) -
              selectedSafetyScore,
          ) < SCORE_TIE_EPSILON,
      );
    const selectedIsUniquelySafest =
      otherCandidates.every(
        (candidate) =>
          selectedSafetyScore -
            (candidate
              .safetyEvaluation.score ??
              0) >=
          SCORE_TIE_EPSILON,
      );
    const selectedIsClosest =
      otherCandidates.every(
        (candidate) =>
          recommendedCandidate
            .distanceAccuracyScore -
            candidate
              .distanceAccuracyScore >=
          SCORE_TIE_EPSILON,
      );

    if (
      allSafetyScoresMatch &&
      selectedIsClosest
    ) {
      reasonCode =
        'same-safety-closest-distance';
    } else if (
      selectedIsUniquelySafest
    ) {
      reasonCode = 'safest';
    } else if (selectedIsClosest) {
      reasonCode =
        'closest-distance';
    } else {
      reasonCode = 'best-balanced';
    }
  }

  return {
    reasonCode,
    reasonText:
      REASON_TEXT[reasonCode],
  };
}

async function requestCandidateRoute({
  startCoordinate,
  targetDistanceM,
  keyword,
  variant,
  variantIndex,
  baseBearingDegrees,
  requestKey,
  radiusScale,
  waypoint,
  signal,
}: {
  startCoordinate: LngLat;
  targetDistanceM: number;
  keyword: RouteKeyword;
  variant: RouteCandidateVariant;
  variantIndex: number;
  baseBearingDegrees: number;
  requestKey?: string;
  radiusScale: number;
  waypoint?: LngLat;
  signal?: AbortSignal;
}): Promise<WalkingRouteResult> {
  throwIfAborted(signal);

  const turnaroundPoint =
    calculateDestinationPoint(
      startCoordinate,
      (targetDistanceM / 2) *
        radiusScale,
      baseBearingDegrees +
        variant.bearingOffsetDeg,
    );

  if (
    !isValidCoordinate(
      turnaroundPoint,
    )
  ) {
    throw new CandidateGenerationError(
      '후보 경유 좌표가 유효하지 않습니다.',
      {
        reason: 'invalid-route',
      },
    );
  }

  try {
    return await createRunningRoute({
      coordinates: [
        startCoordinate,
        ...(waypoint
          ? [waypoint]
          : []),
        turnaroundPoint,
        startCoordinate,
      ],
      keyword,
      routeId: [
        'ors-recommendation',
        requestKey ?? 'route',
        variantIndex,
      ].join('-'),
      signal,
    });
  } catch (error: unknown) {
    if (
      signal?.aborted ||
      (error instanceof Error &&
        error.name === 'AbortError')
    ) {
      throw error;
    }

    throw new CandidateGenerationError(
      '후보 경로 요청에 실패했습니다.',
      {
        reason:
          'route-request-failed',
        cause: error,
      },
    );
  }
}

async function requestFallbackRoute({
  startCoordinate,
  targetDistanceM,
  keyword,
  baseBearingDegrees,
  requestKey,
  signal,
}: {
  startCoordinate: LngLat;
  targetDistanceM: number;
  keyword: RouteKeyword;
  baseBearingDegrees: number;
  requestKey?: string;
  signal?: AbortSignal;
}): Promise<WalkingRouteResult> {
  const turnaroundPoint =
    calculateDestinationPoint(
      startCoordinate,
      targetDistanceM / 2,
      baseBearingDegrees,
    );

  return createRunningRoute({
    coordinates: [
      startCoordinate,
      turnaroundPoint,
      startCoordinate,
    ],
    keyword,
    routeId: [
      'ors-running-start',
      requestKey ?? 'fallback',
    ].join('-'),
    signal,
  });
}

export async function generateRecommendedRoute({
  startCoordinate,
  targetDistanceM,
  keyword = '안전',
  waypointCandidates = [],
  accidentZones,
  safetyDataStatus,
  baseBearingDegrees =
    DEFAULT_ROUTE_BEARING_DEGREES,
  requestKey,
  signal,
}: GenerateRecommendedRouteParams): Promise<RouteRecommendationResult> {
  if (
    !isValidCoordinate(
      startCoordinate,
    ) ||
    !Number.isFinite(
      targetDistanceM,
    ) ||
    targetDistanceM <= 0
  ) {
    return {
      status: 'failed',
      recommendedCandidate: null,
      candidates: [],
      failures: [],
      failedCandidateCount:
        ROUTE_CANDIDATE_VARIANTS.length,
      reasonCode: null,
      reasonText:
        '현재 위치에서 추천 코스를 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
    };
  }

  throwIfAborted(signal);

  const evaluatedAt = Date.now();
  const candidates:
    RouteRecommendationCandidate[] =
    [];
  const failures:
    RouteCandidateFailure[] = [];
  const seenSignatures =
    new Set<string>();
  let radiusScale =
    INITIAL_RADIUS_SCALE;

  for (
    let attemptIndex = 0;
    attemptIndex <
    MAX_GENERATION_ATTEMPTS;
    attemptIndex += 1
  ) {
    const settledCandidates =
      await Promise.allSettled(
        ROUTE_CANDIDATE_VARIANTS.map(
          async (
            variant,
            variantIndex,
          ) => {
            const waypoint =
              waypointCandidates.length >
              0
                ? waypointCandidates[
                    variantIndex %
                      waypointCandidates.length
                  ]
                : undefined;
            const routeResult =
              await requestCandidateRoute({
                startCoordinate,
                targetDistanceM,
                keyword,
                variant,
                variantIndex,
                baseBearingDegrees,
                requestKey: [
                  requestKey ??
                    'route',
                  attemptIndex,
                ].join('-'),
                radiusScale,
                waypoint,
                signal,
              });

            return createCandidate({
              id: `${variant.id}-attempt-${attemptIndex + 1}`,
              variantIndex,
              routeResult,
              targetDistanceM,
              accidentZones,
              safetyDataStatus,
              evaluatedAt,
            });
          },
        ),
      );

    throwIfAborted(signal);

    const attemptCandidates:
      RouteRecommendationCandidate[] =
      [];

    settledCandidates.forEach(
      (settledCandidate, index) => {
        const variant =
          ROUTE_CANDIDATE_VARIANTS[
            index
          ];
        const candidateId =
          `${variant.id}-attempt-${attemptIndex + 1}`;

        if (
          settledCandidate.status ===
          'rejected'
        ) {
          failures.push({
            candidateId,
            reason: getFailureReason(
              settledCandidate.reason,
            ),
          });
          return;
        }

        const candidate =
          settledCandidate.value;
        attemptCandidates.push(
          candidate,
        );

        if (
          !isRouteDistanceWithinTolerance(
            targetDistanceM,
            candidate.actualDistanceM,
          )
        ) {
          failures.push({
            candidateId,
            reason: 'invalid-distance',
          });
          return;
        }

        const signature =
          createRouteSignature(
            candidate.route
              .coordinates,
          );

        if (!signature) {
          failures.push({
            candidateId,
            reason: 'invalid-route',
          });
          return;
        }

        if (
          seenSignatures.has(signature)
        ) {
          failures.push({
            candidateId,
            reason:
              'duplicate-route',
          });
          return;
        }

        seenSignatures.add(signature);
        candidates.push(candidate);
      },
    );

    if (candidates.length > 0) {
      break;
    }

    const closestAttemptCandidate =
      attemptCandidates.sort(
        (first, second) =>
          first.distanceErrorM -
          second.distanceErrorM,
      )[0];

    if (closestAttemptCandidate) {
      radiusScale = Math.min(
        1.1,
        Math.max(
          0.25,
          radiusScale *
            (targetDistanceM /
              closestAttemptCandidate
                .actualDistanceM),
        ),
      );
    }
  }

  const recommendedCandidate =
    selectRecommendedRoute(
      candidates,
    );

  if (recommendedCandidate) {
    const {
      reasonCode,
      reasonText,
    } =
      createRouteRecommendationReason(
        candidates,
        recommendedCandidate,
      );

    return {
      status: 'success',
      recommendedCandidate,
      candidates,
      failures,
      failedCandidateCount:
        failures.length,
      reasonCode,
      reasonText,
    };
  }

  if (waypointCandidates.length > 0) {
    return {
      status: 'failed',
      recommendedCandidate: null,
      candidates: [],
      failures,
      failedCandidateCount:
        failures.length,
      reasonCode: null,
      reasonText:
        '선택한 장소를 포함하면서 목표 거리 ±200m를 만족하는 코스를 만들지 못했어요. 다시 생성해 주세요.',
    };
  }

  try {
    throwIfAborted(signal);

    const fallbackResult =
      await requestFallbackRoute({
        startCoordinate,
        targetDistanceM,
        keyword,
        baseBearingDegrees,
        requestKey,
        signal,
      });
    const fallbackCandidate =
      createCandidate({
        id: 'fallback-route',
        variantIndex: -1,
        routeResult:
          fallbackResult,
        targetDistanceM,
        accidentZones,
        safetyDataStatus,
        evaluatedAt,
      });

    if (
      !isRouteDistanceWithinTolerance(
        targetDistanceM,
        fallbackCandidate
          .actualDistanceM,
      )
    ) {
      throw new CandidateGenerationError(
        '기본 코스가 목표 거리 허용 오차를 벗어났습니다.',
        {
          reason: 'invalid-distance',
        },
      );
    }

    if (
      typeof __DEV__ !==
        'undefined' &&
      __DEV__
    ) {
      console.warn(
        '[ROUTE-RECOMMENDATION] fallback 사용',
        {
          failedCandidateCount:
            failures.length,
        },
      );
    }

    return {
      status: 'fallback',
      recommendedCandidate:
        fallbackCandidate,
      candidates: [],
      failures,
      failedCandidateCount:
        failures.length,
      reasonCode: 'fallback-route',
      reasonText:
        REASON_TEXT[
          'fallback-route'
        ],
    };
  } catch (error: unknown) {
    throwIfAborted(signal);

    if (
      typeof __DEV__ !==
        'undefined' &&
      __DEV__
    ) {
      console.warn(
        '[ROUTE-RECOMMENDATION] 추천 실패',
        {
          failedCandidateCount:
            failures.length,
          reason:
            getFailureReason(error),
        },
      );
    }

    return {
      status: 'failed',
      recommendedCandidate: null,
      candidates: [],
      failures,
      failedCandidateCount:
        failures.length,
      reasonCode: null,
      reasonText:
        '목표 거리 ±200m 안의 코스를 만들지 못했어요. 코스를 다시 생성해 주세요.',
    };
  }
}
