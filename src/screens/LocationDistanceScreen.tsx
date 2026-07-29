import {
  useState,
} from 'react';
import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  StyleSheet,
  View,
} from 'react-native';

import {
  LocationDistanceContent,
} from '../features/search/components/LocationDistanceContent';
import {
  LocationSearchHeader,
} from '../features/search/components/LocationSearchHeader';
import type {
  RootStackParamList,
  TargetDistanceKm,
} from '../navigation/types';

type LocationDistanceScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'LocationDistance'
  >;

export function LocationDistanceScreen({
  navigation,
  route,
}: LocationDistanceScreenProps) {
  const [
    targetDistanceKm,
    setTargetDistanceKm,
  ] = useState<TargetDistanceKm>(5);
  const { startPlace } = route.params;

  return (
    <View style={styles.screen}>
      <LocationSearchHeader
        title="거리 설정"
        onBack={() => navigation.goBack()}
      />

      <LocationDistanceContent
        startPlace={startPlace}
        targetDistanceKm={
          targetDistanceKm
        }
        onSelectDistance={
          setTargetDistanceKm
        }
        onComplete={() =>
          navigation.navigate(
            'Loading',
            {
              mode: 'locationCourse',
              startPlace,
              targetDistanceKm,
            },
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
