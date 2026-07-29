import type {
  NavigationStep,
} from '../../running/types/voiceGuide.types';

export type LngLat = [
  longitude: number,
  latitude: number,
];

export type RouteKeyword =
  | '안전'
  | '기록'
  | '공원'
  | '야경'
  | '카페';

export type RunningRouteSource =
  | 'fixture'
  | 'ors'
  | 'recorded';

export type RunningRouteShape =
  | 'out-and-back'
  | 'loop';

export type RunningRoute = {
  id: string;
  keyword: RouteKeyword;
  source: RunningRouteSource;
  shape?: RunningRouteShape;
  coordinates: LngLat[];
  navigationSteps: NavigationStep[];
  turnaroundPoint?: LngLat;
  cautionPoints: LngLat[];
  generatedAtMs: number;
};
