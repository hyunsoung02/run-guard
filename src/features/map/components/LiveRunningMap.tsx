import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Camera,
  Map,
  Marker,
} from '@maplibre/maplibre-react-native';

import type {
  CameraRef,
  InitialViewState,
  LngLatBounds,
  ViewPadding,
} from '@maplibre/maplibre-react-native';

import {
  ActivityIndicator,
  Image,
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
import type {
  LocationPoint,
} from '../../../types';
import type {
  NavigationManeuver,
} from '../../running/types/voiceGuide.types';

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
  /** RunningActive에서 현재 위치 버튼으로 카메라를 복귀시키는 신호. */
  navigationLocation?: LocationPoint | null;
  focusRequestKey?: number;
  /** 경로나 지정 출발지가 없는 최초 진입에서만 현재 위치를 표시합니다. */
  autoFocusInitialLocation?: boolean;
  /** 다음 실제 회전 지점의 안내 배지입니다. */
  nextTurnMarker?: NextTurnMarker | null;
  /** 사용자가 지도를 옮기기 전까지 현재 위치를 따라갑니다. */
  followNavigationLocation?: boolean;
  onUserMapInteraction?: () => void;
};

export type NextTurnMarker = {
  coordinate: LngLat;
  label: string;
  color: string;
  direction: NavigationManeuver;
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
const NAVIGATION_MARKER_ID =
  'running-navigation-location';
const NEXT_TURN_MARKER_ID =
  'running-next-turn';
const MINIMUM_DIRECTIONAL_SPEED_MPS =
  0.8;
const MINIMUM_BEARING_DISTANCE_M = 5;
const MAXIMUM_BEARING_DISTANCE_M = 25;
const BEARING_CHANGE_DEADBAND_DEG = 10;
const DIRECTION_ARROW_IMAGE = require(
  '../../../assets/icons/running/running-direction-arrow.png',
);

const TURN_ROTATION: Record<
  NavigationManeuver,
  number
> = {
  straight: 0,
  'slight-left': -45,
  left: -90,
  'sharp-left': -135,
  'slight-right': 45,
  right: 90,
  'sharp-right': 135,
  'u-turn': 180,
  arrive: 0,
  unknown: 0,
};

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

function isValidCoordinate(
  coordinate: unknown,
): coordinate is LngLat {
  if (
    !Array.isArray(coordinate) ||
    coordinate.length < 2
  ) {
    return false;
  }

  const [longitude, latitude] = coordinate;

  return (
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90
  );
}

function getNavigationCoordinate(
  location: LocationPoint,
): LngLat | null {
  const coordinate: LngLat = [
    location.longitude,
    location.latitude,
  ];

  return isValidCoordinate(coordinate)
    ? coordinate
    : null;
}

function normalizeBearing(
  bearingDeg: number,
): number | null {
  if (!Number.isFinite(bearingDeg)) {
    return null;
  }

  return (
    ((bearingDeg % 360) + 360) % 360
  );
}

function getReliableHeading(
  location: LocationPoint,
): number | null {
  const heading = location.headingDeg;
  const speed = location.speedMps;

  if (
    heading === null ||
    speed === null ||
    !Number.isFinite(heading) ||
    heading < 0 ||
    heading > 360 ||
    !Number.isFinite(speed) ||
    speed < MINIMUM_DIRECTIONAL_SPEED_MPS
  ) {
    return null;
  }

  return normalizeBearing(heading);
}

function getDistanceBetweenLocationsM(
  first: LocationPoint,
  second: LocationPoint,
): number {
  const earthRadiusM = 6_371_000;
  const latitudeDeltaRad =
    ((second.latitude - first.latitude) *
      Math.PI) /
    180;
  const longitudeDeltaRad =
    ((second.longitude - first.longitude) *
      Math.PI) /
    180;
  const firstLatitudeRad =
    (first.latitude * Math.PI) / 180;
  const secondLatitudeRad =
    (second.latitude * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDeltaRad / 2) ** 2 +
    Math.cos(firstLatitudeRad) *
      Math.cos(secondLatitudeRad) *
      Math.sin(longitudeDeltaRad / 2) ** 2;

  return (
    2 *
    earthRadiusM *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine),
    )
  );
}

function getBearingBetweenLocations(
  first: LocationPoint,
  second: LocationPoint,
): number | null {
  const longitudeDeltaRad =
    ((second.longitude - first.longitude) *
      Math.PI) /
    180;
  const firstLatitudeRad =
    (first.latitude * Math.PI) / 180;
  const secondLatitudeRad =
    (second.latitude * Math.PI) / 180;
  const horizontal =
    Math.sin(longitudeDeltaRad) *
    Math.cos(secondLatitudeRad);
  const vertical =
    Math.cos(firstLatitudeRad) *
      Math.sin(secondLatitudeRad) -
    Math.sin(firstLatitudeRad) *
      Math.cos(secondLatitudeRad) *
      Math.cos(longitudeDeltaRad);

  return normalizeBearing(
    (Math.atan2(horizontal, vertical) *
      180) /
      Math.PI,
  );
}

