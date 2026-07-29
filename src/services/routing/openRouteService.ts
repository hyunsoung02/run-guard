import type {
  LngLat,
  RunningRoute,
  RouteKeyword,
} from '../../features/map/data/runningRoute';
import type {
  NavigationManeuver,
  NavigationStep,
} from '../../features/running/types/voiceGuide.types';

type OrsRouteSummary = {
  distance: number;
  duration: number;
};

type OrsRouteSegment = {
  distance: number;
  duration: number;
  steps: OrsRouteStep[];
};

type OrsRouteStep = {
  distance: number;
  duration: number;
  instruction: string;
  type: number;
  way_points: [number, number];
};

type OrsRouteProperties = {
  summary?: OrsRouteSummary;
  segments?: OrsRouteSegment[];
  way_points?: number[];
};

type OrsRouteGeometry = {
  type: 'LineString';
  coordinates: LngLat[];
};

type OrsRouteFeature = {
  type: 'Feature';
  properties: OrsRouteProperties;
  geometry: OrsRouteGeometry;
};

type OrsRouteResponse = {
  type: 'FeatureCollection';
  features: OrsRouteFeature[];
};

type RequestWalkingRouteParams = {
  coordinates: LngLat[];
  signal?: AbortSignal;
};

type CreateRunningRouteParams = {
  coordinates: LngLat[];
  keyword?: RouteKeyword;
  routeId?: string;
  signal?: AbortSignal;
};

export type WalkingRouteResult = {
  route: RunningRoute;
  distanceM: number;
  durationSeconds: number;
};

const ORS_DIRECTIONS_URL =
  'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';
const ORS_REQUEST_TIMEOUT_MS = 15_000;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null
  );
}

function isLngLat(
  value: unknown,
): value is LngLat {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    Number.isFinite(value[0]) &&
    value[0] >= -180 &&
    value[0] <= 180 &&
    typeof value[1] === 'number' &&
    Number.isFinite(value[1]) &&
    value[1] >= -90 &&
    value[1] <= 90
  );
}

function parseWayPoints(
  value: unknown,
): [number, number] | null {
  if (
    !Array.isArray(value) ||
    value.length < 2 ||
    !Number.isInteger(value[0]) ||
    !Number.isInteger(value[1]) ||
    value[0] < 0 ||
    value[1] < value[0]
  ) {
    return null;
  }

  return [value[0], value[1]];
}

function parseOrsStep(
  value: unknown,
): OrsRouteStep | null {
  if (!isRecord(value)) {
    return null;
  }

  const wayPoints = parseWayPoints(
    value.way_points,
  );

  if (
    typeof value.distance !== 'number' ||
    !Number.isFinite(value.distance) ||
    value.distance < 0 ||
    typeof value.duration !== 'number' ||
    !Number.isFinite(value.duration) ||
    value.duration < 0 ||
    typeof value.type !== 'number' ||
    !Number.isInteger(value.type) ||
    !wayPoints
  ) {
    return null;
  }

  return {
    distance: value.distance,
    duration: value.duration,
    instruction:
      typeof value.instruction ===
      'string'
        ? value.instruction
        : '',
    type: value.type,
    way_points: wayPoints,
  };
}

function parseOrsSegment(
  value: unknown,
): OrsRouteSegment | null {
  if (!isRecord(value)) {
    return null;
  }

  const steps = Array.isArray(
    value.steps,
  )
    ? value.steps
        .map(parseOrsStep)
        .filter(
          (
            step,
          ): step is OrsRouteStep =>
            step !== null,
        )
    : [];

  return {
    distance:
      typeof value.distance ===
        'number' &&
      Number.isFinite(value.distance)
        ? value.distance
        : 0,
    duration:
      typeof value.duration ===
        'number' &&
      Number.isFinite(value.duration)
        ? value.duration
        : 0,
    steps,
  };
}

