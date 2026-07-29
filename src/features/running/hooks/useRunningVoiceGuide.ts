import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AppState,
} from 'react-native';
import type {
  AppStateStatus,
} from 'react-native';

import type {
  RouteWarningPoint,
} from '../../../services/safety/routeSafetyService';
import {
  getDistanceBetweenCoordinatesM,
} from '../../../services/safety/routeSafetyService';
import type {
  LocationPoint,
  RunningSessionStatus,
} from '../../../types';
import {
  createDistanceMessage,
  createNavigationMessage,
  resetVoiceGuideSession,
  setVoiceGuideEnabled,
  speakVoiceGuide,
  stopVoiceGuide,
} from '../services/runningVoiceGuide';
import type {
  NavigationDistanceStage,
  NavigationStep,
  VoiceGuideCategory,
  VoiceGuidePriority,
} from '../types/voiceGuide.types';

const NAVIGATION_PREVIEW_DISTANCE_M =
  300;
const NAVIGATION_PREVIEW_RANGE_MIN_M =
  250;
const NAVIGATION_PREVIEW_RANGE_MAX_M =
  350;
const NAVIGATION_NEAR_DISTANCE_M = 80;
const ARRIVAL_ANNOUNCEMENT_DISTANCE_M =
  25;
const WARNING_APPROACH_RADIUS_M = 100;
export const MAX_VOICE_GUIDANCE_ACCURACY_M =
  50;

export type UseRunningVoiceGuideParams = {
  sessionId: string | null;
  routeId: string | null;
  status: RunningSessionStatus;
  distanceM: number;
  remainingDistanceM: number;
  targetDistanceM: number;
  currentLocation: LocationPoint | null;
  locationAccuracyM?: number | null;
  currentNavigationStep?: NavigationStep | null;
  navigationDistanceM?: number | null;
  warningPoints?: readonly RouteWarningPoint[];
  voiceGuidanceEnabled: boolean;
  voiceGuidanceReady?: boolean;
  turnGuidanceEnabled?: boolean;
  remainingDistanceEnabled?: boolean;
};

export type UseRunningVoiceGuideResult = {
  announceSessionFinish: () => void;
};

type PreviousNavigationState = {
  stepId: string;
  distanceM: number;
};

function isAccuracyAcceptable(
  accuracyM:
    | number
    | null
    | undefined,
): boolean {
  return (
    accuracyM !== null &&
    accuracyM !== undefined &&
    Number.isFinite(accuracyM) &&
    accuracyM >= 0 &&
    accuracyM <=
      MAX_VOICE_GUIDANCE_ACCURACY_M
  );
}

function requestVoiceGuide({
  id,
  category,
  message,
  priority,
}: {
  id: string;
  category: VoiceGuideCategory;
  message: string;
  priority: VoiceGuidePriority;
}) {
  void speakVoiceGuide({
    id,
    category,
    message,
    priority,
    createdAtMs: Date.now(),
  });
}

function getNavigationGuideId(
  routeId: string,
  stepId: string,
  stage: NavigationDistanceStage,
): string {
  return `turn:${routeId}:${stepId}:${stage}`;
}

