import {
  useEffect,
  useMemo,
  useRef,
} from 'react';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  RunningControls,
} from '../features/running/components/RunningControls';
import {
  RunningLiveStats,
} from '../features/running/components/RunningLiveStats';
import {
  TurnDirectionGuide,
} from '../features/running/components/TurnDirectionGuide';
import {
  useNavigationProgress,
} from '../features/running/hooks/useNavigationProgress';
import {
  useRunningSession,
} from '../features/running/hooks/useRunningSession';
import {
  useRunningVoiceGuide,
} from '../features/running/hooks/useRunningVoiceGuide';
import {
  getGuidanceTheme,
} from '../features/running/utils/runningGuidance';
import {
  useSettingsPreferences,
} from '../features/settings/hooks/useSettingsPreferences';
import type {
  RootStackParamList,
} from '../navigation/types';
import {
  useRunningStore,
} from '../stores/useRunningStore';
import type {
  RunningSessionStatus,
} from '../types';
import type {
  RouteWarningPoint,
} from '../services/safety/routeSafetyService';
import {
  createRunningRecordPayload,
} from '../features/records/utils/createRunningRecordPayload';

type RunningActiveScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'RunningActive'
  >;

const EMPTY_WARNING_POINTS:
  RouteWarningPoint[] = [];
const EMPTY_ROUTE_COORDINATES: [] = [];
const EMPTY_NAVIGATION_STEPS: [] = [];

function canFinishSession(
  status:
    | RunningSessionStatus
    | undefined,
): boolean {
  return (
    status === 'running' ||
    status === 'paused'
  );
}

