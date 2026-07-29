import type {
  SettingsMenuSectionData,
} from '../types/settingsMenu';

export const SETTINGS_MENU_SECTIONS:
  SettingsMenuSectionData[] = [
    {
      id: 'running',
      title: '러닝 설정',
      items: [
        {
          id: 'running-profile',
          label: '러닝 프로필',
          action: 'runningProfile',
        },
        {
          id: 'running-goal',
          label: '러닝 목표',
          action: 'runningGoal',
        },
        {
          id: 'coach-badge',
          label: '러닝 코치 배지',
          action: 'coachBadge',
        },
        {
          id: 'voice-guidance',
          label: '음성 안내',
          action: 'voiceGuide',
        },
      ],
    },
    {
      id: 'app',
      title: '앱 정보',
      items: [
        {
          id: 'usage-data',
          label: '활용 데이터',
          action: 'usedData',
        },
        {
          id: 'licenses',
          label: '앱 정보 및 라이선스',
          action: 'appInfo',
        },
      ],
    },
  ];
