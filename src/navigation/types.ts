import type {
  LoadingMode,
} from '../features/loading/data/loadingPresets';
import type {
  LngLat,
} from '../features/map/data/runningRoute';
import type {
  NavigationStep,
} from '../features/running/types/voiceGuide.types';
import type {
  RouteWarningPoint,
} from '../services/safety/routeSafetyService';

export type SearchPlace = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type TargetDistanceKm =
  | 5
  | 7
  | 10;

export type SelectedRunningCourseOptions = {
  startPlace: SearchPlace;
  targetDistanceKm: TargetDistanceKm;
};

export type RunningCourseGenerationStatus =
  | 'fallback-route';

export type RunningSplitPayload = {
  distanceKm: number;
  durationSeconds: number;
  isPartial: boolean;
  pace: string;
  change: string | null;
  changeType:
    | 'faster'
    | 'slower'
    | null;
};

export type RunningRecordPayload = {
  date: string;
  timeRange: string;
  distanceKm: number;
  averagePace: string;
  durationSeconds: number;
  heartRate: number | null;
  elevationM: number | null;
  cadenceSpm: number | null;
  splits: RunningSplitPayload[];
  plannedRouteCoordinates: LngLat[];
  actualRouteCoordinates: LngLat[];
  routeCoordinates: LngLat[];
};

export type RootStackParamList = {
  Splash: undefined;

  Main: undefined;

  Coach: undefined;

  Menu: undefined;

  AiCoachBadge: undefined;

  RunningProfile: undefined;

  RunningGoal: undefined;

  VoiceGuide: undefined;

  Loading:
    | {
        mode?: Exclude<
          LoadingMode,
          'locationCourse'
        >;
        subjectName?: string;
      }
    | ({
        mode: 'locationCourse';
      } & SelectedRunningCourseOptions)
    | undefined;

  RunningStart:
    | SelectedRunningCourseOptions
    | undefined;

  LocationSearch: undefined;

  LocationDistance: {
    startPlace: SearchPlace;
  };

  RunningActive:
    | {
        routeId: string;
        routeCoordinates: LngLat[];
        navigationSteps: NavigationStep[];
        warningPoints: RouteWarningPoint[];
        targetDistanceM: number;
        plannedDistanceM: number;
        safetyStatus:
          | 'available'
          | 'unavailable';
        safetyScore: number | null;
        startCoordinate: LngLat;
        generatedAtMs: number;
      }
    | undefined;

  RunningGoalComplete: {
    recordId: string;
  };

  RunningRecordSummary: {
    recordId?: string;
    record?: RunningRecordPayload;
  };
};
