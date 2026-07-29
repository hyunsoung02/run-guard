import {
  Image,
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
import {
  formatDuration,
} from '../utils/recordFormatters';

const RUNNING_SHOE_IMAGE = require(
  '../../../assets/images/records/running-shoe.png',
);

type RecordSplitListProps = {
  splits: RunningSplitPayload[];
  emptyMessage?: string;
};

export function RecordSplitList({
  splits,
  emptyMessage = '측정된 구간 기록이 없습니다.',
}: RecordSplitListProps) {
  return (
    <>
      <Text style={styles.sectionTitle}>
        구간별 기록
      </Text>

      {splits.length === 0 ? (
        <View
          style={
            styles.emptySplitContainer
          }
        >
          <Text
            style={
              styles.emptySplitText
            }
          >
            {emptyMessage}
          </Text>
        </View>
      ) : (
        <View style={styles.splits}>
          {splits.map(
            (split, index) => (
              <SplitRecordRow
                key={
                  `${index}-${split.distanceKm}`
                }
                record={split}
              />
            ),
          )}
        </View>
      )}
    </>
  );
}

function SplitRecordRow({
  record,
}: {
  record: RunningSplitPayload;
}) {
  return (
    <View style={styles.splitRow}>
      <Text style={styles.splitDistance}>
        {formatDistanceKm(
          record.distanceKm,
        )} km
      </Text>
      <View style={styles.shoeTrack}>
        <View style={styles.shoeIconContainer}>
          <Image
            fadeDuration={0}
            resizeMode="contain"
            source={RUNNING_SHOE_IMAGE}
            style={styles.shoeImage}
          />
        </View>
        <View style={styles.trackLine} />
      </View>
      <Text style={styles.splitPace}>{record.pace}</Text>
      <Text
        style={styles.splitChange}
      >
        {formatDuration(
          record.durationSeconds,
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginTop: 22,
    marginBottom: 12,
    color: '#111111',
    fontSize: 23,
    fontWeight: '800',
  },
  splits: {
    gap: 9,
  },
  splitRow: {
    height: 67,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 17,
    backgroundColor: '#F3F3F3',
  },
  splitDistance: {
    width: 50,
    color: '#333333',
    fontSize: 14,
    fontWeight: '700',
  },
  shoeTrack: {
    width: 140,
    height: 44,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  shoeImage: {
    width: 38,
    height: 38,
  },
  shoeIconContainer: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  trackLine: {
    width: 140,
    height: 3,
    marginTop: 2,
    borderRadius: 2,
    backgroundColor: '#111111',
  },
  splitPace: {
    flex: 1,
    marginLeft: 6,
    color: '#111111',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  splitChange: {
    width: 58,
    color: '#666666',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  emptySplitContainer: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F3F3F3',
  },
  emptySplitText: {
    color: '#888888',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
