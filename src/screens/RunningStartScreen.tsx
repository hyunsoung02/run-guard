import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';


import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import {
  LinearGradient,
} from 'expo-linear-gradient';

import {
  Alert,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import {
  LiveRunningMap,
} from '../features/map/components/LiveRunningMap';
import {
  LngLat,
  RunningRoute,
  RouteKeyword,
} from '../features/map/data/runningRoute';
import {
  RunningKeywordPlaceDetail,
} from '../features/running/components/RunningKeywordPlaceDetail';
import {
  RouteSafetyDetailSheet,
} from '../features/running/components/RouteSafetyDetailSheet';
import {
  RouteWarningDetailSheet,
} from '../features/running/components/RouteWarningDetailSheet';
import {
  RunningStartMetricsRail,
} from '../features/running/components/RunningStartMetricsRail';
import {
  RunningStartSummary,
} from '../features/running/components/RunningStartSummary';
import {
  RunningStartTopControls,
} from '../features/running/components/RunningStartTopControls';
import {
  KEYWORD_MAIN_IMAGES,
  KEYWORD_MARKER_IMAGES,
} from '../features/running/data/runningStartOptions';
import type {
  DetailKeyword,
  KeywordPlace,
} from '../features/running/data/runningStartOptions';
import {
  getRunningTargetPace,
  getRunningTargetTime,
} from '../features/running/utils/runningStartFormatters';
import type {
  RootStackParamList,
} from '../navigation/types';
import {
  useRunningStore,
} from '../stores/useRunningStore';
import {
  generateRecommendedRoute,
} from '../services/routing/routeRecommendationService';
import type {
  RouteRecommendationResult,
} from '../services/routing/routeRecommendationService';
import {
  fetchOldmanAccidentZones,
  OldmanAccidentApiError,
} from '../services/safety/oldmanAccidentService';
import {
  isGwangmyeongRegion,
  resolveKakaoLegalRegion,
} from '../services/kakao/kakaoRegionService';

import type {
  OldmanAccidentRiskPoint,
} from '../services/safety/oldmanAccidentService';
import {
  getDistanceBetweenCoordinatesM,
} from '../services/safety/routeSafetyService';
import type {
  RouteSafetyEvaluation,
  SafetyEvaluationStatus,
} from '../services/safety/routeSafetyService';
import {
  isLocationUsable,
} from '../services/location/locationValidity';
import {
  searchNearbyRoutePlaces,
} from '../services/kakao/kakaoPlaceService';
import {
  selectCurrentLocation,
  selectEnsureFreshLocation,
  selectLocationErrorMessage,
  selectLocationStatus,
  useLocationStore,
} from '../stores/useLocationStore';

type RunningStartScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'RunningStart'
  >;

const TARGET_DISTANCE_KM = 5;
const KEYWORD_PLACE_MAX_DISTANCE_M =
  10_000;
const ROUTE_START_REFRESH_DISTANCE_M =
  50;

const GWANGMYEONG_ACCIDENT_REQUEST = {
  searchYearCd: '2024',
  siDo: '41',
  guGun: '210',
} as const;

type RouteLoadState = {
  requestKey: string | null;
  status:
    | 'idle'
    | 'loading'
    | 'available'
    | 'unavailable';
};

type RoutePreparationStatus =
  | 'idle'
  | 'locating'
  | 'generating'
  | 'ready'
  | 'error';

type MapDetailSheetType =
  | 'safety'
  | 'warnings'
  | null;

type KeywordSearchStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'error';

function isDetailKeyword(
  keyword: RouteKeyword,
): keyword is DetailKeyword {
  return (
    keyword === '공원' ||
    keyword === '야경' ||
    keyword === '카페'
  );
}

function createEmptySafetyEvaluation(
  status: SafetyEvaluationStatus,
): RouteSafetyEvaluation {
  return {
    status,
    score: null,
    grade: null,
    warningPoints: [],
    evaluatedAt: null,
  };
}

function isValidCoordinate(
  coordinate: LngLat | undefined,
): coordinate is LngLat {
  if (!coordinate) {
    return false;
  }

  const [longitude, latitude] =
    coordinate;

  return (
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90
  );
}

function calculateCoordinateDistanceM(
  first: LngLat,
  second: LngLat,
): number {
  return getDistanceBetweenCoordinatesM(
    first,
    second,
  );
}


export function RunningStartScreen({
  navigation,
  route: navigationRoute,
}: RunningStartScreenProps) {
  const selectedCourseOptions =
    navigationRoute.params;
  const targetDistanceKm =
    selectedCourseOptions
      ?.targetDistanceKm ??
    TARGET_DISTANCE_KM;
  const targetTime =
    getRunningTargetTime(
      targetDistanceKm,
    );
  const targetPace =
    getRunningTargetPace(
      targetDistanceKm,
    );
  const [
    selectedKeyword,
    setSelectedKeyword,
  ] = useState<RouteKeyword>('안전');

  const [
    selectedPlace,
    setSelectedPlace,
  ] = useState<KeywordPlace | null>(
    null,
  );
  const [
    keywordPlaces,
    setKeywordPlaces,
  ] = useState<KeywordPlace[]>([]);
  const [
    keywordSearchStatus,
    setKeywordSearchStatus,
  ] =
    useState<KeywordSearchStatus>(
      'idle',
    );

  const [
    detailSheetType,
    setDetailSheetType,
  ] =
    useState<MapDetailSheetType>(
      null,
    );

  const selectedStartLongitude =
    selectedCourseOptions?.startPlace
      .longitude;
  const selectedStartLatitude =
    selectedCourseOptions?.startPlace
      .latitude;

  const selectedStartCoordinate =
    useMemo<LngLat | null>(() => {
      const selectedStart:
        | LngLat
        | undefined =
        selectedStartLongitude !==
          undefined &&
        selectedStartLatitude !==
          undefined
          ? [
              selectedStartLongitude,
              selectedStartLatitude,
            ]
          : undefined;

      return isValidCoordinate(
        selectedStart,
      )
        ? selectedStart
        : null;
    }, [
      selectedStartLatitude,
      selectedStartLongitude,
    ]);

  const currentLocation =
    useLocationStore(
      selectCurrentLocation,
    );
  const locationStatus =
    useLocationStore(
      selectLocationStatus,
    );
  const locationErrorMessage =
    useLocationStore(
      selectLocationErrorMessage,
    );
  const ensureFreshLocation =
    useLocationStore(
      selectEnsureFreshLocation,
    );

  const [
    route,
    setRoute,
  ] =
    useState<RunningRoute | null>(
      null,
    );

  const [
    routeStartCoordinate,
    setRouteStartCoordinate,
  ] = useState<LngLat | null>(
    selectedStartCoordinate,
  );

  const [
    routePreparationStatus,
    setRoutePreparationStatus,
  ] =
    useState<RoutePreparationStatus>(
      'idle',
    );

  const [
    accidentZones,
    setAccidentZones,
  ] = useState<
    OldmanAccidentRiskPoint[]
  >([]);

  const [
    accidentStatus,
    setAccidentStatus,
  ] =
    useState<SafetyEvaluationStatus>(
      'idle',
    );

  const [
    routeLoadState,
    setRouteLoadState,
  ] = useState<RouteLoadState>({
    requestKey: null,
    status: 'idle',
  });

  const [
    routeRefreshToken,
    setRouteRefreshToken,
  ] = useState(0);

  const [
    recommendationResult,
    setRecommendationResult,
  ] =
    useState<RouteRecommendationResult | null>(
      null,
    );

  const startNavigationPending =
    useRef(false);
  const locationRequestIdRef =
    useRef(0);
  const recommendationRequestIdRef =
    useRef(0);
  const recommendationPendingRef =
    useRef(false);

  useFocusEffect(
    // 시작 버튼 중복 이동 방지 상태 초기화
    useCallback(() => {
      startNavigationPending.current =
        false;
    }, []),
  );

  const prepareRouteStartLocation =
    useCallback(async () => {
      if (selectedStartCoordinate) {
        locationRequestIdRef.current +=
          1;
        setRouteStartCoordinate(
          selectedStartCoordinate,
        );
        return;
      }

      const requestId =
        locationRequestIdRef.current +
        1;
      locationRequestIdRef.current =
        requestId;

      setRoutePreparationStatus(
        'locating',
      );
      setRoute(null);
      setRecommendationResult(null);

      const location =
        await ensureFreshLocation();

      if (
        requestId !==
        locationRequestIdRef.current
      ) {
        return;
      }

      if (
        !location ||
        !isLocationUsable(location)
      ) {
        setRouteStartCoordinate(null);
        setRouteLoadState({
          requestKey: null,
          status: 'unavailable',
        });
        setRoutePreparationStatus(
          'error',
        );
        return;
      }

      setRouteStartCoordinate([
        location.longitude,
        location.latitude,
      ]);
    }, [
      ensureFreshLocation,
      selectedStartCoordinate,
    ]);

  useEffect(() => {
    void prepareRouteStartLocation();

    return () => {
      locationRequestIdRef.current += 1;
    };
  }, [prepareRouteStartLocation]);

  useEffect(() => {
    if (
      selectedStartCoordinate ||
      locationStatus !== 'ready' ||
      !currentLocation ||
      !isLocationUsable(
        currentLocation,
      )
    ) {
      return;
    }

    const nextCoordinate: LngLat = [
      currentLocation.longitude,
      currentLocation.latitude,
    ];

    setRouteStartCoordinate(
      (previousCoordinate) => {
        if (!previousCoordinate) {
          return nextCoordinate;
        }

        return calculateCoordinateDistanceM(
          previousCoordinate,
          nextCoordinate,
        ) >=
          ROUTE_START_REFRESH_DISTANCE_M
          ? nextCoordinate
          : previousCoordinate;
      },
    );
  }, [
    currentLocation,
    locationStatus,
    selectedStartCoordinate,
  ]);

  useEffect(() => {
    const abortController =
      new AbortController();

    setKeywordPlaces([]);
    setSelectedPlace(null);

    if (
      !routeStartCoordinate ||
      !isDetailKeyword(
        selectedKeyword,
      )
    ) {
      setKeywordSearchStatus('idle');
      return () =>
        abortController.abort();
    }

    const detailKeyword =
      selectedKeyword;
    setKeywordSearchStatus('loading');

    void searchNearbyRoutePlaces({
      keyword: detailKeyword,
      longitude:
        routeStartCoordinate[0],
      latitude:
        routeStartCoordinate[1],
      radiusM: Math.min(
        20_000,
        targetDistanceKm * 500,
      ),
      signal:
        abortController.signal,
    })
      .then((places) => {
        if (
          abortController.signal.aborted
        ) {
          return;
        }

        const maximumWaypointDistanceM =
          targetDistanceKm *
          1_000 *
          0.45;
        const mappedPlaces =
          places
            .filter(
              (place) =>
                place.distanceM >=
                  100 &&
                place.distanceM <=
                  maximumWaypointDistanceM,
            )
            .slice(0, 9)
            .map(
              (place): KeywordPlace => ({
                id: place.id,
                keyword:
                  detailKeyword,
                name: place.name,
                address:
                  place.roadAddressName ||
                  place.addressName,
                distanceM:
                  place.distanceM,
                description:
                  `${detailKeyword} 경유 후보`,
                markerImage:
                  KEYWORD_MARKER_IMAGES[
                    detailKeyword
                  ],
                mainImage:
                  KEYWORD_MAIN_IMAGES[
                    detailKeyword
                  ],
                longitude:
                  place.longitude,
                latitude:
                  place.latitude,
              }),
            );

        setKeywordPlaces(
          mappedPlaces,
        );
        setKeywordSearchStatus(
          mappedPlaces.length > 0
            ? 'ready'
            : 'empty',
        );
      })
      .catch((error: unknown) => {
        if (
          abortController.signal.aborted
        ) {
          return;
        }

        if (__DEV__) {
          console.warn(
            '[KAKAO] 경유 장소 검색 실패',
            error instanceof Error
              ? error.message
              : '알 수 없는 오류',
          );
        }
        setKeywordPlaces([]);
        setKeywordSearchStatus(
          'error',
        );
      });

    return () =>
      abortController.abort();
  }, [
    routeStartCoordinate,
    selectedKeyword,
    targetDistanceKm,
  ]);

  const routeRequestKey = useMemo(
    () =>
      routeStartCoordinate
        ? [
            routeStartCoordinate[0],
            routeStartCoordinate[1],
            targetDistanceKm,
            selectedKeyword,
            routeRefreshToken,
          ].join(':')
        : null,
    [
      routeStartCoordinate,
      routeRefreshToken,
      selectedKeyword,
      targetDistanceKm,
    ],
  );

  useEffect(() => {
    const abortController =
      new AbortController();
    let screenIsMounted = true;

    setAccidentZones([]);

    if (!routeStartCoordinate) {
      setAccidentStatus(
        'unavailable',
      );
      return () => {
        screenIsMounted = false;
        abortController.abort();
      };
    }

    const accidentRequestCoordinate =
      routeStartCoordinate;

    setAccidentStatus('loading');

    async function loadAccidentZones() {
      try {
        const region =
          await resolveKakaoLegalRegion({
            longitude:
              accidentRequestCoordinate[0],
            latitude:
              accidentRequestCoordinate[1],
            signal:
              abortController.signal,
          });

        if (
          !screenIsMounted ||
          abortController.signal.aborted
        ) {
          return;
        }

        if (
          !isGwangmyeongRegion(region)
        ) {
          setAccidentZones([]);
          setAccidentStatus(
            'unavailable',
          );
          return;
        }

        const result =
          await fetchOldmanAccidentZones({
            ...GWANGMYEONG_ACCIDENT_REQUEST,
            timeoutMs: 4_000,
            signal:
              abortController.signal,
          });

        if (!screenIsMounted) {
          return;
        }

        setAccidentZones(result.items);
        setAccidentStatus('available');

      } catch (error: unknown) {
        if (
          !screenIsMounted ||
          abortController.signal.aborted
        ) {
          return;
        }

        if (
          error instanceof
          OldmanAccidentApiError
        ) {
          console.warn(
            '[KOROAD-OLDMAN] 조회 실패',
            {
              message: error.message,
              status: error.status,
              code: error.code,
              resultMsg:
                error.resultMsg,
            },
          );
        } else {
          console.warn(
            '[KOROAD-OLDMAN] 조회 실패',
            {
              message:
                error instanceof Error
                  ? error.message
                  : '알 수 없는 오류',
            },
          );
        }

        setAccidentZones([]);
        setAccidentStatus(
          'unavailable',
        );
      }
    }

    void loadAccidentZones();

    return () => {
      screenIsMounted = false;
      abortController.abort();
    };
  }, [routeStartCoordinate]);

  useEffect(() => {
    if (
      !routeStartCoordinate ||
      !routeRequestKey
    ) {
      return;
    }

    if (
      isDetailKeyword(
        selectedKeyword,
      ) &&
      (keywordSearchStatus ===
        'idle' ||
        keywordSearchStatus ===
          'loading')
    ) {
      setRoute(null);
      setRecommendationResult(null);
      setRouteLoadState({
        requestKey:
          routeRequestKey,
        status: 'loading',
      });
      setRoutePreparationStatus(
        'generating',
      );
      return;
    }

    if (
      accidentStatus !==
        'available' &&
      accidentStatus !==
        'unavailable'
    ) {
      setRoute(null);
      setRecommendationResult(null);
      setRouteLoadState({
        requestKey:
          routeRequestKey,
        status: 'loading',
      });
      setRoutePreparationStatus(
        'generating',
      );
      return;
    }

    const startCoordinate =
      routeStartCoordinate;
    const requestKey =
      routeRequestKey;
    const safetyDataStatus =
      accidentStatus;
    const requestId =
      recommendationRequestIdRef
        .current + 1;
    recommendationRequestIdRef.current =
      requestId;
    const abortController =
      new AbortController();
    let screenIsMounted = true;

    recommendationPendingRef.current =
      true;
    setRoute(null);
    setRecommendationResult(null);
    setRouteLoadState({
      requestKey,
      status: 'loading',
    });
    setRoutePreparationStatus(
      'generating',
    );

    async function loadRecommendation() {
      try {
        const result =
          await generateRecommendedRoute({
            startCoordinate,
            targetDistanceM:
              targetDistanceKm *
              1_000,
            keyword:
              isDetailKeyword(
                selectedKeyword,
              ) &&
              keywordPlaces.length ===
                0
                ? '안전'
                : selectedKeyword,
            waypointCandidates:
              keywordPlaces.map(
                (place) => [
                  place.longitude,
                  place.latitude,
                ],
              ),
            accidentZones,
            safetyDataStatus,
            requestKey,
            signal:
              abortController.signal,
          });

        if (
          !screenIsMounted ||
          requestId !==
            recommendationRequestIdRef
              .current
        ) {
          return;
        }

        const recommendedCandidate =
          result.recommendedCandidate;

        if (!recommendedCandidate) {
          setRoute(null);
          setRecommendationResult(
            result,
          );
          setRouteLoadState({
            requestKey,
            status: 'unavailable',
          });
          setRoutePreparationStatus(
            'error',
          );
          return;
        }

        setRoute(
          recommendedCandidate.route,
        );
        setRecommendationResult(
          result,
        );
        setRouteLoadState({
          requestKey,
          status: 'available',
        });
        setRoutePreparationStatus(
          'ready',
        );
      } catch (error: unknown) {
        if (
          !screenIsMounted ||
          abortController.signal
            .aborted ||
          requestId !==
            recommendationRequestIdRef
              .current
        ) {
          return;
        }

        if (__DEV__) {
          console.warn(
            '[ROUTE] 추천 코스 생성 실패',
            error instanceof Error
              ? error.message
              : '알 수 없는 오류',
          );
        }

        setRoute(null);
        setRecommendationResult(null);
        setRouteLoadState({
          requestKey,
          status: 'unavailable',
        });
        setRoutePreparationStatus(
          'error',
        );
      } finally {
        if (
          requestId ===
          recommendationRequestIdRef
            .current
        ) {
          recommendationPendingRef.current =
            false;
        }
      }
    }

    void loadRecommendation();

    return () => {
      screenIsMounted = false;
      abortController.abort();

      if (
        requestId ===
        recommendationRequestIdRef
          .current
      ) {
        recommendationPendingRef.current =
          false;
      }
    };
  }, [
    accidentStatus,
    accidentZones,
    keywordPlaces,
    keywordSearchStatus,
    routeRequestKey,
    routeStartCoordinate,
    selectedKeyword,
    targetDistanceKm,
  ]);

  const routeIsReady =
    route !== null &&
    route.navigationSteps.length > 0 &&
    routeRequestKey !== null &&
    routeLoadState.requestKey ===
      routeRequestKey &&
    routeLoadState.status ===
      'available';

  const safetyEvaluation =
    useMemo<RouteSafetyEvaluation>(() => {
      if (
        routeLoadState.status ===
          'loading' ||
        accidentStatus ===
          'loading'
      ) {
        return createEmptySafetyEvaluation(
          'loading',
        );
      }

      if (
        routeIsReady &&
        recommendationResult
          ?.recommendedCandidate
      ) {
        return recommendationResult
          .recommendedCandidate
          .safetyEvaluation;
      }

      if (
        routeIsReady &&
        accidentStatus ===
          'unavailable'
      ) {
        return createEmptySafetyEvaluation(
          'unavailable',
        );
      }

      return createEmptySafetyEvaluation(
        'idle',
      );
    }, [
      accidentStatus,
      recommendationResult,
      routeLoadState.status,
      routeIsReady,
    ]);

  useEffect(() => {
    if (
      safetyEvaluation.status ===
      'unavailable'
    ) {
      console.warn(
        '[SAFETY] 사고 다발지역 데이터 사용 불가',
      );
    }
  }, [
    safetyEvaluation.status,
  ]);

  const recommendedCandidate =
    recommendationResult
      ?.recommendedCandidate ??
    null;
  const actualDistanceKm =
    recommendedCandidate
      ? recommendedCandidate
          .actualDistanceM / 1_000
      : null;
  const recommendationIsLoading =
    routePreparationStatus ===
      'locating' ||
    routePreparationStatus ===
      'generating';
  const recommendationReason =
    routePreparationStatus ===
    'locating'
      ? '현재 위치를 확인하고 있어요.'
      : routePreparationStatus ===
          'generating'
        ? '안전한 러닝 코스를 분석하고 있어요.'
        : routePreparationStatus ===
              'error' &&
            locationStatus ===
              'permission-denied'
          ? '위치 권한이 필요해요. 설정에서 권한을 허용한 뒤 다시 시도해 주세요.'
          : routePreparationStatus ===
                'error' &&
              !routeStartCoordinate
            ? locationErrorMessage ??
              '현재 위치를 확인할 수 없어요. GPS 상태를 확인한 뒤 다시 시도해 주세요.'
            : isDetailKeyword(
                  selectedKeyword,
                ) &&
                (keywordSearchStatus ===
                  'empty' ||
                  keywordSearchStatus ===
                    'error')
              ? `${selectedKeyword} 장소를 찾지 못해 안전 추천 기본 코스를 표시했어요.`
              : recommendationResult
                ?.reasonText ??
              (routeLoadState.status ===
                'unavailable'
                ? '현재 위치에서 추천 코스를 만들지 못했어요. 잠시 후 다시 시도해 주세요.'
                : '현재 위치를 기준으로 코스를 준비할게요.');

  const visibleKeywordPlaces =
    useMemo(() => {
      if (
        selectedKeyword !== '공원' &&
        selectedKeyword !== '야경' &&
        selectedKeyword !== '카페'
      ) {
        return [];
      }

      const recommendationCenter =
        routeStartCoordinate ??
        route?.coordinates[0];

      return keywordPlaces.filter(
        (place) => {
          if (
            place.keyword !==
            selectedKeyword
          ) {
            return false;
          }

          const placeCoordinate:
            LngLat = [
              place.longitude,
              place.latitude,
            ];

          if (
            !isValidCoordinate(
              placeCoordinate,
            )
          ) {
            return false;
          }

          if (
            !isValidCoordinate(
              recommendationCenter,
            )
          ) {
            return true;
          }

          return (
            calculateCoordinateDistanceM(
              recommendationCenter,
              placeCoordinate,
            ) <=
            KEYWORD_PLACE_MAX_DISTANCE_M
          );
        },
      );
    }, [
      route,
      routeStartCoordinate,
      keywordPlaces,
      selectedKeyword,
    ]);

  function handleSearch() {
    navigation.navigate(
      'LocationSearch',
    );
  }

  function handleBackToMain() {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Main',
          },
        ],
      }),
    );
  }

  function handleResetCourse() {
    if (
      recommendationPendingRef.current
    ) {
      return;
    }

    setSelectedKeyword('안전');
    setSelectedPlace(null);

    if (!routeStartCoordinate) {
      void prepareRouteStartLocation();
      return;
    }

    setRoute(null);
    setRecommendationResult(null);
    setRouteRefreshToken(
      (currentToken) =>
        currentToken + 1,
    );
  }

  function handleKeyword(
    keyword: RouteKeyword,
  ) {
    if (
      recommendationPendingRef.current
    ) {
      return;
    }

    setSelectedKeyword(keyword);
    setSelectedPlace(null);
    setKeywordPlaces([]);
    setKeywordSearchStatus('idle');
    setRoute(null);
    setRecommendationResult(null);
  }

  function showMetricDescription(
    title: string,
    message: string,
  ) {
    Alert.alert(title, message);
  }

  function handleStartRunning() {
    if (
      startNavigationPending.current ||
      !routeIsReady ||
      !route ||
      !recommendationResult
        ?.recommendedCandidate
    ) {
      Alert.alert(
        '코스를 시작할 수 없어요',
        '실제 경로와 길 안내를 준비한 뒤 다시 시도해 주세요.',
      );
      return;
    }

    const targetDistanceM =
      targetDistanceKm * 1000;
    const runningStore =
      useRunningStore.getState();
    const session =
      runningStore.activeSession;

    if (
      session?.status !== 'running' &&
      session?.status !== 'paused'
    ) {
      runningStore.prepareSession(
        targetDistanceM,
        route.coordinates,
      );

      const preparedStore =
        useRunningStore.getState();
      const preparedSession =
        preparedStore.activeSession;

      if (
        preparedSession?.status ===
          'ready' ||
        preparedSession?.status ===
          'idle'
      ) {
        preparedStore.startSession();
      }
    }

    const activeStatus =
      useRunningStore.getState()
        .activeSession?.status;

    if (
      activeStatus !== 'running' &&
      activeStatus !== 'paused'
    ) {
      return;
    }

    startNavigationPending.current =
      true;

    navigation.navigate(
      'RunningActive',
      {
        routeId: route.id,
        routeCoordinates:
          route.coordinates,
        navigationSteps:
          route.navigationSteps,
        warningPoints:
          safetyEvaluation
            .warningPoints,
        targetDistanceM,
        plannedDistanceM:
          recommendationResult
            .recommendedCandidate
            .actualDistanceM,
        safetyStatus:
          safetyEvaluation.status ===
          'available'
            ? 'available'
            : 'unavailable',
        safetyScore:
          safetyEvaluation.score,
        startCoordinate:
          routeStartCoordinate ??
          route.coordinates[0],
        generatedAtMs:
          route.generatedAtMs,
      },
    );
  }

  if (selectedPlace) {
    return (
      <RunningKeywordPlaceDetail
        onBack={() =>
          setSelectedPlace(null)
        }
        place={selectedPlace}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar hidden />

      <View style={styles.mapLayer}>
        <LiveRunningMap
          centerCoordinate={
            routeStartCoordinate ??
            undefined
          }
          locationStatus={
            locationStatus
          }
          locationIsLoading={
            routePreparationStatus ===
            'locating'
          }
          route={route}
          showRoute={routeIsReady}
          keywordPlaces={
            visibleKeywordPlaces
          }
          onSelectKeywordPlace={
            setSelectedPlace
          }
          targetDistanceKm={
            targetDistanceKm
          }
          warningPoints={
            safetyEvaluation
              .warningPoints
          }
        />
      </View>

      <LinearGradient
        colors={[
          'rgba(255,255,255,0.96)',
          'rgba(255,255,255,0.68)',
          'rgba(255,255,255,0)',
        ]}
        locations={[0, 0.58, 1]}
        pointerEvents="none"
        style={styles.topGradient}
      />

      <LinearGradient
        colors={[
          'rgba(255,255,255,0)',
          'rgba(255,255,255,0.72)',
          'rgba(255,255,255,0.97)',
        ]}
        locations={[0, 0.45, 1]}
        pointerEvents="none"
        style={styles.bottomGradient}
      />

      <RunningStartTopControls
        recommendationIsLoading={
          recommendationIsLoading
        }
        selectedKeyword={selectedKeyword}
        onBack={handleBackToMain}
        onSearch={handleSearch}
        onReset={handleResetCourse}
        onSelectKeyword={handleKeyword}
      />

      <RunningStartMetricsRail
        onOpenSafetyDetail={() =>
          setDetailSheetType(
            'safety',
          )
        }
        onOpenWarningDetail={() =>
          setDetailSheetType(
            'warnings',
          )
        }
        safetyEvaluation={
          safetyEvaluation
        }
        targetDistanceKm={
          targetDistanceKm
        }
        targetTime={targetTime}
        onShowDescription={
          showMetricDescription
        }
      />

      <RunningStartSummary
        actualDistanceKm={
          actualDistanceKm
        }
        recommendationIsLoading={
          recommendationIsLoading
        }
        recommendationReason={
          recommendationReason
        }
        routeIsReady={routeIsReady}
        targetDistanceKm={
          targetDistanceKm
        }
        targetPace={targetPace}
        onStartRunning={
          handleStartRunning
        }
      />

      <RouteSafetyDetailSheet
        evaluation={
          safetyEvaluation
        }
        onClose={() =>
          setDetailSheetType(null)
        }
        visible={
          detailSheetType ===
          'safety'
        }
      />

      <RouteWarningDetailSheet
        evaluation={
          safetyEvaluation
        }
        onClose={() =>
          setDetailSheetType(null)
        }
        visible={
          detailSheetType ===
          'warnings'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#F3F3F3',
  },
  mapLayer: {
    flex: 1,
    position: 'relative',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: 185,
  },
  bottomGradient: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 230,
  },
});
