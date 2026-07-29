import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  RUNNING_START_BUTTON_IMAGE,
} from '../data/runningStartOptions';
import {
  formatDistanceKm,
} from '../../../utils/distanceFormat';

type RunningStartSummaryProps = {
  actualDistanceKm: number | null;
  recommendationIsLoading: boolean;
  recommendationReason: string;
  routeIsReady: boolean;
  targetDistanceKm: number;
  targetPace: string;
  onStartRunning: () => void;
};

export function RunningStartSummary({
  actualDistanceKm,
  recommendationIsLoading,
  recommendationReason,
  routeIsReady,
  targetDistanceKm,
  targetPace,
  onStartRunning,
}: RunningStartSummaryProps) {
  const { height } =
    useWindowDimensions();
  const insets = useSafeAreaInsets();
  const startIsDisabled =
    recommendationIsLoading ||
    !routeIsReady;

  return (
    <View
      style={[
        styles.bottomContent,
        {
          bottom: Math.max(
            insets.bottom + 12,
            Math.min(
              90,
              height * 0.1,
            ),
          ),
        },
      ]}
    >
      <Pressable
        accessibilityLabel="러닝 시작"
        accessibilityRole="button"
        accessibilityState={{
          disabled:
            startIsDisabled,
        }}
        disabled={startIsDisabled}
        onPress={onStartRunning}
        style={({ pressed }) => [
          styles.startButton,
          startIsDisabled &&
            styles.startButtonDisabled,
          pressed &&
            styles.startButtonPressed,
        ]}
      >
        <Image
          resizeMode="contain"
          source={
            RUNNING_START_BUTTON_IMAGE
          }
          style={
            styles.startButtonImage
          }
        />
      </Pressable>

      <View style={styles.runningStats}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>
            {actualDistanceKm === null
              ? '--'
              : formatDistanceKm(
                  actualDistanceKm,
                  2,
                )}
          </Text>

          <Text style={styles.statUnit}>
            실제 KM
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBlock}>
          <Text style={styles.statValue}>
            {targetPace}
          </Text>

          <Text style={styles.statUnit}>
            목표 PACE
          </Text>
        </View>
      </View>

      <Text style={styles.recommendationTitle}>
        규칙 기반 추천 코스 · 목표{' '}
        {targetDistanceKm}km
      </Text>

      <Text
        ellipsizeMode="tail"
        numberOfLines={2}
        style={styles.recommendationReason}
      >
        {recommendationReason}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomContent: {
    position: 'absolute',
    right: 0,
    left: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  startButton: {
    width: 157,
    height: 93,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  startButtonImage: {
    width: '100%',
    height: '100%',
  },
  startButtonPressed: {
    opacity: 0.86,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },
  startButtonDisabled: {
    opacity: 0.48,
  },
  runningStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 13,
  },
  statBlock: {
    minWidth: 74,
    alignItems: 'center',
  },
  statValue: {
    color: '#111111',
    fontSize: 19,
    fontWeight: '600',
  },
  statUnit: {
    marginTop: -1,
    color: '#4E6A01',
    fontSize: 11,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 31,
    backgroundColor:
      'rgba(78,106,1,0.32)',
  },
  recommendationTitle: {
    marginTop: 24,
    color: '#273601',
    fontSize: 15,
    fontWeight: '800',
  },
  recommendationReason: {
    width: 310,
    marginTop: 6,
    color: '#445314',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    textAlign: 'center',
  },
});
