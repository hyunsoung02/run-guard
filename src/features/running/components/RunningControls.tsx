import {
  Ionicons,
} from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

type RunningControlsProps = {
  color: string;
  isPaused: boolean;
  onPauseToggle: () => void;
  onStop: () => void;
};

export function RunningControls({
  color,
  isPaused,
  onPauseToggle,
  onStop,
}: RunningControlsProps) {
  const { height } =
    useWindowDimensions();
  const controlsBottom = Math.max(
    64,
    Math.min(120, height * 0.15),
  );

  return (
    <>
      <View
        style={[
          styles.controls,
          {
            bottom: controlsBottom,
          },
        ]}
      >
        <Pressable
          accessibilityLabel={
            isPaused
              ? '러닝 다시 시작'
              : '러닝 일시정지'
          }
          accessibilityRole="button"
          hitSlop={16}
          onPress={onPauseToggle}
          style={({ pressed }) => [
            styles.controlButton,
            pressed &&
              styles.controlButtonPressed,
          ]}
        >
          <Ionicons
            color={color}
            name={
              isPaused
                ? 'play'
                : 'pause'
            }
            size={70}
          />
        </Pressable>

        <Pressable
          accessibilityLabel="러닝 종료"
          accessibilityRole="button"
          hitSlop={16}
          onPress={onStop}
          style={({ pressed }) => [
            styles.controlButton,
            pressed &&
              styles.controlButtonPressed,
          ]}
        >
          <Ionicons
            color={color}
            name="stop-outline"
            size={78}
          />
        </Pressable>
      </View>

      {isPaused && (
        <View
          pointerEvents="none"
          style={
            styles.pausedBadgeContainer
          }
        >
          <Text
            style={[
              styles.pausedBadgeText,
              {
                color,
                borderColor: color,
              },
            ]}
          >
            일시정지
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  controls: {
    position: 'absolute',
    right: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 35,
  },
  controlButton: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonPressed: {
    opacity: 0.55,
    transform: [
      {
        scale: 0.93,
      },
    ],
  },
  pausedBadgeContainer: {
    position: 'absolute',
    right: 0,
    bottom: 80,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedBadgeText: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 2,
    borderRadius: 20,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
