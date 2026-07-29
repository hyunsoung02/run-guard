import type {
  RouteSafetyEvaluation,
  RouteWarningPoint,
} from '../../../services/safety/routeSafetyService';

export type WarningDetailItem = {
  id: string;
  title: string;
  distanceLabel: string | null;
  accidentCountLabel: string | null;
  warningPoint: RouteWarningPoint;
};

export type WarningDetailContent = {
  title: string;
  summaryLabel: string;
  resultTitle: string;
  resultDescription: string;
  warningItems: WarningDetailItem[];
  remainingCount: number;
  showEvaluationCriteria: boolean;
  showDataSource: boolean;
  disclaimer: string;
  isLoading: boolean;
};

export const WARNING_DETECTION_CRITERIA = [
  '추천 경로와 사고 다발지역 사이의 거리',
  '경로 주변 200m 이내 포함 여부',
] as const;

export const WARNING_DATA_SOURCE =
  '한국도로교통공단 보행노인 교통사고 다발지역';

const WARNING_DISCLAIMER =
  '본 정보는 과거 사고 이력을 기반으로 한 참고 정보이며, 현재 도로 상태와 모든 위험 요소를 포함하지 않습니다.';

const toFiniteNumber = (
  value: unknown,
): number | null => {
  const numberValue =
    typeof value === 'number'
      ? value
      : Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
};

function getWarningPoints(
  evaluation?:
    | RouteSafetyEvaluation
    | null,
): RouteWarningPoint[] {
  if (
    !Array.isArray(
      evaluation?.warningPoints,
    )
  ) {
    return [];
  }

  return evaluation.warningPoints.filter(
    (
      warningPoint,
    ): warningPoint is RouteWarningPoint =>
      typeof warningPoint ===
        'object' &&
      warningPoint !== null,
  );
}

function createWarningItems(
  warningPoints: RouteWarningPoint[],
): {
  items: WarningDetailItem[];
  remainingCount: number;
} {
  const sortedWarningPoints =
    warningPoints
      .map((warningPoint) => {
        const rawDistance =
          toFiniteNumber(
            warningPoint
              .distanceFromRouteM,
          );

        return {
          warningPoint,
          distanceM:
            rawDistance !== null &&
            rawDistance >= 0
              ? rawDistance
              : null,
        };
      })
      .sort((first, second) => {
        if (
          first.distanceM === null
        ) {
          return second.distanceM ===
            null
            ? 0
            : 1;
        }

        if (
          second.distanceM === null
        ) {
          return -1;
        }

        return (
          first.distanceM -
          second.distanceM
        );
      });
  const items = sortedWarningPoints
    .slice(0, 3)
    .map(
      (
        {
          warningPoint,
          distanceM,
        },
        index,
      ) => {
        const normalizedName =
          typeof warningPoint.name ===
          'string'
            ? warningPoint.name.trim()
            : '';
        const accidentCount =
          toFiniteNumber(
            warningPoint
              .accidentCount,
          );

        return {
          id: `${String(
            warningPoint.id ??
              'warning',
          )}-${index}`,
          title:
            normalizedName ||
            '보행노인 사고 다발지역',
          distanceLabel:
            distanceM === null
              ? null
              : `경로에서 약 ${Math.round(
                  distanceM,
                )}m`,
          accidentCountLabel:
            accidentCount !== null &&
            accidentCount > 0
              ? `사고 ${Math.round(
                  accidentCount,
                )}건`
              : null,
          warningPoint,
        };
      },
    );

  return {
    items,
    remainingCount: Math.max(
      0,
      sortedWarningPoints.length -
        items.length,
    ),
  };
}

export function createWarningDetailContent(
  evaluation?:
    | RouteSafetyEvaluation
    | null,
): WarningDetailContent {
  const status =
    evaluation?.status ?? 'idle';

  if (status === 'loading') {
    return {
      title: '주의 지점',
      summaryLabel:
        '주의 지점 분석 중',
      resultTitle:
        '이번 경로 분석 결과',
      resultDescription:
        '추천 경로와 사고 다발지역 사이의 거리를 계산하고 있습니다.',
      warningItems: [],
      remainingCount: 0,
      showEvaluationCriteria: false,
      showDataSource: false,
      disclaimer:
        '분석이 완료되면 과거 사고 이력을 기준으로 주의 지점을 안내합니다.',
      isLoading: true,
    };
  }

  if (status === 'unavailable') {
    return {
      title: '주의 지점',
      summaryLabel:
        '주의 지점 정보 없음',
      resultTitle:
        '이번 경로 분석 결과',
      resultDescription:
        '현재 출발지가 광명시가 아니거나 사고 이력 데이터를 불러오지 못해 주의 지점을 평가하지 않았습니다.',
      warningItems: [],
      remainingCount: 0,
      showEvaluationCriteria: false,
      showDataSource: false,
      disclaimer:
        '지도를 직접 확인하고 실제 도로 상황에 주의해 주세요.',
      isLoading: false,
    };
  }

  if (status !== 'available') {
    return {
      title: '주의 지점',
      summaryLabel: '분석 준비 중',
      resultTitle:
        '이번 경로 분석 결과',
      resultDescription:
        '경로가 생성되면 보행노인 교통사고 다발지역 데이터를 기준으로 경로 주변 200m 이내의 주의 지점을 확인합니다.',
      warningItems: [],
      remainingCount: 0,
      showEvaluationCriteria: false,
      showDataSource: false,
      disclaimer:
        '경로 생성과 사고 이력 데이터 조회가 완료될 때까지 잠시 기다려 주세요.',
      isLoading: false,
    };
  }

  const warningPoints =
    getWarningPoints(evaluation);
  const {
    items,
    remainingCount,
  } = createWarningItems(
    warningPoints,
  );
  const warningPointCount =
    warningPoints.length;

  return {
    title: '주의 지점',
    summaryLabel: `주의 지점 ${warningPointCount}곳`,
    resultTitle:
      '이번 경로 분석 결과',
    resultDescription:
      warningPointCount === 0
        ? '보행노인 교통사고 다발지역 데이터 기준으로 이번 경로 주변 200m 이내에서 주의 지점이 발견되지 않았습니다.'
        : `이번 경로 주변 200m 이내에서 주의가 필요한 사고 다발지역 ${warningPointCount}곳을 발견했습니다.`,
    warningItems: items,
    remainingCount,
    showEvaluationCriteria: true,
    showDataSource: true,
    disclaimer: WARNING_DISCLAIMER,
    isLoading: false,
  };
}
