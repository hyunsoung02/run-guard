import {
  Ionicons,
} from '@expo/vector-icons';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  PanResponderInstance,
} from 'react-native';

import type {
  RunningRecordPayload,
} from '../../../navigation/types';
import {
  isValidPaceSample,
  RUNNING_PACE_UNAVAILABLE_MESSAGE,
} from '../../running/utils/runningSessionCalculations';
import {
  RecordMetricsGrid,
} from './RecordMetricsGrid';
import {
  RecordPaceGraph,
} from './RecordPaceGraph';
import {
  RecordSplitList,
} from './RecordSplitList';

type RecordAnalysisPanelProps = {
  record: RunningRecordPayload;
  isExpanded: boolean;
  panHandlers: PanResponderInstance['panHandlers'];
};

export function RecordAnalysisPanel({
  record,
  isExpanded,
  panHandlers,
}: RecordAnalysisPanelProps) {
  const paceUnavailableMessage =
    isValidPaceSample(
      record.distanceKm * 1_000,
      record.durationSeconds,
    )
      ? undefined
      : RUNNING_PACE_UNAVAILABLE_MESSAGE;

  return (
    <>
      <View
        {...panHandlers}
        accessibilityLabel="상세 기록 패널"
        style={styles.panelHandleArea}
      >
        <Ionicons
          color="#7EAC00"
          name={
            isExpanded
              ? 'chevron-down'
              : 'chevron-up'
          }
          size={26}
        />
        <View style={styles.handle} />
        <Text style={styles.panelHint}>
          상세한 기록 분석을 보려면 위로 슬라이드 하세요.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.panelContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={isExpanded}
      >
        <RecordMetricsGrid record={record} />

        <RecordSplitList
          emptyMessage={
            paceUnavailableMessage
          }
          splits={record.splits}
        />

        <View style={styles.aiComment}>
          <Text style={styles.aiBrand}>
            RUN Guard
          </Text>

          <Text style={styles.aiTitle}>
            기록 안내
          </Text>

          <Text style={styles.aiBody}>
            {paceUnavailableMessage ??
              `구간별 페이스와 변화 그래프를 확인해\n다음 러닝의 속도 배분에 활용해 보세요.`}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          그래프 분석
        </Text>

        <RecordPaceGraph
          emptyMessage={
            paceUnavailableMessage
          }
          splits={record.splits}
        />

        <View
          style={
            styles.graphDescription
          }
        >
          <Text
            style={
              styles.descriptionText
            }
          >
            기록된 구간 데이터를 기준으로
            페이스 변화를 분석합니다.
          </Text>
        </View>

        <View style={styles.finalMessage}>
          <Text
            style={
              styles.finalCaption
            }
          >
            러닝 기록이 저장되었습니다.
          </Text>

          <Text
            style={
              styles.finalTitle
            }
          >
            “수고했어요”
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  panelHandleArea: {
    height: 112,
    alignItems: 'center',
    paddingTop: 7,
    paddingHorizontal: 20,
  },
  handle: {
    width: 44,
    height: 5,
    marginTop: -2,
    borderRadius: 3,
    backgroundColor: '#D7D7D7',
  },
  panelHint: {
    marginTop: 12,
    color: '#555555',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  panelContent: {
    paddingHorizontal: 22,
    paddingBottom: 70,
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 12,
    color: '#111111',
    fontSize: 23,
    fontWeight: '800',
  },
  aiComment: {
    marginTop: 28,
    padding: 22,
    borderRadius: 22,
    backgroundColor: '#F0F8DF',
  },
  aiBrand: {
    color: '#7EAC00',
    fontSize: 13,
    fontWeight: '800',
  },
  aiTitle: {
    marginTop: 2,
    color: '#111111',
    fontSize: 25,
    fontWeight: '800',
  },
  aiBody: {
    marginTop: 15,
    color: '#333333',
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 25,
  },
  graphDescription: {
    gap: 7,
    marginTop: 14,
  },
  descriptionText: {
    color: '#555555',
    fontSize: 14,
    lineHeight: 20,
  },
  finalMessage: {
    alignItems: 'center',
    marginTop: 42,
    paddingVertical: 32,
  },
  finalCaption: {
    color: '#555555',
    fontSize: 15,
    fontWeight: '600',
  },
  finalTitle: {
    marginTop: 8,
    color: '#7EAC00',
    fontSize: 32,
    fontWeight: '800',
  },
});
