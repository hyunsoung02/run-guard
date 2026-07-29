import {
  Camera,
  Map,
} from '@maplibre/maplibre-react-native';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  RunningRouteLayer,
} from '../../map/components/RunningRouteLayer';
import type {
  LngLat,
  RunningRoute,
} from '../../map/data/runningRoute';
import {
  MIN_VALID_PACE_DISTANCE_M,
} from '../../running/utils/runningSessionCalculations';
import {
  isRenderableActualRoute,
  normalizeRouteCoordinates,
} from '../utils/recordRouteCoordinates';

const MAP_STYLE_URL =
  'https://tiles.openfreemap.org/styles/positron';

function getRouteBounds(
  coordinates: LngLat[],
): [number, number, number, number] {
  const longitudes = coordinates.map(
    ([longitude]) => longitude,
  );
  const latitudes = coordinates.map(
    ([, latitude]) => latitude,
  );

  return [
    Math.min(...longitudes),
    Math.min(...latitudes),
    Math.max(...longitudes),
    Math.max(...latitudes),
  ];
}

export function RecordRouteMap({
  coordinates,
  actualCoordinates = [],
  recordId,
}: {
  coordinates: LngLat[];
  actualCoordinates?: LngLat[];
  recordId: string;
}) {
  const plannedCoordinates =
    normalizeRouteCoordinates(
      coordinates,
    );
  const normalizedActualCoordinates =
    normalizeRouteCoordinates(
      actualCoordinates,
    );
  const canRenderActualRoute =
    isRenderableActualRoute(
      normalizedActualCoordinates,
      MIN_VALID_PACE_DISTANCE_M,
    );
  const hasPlannedRoute =
    plannedCoordinates.length >= 2;
  const primaryCoordinates =
    hasPlannedRoute
      ? plannedCoordinates
      : canRenderActualRoute
        ? normalizedActualCoordinates
        : [];
  const actualOverlayCoordinates =
    hasPlannedRoute &&
    canRenderActualRoute
      ? normalizedActualCoordinates
      : [];

  if (primaryCoordinates.length < 2) {
    return (
      <View style={styles.mapCard}>
        <Text style={styles.emptyText}>
          기록된 경로가 없습니다.
        </Text>
      </View>
    );
  }

  const route: RunningRoute = {
    id: `recorded-${recordId}`,
    keyword: '기록',
    source: 'recorded',
    coordinates:
      primaryCoordinates,
    navigationSteps: [],
    cautionPoints: [],
    generatedAtMs: 0,
  };
  const routeBounds = getRouteBounds(
    actualOverlayCoordinates.length >=
      2
      ? [
          ...route.coordinates,
          ...actualOverlayCoordinates,
        ]
      : route.coordinates,
  );
  const actualRoute: RunningRoute = {
    id: `actual-${recordId}`,
    keyword: '기록',
    source: 'recorded',
    coordinates:
      actualOverlayCoordinates,
    navigationSteps: [],
    cautionPoints: [],
    generatedAtMs: 0,
  };

  return (
    <View style={styles.mapCard}>
      <Map
        androidView="texture"
        attribution
        attributionPosition={{
          right: 8,
          bottom: 8,
        }}
        compass={false}
        dragPan={false}
        logo={false}
        mapStyle={MAP_STYLE_URL}
        scaleBar={false}
        style={styles.map}
        touchPitch={false}
        touchRotate={false}
        touchZoom={false}
      >
        <Camera
          bounds={routeBounds}
          padding={{
            top: 42,
            right: 52,
            bottom: 42,
            left: 52,
          }}
        />

        <RunningRouteLayer
          idPrefix="record-planned-route"
          preserveCoordinates
          route={route}
        />
        {actualOverlayCoordinates.length >=
          2 && (
          <RunningRouteLayer
            idPrefix="record-actual-route"
            lineColor="#B2F300"
            lineOutlineColor="#FFFFFF"
            preserveCoordinates
            route={actualRoute}
            showStartMarker={false}
          />
        )}
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  mapCard: {
    position: 'absolute',
    top: 112,
    right: 28,
    left: 28,
    height: 330,
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: '#EAEAEA',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  emptyText: {
    margin: 'auto',
    color: '#777777',
    fontSize: 15,
    fontWeight: '600',
  },
});
