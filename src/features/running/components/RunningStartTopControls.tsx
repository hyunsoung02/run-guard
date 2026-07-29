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
  RouteKeyword,
} from '../../map/data/runningRoute';
import {
  RUNNING_START_KEYWORDS,
} from '../data/runningStartOptions';

type RunningStartTopControlsProps = {
  recommendationIsLoading: boolean;
  selectedKeyword: RouteKeyword;
  onBack: () => void;
  onSearch: () => void;
  onReset: () => void;
  onSelectKeyword: (
    keyword: RouteKeyword,
  ) => void;
};

export function RunningStartTopControls({
  recommendationIsLoading,
  selectedKeyword,
  onBack,
  onSearch,
  onReset,
  onSelectKeyword,
}: RunningStartTopControlsProps) {
  return (
    <View style={styles.topControls}>
      <View style={styles.searchRow}>
        <Pressable
          accessibilityLabel="메인 화면으로 돌아가기"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Ionicons
            color="#111111"
            name="arrow-back"
            size={30}
          />
        </Pressable>

        <Pressable
          accessibilityLabel="장소 검색"
          accessibilityRole="button"
          onPress={onSearch}
          style={({ pressed }) => [
            styles.searchButton,
            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Ionicons
            color="#111111"
            name="search-outline"
            size={25}
          />

          <Text style={styles.searchText}>
            검색
          </Text>
        </Pressable>

        <Pressable
          accessibilityLabel="추천 코스 다시 생성"
          accessibilityRole="button"
          accessibilityState={{
            disabled:
              recommendationIsLoading,
          }}
          disabled={
            recommendationIsLoading
          }
          onPress={onReset}
          style={({ pressed }) => [
            styles.resetButton,
            recommendationIsLoading &&
              styles.buttonDisabled,
            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Ionicons
            color="#4E6A01"
            name="refresh"
            size={21}
          />

          <Text style={styles.resetText}>
            다시 추천
          </Text>
        </Pressable>
      </View>

      <View style={styles.keywordRow}>
        {RUNNING_START_KEYWORDS.map(
          (keyword) => {
            const selected =
              keyword.label ===
              selectedKeyword;

            return (
              <Pressable
                accessibilityLabel={`${keyword.label} 맞춤 코스`}
                accessibilityRole="button"
                accessibilityState={{
                  selected,
                  disabled:
                    recommendationIsLoading,
                }}
                disabled={
                  recommendationIsLoading
                }
                key={keyword.label}
                onPress={() =>
                  onSelectKeyword(
                    keyword.label,
                  )
                }
                style={({ pressed }) => [
                  styles.keywordButton,
                  selected &&
                    styles.keywordButtonSelected,
                  recommendationIsLoading &&
                    styles.buttonDisabled,
                  pressed &&
                    styles.buttonPressed,
                ]}
              >
                <Ionicons
                  color={
                    selected
                      ? '#4E6A01'
                      : '#7EAC00'
                  }
                  name={keyword.icon}
                  size={17}
                />

                <Text
                  style={[
                    styles.keywordText,
                    selected &&
                      styles.keywordTextSelected,
                  ]}
                >
                  {keyword.label}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topControls: {
    position: 'absolute',
    top: 55,
    right: 14,
    left: 14,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor:
      'rgba(255,255,255,0.88)',
  },
  searchButton: {
    height: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 19,
    borderWidth: 2,
    borderColor:
      'rgba(0,0,0,0.12)',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  searchText: {
    color: '#6C6C6C',
    fontSize: 19,
    fontWeight: '500',
  },
  resetButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#7EAC00',
    borderRadius: 24,
    backgroundColor:
      'rgba(222,240,208,0.94)',
  },
  resetText: {
    color: '#4E6A01',
    fontSize: 13,
    fontWeight: '600',
  },
  keywordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  keywordButton: {
    minWidth: 62,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor:
      'rgba(78,106,1,0.18)',
    borderRadius: 17,
    backgroundColor:
      'rgba(255,255,255,0.92)',
  },
  keywordButtonSelected: {
    borderColor: '#7EAC00',
    backgroundColor: '#E8FFC0',
  },
  keywordText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '500',
  },
  keywordTextSelected: {
    color: '#4E6A01',
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.72,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
