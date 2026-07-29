export type HomeCoachCategory =
  | 'goal'
  | 'returning'
  | 'consistent';

type HomeCoachMessageBuilder = (
  goalKm: number,
) => string;

type GetDailyMessageOptions = {
  category: HomeCoachCategory;
  goalKm: number;
  date?: Date;
};

const DAY_IN_MILLISECONDS =
  24 * 60 * 60 * 1000;

/**
 * 목표 거리 표기
 *
 * 3    → "3"
 * 3.5  → "3.5"
 * 5    → "5"
 */
const formatGoalKm = (
  goalKm: number,
): string => {
  if (Number.isInteger(goalKm)) {
    return goalKm.toFixed(0);
  }

  return goalKm.toFixed(1);
};

/**
 * 홈 화면 규칙 기반 코치 문장 데이터
 *
 * goal:
 * 일반 사용자에게 오늘의 목표를 안내
 *
 * returning:
 * 7일 이상 앱에 접속하지 않은 사용자
 *
 * consistent:
 * 연속으로 러닝을 실천한 사용자
 */
export const HOME_COACH_MESSAGES: Record<
  HomeCoachCategory,
  HomeCoachMessageBuilder[]
> = {
  goal: [
    (goalKm) =>
      `오늘은 가볍게\n${formatGoalKm(goalKm)}KM 달리자!`,

    (goalKm) =>
      `오늘 목표는 ${formatGoalKm(goalKm)}KM!\n천천히 출발해요.`,

    (goalKm) =>
      `${formatGoalKm(goalKm)}KM만 채워도 충분해요!\n완주에 집중해요.`,

    (goalKm) =>
      `오늘도 내 페이스로\n${formatGoalKm(goalKm)}KM 함께 달려요!`,
  ],

  returning: [
    () =>
      `오랜만이에요!\n오늘은 1KM부터 시작해요.`,

    () =>
      `쉬어간 만큼 천천히!\n가볍게 몸을 깨워봐요.`,
  ],

  consistent: [
    () =>
      `꾸준함이 쌓였어요!\n오늘도 흐름을 이어가요.`,

    () =>
      `연속 러닝 멋져요!\n오늘도 내 페이스로!`,

    () =>
      `이번 주 리듬이 좋아요!\n무리 없이 한 걸음 더!`,

    () =>
      `매일의 실천이 실력이 돼요!\n오늘도 파이팅!`,
  ],
};

/**
 * 날짜를 일련번호로 변환합니다.
 *
 * 같은 날짜에는 같은 문장을 반환하고,
 * 다음 날짜에는 다음 문장으로 이동합니다.
 */
const getDayNumber = (
  date: Date,
): number => {
  const utcDate = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  return Math.floor(
    utcDate / DAY_IN_MILLISECONDS,
  );
};

/**
 * 카테고리에 따라 시작 순서를 조금 다르게 합니다.
 */
const CATEGORY_OFFSET: Record<
  HomeCoachCategory,
  number
> = {
  goal: 0,
  returning: 1,
  consistent: 2,
};

/**
 * 하루 동안은 같은 문장을 유지하고,
 * 날짜가 바뀌면 다음 문장을 선택합니다.
 */
export function getDailyHomeCoachMessage({
  category,
  goalKm,
  date = new Date(),
}: GetDailyMessageOptions): string {
  const messages =
    HOME_COACH_MESSAGES[category];

  const dayNumber = getDayNumber(date);

  const messageIndex =
    (
      dayNumber +
      CATEGORY_OFFSET[category]
    ) % messages.length;

  return messages[messageIndex](goalKm);
}