function getMovementBearing(
  previous: LocationPoint,
  current: LocationPoint,
): number | null {
  if (
    current.timestampMs <=
    previous.timestampMs
  ) {
    return null;
  }

  const accuracyM = Math.max(
    previous.accuracyM ?? 0,
    current.accuracyM ?? 0,
  );
  const minimumDistanceM = Math.max(
    MINIMUM_BEARING_DISTANCE_M,
    Math.min(
      accuracyM,
      MAXIMUM_BEARING_DISTANCE_M,
    ),
  );
  const distanceM =
    getDistanceBetweenLocationsM(
      previous,
      current,
    );

  if (distanceM < minimumDistanceM) {
    return null;
  }

  return getBearingBetweenLocations(
    previous,
    current,
  );
}

function getAngularDifferenceDeg(
  first: number,
  second: number,
): number {
  return Math.abs(
    ((first - second + 540) % 360) - 180,
  );
}

type NavigationLocationMarkerProps = {
  location: LocationPoint;
};

function NavigationLocationMarker({
  location,
}: NavigationLocationMarkerProps) {
  const lastObservedLocationRef =
    useRef<LocationPoint | null>(null);
  const bearingOriginLocationRef =
    useRef<LocationPoint | null>(null);
  const stableBearingRef = useRef<
    number | null
  >(null);
  const [
    bearingDeg,
    setBearingDeg,
  ] = useState(0);
  const coordinate = getNavigationCoordinate(
    location,
  );

  useEffect(() => {
    const lastObservedLocation =
      lastObservedLocationRef.current;

    if (
      lastObservedLocation &&
      location.timestampMs <=
        lastObservedLocation.timestampMs
    ) {
      return;
    }

    const reliableHeading =
      getReliableHeading(location);
    const movementBearing =
      reliableHeading === null &&
      bearingOriginLocationRef.current
        ? getMovementBearing(
            bearingOriginLocationRef.current,
            location,
          )
        : null;
    const candidateBearing =
      reliableHeading ?? movementBearing;

    if (candidateBearing !== null) {
      const stableBearing =
        stableBearingRef.current;
      const shouldUpdateBearing =
        stableBearing === null ||
        getAngularDifferenceDeg(
          stableBearing,
          candidateBearing,
        ) >= BEARING_CHANGE_DEADBAND_DEG;

      if (shouldUpdateBearing) {
        stableBearingRef.current =
          candidateBearing;
        setBearingDeg(candidateBearing);
      }

      bearingOriginLocationRef.current =
        location;
    } else if (
      bearingOriginLocationRef.current === null
    ) {
      bearingOriginLocationRef.current =
        location;
    }

    lastObservedLocationRef.current = location;
  }, [location]);

  if (!coordinate) {
    return null;
  }

  return (
    <Marker
      anchor="center"
      id={NAVIGATION_MARKER_ID}
      lngLat={coordinate}
    >
      <View
        accessibilityLabel="현재 위치와 진행 방향"
        accessible
        pointerEvents="none"
        style={styles.navigationMarker}
      >
        <View style={styles.navigationHalo} />

        <View
          style={styles.navigationMarkerSurface}
        >
          <View
            style={[
              styles.navigationArrow,
              {
                transform: [
                  {
                    rotate: `${bearingDeg}deg`,
                  },
                ],
              },
            ]}
          >
            <View
              style={styles.navigationArrowHead}
            />

            <View
              style={styles.navigationArrowTail}
            />
          </View>
        </View>
      </View>
    </Marker>
  );
}

type NextTurnMapMarkerProps = {
  marker: NextTurnMarker;
};

