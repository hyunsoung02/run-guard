import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  getDistanceBetweenCoordinatesM,
  getDistanceFromPointToRouteM,
} from '../../../services/safety/routeSafetyService';
import type {
  LngLat,
} from '../../map/data/runningRoute';
import type {
  LocationPoint,
} from '../../../types';
import type {
  NavigationStep,
} from '../types/voiceGuide.types';

const MAX_PROGRESS_ACCURACY_M = 50;
const STEP_APPROACH_RADIUS_M = 25;
const STEP_IMMEDIATE_PASS_RADIUS_M = 8;
const STEP_DEPARTURE_DELTA_M = 8;
const NEXT_STEP_CLOSER_DELTA_M = 5;
const OFF_ROUTE_DISTANCE_M = 60;

type StepProgressTracker = {
  index: number;
  routeSegmentIndex: number;
  closestDistanceM: number;
  enteredApproachRadius: boolean;
};

export type NavigationProgress = {
  currentStep: NavigationStep | null;
  currentStepIndex: number;
  distanceToStepM: number | null;
  isOffRoute: boolean;
  hasArrived: boolean;
  isLocationAccuracyUsable: boolean;
};

const EMPTY_PROGRESS: NavigationProgress = {
  currentStep: null,
  currentStepIndex: 0,
  distanceToStepM: null,
  isOffRoute: false,
  hasArrived: false,
  isLocationAccuracyUsable: false,
};

function getStepDistanceM(
  location: LocationPoint,
  step: NavigationStep,
  routeCoordinates: readonly LngLat[],
  minimumSegmentIndex: number,
): number {
  const stepCoordinateIndex =
    Math.min(
      step.wayPoints[0],
      routeCoordinates.length - 1,
    );
  const nearest =
    findNearestRoutePosition(
      [
        location.longitude,
        location.latitude,
      ],
      routeCoordinates,
      minimumSegmentIndex,
      stepCoordinateIndex,
    );

  if (!nearest) {
    return getDistanceBetweenCoordinatesM(
      [
        location.longitude,
        location.latitude,
      ],
      [
        step.coordinate.longitude,
        step.coordinate.latitude,
      ],
    );
  }

  let distanceM =
    getDistanceBetweenCoordinatesM(
      nearest.coordinate,
      routeCoordinates[
        nearest.segmentIndex + 1
      ] ??
        routeCoordinates[
          nearest.segmentIndex
        ],
    );

  for (
    let index =
      nearest.segmentIndex + 1;
    index < stepCoordinateIndex;
    index += 1
  ) {
    distanceM +=
      getDistanceBetweenCoordinatesM(
        routeCoordinates[index],
        routeCoordinates[index + 1],
      );
  }

  return distanceM;
}

type NearestRoutePosition = {
  segmentIndex: number;
  coordinate: LngLat;
  distanceM: number;
};

function findNearestRoutePosition(
  point: LngLat,
  routeCoordinates: readonly LngLat[],
  minimumSegmentIndex: number,
  maximumCoordinateIndex: number,
): NearestRoutePosition | null {
  let nearest:
    NearestRoutePosition | null = null;
  const latitudeRadians =
    (point[1] * Math.PI) / 180;
  const metersPerLongitudeDegree =
    111_320 *
    Math.cos(latitudeRadians);
  const metersPerLatitudeDegree =
    110_540;
  const lastSegmentIndex = Math.min(
    routeCoordinates.length - 2,
    Math.max(
      minimumSegmentIndex,
      maximumCoordinateIndex - 1,
    ),
  );

  for (
    let index = Math.max(
      0,
      minimumSegmentIndex,
    );
    index <= lastSegmentIndex;
    index += 1
  ) {
    const start =
      routeCoordinates[index];
    const end =
      routeCoordinates[index + 1];
    const startX =
      (start[0] - point[0]) *
      metersPerLongitudeDegree;
    const startY =
      (start[1] - point[1]) *
      metersPerLatitudeDegree;
    const endX =
      (end[0] - point[0]) *
      metersPerLongitudeDegree;
    const endY =
      (end[1] - point[1]) *
      metersPerLatitudeDegree;
    const segmentX = endX - startX;
    const segmentY = endY - startY;
    const squaredLength =
      segmentX ** 2 + segmentY ** 2;
    const ratio =
      squaredLength > 0
        ? Math.min(
            1,
            Math.max(
              0,
              -(
                startX * segmentX +
                startY * segmentY
              ) / squaredLength,
            ),
          )
        : 0;
    const projectedX =
      startX + ratio * segmentX;
    const projectedY =
      startY + ratio * segmentY;
    const distanceM = Math.hypot(
      projectedX,
      projectedY,
    );

    if (
      nearest === null ||
      distanceM < nearest.distanceM
    ) {
      nearest = {
        segmentIndex: index,
        coordinate: [
          start[0] +
            (end[0] - start[0]) *
              ratio,
          start[1] +
            (end[1] - start[1]) *
              ratio,
        ],
        distanceM,
      };
    }
  }

  return nearest;
}

