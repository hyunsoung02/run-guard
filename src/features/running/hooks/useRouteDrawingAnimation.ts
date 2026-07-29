import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  LngLat,
} from '../../map/data/runningRoute';

type UseRouteDrawingAnimationOptions = {
  coordinates: readonly LngLat[];
  durationMs?: number;
  enabled?: boolean;
};

export function useRouteDrawingAnimation({
  coordinates,
  durationMs = 2400,
  enabled = true,
}: UseRouteDrawingAnimationOptions) {
  const [visiblePointCount, setVisiblePointCount] =
    useState(enabled ? 1 : coordinates.length);

  useEffect(() => {
    if (!enabled || coordinates.length <= 1) {
      setVisiblePointCount(coordinates.length);
      return;
    }

    setVisiblePointCount(1);

    const startTime = Date.now();
    let animationFrameId = 0;

    function drawNextFrame() {
      const elapsedMs = Date.now() - startTime;

      const progress = Math.min(
        elapsedMs / durationMs,
        1,
      );

      /**
       * easeOutCubic
       *
       * 시작은 빠르고 도착점에 가까워질수록
       * 자연스럽게 느려지는 애니메이션이다.
       */
      const easedProgress =
        1 - Math.pow(1 - progress, 3);

      const nextPointCount = Math.max(
        2,
        Math.ceil(
          easedProgress *
            coordinates.length,
        ),
      );

      setVisiblePointCount(
        Math.min(
          nextPointCount,
          coordinates.length,
        ),
      );

      if (progress < 1) {
        animationFrameId =
          requestAnimationFrame(
            drawNextFrame,
          );
      }
    }

    animationFrameId =
      requestAnimationFrame(
        drawNextFrame,
      );

    return () => {
      cancelAnimationFrame(
        animationFrameId,
      );
    };
  }, [
    coordinates,
    durationMs,
    enabled,
  ]);

  return useMemo(
    () =>
      coordinates.slice(
        0,
        visiblePointCount,
      ),
    [
      coordinates,
      visiblePointCount,
    ],
  );
}
