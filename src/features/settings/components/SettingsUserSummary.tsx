import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  formatDistanceKm,
} from '../../../utils/distanceFormat';
import type {
  SettingsUserSummaryData,
} from '../types/settingsMenu';

type SettingsUserSummaryProps = {
  data: SettingsUserSummaryData;
};

export function SettingsUserSummary({
  data,
}: SettingsUserSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        사용자 정보
      </Text>

      <Text style={styles.level}>
        {data.runnerLevel}
      </Text>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>
            주간 목표
          </Text>
          <Text
            numberOfLines={1}
            style={styles.metricValue}
          >
            {formatDistanceKm(
              data.weeklyGoalKm,
            )}km
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>
            이번 주
          </Text>
          <Text
            numberOfLines={1}
            style={styles.metricValue}
          >
            {formatDistanceKm(
              data.weeklyCompletedKm,
            )}km 완료
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingBottom: 26,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D8D8',
  },
  heading: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '700',
  },
  level: {
    marginTop: 16,
    color: '#7EAC00',
    fontSize: 25,
    fontWeight: '700',
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#D8D8D8',
  },
  metricLabel: {
    color: '#777777',
    fontSize: 13,
    fontWeight: '500',
  },
  metricValue: {
    marginTop: 5,
    color: '#111111',
    fontSize: 17,
    fontWeight: '600',
  },
});
