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
  BackHandler,
  PanResponder,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  getBottomNavigationHeight,
} from '../features/home/components/BottomNavigation';

import {
  HomeRecordsSheet,
} from '../features/home/components/HomeRecordsSheet';
import type {
  RecordsSheetMode,
} from '../features/home/components/HomeRecordsSheet';

import {
  HOME_DESIGN_WIDTH,
  HomeCanvas,
} from '../features/home/components/HomeCanvas';

import {
  getDailyHomeCoachMessage,
} from '../features/home/data/homeCoachMessages';
import {
  createRuleBasedCoachPlanSummary,
} from '../features/coach/data/coachPlanSummary';
import {
  calculateWeeklyRunningStats,
} from '../features/records/utils/weeklyRunningStats';
import {
  useCoachStore,
} from '../stores/useCoachStore';

import {
  useRunningStore,
} from '../stores/useRunningStore';

import {
  createRunningRecordPayload,
} from '../features/records/utils/createRunningRecordPayload';
import type {
  RunningRecordListItem,
} from '../features/records/types/runningRecordList';

import type {
  RootStackParamList,
  RunningRecordPayload,
} from '../navigation/types';

type MainScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'Main'
  >;

const RECORDS_SHEET_TOP = 24;
const RECORDS_DRAG_THRESHOLD = 70;

