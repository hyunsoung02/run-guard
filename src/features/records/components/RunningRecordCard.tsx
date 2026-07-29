import {
  Ionicons,
} from '@expo/vector-icons';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  formatDuration,
} from '../utils/recordFormatters';
import type {
  RunningRecordListItem,
} from '../types/runningRecordList';
import {
  formatDistanceKm,
} from '../../../utils/distanceFormat';

type RunningRecordCardProps = {
  item: RunningRecordListItem;
  disabled: boolean;
  onPress: (
    item: RunningRecordListItem,
  ) => void;
};

export function RunningRecordCard({
  item,
  disabled,
  onPress,
}: RunningRecordCardProps) {
  const { record } = item;

  return (
    <Pressable
      accessibilityLabel={`${record.date}, ${formatDistanceKm(
        record.distanceKm,
      )}km, 평균 페이스 ${record.averagePace}`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.mapThumbnail}>
        {item.mapThumbnail ? (
          <Image
            resizeMode="cover"
            source={item.mapThumbnail}
            style={styles.mapImage}
          />
        ) : (
          <Ionicons
            color="#7EAC00"
            name="map-outline"
            size={38}
          />
        )}
      </View>

      <View style={styles.details}>
        <Text style={styles.date}>
          {record.date}
        </Text>
        <Text style={styles.timeRange}>
          {record.timeRange}
        </Text>
        <Text style={styles.courseLocation}>
          {item.courseLocation}
        </Text>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {formatDistanceKm(
                record.distanceKm,
              )}
            </Text>
            <Text style={styles.metricLabel}>
              KM
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {record.averagePace}
            </Text>
            <Text style={styles.metricLabel}>
              PACE
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {formatDuration(
                record.durationSeconds,
              )}
            </Text>
            <Text style={styles.metricLabel}>
              TIME
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const CARD_MIN_HEIGHT = 138;
const CARD_PADDING = 12;
const CARD_GAP = 13;

const MAP_WIDTH = 104;
const MAP_HEIGHT = 109;

const styles = StyleSheet.create({
  card: {
    minHeight: CARD_MIN_HEIGHT,
    flexDirection: 'row',
    gap: CARD_GAP,
    padding: CARD_PADDING,
    borderRadius: 26,
    backgroundColor: '#F3F3F3',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 9,
    elevation: 3,
  },

  cardPressed: {
    opacity: 0.72,
  },

  mapThumbnail: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#E5EBDD',
  },

  mapImage: {
    width: '100%',
    height: '100%',
  },

  details: {
    flex: 1,
    paddingVertical: 1,
  },

  date: {
    color: '#111111',
    fontSize: 19,
    fontWeight: '800',
  },

  timeRange: {
    marginTop: 3,
    color: '#555555',
    fontSize: 12,
    fontWeight: '600',
  },

  courseLocation: {
    marginTop: 4,
    color: '#999999',
    fontSize: 12,
    fontWeight: '500',
  },

  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 17,
  },

  metric: {
    flex: 1,
    alignItems: 'center',
  },

  metricValue: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },

  metricLabel: {
    marginTop: 3,
    color: '#888888',
    fontSize: 9,
    fontWeight: '700',
  },

  divider: {
    width: 1,
    height: 29,
    backgroundColor: '#D4D4D4',
  },
});
