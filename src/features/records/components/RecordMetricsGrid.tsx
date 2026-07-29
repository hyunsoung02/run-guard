import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  RunningRecordPayload,
} from '../../../navigation/types';
import {
  createRecordMetrics,
} from '../utils/recordFormatters';

type RecordMetricsGridProps = {
  record: RunningRecordPayload;
};

export function RecordMetricsGrid({
  record,
}: RecordMetricsGridProps) {
  const metrics =
    createRecordMetrics(record);

  return (
    <>
      <View style={styles.dateBlock}>
        <Text style={styles.date}>
          {record.date}
        </Text>

        <Text style={styles.time}>
          {record.timeRange}
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        {metrics.map((metric) => (
          <View
            key={metric.label}
            style={styles.metric}
          >
            <Text
              style={
                styles.metricLabel
              }
            >
              {metric.label}
            </Text>

            <Text
              style={
                styles.metricValue
              }
            >
              {metric.value}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dateBlock: {
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  date: {
    color: '#111111',
    fontSize: 26,
    fontWeight: '800',
  },
  time: {
    marginTop: 4,
    color: '#777777',
    fontSize: 14,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 12,
  },
  metric: {
    width: '33.333%',
    alignItems: 'center',
    paddingVertical: 13,
  },
  metricLabel: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    marginTop: 5,
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },
});