function parseOrsRouteResponse(
  value: unknown,
): OrsRouteResponse {
  if (
    !isRecord(value) ||
    !Array.isArray(value.features)
  ) {
    throw new Error(
      'ORS 응답 형식이 올바르지 않습니다.',
    );
  }

  const features =
    value.features.flatMap(
      (featureValue) => {
        if (!isRecord(featureValue)) {
          return [];
        }

        const geometry =
          featureValue.geometry;
        const properties =
          featureValue.properties;

        if (
          !isRecord(geometry) ||
          geometry.type !==
            'LineString' ||
          !Array.isArray(
            geometry.coordinates,
          ) ||
          !isRecord(properties)
        ) {
          return [];
        }

        if (
          geometry.coordinates
            .length < 2 ||
          !geometry.coordinates.every(
            isLngLat,
          )
        ) {
          return [];
        }
        const coordinates:
          LngLat[] =
          geometry.coordinates;

        const summaryValue =
          properties.summary;
        const summary =
          isRecord(summaryValue) &&
          typeof summaryValue.distance ===
            'number' &&
          Number.isFinite(
            summaryValue.distance,
          ) &&
          typeof summaryValue.duration ===
            'number' &&
          Number.isFinite(
            summaryValue.duration,
          )
            ? {
                distance:
                  summaryValue.distance,
                duration:
                  summaryValue.duration,
              }
            : undefined;
        const segments =
          Array.isArray(
            properties.segments,
          )
            ? properties.segments
                .map(parseOrsSegment)
                .filter(
                  (
                    segment,
                  ): segment is OrsRouteSegment =>
                    segment !== null,
                )
            : [];
        const wayPoints =
          Array.isArray(
            properties.way_points,
          )
            ? properties.way_points.filter(
                (
                  index,
                ): index is number =>
                  Number.isInteger(
                    index,
                  ) && index >= 0,
              )
            : undefined;

        return [
          {
            type: 'Feature' as const,
            properties: {
              summary,
              segments,
              way_points: wayPoints,
            },
            geometry: {
              type: 'LineString' as const,
              coordinates,
            },
          },
        ];
      },
    );

  if (features.length === 0) {
    throw new Error(
      'ORS 응답에 유효한 경로 좌표가 없습니다.',
    );
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

export function mapOrsInstructionTypeToManeuver(
  type: number,
): NavigationManeuver {
  switch (type) {
    case 0:
      return 'left';
    case 1:
      return 'right';
    case 2:
      return 'sharp-left';
    case 3:
      return 'sharp-right';
    case 4:
      return 'slight-left';
    case 5:
    case 13:
      return 'slight-right';
    case 12:
      return 'slight-left';
    case 6:
    case 7:
    case 8:
    case 11:
      return 'straight';
    case 9:
      return 'u-turn';
    case 10:
      return 'arrive';
    default:
      return 'unknown';
  }
}

function createNavigationSteps(
  feature: OrsRouteFeature,
): NavigationStep[] {
  return (
    feature.properties.segments ?? []
  ).flatMap(
    (segment, segmentIndex) =>
      segment.steps.flatMap(
        (step, stepIndex) => {
          /*
           * Depart는 현재 위치에서 즉시 실행되는 지시라
           * "다음 회전" 목록에서는 제외합니다.
           */
          if (step.type === 11) {
            return [];
          }

          const coordinateIndex =
            step.way_points[0];
          const coordinate =
            feature.geometry
              .coordinates[
              coordinateIndex
            ];

          if (!coordinate) {
            return [];
          }

          const maneuver =
            mapOrsInstructionTypeToManeuver(
              step.type,
            );

          return [
            {
              id: [
                segmentIndex,
                stepIndex,
                coordinateIndex,
              ].join('-'),
              instruction:
                createKoreanNavigationInstruction(
                  step.type,
                  maneuver,
                ),
              maneuver,
              distanceM:
                step.distance,
              wayPoints:
                step.way_points,
              coordinate: {
                longitude:
                  coordinate[0],
                latitude:
                  coordinate[1],
              },
            },
          ];
        },
      ),
  );
}

function createKoreanNavigationInstruction(
  orsType: number,
  maneuver: NavigationManeuver,
): string {
  if (orsType === 7) {
    return '회전교차로에 진입하세요.';
  }

  if (orsType === 8) {
    return '회전교차로에서 진출하세요.';
  }

  if (orsType === 12) {
    return '왼쪽 길을 유지하세요.';
  }

  if (orsType === 13) {
    return '오른쪽 길을 유지하세요.';
  }

  switch (maneuver) {
    case 'left':
      return '왼쪽으로 도세요.';
    case 'sharp-left':
      return '왼쪽으로 크게 도세요.';
    case 'slight-left':
      return '왼쪽 방향으로 이동하세요.';
    case 'right':
      return '오른쪽으로 도세요.';
    case 'sharp-right':
      return '오른쪽으로 크게 도세요.';
    case 'slight-right':
      return '오른쪽 방향으로 이동하세요.';
    case 'u-turn':
      return '유턴하세요.';
    case 'arrive':
      return '목적지에 도착합니다.';
    case 'straight':
      return '경로를 따라 직진하세요.';
    case 'unknown':
      return '경로를 따라 이동하세요.';
  }
}

function getOrsApiKey(): string {
  const apiKey =
    process.env.EXPO_PUBLIC_ORS_API_KEY;

  if (!apiKey) {
    throw new Error(
      'EXPO_PUBLIC_ORS_API_KEY가 설정되지 않았습니다.',
    );
  }

  return apiKey;
}

function validateCoordinates(
  coordinates: LngLat[],
): void {
  if (coordinates.length < 2) {
    throw new Error(
      '경로 생성에는 최소 2개의 좌표가 필요합니다.',
    );
  }

  for (const coordinate of coordinates) {
    const [longitude, latitude] =    //ORS API에서 경도 위도 값을 받음 [longitude, latitude]
      coordinate;

    const longitudeIsValid =
      Number.isFinite(longitude) &&
      longitude >= -180 &&
      longitude <= 180;

    const latitudeIsValid =
      Number.isFinite(latitude) &&
      latitude >= -90 &&
      latitude <= 90;

    if (
      !longitudeIsValid ||
      !latitudeIsValid
    ) {
      throw new Error(
        '유효하지 않은 경도 또는 위도 좌표가 포함되어 있습니다.',
      );
    }
  }
}

function getTurnaroundPoint(
  requestedCoordinates: LngLat[],
  feature: OrsRouteFeature,
): LngLat | undefined {
  if (requestedCoordinates.length < 3) {
    return undefined;
  }

  const startCoordinate =
    requestedCoordinates[0];
  const finalCoordinate =
    requestedCoordinates[
      requestedCoordinates.length - 1
    ];

  const routeReturnsToStart =
    startCoordinate[0] ===
      finalCoordinate[0] &&
    startCoordinate[1] ===
      finalCoordinate[1];

  if (!routeReturnsToStart) {
    return undefined;
  }

  const destinationWaypointPosition =
    Math.floor(
      requestedCoordinates.length / 2,
    );

  const destinationRouteIndex =
    feature.properties.way_points?.[
      destinationWaypointPosition
    ];

  if (
    typeof destinationRouteIndex ===
      'number' &&
    Number.isInteger(
      destinationRouteIndex,
    )
  ) {
    const snappedCoordinate =
      feature.geometry.coordinates[
        destinationRouteIndex
      ];

    if (snappedCoordinate) {
      return snappedCoordinate;
    }
  }

  return requestedCoordinates[
    destinationWaypointPosition
  ];
}

async function readErrorMessage(
  response: Response,
): Promise<string> {
  try {
    const responseBody =
      await response.text();

    if (!responseBody) {
      return '응답 내용 없음';
    }

    return responseBody;
  } catch {
    return '오류 응답을 읽지 못했습니다.';
  }
}

export async function requestWalkingRoute({
  coordinates,
  signal,
}: RequestWalkingRouteParams): Promise<OrsRouteResponse> {
  validateCoordinates(coordinates);

  const requestController =
    new AbortController();
  let timedOut = false;
  const handleExternalAbort = () =>
    requestController.abort();
  if (signal?.aborted) {
    requestController.abort();
  } else {
    signal?.addEventListener(
      'abort',
      handleExternalAbort,
      {
        once: true,
      },
    );
  }
  const timeout = setTimeout(() => {
    timedOut = true;
    requestController.abort();
  }, ORS_REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(
      ORS_DIRECTIONS_URL,
      {
        method: 'POST',
        headers: {
          Authorization:
            getOrsApiKey(),
          Accept:
            'application/geo+json',
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          coordinates,
          geometry: true,
          instructions: true,
          language: 'en',
          preference: 'recommended',
        }),
        signal:
          requestController.signal,
      },
    );
  } catch (error: unknown) {
    if (timedOut) {
      throw new Error(
        '경로 요청 시간이 초과되었습니다. 네트워크 상태를 확인해 주세요.',
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener(
      'abort',
      handleExternalAbort,
    );
  }

  if (!response.ok) {
    const errorMessage =
      await readErrorMessage(
        response,
      );

    throw new Error(
      `ORS 경로 요청 실패 (${response.status}): ${errorMessage}`,
    );
  }

  const responseData: unknown =
    await response.json();

  return parseOrsRouteResponse(
    responseData,
  );
}

export async function createRunningRoute({
  coordinates,
  keyword = '안전',
  routeId,
  signal,
}: CreateRunningRouteParams): Promise<WalkingRouteResult> {
  const response =
    await requestWalkingRoute({
      coordinates,
      signal,
    });

  const feature =
    response.features[0];

  const distanceM =
    feature.properties.summary
      ?.distance ??
    feature.properties.segments
      ?.reduce(
        (total, segment) =>
          total +
          segment.distance,
        0,
      ) ??
    0;

  const durationSeconds =
    feature.properties.summary
      ?.duration ??
    feature.properties.segments
      ?.reduce(
        (total, segment) =>
          total +
          segment.duration,
        0,
      ) ??
    0;

  const turnaroundPoint =
    getTurnaroundPoint(
      coordinates,
      feature,
    );

  const route: RunningRoute = {
    id:
      routeId ??
      `ors-route-${Date.now()}`,
    keyword,
    source: 'ors',
    shape: 'out-and-back',
    coordinates:
      feature.geometry.coordinates,
    navigationSteps:
      createNavigationSteps(feature),
    turnaroundPoint,
    cautionPoints: [],
    generatedAtMs: Date.now(),
  };

  return {
    route,
    distanceM,
    durationSeconds,
  };
}
