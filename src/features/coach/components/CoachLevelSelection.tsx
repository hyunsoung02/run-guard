import {
  ScrollView,
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
import {
  SettingsBottomNavigation,
} from '../../settings/components/SettingsBottomNavigation';
import {
  SettingsHeader,
} from '../../settings/components/SettingsHeader';
import {
  COACH_LEVEL_DETAILS,
  COACH_LEVELS,
} from '../data/coachPlans';
import type {
  CoachLevel,
} from '../types/coach.types';
import {
  CoachLevelBanner,
} from './CoachLevelBanner';

type CoachLevelSelectionProps = {
  onPressBack: () => void;
  onPressCoach: () => void;
  onPressMenu: () => void;
  onPressStart: () => void;
  onSelectLevel: (
    level: CoachLevel,
  ) => void;
};

const FIGMA_SCREEN_WIDTH = 375;
const FIGMA_BANNER_WIDTH = 276;
const FIGMA_BANNER_GAP = 32;
const FIGMA_HEADER_GAP = 12;
const MAX_LAYOUT_WIDTH = 430;

export function CoachLevelSelection({
  onPressBack,
  onPressCoach,
  onPressMenu,
  onPressStart,
  onSelectLevel,
}: CoachLevelSelectionProps) {
  const { width } =
    useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layoutWidth = Math.min(
    width,
    MAX_LAYOUT_WIDTH,
  );
  const designScale =
    layoutWidth /
    FIGMA_SCREEN_WIDTH;
  const bannerWidth =
    FIGMA_BANNER_WIDTH *
    designScale;
  const bannerGap =
    FIGMA_BANNER_GAP *
    designScale;
  const bottomContentPadding =
    getBottomNavigationContentPadding(
      width,
      insets.bottom,
    );

  return (
    <View style={styles.screen}>
      <SettingsHeader
        backAccessibilityLabel="이전 화면으로 돌아가기"
        onPressBack={onPressBack}
        title="러닝 코치"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop:
              FIGMA_HEADER_GAP *
              designScale,
            paddingBottom:
              bottomContentPadding,
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={[
            styles.bannerList,
            {
              gap: bannerGap,
            },
          ]}
        >
          {COACH_LEVELS.map(
            (level) => {
              const details =
                COACH_LEVEL_DETAILS[
                  level
                ];

              return (
                <CoachLevelBanner
                  bannerWidth={
                    bannerWidth
                  }
                  description={
                    details.selectionDescription
                  }
                  key={level}
                  label={details.label}
                  level={level}
                  onPress={
                    onSelectLevel
                  }
                />
              );
            },
          )}
        </View>
      </ScrollView>

      <SettingsBottomNavigation
        onPressCoach={onPressCoach}
        onPressMenu={onPressMenu}
        onPressStart={onPressStart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  scrollContent: {
    alignItems: 'center',
  },
  bannerList: {
    width: '100%',
    alignItems: 'center',
  },
});