export function RunningActiveScreen({
  navigation,
  route,
}: RunningActiveScreenProps) {
  const runningData =
    useRunningSession();
  const {
    preferences,
    isHydrated:
      settingsAreHydrated,
  } = useSettingsPreferences();

  const stopRequestPending =
    useRef(false);

  const currentLocation =
    runningData.actualRoute.length >
    0
      ? runningData.actualRoute[
          runningData.actualRoute
            .length - 1
        ]
      : null;
  const warningPoints =
    route.params?.warningPoints ??
    EMPTY_WARNING_POINTS;
  const navigationProgress =
    useNavigationProgress({
      routeId:
        route.params?.routeId,
      routeCoordinates:
        route.params
          ?.routeCoordinates ??
        EMPTY_ROUTE_COORDINATES,
      navigationSteps:
        route.params
          ?.navigationSteps ??
        EMPTY_NAVIGATION_STEPS,
      currentLocation,
    });
  const currentNavigationStep =
    navigationProgress.currentStep;
  const turnDistanceM =
    navigationProgress.distanceToStepM;
  const turnDirection =
    !navigationProgress
      .isLocationAccuracyUsable ||
    (turnDistanceM !== null &&
      turnDistanceM > 80)
      ? 'straight'
      : currentNavigationStep
          ?.maneuver ??
        'straight';
  const turnInstruction =
    navigationProgress.hasArrived
      ? '목적지에 도착했습니다.'
      : !navigationProgress
            .isLocationAccuracyUsable
        ? 'GPS 정확도를 확인하고 있습니다.'
        : turnDistanceM !== null &&
            turnDistanceM > 80
          ? '다음 안내 지점까지 직진하세요.'
      : currentNavigationStep
          ?.instruction ??
        '길 안내를 준비하고 있습니다.';

  const {
    announceSessionFinish,
  } = useRunningVoiceGuide({
    sessionId: runningData.sessionId,
    routeId:
      route.params?.routeId ?? null,
    status: runningData.status,
    distanceM: runningData.distanceM,
    remainingDistanceM:
      runningData.remainingDistanceM,
    targetDistanceM:
      runningData.targetDistanceM,
    currentLocation,
    locationAccuracyM:
      currentLocation?.accuracyM,
    currentNavigationStep,
    navigationDistanceM:
      turnDistanceM,
    warningPoints,
    voiceGuidanceEnabled:
      settingsAreHydrated &&
      preferences.voiceGuide.enabled,
    voiceGuidanceReady:
      settingsAreHydrated,
    turnGuidanceEnabled:
      preferences.voiceGuide
        .turnGuidanceEnabled,
    remainingDistanceEnabled:
      preferences.voiceGuide
        .remainingDistanceEnabled,
  });

  const theme = useMemo(
    () =>
      getGuidanceTheme(
        turnDistanceM,
      ),
    [turnDistanceM],
  );

  function handlePauseToggle() {
    const runningStore =
      useRunningStore.getState();
    const status =
      runningStore.activeSession
        ?.status;

    if (status === 'running') {
      const pausedAtMs =
        Date.now();

      runningStore.syncElapsedTime(
        pausedAtMs,
      );
      runningStore.pauseSession(
        pausedAtMs,
      );
      return;
    }

    if (status === 'paused') {
      runningStore.resumeSession();
    }
  }

  useEffect(() => {
    const hasReachedGoal =
      runningData.status ===
        'running' &&
      runningData.targetDistanceM >
        0 &&
      runningData.distanceM >=
        runningData.targetDistanceM;

    if (
      !hasReachedGoal ||
      stopRequestPending.current
    ) {
      return;
    }

    stopRequestPending.current =
      true;

    const runningStore =
      useRunningStore.getState();

    if (
      !canFinishSession(
        runningStore.activeSession
          ?.status,
      )
    ) {
      stopRequestPending.current =
        false;
      return;
    }

    const record =
      runningStore.finishSession();

    if (record === null) {
      stopRequestPending.current =
        false;
      return;
    }

    navigation.replace(
      'RunningGoalComplete',
      {
        recordId: record.id,
      },
    );
  }, [
    navigation,
    runningData.distanceM,
    runningData.status,
    runningData.targetDistanceM,
  ]);
  /**
   * 사용자가 직접 정지 버튼을 누른 경우입니다.
   *
   * 목표 거리를 달성한 것이 아니므로
   * 목표 달성 화면을 거치지 않고
   * 기록 요약 화면으로 바로 이동합니다.
   */
  function handleStopRunning() {
    const status =
      useRunningStore.getState()
        .activeSession?.status;

    if (
      stopRequestPending.current ||
      !canFinishSession(status)
    ) {
      return;
    }

    stopRequestPending.current =
      true;

    Alert.alert(
      '러닝을 종료할까요?',
      '현재까지 측정된 기록으로 러닝을 종료합니다.',
      [
        {
          text: '계속 달리기',
          style: 'cancel',
          onPress: () => {
            stopRequestPending.current =
              false;
          },
        },
        {
          text: '종료',
          style: 'destructive',
          onPress: () => {
            const runningStore =
              useRunningStore.getState();

            if (
              !canFinishSession(
                runningStore
                  .activeSession
                  ?.status,
              )
            ) {
              stopRequestPending.current =
                false;
              return;
            }

            const record =
              runningStore.finishSession();

            if (record === null) {
              stopRequestPending.current =
                false;
              return;
            }

            announceSessionFinish();

            navigation.replace(
              'RunningRecordSummary',
              {
                recordId: record.id,
                record:
                  createRunningRecordPayload(
                    record,
                  ),
              },
            );
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          stopRequestPending.current =
            false;
        },
      },
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor:
            theme.backgroundColor,
        },
      ]}
    >
      <StatusBar
        backgroundColor={
          theme.backgroundColor
        }
        barStyle={
          theme.foregroundColor ===
          '#FFFFFF'
            ? 'light-content'
            : 'dark-content'
        }
      />

      <View style={styles.container}>
        <RunningLiveStats
          color={
            theme.foregroundColor
          }
          data={runningData}
        />

        <TurnDirectionGuide
          color={
            theme.foregroundColor
          }
          direction={turnDirection}
          distanceM={turnDistanceM}
          instruction={
            turnInstruction
          }
        />

        {(runningData.locationErrorMessage ||
          navigationProgress.isOffRoute) && (
          <View
            accessibilityLiveRegion="polite"
            style={styles.locationNotice}
          >
            <Text
              style={
                styles.locationNoticeText
              }
            >
              {runningData.locationErrorMessage ??
                '경로에서 벗어났습니다. 표시된 코스로 돌아와 주세요.'}
            </Text>
          </View>
        )}

        <RunningControls
          color={
            theme.foregroundColor
          }
          isPaused={
            runningData.status ===
            'paused'
          }
          onPauseToggle={
            handlePauseToggle
          }
          onStop={
            handleStopRunning
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  locationNotice: {
    position: 'absolute',
    top: 180,
    right: 24,
    left: 24,
    zIndex: 4,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor:
      'rgba(17,17,17,0.82)',
  },
  locationNoticeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
});
