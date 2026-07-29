import {
  useEffect,
  useMemo,
  useRef,
} from 'react';

import {
  Ionicons,
} from '@expo/vector-icons';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  LinearGradient,
} from 'expo-linear-gradient';

import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import type {
  RootStackParamList,
} from '../navigation/types';

const GOAL_CHARACTER_IMAGE = require(
  '../assets/images/running/running-goal-character.png',
);

const {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const SUMMARY_NAVIGATION_DELAY_MS = 5500;

type RunningGoalCompleteScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'RunningGoalComplete'
  >;

type FireworkParticleConfig = {
  id: string;
  startX: number;
  startY: number;
  moveX: number;
  moveY: number;
  size: number;
  color: string;
  delay: number;
};

const FIREWORK_COLORS = [
  '#B2F300',
  '#7EAC00',
  '#FF6E32',
  '#FF2B06',
  '#FFD84D',
  '#FFFFFF',
] as const;

const FIREWORK_PARTICLES: FireworkParticleConfig[] =
  Array.from(
    {
      length: 26,
    },
    (_, index) => {
      const isLeftSide =
        index % 2 === 0;

      const groupIndex =
        Math.floor(index / 2);

      const angle =
        (groupIndex / 13) *
        Math.PI *
        2;

      const distance =
        70 +
        (groupIndex % 4) * 18;

      return {
        id: `particle-${index}`,

        startX: isLeftSide
          ? SCREEN_WIDTH * 0.23
          : SCREEN_WIDTH * 0.77,

        startY:
          SCREEN_HEIGHT *
          (index % 3 === 0
            ? 0.26
            : 0.36),

        moveX:
          Math.cos(angle) *
          distance,

        moveY:
          Math.sin(angle) *
          distance,

        size:
          6 +
          (index % 3) * 2,

        color:
          FIREWORK_COLORS[
            index %
              FIREWORK_COLORS.length
          ],

        delay:
          (index % 7) * 70,
      };
    },
  );

export function RunningGoalCompleteScreen({
  navigation,
   route,
}: RunningGoalCompleteScreenProps) {
  const { recordId } = route.params;
  const titleTranslateY = useRef(
    new Animated.Value(-150),
  ).current;

  const titleOpacity = useRef(
    new Animated.Value(0),
  ).current;

  const characterOpacity = useRef(
    new Animated.Value(0),
  ).current;

  const characterScale = useRef(
    new Animated.Value(0.96),
  ).current;

  const particleAnimations =
    useMemo(
      () =>
        FIREWORK_PARTICLES.map(
          () => ({
            progress:
              new Animated.Value(
                0,
              ),
          }),
        ),
      [],
    );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(
        titleTranslateY,
        {
          toValue: 0,
          duration: 1300,
          easing:
            Easing.out(
              Easing.cubic,
            ),
          useNativeDriver: true,
        },
      ),

      Animated.timing(
        titleOpacity,
        {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        },
      ),

      Animated.timing(
        characterOpacity,
        {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        },
      ),

      Animated.spring(
        characterScale,
        {
          toValue: 1,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        },
      ),
    ]).start();

    particleAnimations.forEach(
      (
        animation,
        index,
      ) => {
        const config =
          FIREWORK_PARTICLES[
            index
          ];

        Animated.sequence([
          Animated.delay(
            180 +
              config.delay,
          ),

          Animated.timing(
            animation.progress,
            {
              toValue: 1,
              duration: 1100,
              easing:
                Easing.out(
                  Easing.quad,
                ),
              useNativeDriver: true,
            },
          ),
        ]).start();
      },
    );

    const navigationTimer =
      setTimeout(() => {
        navigation.replace(
  'RunningRecordSummary',
  {
    recordId,
  },
);
      }, SUMMARY_NAVIGATION_DELAY_MS);

    return () => {
      clearTimeout(
        navigationTimer,
      );

      titleTranslateY.stopAnimation();
      titleOpacity.stopAnimation();
      characterOpacity.stopAnimation();
      characterScale.stopAnimation();
      particleAnimations.forEach(
        (animation) => {
          animation.progress
            .stopAnimation();
        },
      );
    };
  }, [
    characterOpacity,
  characterScale,
  navigation,
  particleAnimations,
  recordId,
  titleOpacity,
  titleTranslateY,
  ]);

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar
        backgroundColor="#D5D8DF"
        barStyle="dark-content"
      />

      <View style={styles.container}>
        <Animated.View
          style={[
            styles.characterContainer,
            {
              opacity:
                characterOpacity,

              transform: [
                {
                  scale:
                    characterScale,
                },
              ],
            },
          ]}
        >
          <Image
            fadeDuration={0}
            resizeMode="cover"
            source={
              GOAL_CHARACTER_IMAGE
            }
            style={
              styles.characterImage
            }
          />
        </Animated.View>

        <LinearGradient
          colors={[
            '#D5D8DF',
            'rgba(213,216,223,0)',
          ]}
          pointerEvents="none"
          style={styles.topImageFade}
        />

        <LinearGradient
          colors={[
            'rgba(213,216,223,0)',
            '#D5D8DF',
          ]}
          pointerEvents="none"
          style={styles.bottomImageFade}
        />

        <Pressable
          accessibilityLabel="이전 화면으로 이동"
          accessibilityRole="button"
          hitSlop={16}
          onPress={() => {
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <Ionicons
            color="#111111"
            name="arrow-back"
            size={46}
          />
        </Pressable>

        <Fireworks
          animations={
            particleAnimations
          }
        />

        <Animated.Text
          style={[
            styles.title,
            {
              opacity:
                titleOpacity,

              transform: [
                {
                  translateY:
                    titleTranslateY,
                },
              ],
            },
          ]}
        >
          목표 달성
        </Animated.Text>

      </View>
    </SafeAreaView>
  );
}

