import {
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  getBottomNavigationContentPadding,
} from '../../home/components/BottomNavigation';
import type {
  CoachBadgeSlotData,
} from '../types/coachBadge';
import {
  CoachBadgeGrid,
} from './CoachBadgeGrid';
import {
  CoachBadgeLevelHeader,
} from './CoachBadgeLevelHeader';

type CoachBadgeContentProps = {
  levelName: string;
  badges: CoachBadgeSlotData[];
};

export function CoachBadgeContent({
  levelName,
  badges,
}: CoachBadgeContentProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomContentPadding =
    getBottomNavigationContentPadding(
      width,
      insets.bottom,
    );

  return (
    <View style={styles.content}>
      <CoachBadgeLevelHeader
        levelName={levelName}
      />

      <View style={styles.grid}>
        <CoachBadgeGrid
          badges={badges}
          bottomPadding={
            bottomContentPadding
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    minHeight: 0,
  },
  grid: {
    flex: 1,
    minHeight: 0,
    overflow: 'visible',
  },
});