function getDistanceToRouteM(
  location: LocationPoint,
  routeCoordinates: readonly LngLat[],
): number {
  return getDistanceFromPointToRouteM(
    [
      location.longitude,
      location.latitude,
    ],
    routeCoordinates,
  );
}

export function useNavigationProgress({
  routeId,
  routeCoordinates,
  navigationSteps,
  currentLocation,
}: {
  routeId: string | undefined;
  routeCoordinates: readonly LngLat[];
  navigationSteps: readonly NavigationStep[];
  currentLocation: LocationPoint | null;
}): NavigationProgress {
  const trackerRef =
    useRef<StepProgressTracker>({
      index: 0,
      routeSegmentIndex: 0,
      closestDistanceM:
        Number.POSITIVE_INFINITY,
      enteredApproachRadius: false,
    });
  const [progress, setProgress] =
    useState<NavigationProgress>(
      EMPTY_PROGRESS,
    );

  useEffect(() => {
    trackerRef.current = {
      index: 0,
      routeSegmentIndex: 0,
      closestDistanceM:
        Number.POSITIVE_INFINITY,
      enteredApproachRadius: false,
    };
    setProgress({
      ...EMPTY_PROGRESS,
      currentStep:
        navigationSteps[0] ?? null,
    });
  }, [navigationSteps, routeId]);

  useEffect(() => {
    if (
      !currentLocation ||
      navigationSteps.length === 0
    ) {
      return;
    }

    const accuracyIsUsable =
      currentLocation.accuracyM !==
        null &&
      currentLocation.accuracyM <=
        MAX_PROGRESS_ACCURACY_M;
    const routeDistanceM =
      getDistanceToRouteM(
        currentLocation,
        routeCoordinates,
      );
    const tracker =
      trackerRef.current;
    let stepIndex = Math.min(
      tracker.index,
      navigationSteps.length - 1,
    );
    let step =
      navigationSteps[stepIndex];
    const nearestRoutePosition =
      findNearestRoutePosition(
        [
          currentLocation.longitude,
          currentLocation.latitude,
        ],
        routeCoordinates,
        tracker.routeSegmentIndex,
        step.wayPoints[0],
      );

    if (
      accuracyIsUsable &&
      nearestRoutePosition
    ) {
      tracker.routeSegmentIndex =
        Math.max(
          tracker.routeSegmentIndex,
          nearestRoutePosition
            .segmentIndex,
        );
    }
    let distanceToStepM =
      getStepDistanceM(
        currentLocation,
        step,
        routeCoordinates,
        tracker.routeSegmentIndex,
      );

    if (accuracyIsUsable) {
      tracker.closestDistanceM =
        Math.min(
          tracker.closestDistanceM,
          distanceToStepM,
        );

      if (
        distanceToStepM <=
        STEP_APPROACH_RADIUS_M
      ) {
        tracker.enteredApproachRadius =
          true;
      }

      const nextStep =
        navigationSteps[
          stepIndex + 1
        ];
      const nextStepDistanceM =
        nextStep
          ? getStepDistanceM(
              currentLocation,
              nextStep,
              routeCoordinates,
              tracker.routeSegmentIndex,
            )
          : Number.POSITIVE_INFINITY;
      const passedCurrentStep =
        tracker.enteredApproachRadius &&
        stepIndex <
          navigationSteps.length - 1 &&
        (distanceToStepM <=
          STEP_IMMEDIATE_PASS_RADIUS_M ||
          distanceToStepM >=
            tracker.closestDistanceM +
              STEP_DEPARTURE_DELTA_M ||
          nextStepDistanceM +
            NEXT_STEP_CLOSER_DELTA_M <
            distanceToStepM);

      if (passedCurrentStep) {
        stepIndex += 1;
        step =
          navigationSteps[stepIndex];
        distanceToStepM =
          getStepDistanceM(
            currentLocation,
            step,
            routeCoordinates,
            tracker.routeSegmentIndex,
          );
        tracker.index = stepIndex;
        tracker.closestDistanceM =
          distanceToStepM;
        tracker.enteredApproachRadius =
          distanceToStepM <=
          STEP_APPROACH_RADIUS_M;
      }
    }

    const hasArrived =
      stepIndex ===
        navigationSteps.length - 1 &&
      step.maneuver === 'arrive' &&
      accuracyIsUsable &&
      distanceToStepM <=
        STEP_APPROACH_RADIUS_M;

    setProgress({
      currentStep: step,
      currentStepIndex: stepIndex,
      distanceToStepM:
        Number.isFinite(
          distanceToStepM,
        )
          ? Math.max(
              0,
              Math.round(
                distanceToStepM,
              ),
            )
          : null,
      isOffRoute:
        accuracyIsUsable &&
        routeDistanceM >
          OFF_ROUTE_DISTANCE_M,
      hasArrived,
      isLocationAccuracyUsable:
        accuracyIsUsable,
    });
  }, [
    currentLocation,
    navigationSteps,
    routeCoordinates,
  ]);

  return progress;
}