export function MainScreen({
  navigation,
}: MainScreenProps) {
  const {
    width: screenWidth,
    height: screenHeight,
  } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const recordsSheetHeight =
    screenHeight -
    RECORDS_SHEET_TOP;
  const bottomNavigationHeight =
    getBottomNavigationHeight(
      screenWidth,
      insets.bottom,
    );
  const recordsCollapsedY =
    recordsSheetHeight -
    bottomNavigationHeight;
  const recordsTranslateY = useRef(
    new Animated.Value(
      recordsCollapsedY,
    ),
  ).current;
  const recordsGestureStartY =
    useRef(recordsCollapsedY);
  const [
    isRecordsExpanded,
    setIsRecordsExpanded,
  ] = useState(false);
  const [
    recordsSheetMode,
    setRecordsSheetMode,
  ] = useState<RecordsSheetMode>('list');
  const [
    selectedRecord,
    setSelectedRecord,
  ] = useState<RunningRecordPayload | null>(
    null,
    
  );
  const storedRecords =
  useRunningStore(
    (state) => state.records,
  );
  const selectedCoachLevel =
    useCoachStore(
      (state) =>
        state.selectedLevel,
    );

const runningRecords =
  useMemo<RunningRecordListItem[]>(
    () =>
      storedRecords.map(
        (record) => ({
          id: record.id,
          courseLocation:
            '현재 위치 주변 코스',
          record:
            createRunningRecordPayload(
              record,
            ),
        }),
      ),
    [storedRecords],
  );
  const sideNavigationOpacity =
    recordsTranslateY.interpolate({
      inputRange: [
        0,
        recordsCollapsedY * 0.65,
        recordsCollapsedY,
      ],
      outputRange: [
        0,
        0.05,
        1,
      ],
      extrapolate: 'clamp',
    });

  /*
   * 메인 비주얼은 화면 너비를 모두 사용하고,
   * 세로 여유는 HomeCanvas 안의 요소 간격만
   * 조정하는 데 사용합니다.
   */
  const scale =
    screenWidth / HOME_DESIGN_WIDTH;
  const canvasWidth = screenWidth;
  const canvasHeight = screenHeight;

  const coachPlan = useMemo(
    () =>
      createRuleBasedCoachPlanSummary(
        selectedCoachLevel,
      ),
    [selectedCoachLevel],
  );
  const weeklyStats = useMemo(
    () =>
      calculateWeeklyRunningStats(
        storedRecords,
      ),
    [storedRecords],
  );
  const todayGoalKm =
    coachPlan.recommendedDistanceKm;

  const speechMessage =
    getDailyHomeCoachMessage({
      category: 'goal',
      goalKm: todayGoalKm,
    });

  function handlePressStart() {
    navigation.navigate(
      'Loading',
      {
        mode: 'course',
      },
    );
  }

  function handlePressCoach() {
    navigation.navigate(
      'Coach',
      undefined,
      {
        pop: true,
      },
    );
  }

  function handlePressMenu() {
    navigation.navigate('Menu');
  }

  function expandRecordsSheet() {
    setIsRecordsExpanded(true);
    Animated.spring(
      recordsTranslateY,
      {
        toValue: 0,
        damping: 22,
        stiffness: 210,
        mass: 0.8,
        useNativeDriver: true,
      },
    ).start();
  }

  function collapseRecordsSheet() {
    setIsRecordsExpanded(false);
    Animated.spring(
      recordsTranslateY,
      {
        toValue:
          recordsCollapsedY,
        damping: 22,
        stiffness: 210,
        mass: 0.8,
        useNativeDriver: true,
      },
    ).start(({ finished }) => {
      if (
        finished &&
        recordsSheetMode === 'detail'
      ) {
        setRecordsSheetMode('list');
        setSelectedRecord(null);
      }
    });
  }

  const recordsPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (
          _,
          gesture,
        ) =>
          Math.abs(gesture.dy) > 4,
        onPanResponderGrant: () => {
          recordsTranslateY.stopAnimation(
            (value) => {
              recordsGestureStartY.current =
                value;
            },
          );
        },
        onPanResponderMove: (
          _,
          gesture,
        ) => {
          recordsTranslateY.setValue(
            Math.max(
              0,
              Math.min(
                recordsCollapsedY,
                recordsGestureStartY.current +
                  gesture.dy,
              ),
            ),
          );
        },
        onPanResponderRelease: (
          _,
          gesture,
        ) => {
          if (
            gesture.dy <
            -RECORDS_DRAG_THRESHOLD
          ) {
            expandRecordsSheet();
            return;
          }

          if (
            gesture.dy >
            RECORDS_DRAG_THRESHOLD
          ) {
            collapseRecordsSheet();
            return;
          }

          if (isRecordsExpanded) {
            expandRecordsSheet();
            return;
          }

          collapseRecordsSheet();
        },
        onPanResponderTerminate: () => {
          if (isRecordsExpanded) {
            expandRecordsSheet();
            return;
          }

          collapseRecordsSheet();
        },
      }),
    [
      isRecordsExpanded,
      recordsSheetMode,
      recordsCollapsedY,
      recordsTranslateY,
    ],
  );

  useEffect(() => {
    const subscription =
      BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (!isRecordsExpanded) {
            return false;
          }

          collapseRecordsSheet();
          return true;
        },
      );

    return () => {
      subscription.remove();
    };
  }, [
    isRecordsExpanded,
    recordsSheetMode,
    recordsCollapsedY,
    recordsTranslateY,
  ]);

  function handlePressRecord(
    item: RunningRecordListItem,
  ) {
    setSelectedRecord(item.record);
    setRecordsSheetMode('detail');
  }

  return (
    <View style={styles.screen}>
      <StatusBar hidden />

      <View
        style={[
          styles.canvasContainer,
          {
            width: canvasWidth,
            height: canvasHeight,
          },
        ]}
      >
        <HomeCanvas
          scale={scale}
          height={canvasHeight}
          bottomNavigationHeight={
            bottomNavigationHeight
          }
          currentKm={
            weeklyStats.completedKm
          }
          goalKm={
            coachPlan.weeklyGoalKm
          }
          speechMessage={
            speechMessage
          }
        />
      </View>

      <Animated.View
        style={[
          styles.recordsSheet,
          {
            top:
              RECORDS_SHEET_TOP,
            height:
              recordsSheetHeight,
            transform: [
              {
                translateY:
                  recordsTranslateY,
              },
            ],
          },
        ]}
      >
        <HomeRecordsSheet
          mode={recordsSheetMode}
          selectedRecord={selectedRecord}
          isExpanded={
            isRecordsExpanded
          }
          panHandlers={
            recordsPanResponder.panHandlers
          }
          records={runningRecords}
          sideNavigationOpacity={
            sideNavigationOpacity
          }
          onPressCoach={
            handlePressCoach
          }
          onPressMenu={
            handlePressMenu
          }
          onPressStart={
            handlePressStart
          }
          onPressRecord={
            handlePressRecord
          }
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#FFFEFE',
  },

  canvasContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
    backgroundColor: '#F3F3F3',
  },

  recordsSheet: {
    position: 'absolute',
    right: 0,
    left: 0,
    zIndex: 100,
    overflow: 'visible',
  },
});
