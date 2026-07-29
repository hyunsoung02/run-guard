import type {
  RouteSafetyEvaluation,
  RouteSafetyGrade,
  RouteWarningPoint,
} from '../../../services/safety/routeSafetyService';

export type SafetyDetailWarningItem = {
  id: string;
  label: string;
  warningPoint: RouteWarningPoint;
};

export type SafetyDetailContent = {
  title: string;
  scoreLabel: string | null;
  summary: string;
  description?: string;
  warningItems: SafetyDetailWarningItem[];
  remainingWarningCount: number;
  showEvaluationCriteria: boolean;
  showDataSource: boolean;
  disclaimer: string;
  isLoading: boolean;
};

export const SAFETY_EVALUATION_CRITERIA = [
  '추천 경로와 사고 다발지역 사이의 거리',
  '사고 발생 건수',
  '사망자 및 중상자 수',
  '경로 주변 200m 이내 주의 지점',
] as const;

export const SAFETY_DATA_SOURCE =
  '한국도로교통공단 보행노인 교통사고 다발지역';

const SAFETY_GRADE_LABELS: Record<
  RouteSafetyGrade,
  string
> = {
  safe: '안전',
  good: '양호',
  caution: '주의',
  danger: '위험',
};

const AVAILABLE_DISCLAIMER =
  '본 점수는 과거 사고 이력을 기반으로 한 참고 정보이며, 현재 도로 상태와 모든 위험 요소를 포함하지 않습니다.';

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

function getScoreLabel(
  evaluation:
    | RouteSafetyEvaluation
    | null
    | undefined,
): string | null {
  if (
    evaluation?.status !==
      'available' ||
    evaluation.score === null
  ) {
    return null;
  }

  const score = toFiniteNumber(
    evaluation.score,
  );

  if (score === null) {
    return null;
  }

  const gradeLabel = evaluation.grade
    ? SAFETY_GRADE_LABELS[
        evaluation.grade
      ]
    : null;

  return gradeLabel
    ? `${score}점 · ${gradeLabel}`
    : `${score}점`;
}

function getWarningItems(
  evaluation:
    | RouteSafetyEvaluation
    | null
    | undefined,
): {
  items: SafetyDetailWarningItem[];
  remainingCount: number;
  totalCount: number;
} {
  const warningPoints =
    Array.isArray(
      evaluation?.warningPoints,
    )
      ? evaluation.warningPoints
      : [];
  const validWarningPoints =
    warningPoints
      .map((warningPoint) => ({
        warningPoint,
        distanceM: toFiniteNumber(
          warningPoint
            ?.distanceFromRouteM,
        ),
      }))
      .filter(
        (
          item,
        ): item is {
          warningPoint: RouteWarningPoint;
          distanceM: number;
        } =>
          item.warningPoint !==
            null &&
          item.warningPoint !==
            undefined &&
          item.distanceM !== null &&
          item.distanceM >= 0,
      )
      .sort(
        (first, second) =>
          first.distanceM -
          second.distanceM,
      );
  const items =
    validWarningPoints
      .slice(0, 3)
      .map(
        ({
          warningPoint,
          distanceM,
        }) => {
          const accidentCount =
            toFiniteNumber(
              warningPoint
                .accidentCount,
            );
          const distanceLabel =
            `경로에서 약 ${Math.round(
              Math.max(0, distanceM),
            )}m`;
          const accidentLabel =
            accidentCount !== null &&
            accidentCount > 0
              ? ` · 사고 ${Math.round(
                  accidentCount,
                )}건`
              : '';

          return {
            id: String(
              warningPoint.id ??
                `warning-${distanceM}`,
            ),
            label:
              distanceLabel +
              accidentLabel,
            warningPoint,
          };
        },
      );

  return {
    items,
    remainingCount: Math.max(
      0,
      validWarningPoints.length -
        items.length,
    ),
    totalCount:
      validWarningPoints.length,
  };
}

export function createSafetyDetailContent(
  evaluation?:
    | RouteSafetyEvaluation
    | null,
): SafetyDetailContent {
  const status =
    evaluation?.status ?? 'idle';

  if (status === 'loading') {
    return {
      title: '코스 안전도',
      scoreLabel: null,
      summary:
        '경로 주변의 사고 이력을 분석하고 있어요.',
      description:
        '추천 경로와 사고 다발지역 사이의 거리를 계산하고 있습니다.',
      warningItems: [],
      remainingWarningCount: 0,
      showEvaluationCriteria: false,
      showDataSource: false,
      disclaimer:
        '분석이 완료되면 과거 사고 이력을 기준으로 결과를 안내합니다.',
      isLoading: true,
    };
  }

  if (status === 'unavailable') {
    return {
      title: '코스 안전도',
      scoreLabel: null,
      summary:
        '안전 정보가 제공되지 않는 경로예요.',
      description:
        '현재 출발지가 광명시가 아니거나 사고 이력 데이터를 불러오지 못해 안전도를 평가하지 않았습니다.',
      warningItems: [],
      remainingWarningCount: 0,
      showEvaluationCriteria: false,
      showDataSource: false,
      disclaimer:
        '지도를 직접 확인하고 실제 도로 상황에 주의해 주세요.',
      isLoading: false,
    };
  }

  if (status !== 'available') {
    return {
      title: '코스 안전도',
      scoreLabel: null,
      summary:
        '안전 정보를 준비하고 있어요.',
      description:
        '경로가 생성되면 사고 이력 데이터를 기준으로 경로 주변 주의 지점을 분석합니다.',
      warningItems: [],
      remainingWarningCount: 0,
      showEvaluationCriteria: false,
      showDataSource: false,
      disclaimer:
        '경로 생성과 사고 이력 데이터 조회가 완료될 때까지 잠시 기다려 주세요.',
      isLoading: false,
    };
  }

  const {
    items,
    remainingCount,
    totalCount,
  } = getWarningItems(evaluation);

  return {
    title: '코스 안전도',
    scoreLabel:
      getScoreLabel(evaluation),
    summary:
      totalCount === 0
        ? '보행노인 교통사고 다발지역 데이터 기준으로 이번 경로 주변 200m 이내에서 주의 지점이 발견되지 않았습니다.'
        : `추천 경로 주변에서 주의가 필요한 사고 다발지역 ${totalCount}곳을 발견했어요.`,
    warningItems: items,
    remainingWarningCount:
      remainingCount,
    showEvaluationCriteria: true,
    showDataSource: true,
    disclaimer:
      AVAILABLE_DISCLAIMER,
    isLoading: false,
  };
}
