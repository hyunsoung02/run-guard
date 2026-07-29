import type {
  LocationPoint,
} from './location';
import type {
  LngLat,
} from '../features/map/data/runningRoute';

export type RunningRecord = {
  id: string;
  createdAtMs: number;

  startedAtMs: number;
  endedAtMs: number;

  targetDistanceM: number;
  distanceM: number;
  durationSeconds: number;

  averagePaceSecondsPerKm:
    | number
    | null;
  averageHeartRateBpm:
    | number
    | null;

  caloriesKcal: number | null;
  elevationGainM: number | null;
  cadenceSpm: number | null;

  completedTarget: boolean;
  plannedRoute?: LngLat[];
  actualRoute?: LocationPoint[];
  /** 이전 저장 데이터 역직렬화를 위한 legacy 필드입니다. */
  routePoints?: LocationPoint[];
};
