import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  PanResponderInstance,
} from 'react-native';

import {
  HistoryRecordDetailContent,
} from '../../records/components/HistoryRecordDetailContent';
import {
  RunningRecordCard,
} from '../../records/components/RunningRecordCard';
import type {
  RunningRecordListItem,
} from '../../records/types/runningRecordList';
import type {
  RunningRecordPayload,
} from '../../../navigation/types';
import {
  BottomNavigation,
} from './BottomNavigation';

type HomeRecordsSheetProps = {
  mode: RecordsSheetMode;
  selectedRecord: RunningRecordPayload | null;
  records: RunningRecordListItem[];
  isExpanded: boolean;
  panHandlers: PanResponderInstance['panHandlers'];
  sideNavigationOpacity:
    Animated.AnimatedInterpolation<number>;
  onPressStart: () => void;
  onPressCoach: () => void;
  onPressMenu: () => void;
  onPressRecord: (
    item: RunningRecordListItem,
  ) => void;
};

export type RecordsSheetMode =
  | 'list'
  | 'detail';

export function HomeRecordsSheet({
  mode,
  selectedRecord,
  records,
  isExpanded,
  panHandlers,
  sideNavigationOpacity,
  onPressStart,
  onPressCoach,
  onPressMenu,
  onPressRecord,
}: HomeRecordsSheetProps) {
  return (
    <View style={styles.sheet}>
      <BottomNavigation
        isExpanded={isExpanded}
        placement="top"
        panHandlers={panHandlers}
        sideNavigationOpacity={
          sideNavigationOpacity
        }
        onPressStart={onPressStart}
        onPressCoach={onPressCoach}
        onPressMenu={onPressMenu}
      />

      <View style={styles.recordsPanel}>
        {mode === 'detail' &&
        selectedRecord ? (
          <HistoryRecordDetailContent
            record={selectedRecord}
            scrollEnabled={isExpanded}
          />
        ) : (
          <View style={styles.recordsSection}>
            <View style={styles.recordsHeader}>
              <Text style={styles.title}>
                이전 러닝 기록
              </Text>
            </View>

            <View
              style={styles.recordsListWrapper}
            >
              <FlatList
                contentContainerStyle={
                  styles.listContent
                }
                data={records}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                      아직 저장된 러닝 기록이 없습니다.
                    </Text>
                  </View>
                }
                ItemSeparatorComponent={
                  RecordSeparator
                }
                renderItem={({ item }) => (
                  <RunningRecordCard
                    disabled={!isExpanded}
                    item={item}
                    onPress={onPressRecord}
                  />
                )}
                scrollEnabled={isExpanded}
                showsVerticalScrollIndicator={false}
                style={styles.list}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function RecordSeparator() {
  return (
    <View style={styles.separator} />
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  recordsPanel: {
    position: 'absolute',
    top: 96,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  list: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  recordsSection: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#FFFFFF',
  },
  recordsHeader: {
    flexShrink: 0,
    paddingTop: 58,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  recordsListWrapper: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    backgroundColor: '#FFFFFF',
  },
  title: {
    marginBottom: 20,
    color: '#111111',
    fontSize: 28,
    fontWeight: '800',
  },
  separator: {
    height: 16,
  },
  emptyState: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#888888',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
