import {
  Ionicons,
} from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  SearchPlace,
  TargetDistanceKm,
} from '../../../navigation/types';
import {
  TARGET_DISTANCE_OPTIONS,
} from '../data/targetDistanceOptions';

type LocationDistanceContentProps = {
  startPlace: SearchPlace;
  targetDistanceKm: TargetDistanceKm;
  onSelectDistance: (
    distance: TargetDistanceKm,
  ) => void;
  onComplete: () => void;
};

export function LocationDistanceContent({
  startPlace,
  targetDistanceKm,
  onSelectDistance,
  onComplete,
}: LocationDistanceContentProps) {
  return (
    <>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>
          선택한 출발 위치
        </Text>
        <Text style={styles.placeName}>
          {startPlace.name}
        </Text>
        <Text style={styles.address}>
          {startPlace.address}
        </Text>

        <Text style={styles.question}>
          얼마나 달릴까요?
        </Text>
        <View style={styles.distanceList}>
          {TARGET_DISTANCE_OPTIONS.map(
            ({ distance, time }) => {
              const selected =
                distance ===
                targetDistanceKm;

              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected,
                  }}
                  key={distance}
                  onPress={() =>
                    onSelectDistance(
                      distance,
                    )
                  }
                  style={({ pressed }) => [
                    styles.distanceButton,
                    selected &&
                      styles.distanceButtonSelected,
                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.distance,
                      selected &&
                        styles.distanceSelected,
                    ]}
                  >
                    {distance}km
                  </Text>
                  <Text
                    style={[
                      styles.time,
                      selected &&
                        styles.timeSelected,
                    ]}
                  >
                    {time}
                  </Text>
                  <Ionicons
                    color={
                      selected
                        ? '#4E6A01'
                        : '#BBBBBB'
                    }
                    name={
                      selected
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={25}
                  />
                </Pressable>
              );
            },
          )}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onComplete}
        style={({ pressed }) => [
          styles.completeButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.completeText}>
          완료
        </Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  eyebrow: {
    color: '#6B6B6B',
    fontSize: 13,
    fontWeight: '600',
  },
  placeName: {
    marginTop: 8,
    color: '#111111',
    fontSize: 23,
    fontWeight: '800',
  },
  address: {
    marginTop: 7,
    color: '#777777',
    fontSize: 14,
    lineHeight: 20,
  },
  question: {
    marginTop: 42,
    marginBottom: 16,
    color: '#111111',
    fontSize: 20,
    fontWeight: '800',
  },
  distanceList: {
    gap: 11,
  },
  distanceButton: {
    minHeight: 72,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#E1E1E1',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceButtonSelected: {
    borderColor: '#7EAC00',
    backgroundColor: '#F3F9E5',
  },
  distance: {
    width: 68,
    color: '#333333',
    fontSize: 19,
    fontWeight: '800',
  },
  distanceSelected: {
    color: '#4E6A01',
  },
  time: {
    flex: 1,
    color: '#777777',
    fontSize: 14,
  },
  timeSelected: {
    color: '#4E6A01',
    fontWeight: '600',
  },
  completeButton: {
    height: 58,
    marginHorizontal: 24,
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: '#B2F300',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeText: {
    color: '#283700',
    fontSize: 18,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.65,
  },
});
