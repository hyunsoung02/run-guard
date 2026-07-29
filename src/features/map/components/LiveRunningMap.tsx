import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Camera,
  Map,
  UserLocation,
} from '@maplibre/maplibre-react-native';

import type {
  CameraRef,
  InitialViewState,
  LngLatBounds,
  ViewPadding,
} from '@maplibre/maplibre-react-native';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  LngLat,
  RunningRoute,
} from '../data/runningRoute';

import type {
  RouteWarningPoint,
} from '../../../services/safety/routeSafetyService';

import type {
  KeywordPlace,
} from '../../running/data/runningStartOptions';
import type {
  LocationStatus,
} from '../../../stores/useLocationStore';

import {
  RunningRouteLayer,
} from './RunningRouteLayer';

import {
  RunningKeywordMarkers,
} from './RunningKeywordMarkers';

import {
  AccidentZoneLayer,
} from './AccidentZoneLayer';

type LiveRunningMapProps = {
  route: RunningRoute | null;
  showRoute?: boolean;
  targetDistanceKm: number;
  centerCoordinate?: LngLat;
  locationIsLoading: boolean;
  locationStatus: LocationStatus;
  warningPoints?: readonly RouteWarningPoint[];
  keywordPlaces?: KeywordPlace[];
  onSelectKeywordPlace: (
    place: KeywordPlace,
  ) => void;
};

const MAP_STYLE_URL =
  'https://tiles.openfreemap.org/styles/positron';

const ROUTE_CAMERA_PADDING: ViewPadding = {
  top: 150,
  right: 50,
  bottom: 230,
  left: 50,
};

const ROUTE_CAMERA_DURATION_MS = 650;

type RouteCameraTarget = {
  bounds: LngLatBounds;
  key: string;
};

function getInitialZoom(
  targetDistanceKm: number,
): number {
  if (targetDistanceKm <= 5) {
    return 14.3;
  }

  if (targetDistanceKm <= 7) {
    return 13.8;
  }

  return 13.3;
}

/**
 * bounds를 사용할 수 없는 코스의
 * 기존 카메라 중앙 좌표를 계산합니다.
 */
function getRouteCenter(
  coordinates: LngLat[],
): LngLat | null {
  if (coordinates.length === 0) {
    return null;
  }

  const total = coordinates.reduce(
    (result, coordinate) => {
      return {
        longitude:
          result.longitude +
          coordinate[0],
        latitude:
          result.latitude +
          coordinate[1],
      };
    },
    {
      longitude: 0,
      latitude: 0,
    },
  );

  return [
    total.longitude /
      coordinates.length,
    total.latitude /
      coordinates.length,
  ];
}

function getRouteCameraTarget(
  routeId: string,
  coordinates: LngLat[],
  keywordPlaces: KeywordPlace[],
): RouteCameraTarget | null {
  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2
  ) {
    return null;
  }

  let minLongitude = Infinity;
  let maxLongitude = -Infinity;
  let minLatitude = Infinity;
  let maxLatitude = -Infinity;

  for (const coordinate of coordinates) {
    if (
      !Array.isArray(coordinate) ||
      coordinate.length < 2
    ) {
      return null;
    }

    const [
      longitude,
      latitude,
    ] = coordinate;

    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return null;
    }

    minLongitude = Math.min(
      minLongitude,
      longitude,
    );
    maxLongitude = Math.max(
      maxLongitude,
      longitude,
    );
    minLatitude = Math.min(
      minLatitude,
      latitude,
    );
    maxLatitude = Math.max(
      maxLatitude,
      latitude,
    );
  }

  if (
    minLongitude === maxLongitude &&
    minLatitude === maxLatitude
  ) {
    return null;
  }

  const keywordCoordinates: LngLat[] =
    [];

  for (const place of keywordPlaces) {
    const {
      longitude,
      latitude,
    } = place;

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180 ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      continue;
    }

    keywordCoordinates.push([
      longitude,
      latitude,
    ]);
    minLongitude = Math.min(
      minLongitude,
      longitude,
    );
    maxLongitude = Math.max(
      maxLongitude,
      longitude,
    );
    minLatitude = Math.min(
      minLatitude,
      latitude,
    );
    maxLatitude = Math.max(
      maxLatitude,
      latitude,
    );
  }

  return {
    bounds: [
      minLongitude,
      minLatitude,
      maxLongitude,
      maxLatitude,
    ],
    key: JSON.stringify([
      routeId,
      coordinates,
      keywordCoordinates,
    ]),
  };
}

