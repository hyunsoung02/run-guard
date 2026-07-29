import {
  useState,
} from 'react';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import {
  LocationSearchHeader,
} from '../features/search/components/LocationSearchHeader';
import {
  LocationSearchInput,
} from '../features/search/components/LocationSearchInput';
import {
  LocationSearchResults,
} from '../features/search/components/LocationSearchResults';
import type {
  RootStackParamList,
  SearchPlace,
} from '../navigation/types';
import {
  searchPlaces,
} from '../services/placeSearch';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'LocationSearch'
>;

export function LocationSearchScreen({
  navigation,
}: Props) {
  const [query, setQuery] =
    useState('');
  const [places, setPlaces] =
    useState<SearchPlace[]>([]);
  const [isLoading, setIsLoading] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [hasSearched, setHasSearched] =
    useState(false);

  async function handleSearch() {
  const trimmedQuery = query.trim();

  if (!trimmedQuery || isLoading) {
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    const results =
      await searchPlaces(trimmedQuery);

    setPlaces(results);
    setHasSearched(true);
  } catch (searchError: unknown) {
    console.error(
      '[LocationSearch] 검색 오류:',
      searchError,
    );

    setPlaces([]);
    setHasSearched(true);

    setError(
      searchError instanceof Error
        ? searchError.message
        : '장소 검색 중 오류가 발생했습니다.',
    );
  } finally {
    setIsLoading(false);
  }
}

  function handleChangeQuery(
    nextQuery: string,
  ) {
    setQuery(nextQuery);
    setError(null);

    if (!nextQuery.trim()) {
      setPlaces([]);
      setHasSearched(false);
    }
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        style={styles.screen}
      >
        <LocationSearchHeader
          title="출발 위치 검색"
          onBack={() => navigation.goBack()}
        />

        <LocationSearchInput
          query={query}
          onChangeQuery={
            handleChangeQuery
          }
          onSubmit={() => {
            void handleSearch();
          }}
          isLoading={isLoading}
        />

        <LocationSearchResults
          places={places}
          isLoading={isLoading}
          error={error}
          hasSearched={hasSearched}
          onSelectPlace={(startPlace) =>
            navigation.navigate(
              'LocationDistance',
              { startPlace },
            )
          }
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
