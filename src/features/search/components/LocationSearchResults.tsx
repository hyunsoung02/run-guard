import {
  Ionicons,
} from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  SearchPlace,
} from '../../../navigation/types';

type LocationSearchResultsProps = {
  places: SearchPlace[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  onSelectPlace: (
    place: SearchPlace,
  ) => void;
};

export function LocationSearchResults({
  places,
  isLoading,
  error,
  hasSearched,
  onSelectPlace,
}: LocationSearchResultsProps) {
  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator color="#7EAC00" />
        <Text style={styles.stateText}>
          장소를 검색하고 있어요.
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <Ionicons
          color="#777777"
          name="alert-circle-outline"
          size={32}
        />
        <Text style={styles.errorText}>
          {error}
        </Text>
      </View>
    );
  }

  if (
    hasSearched &&
    places.length === 0
  ) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateText}>
          검색 결과가 없습니다.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={places}
      keyboardShouldPersistTaps="handled"
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          accessibilityLabel={`${item.name}, ${item.address}`}
          onPress={() =>
            onSelectPlace(item)
          }
          style={({ pressed }) => [
            styles.resultRow,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            color="#7EAC00"
            name="location-outline"
            size={25}
          />
          <View style={styles.resultText}>
            <Text style={styles.placeName}>
              {item.name}
            </Text>
            <Text style={styles.address}>
              {item.address}
            </Text>
          </View>
          <Ionicons
            color="#A0A0A0"
            name="chevron-forward"
            size={20}
          />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  stateContainer: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateText: {
    color: '#666666',
    fontSize: 15,
  },
  errorText: {
    color: '#555555',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  resultRow: {
    minHeight: 76,
    marginHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: '#DDDDDD',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultText: {
    flex: 1,
    gap: 5,
  },
  placeName: {
    color: '#171717',
    fontSize: 16,
    fontWeight: '700',
  },
  address: {
    color: '#777777',
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.55,
  },
});