export function LiveRunningMap({
  route,
  showRoute = true,
  targetDistanceKm,
  centerCoordinate,
  locationIsLoading,
  locationStatus,
  warningPoints = [],
  keywordPlaces = [],
  onSelectKeywordPlace,
}: LiveRunningMapProps) {
  const cameraRef =
    useRef<CameraRef>(null);

  const componentIsMountedRef =
    useRef(true);

  const lastFittedRouteKeyRef =
    useRef<string | null>(null);

  const [
    mapLoadFailed,
    setMapLoadFailed,
  ] = useState(false);

  const [
    mapIsReady,
    setMapIsReady,
  ] = useState(false);

  /**
   * 유효한 전체 경로와 추천 장소의
   * bounds 및 변경 key를 계산합니다.
   */
  const routeCameraTarget = useMemo(
    () =>
      showRoute && route
        ? getRouteCameraTarget(
            route.id,
            route.coordinates,
            keywordPlaces,
          )
        : null,
    [
      keywordPlaces,
      route,
      showRoute,
    ],
  );

  const routeCenter = useMemo(
    () =>
      route
        ? getRouteCenter(
            route.coordinates,
          )
        : null,
    [route],
  );

  const cameraCenterLongitude =
    centerCoordinate?.[0] ??
    routeCenter?.[0];

  const cameraCenterLatitude =
    centerCoordinate?.[1] ??
    routeCenter?.[1];

  const fallbackCameraCenter =
    useMemo<LngLat | null>(
      () =>
        cameraCenterLongitude !==
          undefined &&
        cameraCenterLatitude !==
          undefined
          ? [
              cameraCenterLongitude,
              cameraCenterLatitude,
            ]
          : null,
      [
        cameraCenterLatitude,
        cameraCenterLongitude,
      ],
    );

  const initialZoom = getInitialZoom(
    targetDistanceKm,
  );

  const initialViewState =
    useMemo<
      InitialViewState | undefined
    >(
      () =>
        fallbackCameraCenter
          ? {
              center:
                fallbackCameraCenter,
              zoom: initialZoom,
            }
          : undefined,
      [
        fallbackCameraCenter,
        initialZoom,
      ],
    );

  useEffect(() => {
    componentIsMountedRef.current =
      true;

    return () => {
      componentIsMountedRef.current =
        false;
    };
  }, []);

  useEffect(() => {
    if (!routeCameraTarget) {
      lastFittedRouteKeyRef.current =
        null;
      return;
    }

    if (
      !mapIsReady ||
      lastFittedRouteKeyRef.current ===
        routeCameraTarget.key
    ) {
      return;
    }

    const animationFrameId =
      requestAnimationFrame(() => {
        if (
          !componentIsMountedRef.current ||
          lastFittedRouteKeyRef.current ===
            routeCameraTarget.key
        ) {
          return;
        }

        const camera =
          cameraRef.current;

        if (!camera) {
          return;
        }

        camera.fitBounds(
          routeCameraTarget.bounds,
          {
            padding:
              ROUTE_CAMERA_PADDING,
            duration:
              ROUTE_CAMERA_DURATION_MS,
            easing: 'ease',
          },
        );

        lastFittedRouteKeyRef.current =
          routeCameraTarget.key;
      });

    return () => {
      cancelAnimationFrame(
        animationFrameId,
      );
    };
  }, [
    mapIsReady,
    routeCameraTarget,
  ]);

  return (
    <View style={styles.container}>
      {initialViewState &&
        fallbackCameraCenter && (
        <Map
        androidView="texture"
        attribution
        attributionPosition={{
          right: 8,
          bottom: 252,
        }}
        compass={false}
        dragPan={true}
        logo={false}
        mapStyle={MAP_STYLE_URL}
        onDidFailLoadingMap={() => {
          lastFittedRouteKeyRef.current =
            null;

          if (
            componentIsMountedRef.current
          ) {
            setMapIsReady(false);
            setMapLoadFailed(true);
          }
        }}
        onDidFinishLoadingMap={() => {
          if (
            componentIsMountedRef.current
          ) {
            setMapIsReady(true);
            setMapLoadFailed(false);
          }
        }}
        onWillStartLoadingMap={() => {
          lastFittedRouteKeyRef.current =
            null;

          if (
            componentIsMountedRef.current
          ) {
            setMapIsReady(false);
          }
        }}
        preferredFramesPerSecond={60}
        scaleBar={false}
        style={styles.map}
        touchPitch={false}
        touchRotate={false}
        touchZoom={true}
      >
        <Camera
          ref={cameraRef}
          initialViewState={
            initialViewState
          }
          {...(routeCameraTarget
            ? {}
            : {
                center:
                  fallbackCameraCenter,
                duration: 800,
                zoom: initialZoom,
              })}
        />

        {showRoute && route && (
          <RunningRouteLayer
            route={route}
          />
        )}

        <RunningKeywordMarkers
          places={keywordPlaces}
          onSelectPlace={
            onSelectKeywordPlace
          }
        />

        <AccidentZoneLayer
          warningPoints={
            warningPoints
          }
        />

        {locationStatus ===
          'ready' && (
          <UserLocation
            accuracy
            animated
            heading
            minDisplacement={2}
          />
        )}
        </Map>
      )}

      {locationIsLoading && (
        <View
          pointerEvents="none"
          style={
            styles.loadingBadge
          }
        >
          <ActivityIndicator
            color="#7EAC00"
            size="small"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            현재 위치 확인 중
          </Text>
        </View>
      )}

      {mapLoadFailed && (
        <View
          pointerEvents="none"
          style={styles.errorBadge}
        >
          <Text
            style={styles.errorText}
          >
            지도 데이터를 불러오지
            못했습니다.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFill,
      backgroundColor: '#F3F3F3',
    },

    map: {
      ...StyleSheet.absoluteFill,
    },

    loadingBadge: {
      position: 'absolute',
      top: 188,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 18,
      backgroundColor:
        'rgba(255,255,255,0.9)',
    },

    loadingText: {
      color: '#4E6A01',
      fontSize: 13,
      fontWeight: '500',
    },

    errorBadge: {
      position: 'absolute',
      top: 188,
      right: 30,
      left: 30,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 16,
      backgroundColor:
        'rgba(255,255,255,0.94)',
    },

    errorText: {
      color: '#111111',
      fontSize: 13,
      fontWeight: '500',
      textAlign: 'center',
    },
  });
