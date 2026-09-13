import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
const DIRECTION_ARROW_IMAGE = require('../assets/icons/running/running-direction-arrow.png');
const TURN_ROTATION = {
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
} as const;

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
  const { height } = useWindowDimensions();
  const { preferences, isHydrated: settingsAreHydrated, updateVoiceGuide } = useSettingsPreferences();
  const stopPendingRef = useRef(false);
  const [followLocation, setFollowLocation] = useState(true);
  const [focusRequestKey, setFocusRequestKey] = useState(1);
  const [controlsLocked, setControlsLocked] = useState(false);
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
  const direction = guidanceStep?.maneuver ?? 'straight';
  const targetDistanceM = Math.max(0, runningData.targetDistanceM);
  const progressRatio = targetDistanceM > 0
    ? Math.min(1, Math.max(0, runningData.distanceM / targetDistanceM))
    : 0;
  const bottomPanelHeight = Math.min(330, Math.max(270, height * 0.36));

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
        <View style={styles.guidanceCard}>
          <View style={styles.turnSummary}>
            {progress.isOffRoute ? (
              <Ionicons name="warning-outline" size={45} color="#FFFFFF" />
            ) : (
              <Image
                fadeDuration={0}
                resizeMode="contain"
                source={DIRECTION_ARROW_IMAGE}
                style={[styles.directionArrow, { transform: [{ rotate: `${TURN_ROTATION[direction]}deg` }] }]}
              />
            )}
            <Text style={styles.turnDistance}>
              {guidanceDistanceM === null ? '--' : `${guidanceDistanceM}M`}
            </Text>
          </View>
          <View style={styles.guidanceDivider} />
          <View style={styles.guidanceCopy}>
            <Text numberOfLines={2} style={styles.instruction}>{instruction}</Text>
            <Text style={styles.guidanceMeta}>다음 안내 지점까지</Text>
          </View>
          <View pointerEvents="none" style={styles.menuGlyph}>
            <View style={styles.menuLine} /><View style={styles.menuLine} /><View style={styles.menuLine} />
          </View>
        </View>

        {(runningData.locationErrorMessage || progress.isOffRoute) && (
          <View accessibilityLiveRegion="polite" style={styles.notice}>
            <Text style={styles.noticeText}>{runningData.locationErrorMessage ?? instruction}</Text>
          </View>
        )}

        <View style={[styles.mapButtons, { bottom: bottomPanelHeight + 18 }]}>
          <Pressable
            accessibilityLabel={preferences.voiceGuide.enabled ? '음성 안내 끄기' : '음성 안내 켜기'}
            disabled={!settingsAreHydrated}
            onPress={() => updateVoiceGuide({
              ...preferences.voiceGuide,
              enabled: !preferences.voiceGuide.enabled,
            })}
            style={styles.mapButton}
          >
            <Ionicons name={preferences.voiceGuide.enabled ? 'volume-high' : 'volume-mute'} size={24} color="#4E6A01" />
          </Pressable>
          <Pressable accessibilityLabel="현재 위치로 이동" onPress={() => { setFollowLocation(true); setFocusRequestKey((key) => key + 1); }} style={styles.mapButton}>
            <Ionicons name="locate" size={25} color="#4E6A01" />
          </Pressable>
        </View>

        <View style={[styles.runningPanel, { height: bottomPanelHeight }]}>
          <View style={styles.panelSummary}>
            <View style={styles.elapsedBlock}>
              <Text style={styles.runningStatus}>{runningData.status === 'paused' ? '일시정지' : '러닝 중'}</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.elapsedTime}>{formatClock(runningData.elapsedSeconds)}</Text>
              <Text style={styles.elapsedLabel}>경과 시간</Text>
            </View>
            <View style={styles.progressBlock}>
              <Text style={styles.progressDistance}>
                {(Math.max(0, runningData.distanceM) / 1000).toFixed(2)} km
                <Text style={styles.progressTarget}> / {(targetDistanceM / 1000).toFixed(1)} km</Text>
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
              </View>
              <Text style={styles.progressLabel}>목표 거리</Text>
            </View>
          </View>

          <View style={styles.panelDivider} />

          <View style={styles.metricsRow}>
            <View style={styles.metric}><Ionicons name="heart-outline" size={20} color="#8EA0AA" /><Text style={styles.metricValue}>{runningData.heartRate ?? '--'}</Text><Text style={styles.metricLabel}>심박수</Text></View>
            <View style={styles.metric}><Ionicons name="speedometer-outline" size={20} color="#8EA0AA" /><Text style={styles.metricValue}>{runningData.pace}</Text><Text style={styles.metricLabel}>평균 페이스</Text></View>
            <View style={styles.metric}><Ionicons name="map-outline" size={20} color="#8EA0AA" /><Text style={styles.metricValue}>{formatDistance(runningData.distanceM)}</Text><Text style={styles.metricLabel}>거리</Text></View>
          </View>

          <View style={styles.controlsRow}>
            <View style={styles.controlItem}>
              <Pressable accessibilityLabel={controlsLocked ? '컨트롤 잠금 해제' : '컨트롤 잠금'} onPress={() => setControlsLocked((locked) => !locked)} style={styles.sideControl}>
                <Ionicons name={controlsLocked ? 'lock-closed' : 'lock-open-outline'} size={24} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.controlLabel}>{controlsLocked ? '잠금 해제' : '잠금'}</Text>
            </View>
            <View style={styles.controlItem}>
              <Pressable disabled={controlsLocked} accessibilityLabel={runningData.status === 'paused' ? '러닝 다시 시작' : '러닝 일시정지'} onPress={handlePauseToggle} style={[styles.pauseButton, controlsLocked && styles.controlDisabled]}>
                <Ionicons name={runningData.status === 'paused' ? 'play' : 'pause'} size={34} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.controlLabel}>{runningData.status === 'paused' ? '재개' : '일시정지'}</Text>
            </View>
            <View style={styles.controlItem}>
              <Pressable disabled={controlsLocked} accessibilityLabel="러닝 종료" onPress={handleStop} style={[styles.sideControl, controlsLocked && styles.controlDisabled]}>
                <Ionicons name="stop" size={24} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.controlLabel}>종료</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F3F3' },
  overlay: { ...StyleSheet.absoluteFill, justifyContent: 'space-between' },
  guidanceCard: { height: 158, marginTop: 8, marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, borderRadius: 36, backgroundColor: '#7EAC00', elevation: 7, shadowColor: '#172100', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  turnSummary: { width: 82, alignItems: 'center', justifyContent: 'center' },
  directionArrow: { width: 54, height: 68, tintColor: '#FFFFFF' },
  turnDistance: { marginTop: 2, color: '#FFFFFF', fontSize: 23, fontWeight: '900', letterSpacing: -0.8 },
  guidanceDivider: { width: 1, height: 92, marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.42)' },
  guidanceCopy: { flex: 1, minWidth: 0 },
  instruction: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', lineHeight: 29, letterSpacing: -0.8 },
  guidanceMeta: { marginTop: 8, color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '700' },
  menuGlyph: { width: 25, marginLeft: 8, gap: 5, alignItems: 'flex-end' },
  menuLine: { width: 22, height: 3, borderRadius: 2, backgroundColor: '#FFFFFF' },
  notice: { position: 'absolute', top: 178, right: 22, left: 22, padding: 10, borderRadius: 12, backgroundColor: 'rgba(17,17,17,0.84)' },
  noticeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  mapButtons: { position: 'absolute', right: 18, gap: 10 },
  mapButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#FFFFFF', elevation: 5, shadowColor: '#111111', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.16, shadowRadius: 5 },
  runningPanel: { position: 'absolute', right: 0, bottom: 0, left: 0, paddingTop: 20, paddingHorizontal: 22, borderTopLeftRadius: 34, borderTopRightRadius: 34, backgroundColor: '#071824', elevation: 12 },
  panelSummary: { minHeight: 70, flexDirection: 'row', alignItems: 'center' },
  elapsedBlock: { flex: 1.05 },
  runningStatus: { color: '#8FC500', fontSize: 13, fontWeight: '800' },
  elapsedTime: { marginTop: 1, color: '#FFFFFF', fontSize: 34, fontWeight: '800', letterSpacing: -1.5 },
  elapsedLabel: { color: '#8EA0AA', fontSize: 11, fontWeight: '600' },
  progressBlock: { flex: 0.95, alignItems: 'flex-end' },
  progressDistance: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  progressTarget: { color: '#8EA0AA', fontSize: 12, fontWeight: '600' },
  progressTrack: { width: '100%', height: 7, marginTop: 12, overflow: 'hidden', borderRadius: 4, backgroundColor: '#263944' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#7EAC00' },
  progressLabel: { marginTop: 6, color: '#8EA0AA', fontSize: 11, fontWeight: '600' },
  panelDivider: { height: 1, marginTop: 10, backgroundColor: '#20333E' },
  metricsRow: { height: 70, flexDirection: 'row', alignItems: 'center' },
  metric: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  metricValue: { marginTop: 2, color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  metricLabel: { marginTop: 2, color: '#8EA0AA', fontSize: 10, fontWeight: '600' },
  controlsRow: { flex: 1, minHeight: 88, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 3 },
  controlItem: { width: 82, alignItems: 'center' },
  sideControl: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 25, backgroundColor: '#263944' },
  pauseButton: { width: 62, height: 62, marginTop: -6, alignItems: 'center', justifyContent: 'center', borderRadius: 31, backgroundColor: '#7EAC00', elevation: 4 },
  controlDisabled: { opacity: 0.36 },
  controlLabel: { marginTop: 7, color: '#D5DEE3', fontSize: 11, fontWeight: '700' },
});
