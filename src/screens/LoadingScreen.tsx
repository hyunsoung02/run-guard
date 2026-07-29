import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type {
  ImageSourcePropType,
} from 'react-native';

import {
  getLoadingPreset,
} from '../features/loading/data/loadingPresets';

import type {
  RootStackParamList,
} from '../navigation/types';

const loadingCharacter: ImageSourcePropType = require(
  '../assets/images/loading/loading_character.png',
);

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

const SPINNER_SIZE = 206;
const CHARACTER_WIDTH = 132;
const CHARACTER_HEIGHT = 175;

const SPINNER_DURATION_MS = 1100;
const CHARACTER_CYCLE_MS = 560;
const MESSAGE_CHANGE_INTERVAL_MS = 1800;

type LoadingScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'Loading'
  >;

export function LoadingScreen({
  route,
  navigation,
}: LoadingScreenProps) {
  const {
    width: screenWidth,
    height: screenHeight,
  } = useWindowDimensions();

  /**
   * 전달받은 로딩 종류
   *
   * params가 없으면 일반 코스 분석으로 동작합니다.
   */
  const mode =
    route.params?.mode ?? 'course';

  const selectedStartPlace =
    route.params?.mode ===
    'locationCourse'
      ? route.params.startPlace
      : undefined;
  const selectedTargetDistanceKm =
    route.params?.mode ===
    'locationCourse'
      ? route.params.targetDistanceKm
      : undefined;

  useEffect(() => {
    if (
      mode !== 'course' &&
      mode !== 'locationCourse'
    ) {
      return;
    }

    const timer = setTimeout(() => {
      navigation.replace(
        'RunningStart',
        selectedStartPlace &&
          selectedTargetDistanceKm
          ? {
              startPlace:
                selectedStartPlace,
              targetDistanceKm:
                selectedTargetDistanceKm,
            }
          : undefined,
      );
    }, 2200);

    return () => {
      clearTimeout(timer);
    };
  }, [
    mode,
    navigation,
    selectedStartPlace,
    selectedTargetDistanceKm,
  ]);

  const subjectName =
    route.params?.mode !==
    'locationCourse'
      ? route.params?.subjectName
      : undefined;

  /**
   * mode와 subjectName이 바뀔 때만
   * 로딩 제목과 문장 목록을 다시 생성합니다.
   */
  const loadingPreset = useMemo(
    () =>
      getLoadingPreset(
        mode,
        selectedStartPlace?.name ??
          subjectName,
        selectedTargetDistanceKm,
      ),
    [
      mode,
      selectedStartPlace,
      selectedTargetDistanceKm,
      subjectName,
    ],
  );

  const analysisMessages =
    loadingPreset.messages;

  /**
   * 초록색 원 회전값
   */
  const spinnerProgress = useRef(
    new Animated.Value(0),
  ).current;

  /**
   * 캐릭터 움직임 값
   */
  const characterProgress = useRef(
    new Animated.Value(0),
  ).current;

  /**
   * 분석 문장 투명도
   */
  const messageOpacity = useRef(
    new Animated.Value(1),
  ).current;

  const [
    messageIndex,
    setMessageIndex,
  ] = useState(0);

  /**
   * 375 × 812 디자인을
   * 현재 화면에 비례해서 표시합니다.
   */
  const scale = Math.min(
    screenWidth / DESIGN_WIDTH,
    screenHeight / DESIGN_HEIGHT,
  );

  const canvasWidth =
    DESIGN_WIDTH * scale;

  const canvasHeight =
    DESIGN_HEIGHT * scale;

  const canvasLeft =
    (screenWidth - canvasWidth) / 2;

  const canvasTop =
    (screenHeight - canvasHeight) / 2;

  const s = (value: number) =>
    value * scale;

  /**
   * 로딩 종류가 바뀌면
   * 첫 번째 문장부터 다시 시작합니다.
   */
  useEffect(() => {
    messageOpacity.stopAnimation();
    messageOpacity.setValue(1);

    setMessageIndex(0);
  }, [
    analysisMessages,
    messageOpacity,
  ]);

  /**
   * 초록색 원과 캐릭터 애니메이션
   */
  useEffect(() => {
    spinnerProgress.setValue(0);
    characterProgress.setValue(0);

    const spinnerAnimation =
      Animated.loop(
        Animated.timing(
          spinnerProgress,
          {
            toValue: 1,
            duration:
              SPINNER_DURATION_MS,
            easing: Easing.linear,
            useNativeDriver: true,
          },
        ),
      );

    const characterAnimation =
      Animated.loop(
        Animated.timing(
          characterProgress,
          {
            toValue: 1,
            duration:
              CHARACTER_CYCLE_MS,
            easing:
              Easing.inOut(
                Easing.quad,
              ),
            useNativeDriver: true,
          },
        ),
      );

    spinnerAnimation.start();
    characterAnimation.start();

    return () => {
      spinnerAnimation.stop();
      characterAnimation.stop();

      spinnerProgress.stopAnimation();
      characterProgress.stopAnimation();
    };
  }, [
    characterProgress,
    spinnerProgress,
  ]);

  /**
   * 분석 문장 순환
   */
  useEffect(() => {
    /**
     * 문장이 한 개뿐이면
     * 순환 타이머가 필요하지 않습니다.
     */
    if (
      analysisMessages.length <= 1
    ) {
      return;
    }

    const messageTimer =
      setInterval(() => {
        Animated.timing(
          messageOpacity,
          {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          },
        ).start(({ finished }) => {
          if (!finished) {
            return;
          }

          setMessageIndex(
            (previousIndex) =>
              (
                previousIndex + 1
              ) %
              analysisMessages.length,
          );

          Animated.timing(
            messageOpacity,
            {
              toValue: 1,
              duration: 240,
              useNativeDriver: true,
            },
          ).start();
        });
      }, MESSAGE_CHANGE_INTERVAL_MS);

    return () => {
      clearInterval(messageTimer);
      messageOpacity.stopAnimation();
    };
  }, [
    analysisMessages,
    messageOpacity,
  ]);

  /**
   * 로딩 모드가 변경되는 순간 기존 인덱스가
   * 새 문장 배열 범위를 벗어날 수 있으므로
   * 첫 번째 문장을 대체값으로 사용합니다.
   */
  const currentMessage =
    analysisMessages[messageIndex] ??
    analysisMessages[0] ??
    '';

  /**
   * 초록색 원 회전
   */
  const spinnerRotation =
    spinnerProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [
        '0deg',
        '360deg',
      ],
    });

  /**
   * 캐릭터 상하 움직임
   */
  const characterTranslateY =
    characterProgress.interpolate({
      inputRange: [
        0,
        0.5,
        1,
      ],
      outputRange: [
        0,
        -7 * scale,
        0,
      ],
    });

  /**
   * 캐릭터 좌우 기울기
   */
  const characterRotation =
    characterProgress.interpolate({
      inputRange: [
        0,
        0.5,
        1,
      ],
      outputRange: [
        '-1.5deg',
        '1.5deg',
        '-1.5deg',
      ],
    });

  /**
   * 발을 디디는 느낌의
   * 미세한 크기 변화
   */
  const characterScale =
    characterProgress.interpolate({
      inputRange: [
        0,
        0.5,
        1,
      ],
      outputRange: [
        1,
        0.975,
        1,
      ],
    });

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      <View
        style={{
          position: 'absolute',

          left: canvasLeft,
          top: canvasTop,

          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        {/* 초록색 회전 원 */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',

            left: s(85),
            top: s(177),

            width: s(SPINNER_SIZE),
            height: s(SPINNER_SIZE),

            borderRadius: s(
              SPINNER_SIZE / 2,
            ),

            borderWidth: s(13),
            borderColor: '#B2F300',
            borderTopColor:
              'transparent',

            transform: [
              {
                rotate:
                  spinnerRotation,
              },
            ],
          }}
        />

        {/* 캐릭터 */}
        <Animated.Image
          source={loadingCharacter}
          resizeMode="contain"
          style={{
            position: 'absolute',

            left: s(119),
            top: s(189),

            width: s(
              CHARACTER_WIDTH,
            ),

            height: s(
              CHARACTER_HEIGHT,
            ),

            transform: [
              {
                translateY:
                  characterTranslateY,
              },
              {
                rotate:
                  characterRotation,
              },
              {
                scale:
                  characterScale,
              },
            ],
          }}
        />

        {/* 로딩 제목 */}
        <Text
          allowFontScaling={false}
          style={{
            position: 'absolute',

            left: 0,
            top: s(405),

            width: canvasWidth,

            color: '#111111',

            fontSize: s(20),
            lineHeight: s(26),
            fontWeight: '800',

            textAlign: 'center',
            letterSpacing: s(-0.5),
          }}
        >
          {loadingPreset.title}
        </Text>

        {/* 분석 문장 */}
        <Animated.View
          style={{
            position: 'absolute',

            left: s(45),
            top: s(438),

            width: s(285),
            minHeight: s(42),

            opacity: messageOpacity,

            alignItems: 'center',
          }}
        >
          <Text
            allowFontScaling={false}
            numberOfLines={2}
            style={{
              color: '#4F4F4F',

              fontSize: s(14),
              lineHeight: s(20),
              fontWeight: '500',

              textAlign: 'center',
              letterSpacing: s(-0.35),
            }}
          >
            {currentMessage}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#F3F3F3',
  },
});
