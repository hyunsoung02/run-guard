import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  RunningRecordPayload,
} from '../../../navigation/types';
import {
  formatDistanceKm,
} from '../../../utils/distanceFormat';
import {
  isValidPaceSample,
  RUNNING_PACE_UNAVAILABLE_MESSAGE,
} from '../../running/utils/runningSessionCalculations';

const COACH_CHARACTER_IMAGE = require(
  '../../../assets/images/records/record-coach-character.png',
);

const COACH_ICON_IMAGE = require(
  '../../../assets/images/records/record-coach-icon.png',
);

type RecordCoachCardProps = {
  record: RunningRecordPayload;
};

export function RecordCoachCard({
  record,
}: RecordCoachCardProps) {
  const hasValidPace =
    isValidPaceSample(
      record.distanceKm * 1_000,
      record.durationSeconds,
    );

  return (
    <View style={styles.coachCard}>
      <View style={styles.coachHeader}>
        <Image
          fadeDuration={0}
          resizeMode="contain"
          source={COACH_ICON_IMAGE}
          style={styles.coachIcon}
        />

        <Text style={styles.coachLabel}>
          기록 코치
        </Text>
      </View>

      <View style={styles.coachContent}>
        <View style={styles.coachTextArea}>
          <Text style={styles.coachMessage}>
            현재까지{`\n`}
            <Text style={styles.accent}>
              {formatDistanceKm(
                record.distanceKm,
              )}km
            </Text>
            {'를 달렸어요!'}
          </Text>

          <View
            style={
              styles.coachDivider
            }
          />

          {hasValidPace ? (
            <Text style={styles.coachGoal}>
              평균 페이스는{`\n`}
              <Text style={styles.accent}>
                {record.averagePace}
              </Text>
              {'입니다.'}
            </Text>
          ) : (
            <Text
              style={styles.coachGoal}
            >
              {
                RUNNING_PACE_UNAVAILABLE_MESSAGE
              }
            </Text>
          )}
        </View>

        <Image
          fadeDuration={0}
          resizeMode="contain"
          source={
            COACH_CHARACTER_IMAGE
          }
          style={
            styles.coachCharacter
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  coachCard: {
    position: 'absolute',
    top: 466,
    right: 28,
    left: 28,
    height: 228,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  coachHeader: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachIcon: {
    width: 38,
    height: 38,
  },
  coachLabel: {
    marginLeft: 10,
    color: '#7EAC00',
    fontSize: 24,
    fontWeight: '800',
  },
  coachContent: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 8,
  },
  coachTextArea: {
    flex: 1,
    zIndex: 1,
    paddingRight: 4,
  },
  coachMessage: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  coachDivider: {
    width: '92%',
    height: 1,
    marginVertical: 9,
    backgroundColor: '#E2E2E2',
  },
  coachGoal: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 19,
  },
  coachCharacter: {
    width: 126,
    height: 166,
    alignSelf: 'flex-end',
    marginRight: -12,
    marginBottom: -16,
  },
  accent: {
    color: '#7EAC00',
  },
});
