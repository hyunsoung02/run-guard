import {
  GeoJSONSource,
  Layer,
  Marker,
} from '@maplibre/maplibre-react-native';

import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  LngLat,
  RunningRoute,
} from '../data/runningRoute';

type RunningRouteLayerProps = {
  route: RunningRoute;
  idPrefix?: string;
  preserveCoordinates?: boolean;
  showStartMarker?: boolean;
  lineColor?: string;
  lineOutlineColor?: string;
};

type TurnaroundMarkerProps = Pick<
  RunningRoute,
  'shape' | 'turnaroundPoint'
> & {
  markerId: string;
};

const START_CHARACTER_IMAGE = require(
  '../../../assets/map/route-start-character.png',
);

const WARNING_IMAGE = require(
  '../../../assets/map/route-warning.png',
);

const TURNAROUND_MARKER_IMAGE = require(
  '../../../assets/images/map/turnaround-marker.png',
);

/**
 * MapLibre 컴포넌트의 id는 렌더링 이후 변경할 수 없으므로
 * 한 지도 안의 각 경로는 안정적인 idPrefix를 사용합니다.
 */
const DEFAULT_ID_PREFIX =
  'running-route';

const START_MARKER_OFFSET_X = 0;
const START_MARKER_OFFSET_Y = 0;
const CORNER_CURVE_RATIO = 0.15;

const START_OUTLINE_OFFSETS = [
  { x: -2, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: -2 },
  { x: 0, y: 2 },
  { x: -1.5, y: -1.5 },
  { x: 1.5, y: -1.5 },
  { x: -1.5, y: 1.5 },
  { x: 1.5, y: 1.5 },
] as const;

