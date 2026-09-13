import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LiveRunningMap } from '../features/map/components/LiveRunningMap';
import type { NextTurnMarker } from '../features/map/components/LiveRunningMap';
import type { RunningRoute } from '../features/map/data/runningRoute';
import { createRunningRecordPayload } from '../features/records/utils/createRunningRecordPayload';
import { useNavigationProgress } from '../features/running/hooks/useNavigationProgress';
import { useRunningSession } from '../features/running/hooks/useRunningSession';
import { useRunningVoiceGuide } from '../features/running/hooks/useRunningVoiceGuide';
import { useSettingsPreferences } from '../features/settings/hooks/useSettingsPreferences';
import type { RootStackParamList } from '../navigation/types';
import { useRunningStore } from '../stores/useRunningStore';
import type { RunningSessionStatus } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'RunningActive'>;
const EMPTY_COORDINATES: [] = [];
const EMPTY_STEPS: [] = [];
const EMPTY_WARNINGS: [] = [];

function canFinish(status: RunningSessionStatus | undefined) {
  return status === 'running' || status === 'paused';
}

function formatClock(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatDistance(distanceM: number): string {
  return `${(Number.isFinite(distanceM) ? Math.max(0, distanceM) / 1000 : 0).toFixed(2)} km`;
}

export function RunningActiveScreen({ navigation, route }: Props) {
  const runningData = useRunningSession();
  const { preferences, isHydrated: settingsAreHydrated } = useSettingsPreferences();
  const stopPendingRef = useRef(false);
  const [followLocation, setFollowLocation] = useState(true);
  const [focusRequestKey, setFocusRequestKey] = useState(1);
  const params = route.params;
  const routeCoordinates = params?.routeCoordinates ?? EMPTY_COORDINATES;
  const navigationSteps = params?.navigationSteps ?? EMPTY_STEPS;
  const warningPoints = params?.warningPoints ?? EMPTY_WARNINGS;
  const currentLocation = runningData.actualRoute.at(-1) ?? null;

  const mapRoute = useMemo<RunningRoute | null>(() => {
    if (!params || routeCoordinates.length < 2) return null;
    return {
      id: params.routeId,
      keyword: '안전',
      source: 'ors',
      coordinates: [...routeCoordinates],
      navigationSteps: [...navigationSteps],
      cautionPoints: warningPoints.map((point) => [
        point.coordinate[0],
        point.coordinate[1],
      ]),
      generatedAtMs: params.generatedAtMs,
    };
  }, [navigationSteps, params, routeCoordinates, warningPoints]);

  const progress = useNavigationProgress({
    routeId: params?.routeId,
    routeCoordinates,
    navigationSteps,
    currentLocation,
  });
  const guidanceStep = progress.isOffRoute ? null : progress.currentStep;
  const guidanceDistanceM = progress.isOffRoute ? null : progress.distanceToStepM;
  const instruction = progress.isOffRoute
    ? '경로에서 벗어났습니다. 표시된 코스로 돌아와 주세요.'
    : progress.hasArrived
      ? '목적지에 도착했습니다.'
      : !progress.isLocationAccuracyUsable
        ? 'GPS 정확도를 확인하고 있습니다.'
        : guidanceStep?.instruction ?? '길 안내를 준비하고 있습니다.';

  const nextTurnMarker = useMemo<NextTurnMarker | null>(() => {
    if (!guidanceStep || guidanceStep.maneuver === 'arrive') return null;
    return {
      coordinate: [guidanceStep.coordinate.longitude, guidanceStep.coordinate.latitude],
      label: guidanceDistanceM === null ? '다음 회전' : `${guidanceDistanceM}m`,
      color: '#4E6A01',
      direction: guidanceStep.maneuver,
    };
  }, [guidanceDistanceM, guidanceStep]);

  const { announceSessionFinish } = useRunningVoiceGuide({
    sessionId: runningData.sessionId,
    routeId: params?.routeId ?? null,
    status: runningData.status,
    distanceM: runningData.distanceM,
    remainingDistanceM: runningData.remainingDistanceM,
    targetDistanceM: runningData.targetDistanceM,
    currentLocation,
    locationAccuracyM: currentLocation?.accuracyM,
    currentNavigationStep: guidanceStep,
    navigationDistanceM: guidanceDistanceM,
    warningPoints,
    voiceGuidanceEnabled: settingsAreHydrated && preferences.voiceGuide.enabled,
    voiceGuidanceReady: settingsAreHydrated,
    turnGuidanceEnabled: preferences.voiceGuide.turnGuidanceEnabled,
    remainingDistanceEnabled: preferences.voiceGuide.remainingDistanceEnabled,
  });

  function finishAndNavigate(goalReached: boolean) {
    const store = useRunningStore.getState();
    if (!canFinish(store.activeSession?.status)) {
      stopPendingRef.current = false;
      return;
    }
    const record = store.finishSession();
    if (!record) {
      stopPendingRef.current = false;
      return;
    }
    announceSessionFinish();
    if (goalReached) {
      navigation.replace('RunningGoalComplete', { recordId: record.id });
    } else {
      navigation.replace('RunningRecordSummary', {
        recordId: record.id,
        record: createRunningRecordPayload(record),
      });
    }
  }

  useEffect(() => {
    if (runningData.status !== 'running' || runningData.targetDistanceM <= 0 ||
        runningData.distanceM < runningData.targetDistanceM || stopPendingRef.current) return;
    stopPendingRef.current = true;
    finishAndNavigate(true);
  }, [runningData.distanceM, runningData.status, runningData.targetDistanceM]);

  function handlePauseToggle() {
    const store = useRunningStore.getState();
    if (store.activeSession?.status === 'running') {
      const pausedAtMs = Date.now();
      store.syncElapsedTime(pausedAtMs);
      store.pauseSession(pausedAtMs);
    } else if (store.activeSession?.status === 'paused') {
      store.resumeSession();
    }
  }

  function handleStop() {
    if (stopPendingRef.current || !canFinish(useRunningStore.getState().activeSession?.status)) return;
    stopPendingRef.current = true;
    Alert.alert('러닝을 종료할까요?', '현재까지 측정된 기록으로 러닝을 종료합니다.', [
      { text: '계속 달리기', style: 'cancel', onPress: () => { stopPendingRef.current = false; } },
      { text: '종료', style: 'destructive', onPress: () => finishAndNavigate(false) },
    ], { cancelable: true, onDismiss: () => { stopPendingRef.current = false; } });
  }

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <LiveRunningMap
        route={mapRoute}
        showRoute
        targetDistanceKm={Math.max(1, runningData.targetDistanceM / 1000)}
        centerCoordinate={params?.startCoordinate}
        locationIsLoading={runningData.locationTrackingStatus === 'locating'}
        locationStatus={currentLocation ? 'ready' : 'loading'}
        warningPoints={warningPoints}
        keywordPlaces={[]}
        onSelectKeywordPlace={() => undefined}
        navigationLocation={currentLocation}
        nextTurnMarker={nextTurnMarker}
        followNavigationLocation={followLocation}
        focusRequestKey={focusRequestKey}
        onUserMapInteraction={() => setFollowLocation(false)}
      />

      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.statsCard}>
          <View style={styles.stat}><Text style={styles.statLabel}>거리</Text><Text style={styles.statValue}>{formatDistance(runningData.distanceM)}</Text></View>
          <View style={styles.divider} />
          <View style={styles.stat}><Text style={styles.statLabel}>남은 거리</Text><Text style={styles.statValue}>{formatDistance(runningData.remainingDistanceM)}</Text></View>
          <View style={styles.divider} />
          <View style={styles.stat}><Text style={styles.statLabel}>시간</Text><Text style={styles.statValue}>{formatClock(runningData.elapsedSeconds)}</Text></View>
        </View>

        <View style={styles.guidanceCard}>
          <Ionicons name={progress.isOffRoute ? 'warning-outline' : 'navigate'} size={28} color="#4E6A01" />
          <View style={styles.guidanceCopy}>
            <Text numberOfLines={2} style={styles.instruction}>{instruction}</Text>
            <Text style={styles.guidanceMeta}>{guidanceDistanceM === null ? '거리 계산 중' : `다음 안내 ${guidanceDistanceM}m`} · 평균 페이스 {runningData.pace}</Text>
          </View>
        </View>

        {(runningData.locationErrorMessage || progress.isOffRoute) && (
          <View accessibilityLiveRegion="polite" style={styles.notice}>
            <Text style={styles.noticeText}>{runningData.locationErrorMessage ?? instruction}</Text>
          </View>
        )}

        <View style={styles.bottomRow}>
          <Pressable accessibilityLabel="현재 위치로 이동" onPress={() => { setFollowLocation(true); setFocusRequestKey((key) => key + 1); }} style={styles.locationButton}>
            <Ionicons name="locate" size={25} color="#4E6A01" />
          </Pressable>
          <View style={styles.controls}>
            <Pressable accessibilityLabel={runningData.status === 'paused' ? '러닝 다시 시작' : '러닝 일시정지'} onPress={handlePauseToggle} style={styles.pauseButton}>
              <Ionicons name={runningData.status === 'paused' ? 'play' : 'pause'} size={30} color="#FFFFFF" />
              <Text style={styles.controlText}>{runningData.status === 'paused' ? '재개' : '일시정지'}</Text>
            </Pressable>
            <Pressable accessibilityLabel="러닝 종료" onPress={handleStop} style={styles.stopButton}>
              <Ionicons name="stop" size={27} color="#FFFFFF" />
              <Text style={styles.controlText}>종료</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F3F3' },
  overlay: { ...StyleSheet.absoluteFill, paddingHorizontal: 14, justifyContent: 'space-between' },
  statsCard: { marginTop: 8, minHeight: 76, flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.94)', elevation: 5 },
  stat: { flex: 1, alignItems: 'center' }, statLabel: { color: '#747474', fontSize: 11, fontWeight: '700' },
  statValue: { marginTop: 5, color: '#111111', fontSize: 16, fontWeight: '800' },
  divider: { width: 1, height: 34, backgroundColor: '#E4E4E4' },
  guidanceCard: { position: 'absolute', top: 104, right: 14, left: 14, minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.95)', elevation: 5 },
  guidanceCopy: { flex: 1 }, instruction: { color: '#111111', fontSize: 17, fontWeight: '800', lineHeight: 22 },
  guidanceMeta: { marginTop: 4, color: '#626262', fontSize: 12, fontWeight: '600' },
  notice: { position: 'absolute', top: 192, right: 22, left: 22, padding: 10, borderRadius: 12, backgroundColor: 'rgba(17,17,17,0.84)' },
  noticeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  bottomRow: { marginTop: 'auto', marginBottom: 8, gap: 10 },
  locationButton: { width: 48, height: 48, alignSelf: 'flex-end', alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#FFFFFF', elevation: 5 },
  controls: { minHeight: 72, flexDirection: 'row', gap: 10, padding: 8, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.96)', elevation: 6 },
  pauseButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, backgroundColor: '#6F9700' },
  stopButton: { width: 112, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 16, backgroundColor: '#252525' },
  controlText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
