import {
  Ionicons,
} from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  RunningSessionData,
} from '../hooks/useRunningSession';
import {
  formatDistanceKm,
} from '../../../utils/distanceFormat';

type RunningLiveStatsProps = {
  color: string;
  data: RunningSessionData;
};

type RunningStatRowProps = {
  color: string;
  iconName:
    | 'heart-outline'
    | 'speedometer-outline'
    | 'map-outline';
  value: string;
};

function RunningStatRow({
  color,
  iconName,
  value,
}: RunningStatRowProps) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statIcon}>
        <Ionicons
          color={color}
          name={iconName}
          size={35}
        />
      </View>

      <Text
        style={[
          styles.statValue,
          {
            color,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function RunningLiveStats({
  color,
  data,
}: RunningLiveStatsProps) {
  return (
    <View style={styles.statsContainer}>
      <RunningStatRow
        color={color}
        iconName="heart-outline"
        value={
          data.heartRate === null
            ? '--'
            : `${data.heartRate}`
        }
      />

      <RunningStatRow
        color={color}
        iconName="speedometer-outline"
        value={data.pace}
      />

      <RunningStatRow
        color={color}
        iconName="map-outline"
        value={`${formatDistanceKm(
          data.distanceKm,
          2,
        )}KM`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    position: 'absolute',
    top: 50,
    left: 30,
    zIndex: 2,
    gap: 0,
  },
  statRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    marginLeft: 12,
    fontSize: 30,
    fontWeight: '400',
    fontStyle: 'italic',
    letterSpacing: -1.2,
  },
});
