import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  formatDistanceKm,
} from '../../../utils/distanceFormat';

type GoalProgressSummaryProps = {
  weeklyGoalKm: number;
  completedKm: number;
};

export function GoalProgressSummary({
  weeklyGoalKm,
  completedKm,
}: GoalProgressSummaryProps) {
  const safeGoalKm = Math.max(
    weeklyGoalKm,
    0,
  );
  const safeCompletedKm = Math.max(
    completedKm,
    0,
  );
  const remainingKm = Math.max(
    safeGoalKm - safeCompletedKm,
    0,
  );
  const progressRatio =
    safeGoalKm > 0
      ? Math.min(
          safeCompletedKm / safeGoalKm,
          1,
        )
      : 0;
  const progressPercent = Math.round(
    progressRatio * 100,
  );
  const progressWidth:
    `${number}%` =
    `${progressPercent}%`;

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>
          주간 목표 진행
        </Text>
        <Text style={styles.percent}>
          {progressPercent}%
        </Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.progress,
            {
              width: progressWidth,
            },
          ]}
        />
      </View>

      <View style={styles.distanceRow}>
        <Text style={styles.completed}>
          {formatDistanceKm(
            safeCompletedKm,
          )}km 완료 /{' '}
          {formatDistanceKm(
            safeGoalKm,
          )}km
        </Text>
        <Text style={styles.remaining}>
          {formatDistanceKm(
            remainingKm,
          )}km 남음
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '700',
  },
  percent: {
    color: '#7EAC00',
    fontSize: 20,
    fontWeight: '800',
  },
  track: {
    height: 10,
    marginTop: 18,
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: '#DDDDDD',
  },
  progress: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#B2F300',
  },
  distanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  completed: {
    color: '#444444',
    fontSize: 13,
    fontWeight: '600',
  },
  remaining: {
    color: '#777777',
    fontSize: 13,
    fontWeight: '500',
  },
});
