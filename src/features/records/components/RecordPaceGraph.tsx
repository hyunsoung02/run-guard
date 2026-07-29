import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  RunningSplitPayload,
} from '../../../navigation/types';
import {
  formatDistanceKm,
} from '../../../utils/distanceFormat';

type RecordPaceGraphProps = {
  splits: RunningSplitPayload[];
  emptyMessage?: string;
};

export function RecordPaceGraph({
  splits,
  emptyMessage = '표시할 구간 페이스가 없습니다.',
}: RecordPaceGraphProps) {
  if (splits.length === 0) {
    return (
      <View
        style={
          styles.emptyGraphContainer
        }
      >
        <Text
          style={
            styles.emptyGraphText
          }
        >
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.graphCard}>
      {splits.map((split, index) => {
        const paceParts =
          split.pace.match(
            /(\d+)'\s*(\d+)"/,
          );
        const paceSeconds =
          paceParts
            ? Number(paceParts[1]) *
                60 +
              Number(paceParts[2])
            : 0;
        const barWidth = Math.min(
          100,
          Math.max(
            18,
            paceSeconds > 0
              ? (paceSeconds / 720) *
                  100
              : 18,
          ),
        );

        return (
          <View
            key={`${index}-${split.distanceKm}`}
            style={styles.graphRow}
          >
            <Text style={styles.graphLabel}>
              {split.isPartial
                ? `${formatDistanceKm(
                    split.distanceKm,
                  )}km`
                : `${index + 1}km`}
            </Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  {
                    width:
                      `${barWidth}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.pace}>
              {split.pace}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  graphCard: {
    gap: 12,
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 12,
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
  },
  graphRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  graphLabel: {
    width: 56,
    color: '#555555',
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    flex: 1,
    height: 12,
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: '#E5E5E5',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#B2F300',
  },
  pace: {
    width: 62,
    color: '#111111',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  emptyGraphContainer: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
  },
  emptyGraphText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
});