function isValidCoordinate(
  coordinate: unknown,
): coordinate is LngLat {
  if (
    !Array.isArray(coordinate) ||
    coordinate.length < 2
  ) {
    return false;
  }

  const longitude: unknown =
    coordinate[0];
  const latitude: unknown =
    coordinate[1];

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

function getCurvedRouteCoordinates(
  coordinates: LngLat[],
): LngLat[] {
  if (coordinates.length < 3) {
    return coordinates;
  }

  const curvedCoordinates: LngLat[] = [
    coordinates[0],
  ];

  for (
    let index = 1;
    index < coordinates.length - 1;
    index += 1
  ) {
    const previous = coordinates[index - 1];
    const corner = coordinates[index];
    const next = coordinates[index + 1];
    const entry: LngLat = [
      corner[0] +
        (previous[0] - corner[0]) *
          CORNER_CURVE_RATIO,
      corner[1] +
        (previous[1] - corner[1]) *
          CORNER_CURVE_RATIO,
    ];
    const exit: LngLat = [
      corner[0] +
        (next[0] - corner[0]) *
          CORNER_CURVE_RATIO,
      corner[1] +
        (next[1] - corner[1]) *
          CORNER_CURVE_RATIO,
    ];

    curvedCoordinates.push(entry);

    for (const progress of [0.33, 0.66]) {
      const inverseProgress = 1 - progress;

      curvedCoordinates.push([
        inverseProgress * inverseProgress *
            entry[0] +
          2 * inverseProgress * progress *
            corner[0] +
          progress * progress * exit[0],
        inverseProgress * inverseProgress *
            entry[1] +
          2 * inverseProgress * progress *
            corner[1] +
          progress * progress * exit[1],
      ]);
    }

    curvedCoordinates.push(exit);
  }

  curvedCoordinates.push(
    coordinates[coordinates.length - 1],
  );

  return curvedCoordinates;
}

function TurnaroundMarker({
  shape,
  turnaroundPoint,
  markerId,
}: TurnaroundMarkerProps) {
  if (
    shape !== 'out-and-back' ||
    !isValidCoordinate(
      turnaroundPoint,
    )
  ) {
    return null;
  }

  return (
    <Marker
      id={markerId}
      anchor="bottom"
      lngLat={turnaroundPoint}
      offset={[0, 3]}
    >
      <View
        pointerEvents="none"
        style={
          styles.turnaroundContainer
        }
      >
        <View
          style={styles.turnaroundLabel}
        >
          <Text
            style={
              styles.turnaroundLabelText
            }
          >
            반환 지점
          </Text>
        </View>

        <Image
          fadeDuration={0}
          resizeMode="contain"
          source={
            TURNAROUND_MARKER_IMAGE
          }
          style={styles.turnaroundMarker}
        />
      </View>
    </Marker>
  );
}

export function RunningRouteLayer({
  route,
  idPrefix = DEFAULT_ID_PREFIX,
  preserveCoordinates = false,
  showStartMarker = true,
  lineColor = '#4E6A01',
  lineOutlineColor = '#e5f5ba',
}: RunningRouteLayerProps) {
  const routeSourceId =
    `${idPrefix}-source-v2`;
  const routeOuterLayerId =
    `${idPrefix}-outer-v2`;
  const routeInnerLayerId =
    `${idPrefix}-inner-v2`;
  const startMarkerId =
    `${idPrefix}-start-v2`;
  const turnaroundMarkerId =
    `${idPrefix}-turnaround-v2`;
  const routeFeature: GeoJSON.Feature<
    GeoJSON.LineString
  > = {
    type: 'Feature',
    properties: {
      routeId: route.id,
    },
    geometry: {
      type: 'LineString',
      coordinates:
        preserveCoordinates ||
        route.source === 'ors'
          ? route.coordinates
          : getCurvedRouteCoordinates(
              route.coordinates,
            ),
    },
  };

  const startCoordinate =
    route.coordinates[0];
  const nextCoordinate =
    route.coordinates[1] ??
    startCoordinate;
  const isCharacterFacingLeft =
    nextCoordinate[0] <
    startCoordinate[0];
  const characterScaleX =
    isCharacterFacingLeft ? -1 : 1;

  return (
    <>
      <GeoJSONSource
        key={routeSourceId}
        id={routeSourceId}
        data={routeFeature}
      >
        <Layer
          id={routeOuterLayerId}
          type="line"
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
          paint={{
            'line-color':
              lineOutlineColor,
            'line-width': 10,
            'line-opacity': 0.96,
          }}
        />

        <Layer
          id={routeInnerLayerId}
          type="line"
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
          paint={{
            'line-color': lineColor,
            'line-width': 4,
            'line-opacity': 1,
          }}
        />
      </GeoJSONSource>

      {/* 출발지 캐릭터 */}
      {showStartMarker && (
        <Marker
          key={startMarkerId}
          id={startMarkerId}
          anchor="center"
          lngLat={startCoordinate}
        >
          <View
            pointerEvents="none"
            style={[
              styles.startMarkerContainer,
              {
                transform: [
                  {
                    translateX:
                      START_MARKER_OFFSET_X,
                  },
                  {
                    translateY:
                      START_MARKER_OFFSET_Y,
                  },
                ],
              },
            ]}
          >
            {START_OUTLINE_OFFSETS.map(
              ({ x, y }) => (
                <Image
                  key={`outline-${x}-${y}`}
                  fadeDuration={0}
                  resizeMode="contain"
                  source={START_CHARACTER_IMAGE}
                  style={[
                    styles.startCharacter,
                    styles.startCharacterOutline,
                    {
                      transform: [
                        { translateX: x },
                        { translateY: y },
                        { scaleX: characterScaleX },
                      ],
                    },
                  ]}
                />
              ),
            )}

            <Image
              fadeDuration={0}
              resizeMode="contain"
              source={START_CHARACTER_IMAGE}
              style={[
                styles.startCharacter,
                {
                  transform: [
                    {
                      scaleX:
                        characterScaleX,
                    },
                  ],
                },
              ]}
            />
          </View>
        </Marker>
      )}

      <TurnaroundMarker
        markerId={
          turnaroundMarkerId
        }
        shape={route.shape}
        turnaroundPoint={
          route.turnaroundPoint
        }
      />

      {/* 주의 지점 */}
      {route.cautionPoints.map(
        (coordinate, index) => {
          const cautionMarkerId =
            `${idPrefix}-caution-v2-${index}`;

          return (
            <Marker
              key={cautionMarkerId}
              id={cautionMarkerId}
              anchor="center"
              lngLat={coordinate}
            >
              <View
                pointerEvents="none"
                style={styles.warningContainer}
              >
                <Image
                  fadeDuration={0}
                  resizeMode="contain"
                  source={WARNING_IMAGE}
                  style={styles.warningMarker}
                />
              </View>
            </Marker>
          );
        },
      )}
    </>
  );
}

const styles = StyleSheet.create({
  startMarkerContainer: {
    width: 64,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },

  startCharacter: {
    position: 'absolute',
    width: 54,
    height: 63,
  },

  startCharacterOutline: {
    tintColor: '#50514f',
    opacity: 1,
  },

  turnaroundContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },

  turnaroundLabel: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#4E6A01',
    alignItems: 'center',
    justifyContent: 'center',
  },

  turnaroundLabelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  turnaroundMarker: {
    width: 30,
    height: 45,
  },

  warningContainer: {
    width: 46,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  warningMarker: {
    width: 44,
    height: 36,
  },
});
