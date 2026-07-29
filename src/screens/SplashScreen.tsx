import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  useEffect,
  useState,
} from 'react';

import {
  Image,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import type {
  RootStackParamList,
} from '../navigation/types';
import {
  selectInitializeLocation,
  useLocationStore,
} from '../stores/useLocationStore';

const startScreenImage = require(
  '../assets/images/start/start_screen.png',
);

/**
 * 이 값을 저장하면 시작 화면을 본 것으로 처리합니다.
 *
 * 추후 시작 화면을 다시 모든 사용자에게 보여 주고 싶다면
 * v1을 v2로 변경하면 됩니다.
 */
const START_SCREEN_STORAGE_KEY =
  '@run_guard/start_screen_seen_v1';

/**
 * 첫 실행 시 시작 화면 표시 시간
 */
const START_SCREEN_DURATION_MS = 1800;

type SplashScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'Splash'
  >;

export function SplashScreen({
  navigation,
}: SplashScreenProps) {
  const initializeLocation =
    useLocationStore(
      selectInitializeLocation,
    );

  /**
   * AsyncStorage 확인이 끝나기 전에는
   * 시작 화면 이미지를 표시하지 않습니다.
   *
   * 따라서 두 번째 실행부터 이미지가
   * 순간적으로 깜빡이는 현상을 줄입니다.
   */
  const [
    shouldShowStartScreen,
    setShouldShowStartScreen,
  ] = useState(false);

  useEffect(() => {
    /**
     * 위치 초기화는 Splash 표시 시간이나
     * 다음 화면 이동을 기다리게 하지 않습니다.
     */
    void initializeLocation();
  }, [initializeLocation]);

  useEffect(() => {
    let isActive = true;

    let navigationTimer:
      | ReturnType<typeof setTimeout>
      | undefined;

    async function checkFirstLaunch() {
      try {
        const hasSeenStartScreen =
          await AsyncStorage.getItem(
            START_SCREEN_STORAGE_KEY,
          );

        if (!isActive) {
          return;
        }

        /**
         * 이미 시작 화면을 본 사용자
         */
        if (
          hasSeenStartScreen === 'true'
        ) {
          navigation.replace('Main');
          return;
        }

        /**
         * 첫 실행임을 먼저 저장합니다.
         *
         * 앱이 시작 화면 도중 종료되더라도
         * 다음 실행부터 반복 표시되지 않습니다.
         */
        await AsyncStorage.setItem(
          START_SCREEN_STORAGE_KEY,
          'true',
        );

        if (!isActive) {
          return;
        }

        setShouldShowStartScreen(true);

        navigationTimer = setTimeout(
          () => {
            if (isActive) {
              navigation.replace('Main');
            }
          },
          START_SCREEN_DURATION_MS,
        );
      } catch (error) {
        /**
         * 저장 오류가 발생해도
         * 앱 진입 자체가 막히지 않도록 처리합니다.
         */
        console.warn(
          '시작 화면 상태 확인 실패:',
          error,
        );

        if (!isActive) {
          return;
        }

        setShouldShowStartScreen(true);

        navigationTimer = setTimeout(
          () => {
            if (isActive) {
              navigation.replace('Main');
            }
          },
          START_SCREEN_DURATION_MS,
        );
      }
    }

    checkFirstLaunch();

    return () => {
      isActive = false;

      if (navigationTimer) {
        clearTimeout(navigationTimer);
      }
    };
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {shouldShowStartScreen && (
        <Image
          source={startScreenImage}
          resizeMode="contain"
          style={styles.startImage}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#D9D9D9',

    alignItems: 'center',
    justifyContent: 'center',
  },

  startImage: {
    width: '100%',
    height: '100%',
  },
});
