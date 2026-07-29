export type LoadingMode =
  | 'course'
  | 'coach'
  | 'search'
  | 'locationCourse';

export type LoadingPreset = {
  title: string;
  messages: readonly string[];
};

export function getLoadingPreset(
  mode: LoadingMode,
  subjectName?: string,
  targetDistanceKm?: number,
): LoadingPreset {
  const subject =
    subjectName?.trim() || '선택한 장소';

  switch (mode) {
    case 'locationCourse':
      return {
        title:
          '추천 코스 분석 중',
        messages: [
          `${subject}에서 출발하는 ${targetDistanceKm ?? 5}km 후보 코스를 생성하고 있어요.`,
          '코스별 목표 거리 정확도를 비교하고 있어요.',
          '사고 이력 기반 코스 안전도를 분석하고 있어요.',
          '가장 적합한 코스를 선택하고 있어요.',
        ],
      };

    case 'coach':
      return {
        title: '러닝 코치 플랜 분석 중',
        messages: [
          '최근 러닝 기록을 불러오고 있어요.',
          '주간 활동량과 평균 페이스를 분석하고 있어요.',
          '현재 운동 수준에 맞는 강도를 계산하고 있어요.',
          '이번 주 기록과 목표 거리를 확인하고 있어요.',
          '이번 주 추천 훈련을 구성하고 있어요.',
          '규칙 기반 러닝 코치 플랜을 완성하고 있어요.',
        ],
      };

    case 'search':
      return {
        title: '맞춤 코스 분석 중',
        messages: [
          `${subject} 주변의 장소 정보를 확인하고 있어요.`,
          `${subject}을 경유하는 러닝 경로를 찾고 있어요.`,
          '목표 거리와 실제 이동 거리를 비교하고 있어요.',
          '서로 다른 방향의 후보 경로를 생성하고 있어요.',
          '경로 거리와 안전 정보를 분석하고 있어요.',
          '안전도와 목표 거리 정확도를 비교하고 있어요.',
          '추천 러닝 코스를 완성하고 있어요.',
        ],
      };

    case 'course':
    default:
      return {
        title: '추천 코스 분석 중',
        messages: [
          '현재 위치와 목표 거리를 확인하고 있어요.',
          '서로 다른 방향의 후보 코스를 생성하고 있어요.',
          '코스별 목표 거리 정확도를 비교하고 있어요.',
          '사고 이력 기반 코스 안전도를 분석하고 있어요.',
          '가장 적합한 코스를 선택하고 있어요.',
        ],
      };
  }
}
