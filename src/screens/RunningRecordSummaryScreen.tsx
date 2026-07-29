import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Ionicons,
} from '@expo/vector-icons';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  Animated,
  BackHandler,
  PanResponder,
  Pressable,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  RecordAnalysisPanel,
} from '../features/records/components/RecordAnalysisPanel';
import {
  RecordCoachCard,
} from '../features/records/components/RecordCoachCard';
import {
  RecordRouteMap,
} from '../features/records/components/RecordRouteMap';
import type {
  RootStackParamList,
  RunningRecordPayload,
} from '../navigation/types';
import {
  createRunningRecordPayload,
} from '../features/records/utils/createRunningRecordPayload';
import {
  RUNNING_PACE_UNAVAILABLE,
} from '../features/running/utils/runningSessionCalculations';

import {
  useRunningStore,
} from '../stores/useRunningStore';

const PANEL_DRAG_THRESHOLD = 70;

type RunningRecordSummaryScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'RunningRecordSummary'
  >;

const EMPTY_RUNNING_RECORD: RunningRecordPayload = {
  date: '----.--.--',
  timeRange: '00:00:00 - 00:00:00',
  distanceKm: 0,
  averagePace:
    RUNNING_PACE_UNAVAILABLE,
  durationSeconds: 0,
  heartRate: null,
  elevationM: null,
  cadenceSpm: null,
  splits: [],
  plannedRouteCoordinates: [],
  actualRouteCoordinates: [],
  routeCoordinates: [],
};

export function RunningRecordSummaryScreen({
  navigation,
  route: navigationRoute,
}: RunningRecordSummaryScreenProps) {
  const { height: screenHeight } =
    useWindowDimensions();
  const insets = useSafeAreaInsets();
  const panelHeight = Math.round(
    (screenHeight - insets.top) *
      0.78,
  );
  const panelCollapsedY =
    panelHeight -
    Math.max(88, insets.bottom + 64);
  const recordId =
  navigationRoute.params.recordId;

const storedRecord =
  useRunningStore((state) =>
    state.records.find(
      (runningRecord) =>
        runningRecord.id === recordId,
    ),
  );
const record = useMemo(
  () => {
    if (
      navigationRoute.params.record
    ) {
      return navigationRoute.params
        .record;
    }

    if (storedRecord) {
      return createRunningRecordPayload(
        storedRecord,
      );
    }

    return EMPTY_RUNNING_RECORD;
  },
  [
    navigationRoute.params.record,
    storedRecord,
  ],
);
  const panelTranslateY = useRef(
    new Animated.Value(
      panelCollapsedY,
    ),
  ).current;
  const gestureStartY = useRef(
    panelCollapsedY,
  );
  const [isExpanded, setIsExpanded] =
    useState(false);

  useEffect(() => {
    if (!isExpanded) {
      panelTranslateY.setValue(
        panelCollapsedY,
      );
    }
  }, [
    isExpanded,
    panelCollapsedY,
    panelTranslateY,
  ]);

  const returnToMain = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
        },
      ],
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const subscription =
        BackHandler.addEventListener(
          'hardwareBackPress',
          () => {
            returnToMain();
            return true;
          },
        );

      return () => {
        subscription.remove();
      };
    }, [returnToMain]),
  );

  function movePanel(expanded: boolean) {
    setIsExpanded(expanded);
    Animated.spring(panelTranslateY, {
      toValue: expanded
        ? 0
        : panelCollapsedY,
      damping: 22,
      stiffness: 210,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (
          _,
          gesture,
        ) =>
          Math.abs(gesture.dy) > 4,
        onPanResponderGrant: () => {
          panelTranslateY.stopAnimation(
            (value) => {
              gestureStartY.current = value;
            },
          );
        },
        onPanResponderMove: (_, gesture) => {
          panelTranslateY.setValue(
            Math.max(
              0,
              Math.min(
                panelCollapsedY,
                gestureStartY.current +
                  gesture.dy,
              ),
            ),
          );
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < -PANEL_DRAG_THRESHOLD) {
            movePanel(true);
            return;
          }

          if (gesture.dy > PANEL_DRAG_THRESHOLD) {
            movePanel(false);
            return;
          }

          movePanel(isExpanded);
        },
        onPanResponderTerminate: () => {
          movePanel(isExpanded);
        },
      }),
    [
      isExpanded,
      panelCollapsedY,
      panelTranslateY,
    ],
  );

  return (
    <View style={styles.screen}>
      <StatusBar
        backgroundColor="#F3F3F3"
        barStyle="dark-content"
      />

      <RecordRouteMap
        coordinates={
          record.plannedRouteCoordinates
        }
        actualCoordinates={
          record.actualRouteCoordinates
        }
        recordId={
          recordId ?? 'unavailable'
        }
      />

      <Pressable
        accessibilityLabel="뒤로가기"
        accessibilityRole="button"
        hitSlop={12}
        onPress={returnToMain}
        style={[
          styles.backButton,
          {
            top: insets.top + 8,
          },
        ]}
      >
        <Ionicons
          color="#111111"
          name="arrow-back"
          size={30}
        />
      </Pressable>

      <RecordCoachCard record={record} />

      <Animated.View
        style={[
          styles.panel,
          {
            height: panelHeight,
            transform: [
              { translateY: panelTranslateY },
            ],
          },
        ]}
      >
        <RecordAnalysisPanel
          record={record}
          isExpanded={isExpanded}
          panHandlers={panResponder.panHandlers}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#F3F3F3',
  },
  backButton: {
    position: 'absolute',
    left: 18,
    zIndex: 10,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  panel: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
    overflow: 'hidden',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
});