function NextTurnMapMarker({
  marker,
}: NextTurnMapMarkerProps) {
  const label = marker.label.trim();
  const color = marker.color.trim();

  if (
    !isValidCoordinate(marker.coordinate) ||
    label.length === 0 ||
    color.length === 0
  ) {
    return null;
  }

  return (
    <Marker
      anchor="bottom"
      id={NEXT_TURN_MARKER_ID}
      lngLat={marker.coordinate}
      offset={[0, 10]}
    >
      <View
        accessibilityLabel={`다음 회전: ${label}`}
        accessible
        pointerEvents="none"
        style={styles.nextTurnMarker}
      >
        <View
          style={[
            styles.nextTurnLabel,
            { backgroundColor: color },
          ]}
        >
          <Text
            numberOfLines={1}
            style={styles.nextTurnLabelText}
          >
            {label}
          </Text>

          <Image
            fadeDuration={0}
            resizeMode="contain"
            source={DIRECTION_ARROW_IMAGE}
            style={[
              styles.nextTurnArrow,
              {
                transform: [
                  {
                    rotate: `${
                      TURN_ROTATION[
                        marker.direction
                      ]
                    }deg`,
                  },
                ],
              },
            ]}
          />
        </View>

        <View
          style={[
            styles.nextTurnStem,
            { backgroundColor: color },
          ]}
        />

        <View
          style={[
            styles.nextTurnDot,
            { borderColor: color },
          ]}
        >
          <View
            style={[
              styles.nextTurnDotInner,
              { backgroundColor: color },
            ]}
          />
        </View>
      </View>
    </Marker>
  );
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
  navigationLocation = null,
  focusRequestKey = 0,
  autoFocusInitialLocation = false,
  nextTurnMarker = null,
  followNavigationLocation = false,
  onUserMapInteraction,
}: LiveRunningMapProps) {
  const cameraRef =
    useRef<CameraRef>(null);

  const componentIsMountedRef =
    useRef(true);

  const lastFittedRouteKeyRef =
    useRef<string | null>(null);
  const lastFocusedLocationRef =
    useRef<string | null>(null);
  const lastFocusRequestKeyRef =
    useRef<number | null>(null);

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

  useEffect(() => {
    if (!mapIsReady || !navigationLocation) {
      return;
    }

    const focusKey = [
      navigationLocation.timestampMs,
      focusRequestKey,
    ].join(':');
    const locationHasChanged =
      !lastFocusedLocationRef.current?.startsWith(
        `${navigationLocation.timestampMs}:`,
      );
    const explicitFocusRequested =
      focusRequestKey > 0 &&
      lastFocusRequestKeyRef.current !==
        focusRequestKey;
    const shouldFocus =
      (autoFocusInitialLocation &&
        lastFocusedLocationRef.current ===
          null) ||
      explicitFocusRequested ||
      (followNavigationLocation &&
        locationHasChanged);

    if (!shouldFocus) {
      return;
    }

    if (lastFocusedLocationRef.current === focusKey) {
      return;
    }

    const camera = cameraRef.current;

    if (!camera) {
      return;
    }

    camera.easeTo({
      center: [
        navigationLocation.longitude,
        navigationLocation.latitude,
      ],
      duration: 500,
      padding: {
        top: 120,
        right: 0,
        bottom: 300,
        left: 0,
      },
      zoom: 16.5,
    });
    lastFocusedLocationRef.current = focusKey;
    lastFocusRequestKeyRef.current =
      focusRequestKey;
  }, [
    autoFocusInitialLocation,
    focusRequestKey,
    followNavigationLocation,
    mapIsReady,
    navigationLocation,
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
        onRegionWillChange={(event) => {
          if (event.nativeEvent.userInteraction) {
            onUserMapInteraction?.();
          }
        }}
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

        {nextTurnMarker && (
          <NextTurnMapMarker
            marker={nextTurnMarker}
          />
        )}

        {locationStatus === 'ready' &&
          navigationLocation && (
          <NavigationLocationMarker
            location={navigationLocation}
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

    navigationMarker: {
      width: 54,
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
    },

    navigationHalo: {
      position: 'absolute',
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor:
        'rgba(126,172,0,0.18)',
    },

    navigationMarkerSurface: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderColor: 'rgba(17,17,17,0.08)',
      borderWidth: 1,
      elevation: 3,
      shadowColor: '#111111',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.18,
      shadowRadius: 5,
    },

    navigationArrow: {
      width: 24,
      height: 27,
      alignItems: 'center',
    },

    navigationArrowHead: {
      width: 0,
      height: 0,
      borderRightWidth: 10,
      borderBottomWidth: 17,
      borderLeftWidth: 10,
      borderRightColor: 'transparent',
      borderBottomColor: '#7EAC00',
      borderLeftColor: 'transparent',
    },

    navigationArrowTail: {
      width: 8,
      height: 10,
      marginTop: -2,
      borderBottomRightRadius: 2,
      borderBottomLeftRadius: 2,
      backgroundColor: '#7EAC00',
    },

    nextTurnMarker: {
      alignItems: 'center',
      justifyContent: 'flex-end',
    },

    nextTurnLabel: {
      maxWidth: 132,
      minHeight: 30,
      paddingHorizontal: 11,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      shadowColor: '#111111',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.17,
      shadowRadius: 4,
      elevation: 2,
    },

    nextTurnLabelText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },

    nextTurnArrow: {
      width: 16,
      height: 16,
      marginLeft: 4,
      tintColor: '#FFFFFF',
    },

    nextTurnStem: {
      width: 3,
      height: 10,
      marginTop: -1,
    },

    nextTurnDot: {
      width: 19,
      height: 19,
      borderRadius: 9.5,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      backgroundColor: '#FFFFFF',
      shadowColor: '#111111',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.16,
      shadowRadius: 3,
      elevation: 2,
    },

    nextTurnDotInner: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
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
