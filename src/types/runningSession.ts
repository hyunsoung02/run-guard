import type {
  LocationPoint,
} from './location';
import type {
  LngLat,
} from '../features/map/data/runningRoute';

export type RunningSessionStatus =
  | 'idle'
  | 'ready'
  | 'running'
  | 'paused'
  | 'completed';

export type RunningSession = {
  id: string;
  status: RunningSessionStatus;

  targetDistanceM: number;
  distanceM: number;
  elapsedSeconds: number;

  startedAtMs: number | null;
  endedAtMs: number | null;
  pausedAtMs: number | null;
  pausedDurationMs: number;

  currentHeartRateBpm: number | null;

  plannedRoute: LngLat[];
  actualRoute: LocationPoint[];
};
