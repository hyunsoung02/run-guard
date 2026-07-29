import {
  Ionicons,
} from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type LocationSearchInputProps = {
  query: string;
  onChangeQuery: (
    query: string,
  ) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function LocationSearchInput({
  query,
  onChangeQuery,
  onSubmit,
  isLoading,
}: LocationSearchInputProps) {
  const isDisabled =
    !query.trim() || isLoading;

  function handleSubmit() {
    onSubmit();
  }

  return (
    <View style={styles.searchBox}>
      <Ionicons
        color="#6B6B6B"
        name="search-outline"
        size={22}
      />

      <TextInput
        autoFocus
        clearButtonMode="while-editing"
        onChangeText={onChangeQuery}
        onSubmitEditing={handleSubmit}
        placeholder="장소명이나 주소를 검색하세요"
        placeholderTextColor="#929292"
        returnKeyType="search"
        style={styles.input}
        value={query}
      />

      <Pressable
        accessibilityLabel="장소 검색 실행"
        accessibilityRole="button"
        disabled={isDisabled}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          pressed && styles.pressed,
          isDisabled && styles.disabled,
        ]}
      >
        <Text style={styles.submitText}>
          검색
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    height: 52,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 15,
    backgroundColor: '#F2F4EE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    color: '#111111',
    fontSize: 16,
    paddingVertical: 0,
  },
  submitButton: {
    minWidth: 54,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    backgroundColor: '#d6f484',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#283700',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.55,
  },
  disabled: {
    opacity: 0.4,
  },
});