type FireworksProps = {
  animations: Array<{
    progress: Animated.Value;
  }>;
};

function Fireworks({
  animations,
}: FireworksProps) {
  return (
    <View
      pointerEvents="none"
      style={
        styles.fireworksLayer
      }
    >
      {FIREWORK_PARTICLES.map(
        (
          particle,
          index,
        ) => {
          const progress =
            animations[index]
              .progress;

          const translateX =
            progress.interpolate(
              {
                inputRange: [
                  0,
                  1,
                ],

                outputRange: [
                  0,
                  particle.moveX,
                ],
              },
            );

          const translateY =
            progress.interpolate(
              {
                inputRange: [
                  0,
                  1,
                ],

                outputRange: [
                  0,
                  particle.moveY,
                ],
              },
            );

          const opacity =
            progress.interpolate(
              {
                inputRange: [
                  0,
                  0.15,
                  0.72,
                  1,
                ],

                outputRange: [
                  0,
                  1,
                  1,
                  0,
                ],
              },
            );

          const scale =
            progress.interpolate(
              {
                inputRange: [
                  0,
                  0.2,
                  1,
                ],

                outputRange: [
                  0.3,
                  1,
                  0.5,
                ],
              },
            );

          const rotate =
            progress.interpolate(
              {
                inputRange: [
                  0,
                  1,
                ],

                outputRange: [
                  '0deg',
                  '220deg',
                ],
              },
            );

          return (
            <Animated.View
              key={
                particle.id
              }
              style={[
                styles.fireworkParticle,
                {
                  top:
                    particle.startY,

                  left:
                    particle.startX,

                  width:
                    particle.size,

                  height:
                    particle.size *
                    1.8,

                  borderRadius:
                    particle.size /
                    2,

                  backgroundColor:
                    particle.color,

                  opacity,

                  transform: [
                    {
                      translateX,
                    },
                    {
                      translateY,
                    },
                    {
                      scale,
                    },
                    {
                      rotate,
                    },
                  ],
                },
              ]}
            />
          );
        },
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        '#D5D8DF',
    },

    container: {
      flex: 1,
      overflow: 'hidden',
      backgroundColor:
        '#D5D8DF',
    },

    characterContainer: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },

    characterImage: {
      width: '100%',
      height: '100%',
    },

    topImageFade: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      zIndex: 10,
      height: 110,
    },

    bottomImageFade: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 10,
      height: 110,
    },

    backButton: {
      position: 'absolute',
      top: 26,
      left: 24,
      zIndex: 30,
      width: 58,
      height: 58,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    title: {
      position: 'absolute',
      top: 118,
      right: 0,
      left: 0,
      zIndex: 21,
      color: '#111111',
      fontSize: 53,
      fontWeight: '800',
      letterSpacing: -2,
      textAlign: 'center',
    },

    fireworksLayer: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 20,
    },

    fireworkParticle: {
      position: 'absolute',
    },

  });
