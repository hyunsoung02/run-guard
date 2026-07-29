import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getCoachProgressPercent,
} from '../utils/coachProgress';
import {
  formatDistanceKm,
} from '../../../utils/distanceFormat';

type WeeklyGoalCardProps = {
  accentColor: string;
  completedDistanceKm: number;
  targetDistanceKm: number;
};

export function WeeklyGoalCard({
  accentColor,
  completedDistanceKm,
  targetDistanceKm,
}: WeeklyGoalCardProps) {
  const progressPercent =
    getCoachProgressPercent(
      completedDistanceKm,
      targetDistanceKm,
    );
  const roundedProgressPercent =
    Math.round(progressPercent);

  return (
    <View
      accessibilityLabel={`주간 목표 ${targetDistanceKm}킬로미터 중 ${completedDistanceKm}킬로미터 완료, ${roundedProgressPercent}퍼센트`}
      accessible
      style={styles.card}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          주간 목표
        </Text>

        <Text
          style={[
            styles.percent,
            {
              color: accentColor,
            },
          ]}
        >
          {roundedProgressPercent}%
        </Text>
      </View>

      <View style={styles.distanceRow}>
        <Text style={styles.completedDistance}>
          {formatDistanceKm(
            completedDistanceKm,
          )}km
        </Text>
        <Text style={styles.targetDistance}>
          {' / '}
          {formatDistanceKm(
            targetDistanceKm,
          )}km
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor:
                accentColor,
              width: `${progressPercent}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#111111',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '800',
  },
  percent: {
    fontSize: 17,
    fontWeight: '900',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 18,
  },
  completedDistance: {
    color: '#111111',
    fontSize: 26,
    fontWeight: '900',
  },
  targetDistance: {
    color: '#777777',
    fontSize: 15,
    fontWeight: '700',
  },
  progressTrack: {
    height: 12,
    overflow: 'hidden',
    marginTop: 14,
    borderRadius: 6,
    backgroundColor: '#E2E2E2',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
});
