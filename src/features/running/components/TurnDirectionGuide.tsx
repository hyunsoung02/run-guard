import {
  useEffect,
  useRef,
} from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type {
  NavigationManeuver,
} from '../types/voiceGuide.types';

const DIRECTION_ARROW_IMAGE = require(
  '../../../assets/icons/running/running-direction-arrow.png',
);

type TurnDirectionGuideProps = {
  color: string;
  direction: NavigationManeuver;
  distanceM: number | null;
  instruction: string;
};

type TurnArrowProps = {
  direction: NavigationManeuver;
};

const TURN_ROTATION: Record<
  NavigationManeuver,
  number
> = {
  straight: 0,
  'slight-left': -45,
  left: -90,
  'sharp-left': -135,
  'slight-right': 45,
  right: 90,
  'sharp-right': 135,
  'u-turn': 180,
  arrive: 0,
  unknown: 0,
};

function TurnArrow({
  direction,
}: TurnArrowProps) {
  const rotationValue = useRef(
    new Animated.Value(
      TURN_ROTATION[direction],
    ),
  ).current;

  const scaleValue = useRef(
    new Animated.Value(1),
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(
        rotationValue,
        {
          toValue:
            TURN_ROTATION[
              direction
            ],
          duration: 300,
          useNativeDriver: true,
        },
      ),

      Animated.sequence([
        Animated.timing(
          scaleValue,
          {
            toValue: 0.94,
            duration: 120,
            useNativeDriver: true,
          },
        ),

        Animated.spring(
          scaleValue,
          {
            toValue: 1,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          },
        ),
      ]),
    ]).start();
  }, [
    direction,
    rotationValue,
    scaleValue,
  ]);

  const rotate =
    rotationValue.interpolate({
      inputRange: [
        -135,
        -90,
        -45,
        0,
        45,
        90,
        135,
        180,
      ],

      outputRange: [
        '-135deg',
        '-90deg',
        '-45deg',
        '0deg',
        '45deg',
        '90deg',
        '135deg',
        '180deg',
      ],
    });

  return (
    <Animated.View
      style={[
        styles.turnArrowContainer,
        {
          transform: [
            {
              rotate,
            },
            {
              scale:
                scaleValue,
            },
          ],
        },
      ]}
    >
      <Image
        fadeDuration={0}
        resizeMode="contain"
        source={
          DIRECTION_ARROW_IMAGE
        }
        style={
          styles.directionArrowImage
        }
      />
    </Animated.View>
  );
}

export function TurnDirectionGuide({
  color,
  direction,
  distanceM,
  instruction,
}: TurnDirectionGuideProps) {
  const { height, width } =
    useWindowDimensions();
  const scale = Math.min(
    1,
    Math.max(
      0.68,
      Math.min(
        width / 375,
        height / 760,
      ),
    ),
  );

  return (
    <View
      accessibilityLabel={`${instruction}, ${
        distanceM === null
          ? '거리 계산 중'
          : `${distanceM}미터`
      }`}
      style={[
        styles.guidanceArea,
        {
          top: Math.max(
            150,
            height * 0.22,
          ),
        },
      ]}
    >
      <View
        style={{
          transform: [{ scale }],
          marginVertical:
            -45 * (1 - scale),
        }}
      >
        <TurnArrow
          direction={direction}
        />
      </View>

      <Text
        style={[
          styles.distanceText,
          {
            color,
          },
        ]}
      >
        {distanceM === null
          ? '--'
          : `${distanceM}M`}
      </Text>

      <Text
        numberOfLines={2}
        style={[
          styles.instructionText,
          {
            color,
          },
        ]}
      >
        {instruction}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  guidanceArea: {
    position: 'absolute',
    right: 24,
    left: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  turnArrowContainer: {
    width: 280,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },

  directionArrowImage: {
    width: 190,
    height: 265,
  },

  distanceText: {
    marginTop: -4,
    fontSize: 45,
    fontWeight: '700',
    letterSpacing: -2,
    textAlign: 'center',
  },

  instructionText: {
    maxWidth: 320,
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
});
