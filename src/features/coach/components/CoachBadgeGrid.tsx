import {
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import type {
  CoachBadgeSlotData,
} from '../types/coachBadge';
import {
  CoachBadgeSlot,
} from './CoachBadgeSlot';

type CoachBadgeGridProps = {
  badges: CoachBadgeSlotData[];
  bottomPadding: number;
};

const COLUMN_COUNT = 5;
const GRID_HORIZONTAL_PADDING = 24;
const COLUMN_GAP = 2;
const ROW_GAP = 3;
const MIN_BADGE_SIZE = 75;
const MAX_BADGE_SIZE = 81;

export function CoachBadgeGrid({
  badges,
  bottomPadding,
}: CoachBadgeGridProps) {
  const { width } = useWindowDimensions();
  const availableWidth =
    width -
    GRID_HORIZONTAL_PADDING * 2 -
    COLUMN_GAP * (COLUMN_COUNT - 1);
  const calculatedBadgeSize = Math.floor(
    availableWidth / COLUMN_COUNT,
  );
  const badgeSize = Math.min(
    MAX_BADGE_SIZE,
    Math.max(
      MIN_BADGE_SIZE,
      calculatedBadgeSize,
    ),
  );

  return (
    <FlatList
      columnWrapperStyle={
        styles.columns
      }
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom:
            bottomPadding,
        },
      ]}
      data={badges}
      keyExtractor={(item) => item.id}
      numColumns={COLUMN_COUNT}
      renderItem={({ item }) => (
        <CoachBadgeSlot
          badge={item}
          size={badgeSize}
        />
      )}
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal:
      GRID_HORIZONTAL_PADDING,
    paddingTop: 18,
    rowGap: ROW_GAP,
  },
  columns: {
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: COLUMN_GAP,
  },
});
