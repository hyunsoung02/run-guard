import {
  Marker,
} from '@maplibre/maplibre-react-native';

import {
  Image,
  StyleSheet,
  View,
} from 'react-native';

import type {
  LngLat,
} from '../data/runningRoute';

import type {
  KeywordPlace,
} from '../../running/data/runningStartOptions';

type RunningKeywordMarkersProps = {
  places: KeywordPlace[];
  onSelectPlace: (
    place: KeywordPlace,
  ) => void;
};

function getPlaceCoordinate(
  place: KeywordPlace,
): LngLat | null {
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
    return null;
  }

  return [longitude, latitude];
}

export function RunningKeywordMarkers({
  places,
  onSelectPlace,
}: RunningKeywordMarkersProps) {
  return (
    <>
      {places.map((place) => {
        const coordinate =
          getPlaceCoordinate(place);

        if (!coordinate) {
          return null;
        }

        return (
          <Marker
            accessibilityLabel={`${place.name} 상세 보기`}
            accessibilityRole="button"
            anchor="bottom"
            id={`running-keyword-${place.id}`}
            key={place.id}
            lngLat={coordinate}
            onPress={() =>
              onSelectPlace(place)
            }
          >
            <View
              pointerEvents="none"
              style={
                styles.keywordMarker
              }
            >
              <Image
                fadeDuration={0}
                resizeMode="contain"
                source={
                  place.markerImage
                }
                style={
                  styles.keywordMarkerImage
                }
              />
            </View>
          </Marker>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  keywordMarker: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  keywordMarkerImage: {
    width: 68,
    height: 88,
  },
});
