import type {
  ComponentProps,
} from 'react';
import {
  Ionicons,
} from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  RouteSafetyEvaluation,
} from '../../../services/safety/routeSafetyService';

type IoniconName =
  ComponentProps<typeof Ionicons>['name'];

type MetricButtonProps = {
  icon: IoniconName;
  label: string;
  value: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

type RunningStartMetricsRailProps = {
  targetDistanceKm: number;
  targetTime: string;
  safetyEvaluation: RouteSafetyEvaluation;
  onOpenSafetyDetail: () => void;
  onOpenWarningDetail: () => void;
  onShowDescription: (
    title: string,
    message: string,
  ) => void;
};

function MetricButton({
  icon,
  label,
  value,
  onPress,
  accessibilityLabel,
}: MetricButtonProps) {
  return (
    <Pressable
      accessibilityLabel={
        accessibilityLabel ??
        `${label} ${value}`
      }
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.metricButton,
        pressed && styles.buttonPressed,
      ]}
    >
      <Ionicons
        color="#4E6A01"
        name={icon}
        size={27}
      />

      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        numberOfLines={1}
        style={styles.metricValue}
      >
        {value}
      </Text>

      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.65}
        numberOfLines={1}
        style={styles.metricLabel}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function RunningStartMetricsRail({
  targetDistanceKm,
  targetTime,
  safetyEvaluation,
  onOpenSafetyDetail,
  onOpenWarningDetail,
  onShowDescription,
}: RunningStartMetricsRailProps) {
  const warningPointCount =
    Array.isArray(
      safetyEvaluation.warningPoints,
    )
      ? safetyEvaluation
          .warningPoints.length
      : 0;
  const safetyValue =
    safetyEvaluation.status ===
      'available' &&
    safetyEvaluation.score !== null
      ? `${safetyEvaluation.score}점`
      : safetyEvaluation.status ===
          'loading'
        ? '분석 중'
        : safetyEvaluation.status ===
            'unavailable'
          ? '정보 없음'
          : '준비 중';
  const safetyAccessibilityLabel =
    safetyEvaluation.status ===
      'available' &&
    safetyEvaluation.score !== null &&
    Number.isFinite(
      safetyEvaluation.score,
    )
      ? `코스 안전도 ${safetyEvaluation.score}점, 상세 정보 열기`
      : safetyEvaluation.status ===
          'loading'
        ? '코스 안전도 분석 중, 상세 정보 열기'
        : safetyEvaluation.status ===
            'unavailable'
          ? '안전 정보를 확인할 수 없음, 상세 정보 열기'
          : '코스 안전도 준비 중, 상세 정보 열기';
  const warningAccessibilityLabel =
    safetyEvaluation.status ===
    'available'
      ? `주의 지점 ${warningPointCount}개, 상세 정보 열기`
      : safetyEvaluation.status ===
          'loading'
        ? '주의 지점 분석 중, 상세 정보 열기'
      : safetyEvaluation.status ===
          'unavailable'
        ? '주의 지점 정보를 확인할 수 없음, 상세 정보 열기'
        : '주의 지점 정보 준비 중, 상세 정보 열기';
  const warningPointValue =
    safetyEvaluation.status ===
    'available'
      ? `${warningPointCount}개`
      : safetyEvaluation.status ===
          'unavailable'
        ? '정보 없음'
        : '-';

  return (
    <View style={styles.metricRail}>
      <MetricButton
        accessibilityLabel={
          safetyAccessibilityLabel
        }
        icon="shield-checkmark-outline"
        label="코스 안전도"
        onPress={onOpenSafetyDetail}
        value={safetyValue}
      />

      <MetricButton
        accessibilityLabel={
          warningAccessibilityLabel
        }
        icon="warning-outline"
        label="주의 지점"
        onPress={onOpenWarningDetail}
        value={warningPointValue}
      />

      <MetricButton
        icon="time-outline"
        label="목표 시간"
        onPress={() =>
          onShowDescription(
            `목표 시간 ${targetTime}`,
            `${targetDistanceKm}km를 ${targetTime}에 완주하는 목표입니다.`,
          )
        }
        value={targetTime}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  metricRail: {
    position: 'absolute',
    top: '47%',
    left: 16,
    gap: 12,
  },
  metricButton: {
    width: 71,
    height: 71,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor:
      'rgba(126,172,0,0.2)',
    borderRadius: 39,
    backgroundColor:
      'rgba(255,255,255,0.94)',
    shadowColor: '#111111',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  metricValue: {
    width: 58,
    marginTop: 1,
    color: '#111111',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  metricLabel: {
    width: 58,
    color: '#5C5C5C',
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
