export type VoiceGuideCategory =
  | 'session'
  | 'navigation'
  | 'safety'
  | 'distance'
  | 'goal';

export type VoiceGuidePriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'critical';

export type VoiceGuideRequest = {
  id: string;
  category: VoiceGuideCategory;
  message: string;
  priority: VoiceGuidePriority;
  createdAtMs: number;
};

export type NavigationManeuver =
  | 'straight'
  | 'left'
  | 'right'
  | 'slight-left'
  | 'slight-right'
  | 'sharp-left'
  | 'sharp-right'
  | 'u-turn'
  | 'arrive'
  | 'unknown';

export type NavigationDistanceStage =
  | 'early'
  | 'near';

export type NavigationStep = {
  id: string;
  instruction: string;
  maneuver: NavigationManeuver;
  distanceM: number;
  wayPoints: [
    startIndex: number,
    endIndex: number,
  ];
  coordinate: {
    latitude: number;
    longitude: number;
  };
};
