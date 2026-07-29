import type {
  CoachLevel,
  CoachLevelDetails,
  WeeklyCoachPlan,
} from '../types/coach.types';

export const COACH_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
] satisfies CoachLevel[];

export const COACH_LEVEL_DETAILS = {
  beginner: {
    label: '초급',
    title: '초급 러너',
    selectionDescription:
      '러닝을 처음 시작하는 분들을 위한 기초 체력 향상 프로그램',
    dashboardDescription:
      '기초 체력을 차근차근 키우는 주 3회 러닝 플랜이에요.',
    accentColor: '#B2F300',
    softColor: '#F2FFD0',
  },
  intermediate: {
    label: '중급',
    title: '중급 러너',
    selectionDescription:
      '기본 체력이 향상된 러너를 위한 지구력 및 페이스 향상 프로그램',
    dashboardDescription:
      '지구력과 페이스를 함께 끌어올리는 주 3회 러닝 플랜이에요.',
    accentColor: '#2F6FED',
    softColor: '#EAF1FF',
  },
  advanced: {
    label: '상급',
    title: '상급 러너',
    selectionDescription:
      '더 높은 기록과 목표 달성을 위한 고강도 훈련 프로그램',
    dashboardDescription:
      '목표 기록 달성을 위한 고강도 주 3회 러닝 플랜이에요.',
    accentColor: '#7C4DFF',
    softColor: '#F1ECFF',
  },
} satisfies Record<CoachLevel, CoachLevelDetails>;

type WeeklyCoachPlanSeed = Omit<
  WeeklyCoachPlan,
  | 'completedDistanceKm'
  | 'goalAchieved'
  | 'badgeRewardCount'
>;

function createWeeklyCoachPlan(
  seed: WeeklyCoachPlanSeed,
): WeeklyCoachPlan {
  const completedDistanceKm =
    seed.items.reduce(
      (totalDistanceKm, item) =>
        item.status === 'completed'
          ? totalDistanceKm +
            item.distanceKm
          : totalDistanceKm,
      0,
    );

  return {
    ...seed,
    completedDistanceKm,
    goalAchieved:
      completedDistanceKm >=
      seed.targetDistanceKm,
    badgeRewardCount: 5,
  };
}

export const COACH_PLAN_PRESETS = {
  beginner: createWeeklyCoachPlan({
    weekKey: 'preset',
    level: 'beginner',
    targetDistanceKm: 15,
    items: [
      {
        id: 'beginner-monday',
        dayLabel: '월요일',
        distanceKm: 3,
        title: '회복 러닝',
        description:
          '가볍게 몸을 푸는 회복 러닝',
        status: 'scheduled',
      },
      {
        id: 'beginner-wednesday',
        dayLabel: '수요일',
        distanceKm: 5,
        title: '페이스 러닝',
        description:
          '적정 페이스로 지구력 향상',
        status: 'scheduled',
      },
      {
        id: 'beginner-saturday',
        dayLabel: '토요일',
        distanceKm: 7,
        title: '장거리 러닝',
        description:
          '지구력과 체력 강화 러닝',
        status: 'scheduled',
      },
    ],
  }),
  intermediate: createWeeklyCoachPlan({
    weekKey: 'preset',
    level: 'intermediate',
    targetDistanceKm: 25,
    items: [
      {
        id: 'intermediate-tuesday',
        dayLabel: '화요일',
        distanceKm: 6,
        title: '템포 러닝',
        description:
          '일정한 템포로 페이스 향상',
        status: 'scheduled',
      },
      {
        id: 'intermediate-thursday',
        dayLabel: '목요일',
        distanceKm: 7,
        title: '인터벌 러닝',
        description:
          '빠른 구간과 회복 구간 반복',
        status: 'scheduled',
      },
      {
        id: 'intermediate-sunday',
        dayLabel: '일요일',
        distanceKm: 12,
        title: '장거리 러닝',
        description:
          '지구력 향상 장거리 훈련',
        status: 'scheduled',
      },
    ],
  }),
  advanced: createWeeklyCoachPlan({
    weekKey: 'preset',
    level: 'advanced',
    targetDistanceKm: 40,
    items: [
      {
        id: 'advanced-tuesday',
        dayLabel: '화요일',
        distanceKm: 10,
        title: '인터벌 러닝',
        description:
          '고강도 구간 반복 훈련',
        status: 'scheduled',
      },
      {
        id: 'advanced-thursday',
        dayLabel: '목요일',
        distanceKm: 12,
        title: '템포 러닝',
        description:
          '목표 페이스 유지 훈련',
        status: 'scheduled',
      },
      {
        id: 'advanced-sunday',
        dayLabel: '일요일',
        distanceKm: 18,
        title: '장거리 러닝',
        description:
          '기록 향상을 위한 장거리 훈련',
        status: 'scheduled',
      },
    ],
  }),
} satisfies Record<
  CoachLevel,
  WeeklyCoachPlan
>;