export function useRunningVoiceGuide({
  sessionId,
  routeId,
  status,
  distanceM,
  remainingDistanceM,
  targetDistanceM,
  currentLocation,
  locationAccuracyM,
  currentNavigationStep = null,
  navigationDistanceM = null,
  warningPoints = [],
  voiceGuidanceEnabled,
  voiceGuidanceReady = true,
  turnGuidanceEnabled = true,
  remainingDistanceEnabled = true,
}: UseRunningVoiceGuideParams): UseRunningVoiceGuideResult {
  const [appState, setAppState] =
    useState<AppStateStatus>(
      AppState.currentState,
    );
  const previousStatusRef =
    useRef<
      RunningSessionStatus | null
    >(null);
  const previousNavigationRef =
    useRef<PreviousNavigationState | null>(
      null,
    );
  const handledNavigationIdsRef =
    useRef(new Set<string>());
  const announcedWarningIdsRef =
    useRef(new Set<string>());
  const highestObservedKmRef =
    useRef(0);
  const previousRemainingDistanceRef =
    useRef(remainingDistanceM);
  const pauseCountRef = useRef(0);
  const resumeCountRef = useRef(0);
  const preserveSpeechOnUnmountRef =
    useRef(false);

  const appIsActive =
    appState === 'active';

  useEffect(() => {
    const subscription =
      AppState.addEventListener(
        'change',
        setAppState,
      );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    setVoiceGuideEnabled(
      voiceGuidanceReady &&
        voiceGuidanceEnabled,
    );
  }, [
    voiceGuidanceEnabled,
    voiceGuidanceReady,
  ]);

  useEffect(() => {
    resetVoiceGuideSession(sessionId);

    previousStatusRef.current = null;
    previousNavigationRef.current =
      null;
    handledNavigationIdsRef.current =
      new Set();
    announcedWarningIdsRef.current =
      new Set();
    highestObservedKmRef.current =
      Math.floor(
        Math.max(distanceM, 0) /
          1_000,
      );
    previousRemainingDistanceRef.current =
      remainingDistanceM;
    pauseCountRef.current = 0;
    resumeCountRef.current = 0;
    preserveSpeechOnUnmountRef.current =
      false;
  }, [sessionId]);

  useEffect(() => {
    if (
      !sessionId ||
      !voiceGuidanceReady
    ) {
      return;
    }

    const previousStatus =
      previousStatusRef.current;

    previousStatusRef.current = status;

    if (
      !voiceGuidanceEnabled ||
      !appIsActive
    ) {
      return;
    }

    if (
      status === 'running' &&
      (previousStatus === null ||
        previousStatus === 'ready' ||
        previousStatus === 'idle')
    ) {
      requestVoiceGuide({
        id: 'session-start',
        category: 'session',
        message:
          '러닝을 시작합니다.',
        priority: 'high',
      });
      return;
    }

    if (
      previousStatus === 'running' &&
      status === 'paused'
    ) {
      pauseCountRef.current += 1;
      requestVoiceGuide({
        id: `session-pause-${pauseCountRef.current}`,
        category: 'session',
        message:
          '러닝을 일시정지했습니다.',
        priority: 'high',
      });
      return;
    }

    if (
      previousStatus === 'paused' &&
      status === 'running'
    ) {
      resumeCountRef.current += 1;
      requestVoiceGuide({
        id: `session-resume-${resumeCountRef.current}`,
        category: 'session',
        message:
          '러닝을 다시 시작합니다.',
        priority: 'high',
      });
    }
  }, [
    appIsActive,
    sessionId,
    status,
    voiceGuidanceEnabled,
    voiceGuidanceReady,
  ]);

  useEffect(() => {
    const step =
      currentNavigationStep;

    if (
      !step ||
      !routeId ||
      navigationDistanceM === null
    ) {
      previousNavigationRef.current =
        null;
      return;
    }

    const previous =
      previousNavigationRef.current;
    const nearDistanceM =
      step.maneuver === 'arrive'
        ? ARRIVAL_ANNOUNCEMENT_DISTANCE_M
        : NAVIGATION_NEAR_DISTANCE_M;
    const previewId =
      getNavigationGuideId(
        routeId,
        step.id,
        'early',
      );
    const nearId =
      getNavigationGuideId(
        routeId,
        step.id,
        'near',
      );
    const hasGoodAccuracy =
      isAccuracyAcceptable(
        locationAccuracyM,
      );
    const canAnnounce =
      appIsActive &&
      status === 'running' &&
      voiceGuidanceEnabled &&
      turnGuidanceEnabled;

    if (!canAnnounce) {
      if (
        navigationDistanceM <=
        nearDistanceM
      ) {
        handledNavigationIdsRef.current.add(
          previewId,
        );
        handledNavigationIdsRef.current.add(
          nearId,
        );
      } else if (
        navigationDistanceM <=
        NAVIGATION_PREVIEW_DISTANCE_M
      ) {
        handledNavigationIdsRef.current.add(
          previewId,
        );
      }

      previousNavigationRef.current = {
        stepId: step.id,
        distanceM:
          navigationDistanceM,
      };
      return;
    }

    const stepChanged =
      previous?.stepId !== step.id;
    const crossedNearThreshold =
      !stepChanged &&
      previous.distanceM >
        nearDistanceM &&
      navigationDistanceM <=
        nearDistanceM;
    const enteredNearRange =
      stepChanged &&
      navigationDistanceM <=
        nearDistanceM;
    const crossedPreviewThreshold =
      !stepChanged &&
      previous.distanceM >
        NAVIGATION_PREVIEW_DISTANCE_M &&
      navigationDistanceM <=
        NAVIGATION_PREVIEW_DISTANCE_M;
    const enteredPreviewRange =
      navigationDistanceM >=
        NAVIGATION_PREVIEW_RANGE_MIN_M &&
      navigationDistanceM <=
        NAVIGATION_PREVIEW_RANGE_MAX_M;

    if (
      hasGoodAccuracy &&
      (crossedNearThreshold ||
        enteredNearRange ||
        navigationDistanceM <=
          nearDistanceM) &&
      !handledNavigationIdsRef.current.has(
        nearId,
      )
    ) {
      handledNavigationIdsRef.current.add(
        previewId,
      );
      handledNavigationIdsRef.current.add(
        nearId,
      );
      requestVoiceGuide({
        id: nearId,
        category: 'navigation',
        message:
          createNavigationMessage(
            step.maneuver,
            'near',
          ),
        priority: 'high',
      });
    } else if (
      step.maneuver !== 'arrive' &&
      (crossedPreviewThreshold ||
        enteredPreviewRange) &&
      !handledNavigationIdsRef.current.has(
        previewId,
      )
    ) {
      handledNavigationIdsRef.current.add(
        previewId,
      );
      requestVoiceGuide({
        id: previewId,
        category: 'navigation',
        message:
          createNavigationMessage(
            step.maneuver,
            'early',
          ),
        priority: 'normal',
      });
    }

    previousNavigationRef.current = {
      stepId: step.id,
      distanceM:
        navigationDistanceM,
    };
  }, [
    appIsActive,
    currentNavigationStep,
    locationAccuracyM,
    navigationDistanceM,
    routeId,
    status,
    turnGuidanceEnabled,
    voiceGuidanceEnabled,
  ]);

  useEffect(() => {
    if (!currentLocation) {
      return;
    }

    const nearbyWarningPoints =
      warningPoints
        .map((warningPoint) => ({
          warningPoint,
          distanceM:
            getDistanceBetweenCoordinatesM(
              [
                currentLocation.longitude,
                currentLocation.latitude,
              ],
              warningPoint.coordinate,
            ),
        }))
        .filter(
          ({ distanceM: warningDistanceM }) =>
            warningDistanceM <=
            WARNING_APPROACH_RADIUS_M,
        )
        .sort(
          (first, second) =>
            first.distanceM -
            second.distanceM,
        );

    if (
      nearbyWarningPoints.length === 0
    ) {
      return;
    }

    if (
      !appIsActive ||
      status !== 'running' ||
      !voiceGuidanceEnabled
    ) {
      nearbyWarningPoints.forEach(
        ({ warningPoint }) => {
          announcedWarningIdsRef.current.add(
            warningPoint.id,
          );
        },
      );
      return;
    }

    if (
      !isAccuracyAcceptable(
        locationAccuracyM,
      )
    ) {
      return;
    }

    const nearestUnannounced =
      nearbyWarningPoints.find(
        ({ warningPoint }) =>
          !announcedWarningIdsRef.current.has(
            warningPoint.id,
          ),
      );

    if (!nearestUnannounced) {
      return;
    }

    nearbyWarningPoints.forEach(
      ({ warningPoint }) => {
        announcedWarningIdsRef.current.add(
          warningPoint.id,
        );
      },
    );

    requestVoiceGuide({
      id: `safety-${nearestUnannounced.warningPoint.id}`,
      category: 'safety',
      message:
        '전방에 사고 이력 기반 주의 지점이 있습니다.',
      priority: 'critical',
    });
  }, [
    appIsActive,
    currentLocation,
    locationAccuracyM,
    status,
    voiceGuidanceEnabled,
    warningPoints,
  ]);

  useEffect(() => {
    const completedKm = Math.floor(
      Math.max(distanceM, 0) /
        1_000,
    );
    const previousHighestKm =
      highestObservedKmRef.current;

    highestObservedKmRef.current =
      Math.max(
        previousHighestKm,
        completedKm,
      );

    if (
      completedKm <=
        previousHighestKm ||
      completedKm <= 0 ||
      distanceM >= targetDistanceM ||
      !appIsActive ||
      status !== 'running' ||
      !voiceGuidanceEnabled ||
      !remainingDistanceEnabled
    ) {
      return;
    }

    requestVoiceGuide({
      id: `distance-${completedKm}`,
      category: 'distance',
      message:
        createDistanceMessage(
          completedKm,
        ),
      priority: 'normal',
    });
  }, [
    appIsActive,
    distanceM,
    remainingDistanceEnabled,
    status,
    targetDistanceM,
    voiceGuidanceEnabled,
  ]);

  useEffect(() => {
    const previousRemainingDistanceM =
      previousRemainingDistanceRef.current;

    previousRemainingDistanceRef.current =
      remainingDistanceM;

    if (
      targetDistanceM <= 0 ||
      !appIsActive ||
      status !== 'running' ||
      !voiceGuidanceEnabled
    ) {
      return;
    }

    if (distanceM >= targetDistanceM) {
      preserveSpeechOnUnmountRef.current =
        true;
      requestVoiceGuide({
        id: 'goal-complete',
        category: 'goal',
        message:
          '목표 거리를 달성했습니다. 수고하셨습니다.',
        priority: 'critical',
      });
      return;
    }

    if (
      !remainingDistanceEnabled
    ) {
      return;
    }

    if (
      previousRemainingDistanceM >
        100 &&
      remainingDistanceM <= 100
    ) {
      requestVoiceGuide({
        id: 'goal-near-100',
        category: 'goal',
        message:
          '목표까지 100미터 남았습니다.',
        priority: 'high',
      });
      return;
    }

    if (
      previousRemainingDistanceM >
        500 &&
      remainingDistanceM <= 500
    ) {
      requestVoiceGuide({
        id: 'goal-near-500',
        category: 'goal',
        message:
          '목표까지 500미터 남았습니다.',
        priority: 'normal',
      });
    }
  }, [
    appIsActive,
    distanceM,
    remainingDistanceEnabled,
    remainingDistanceM,
    status,
    targetDistanceM,
    voiceGuidanceEnabled,
  ]);

  const announceSessionFinish =
    useCallback(() => {
      if (
        !sessionId ||
        !voiceGuidanceEnabled ||
        !appIsActive
      ) {
        return;
      }

      preserveSpeechOnUnmountRef.current =
        true;
      requestVoiceGuide({
        id: 'session-finish',
        category: 'session',
        message:
          '러닝을 종료합니다.',
        priority: 'critical',
      });
    }, [
      appIsActive,
      sessionId,
      voiceGuidanceEnabled,
    ]);

  useEffect(
    () => () => {
      if (
        !preserveSpeechOnUnmountRef.current
      ) {
        void stopVoiceGuide();
      }
    },
    [],
  );

  return {
    announceSessionFinish,
  };
}
