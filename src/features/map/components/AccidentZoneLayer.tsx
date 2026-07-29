import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Marker,
} from '@maplibre/maplibre-react-native';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  RouteWarningPoint,
  WarningSeverity,
} from '../../../services/safety/routeSafetyService';

type AccidentZoneLayerProps = {
  warningPoints?: readonly RouteWarningPoint[];
};

type WarningFeatureProperties = {
  id: string;
  name: string;
  distanceFromRouteM: number;
  accidentCount: number;
  severity: WarningSeverity;
};

function createWarningFeatureCollection(
  warningPoints: readonly RouteWarningPoint[],
): GeoJSON.FeatureCollection<
  GeoJSON.Point,
  WarningFeatureProperties
> {
  return {
    type: 'FeatureCollection',
    features: warningPoints.map(
      (warningPoint) => ({
        type: 'Feature',
        id: warningPoint.id,
        properties: {
          id: warningPoint.id,
          name: warningPoint.name,
          distanceFromRouteM:
            warningPoint.distanceFromRouteM,
          accidentCount:
            warningPoint.accidentCount,
          severity:
            warningPoint.severity,
        },
        geometry: {
          type: 'Point',
          coordinates: [
            warningPoint.coordinate[0],
            warningPoint.coordinate[1],
          ],
        },
      }),
    ),
  };
}

/**
 * 경로 200m 이내로 선별된 보행노인 사고 다발지역만 표시합니다.
 *
 * 기존 지도 마커 모양을 유지하고, 선택 시 같은 마커 안에서
 * 경로 거리와 사고 정보를 확인할 수 있습니다.
 */
export function AccidentZoneLayer({
  warningPoints = [],
}: AccidentZoneLayerProps) {
  const [
    selectedWarningPointId,
    setSelectedWarningPointId,
  ] = useState<string | null>(null);
  const featureCollection = useMemo(
    () =>
      createWarningFeatureCollection(
        warningPoints,
      ),
    [warningPoints],
  );

  useEffect(() => {
    if (
      selectedWarningPointId &&
      !warningPoints.some(
        (warningPoint) =>
          warningPoint.id ===
          selectedWarningPointId,
      )
    ) {
      setSelectedWarningPointId(null);
    }
  }, [
    selectedWarningPointId,
    warningPoints,
  ]);

  return (
    <>
      {featureCollection.features.map(
        (feature) => {
          const [
            longitude,
            latitude,
          ] = feature.geometry.coordinates;
          const {
            id,
            distanceFromRouteM,
            accidentCount,
          } = feature.properties;
          const isSelected =
            selectedWarningPointId === id;
          const roundedDistanceM =
            Math.round(
              distanceFromRouteM,
            );

          return (
            <Marker
              id={`accident-zone-${id}`}
              key={id}
              anchor="bottom"
              lngLat={[
                longitude,
                latitude,
              ]}
            >
              <Pressable
                accessibilityLabel={[
                  '보행노인 사고 다발지역',
                  `경로에서 약 ${roundedDistanceM}미터`,
                  accidentCount > 0
                    ? `사고 ${accidentCount}건`
                    : '사고 건수 정보 없음',
                ].join(', ')}
                accessibilityRole="button"
                onPress={() => {
                  setSelectedWarningPointId(
                    (currentId) =>
                      currentId === id
                        ? null
                        : id,
                  );
                }}
                style={
                  styles.markerContainer
                }
              >
                {isSelected && (
                  <View
                    style={
                      styles.callout
                    }
                  >
                    <Text
                      style={
                        styles.calloutTitle
                      }
                    >
                      보행노인 사고
                      다발지역
                    </Text>

                    <Text
                      style={
                        styles.calloutText
                      }
                    >
                      경로에서 약{' '}
                      {roundedDistanceM}미터
                    </Text>

                    <Text
                      style={
                        styles.calloutText
                      }
                    >
                      {accidentCount > 0
                        ? `사고 ${accidentCount}건`
                        : '사고 건수 정보 없음'}
                    </Text>

                    <Text
                      style={
                        styles.calloutGuide
                      }
                    >
                      주의해서 통과하세요
                    </Text>
                  </View>
                )}

                <View
                  style={
                    styles.markerBadge
                  }
                >
                  <Text
                    style={
                      styles.warningIcon
                    }
                  >
                    !
                  </Text>
                </View>

                <View
                  style={
                    styles.markerPointer
                  }
                />
              </Pressable>
            </Marker>
          );
        },
      )}
    </>
  );
}

const styles =
  StyleSheet.create({
    markerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    callout: {
      width: 190,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.16,
      shadowRadius: 4,
      elevation: 5,
    },

    calloutTitle: {
      color: '#111111',
      fontSize: 14,
      fontWeight: '700',
    },

    calloutText: {
      marginTop: 3,
      color: '#5C5C5C',
      fontSize: 12,
      fontWeight: '500',
    },

    calloutGuide: {
      marginTop: 6,
      color: '#4E6A01',
      fontSize: 12,
      fontWeight: '700',
    },

    markerBadge: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      borderRadius: 15,
      backgroundColor: '#E5484D',
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 4,
    },

    warningIcon: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '800',
      lineHeight: 20,
      textAlign: 'center',
    },

    markerPointer: {
      width: 0,
      height: 0,
      marginTop: -2,
      borderTopWidth: 7,
      borderRightWidth: 5,
      borderLeftWidth: 5,
      borderTopColor: '#E5484D',
      borderRightColor:
        'transparent',
      borderLeftColor:
        'transparent',
    },
  });
