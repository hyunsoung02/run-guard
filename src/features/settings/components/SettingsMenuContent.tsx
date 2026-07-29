import {
  Image,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  getBottomNavigationContentPadding,
} from '../../home/components/BottomNavigation';
import type {
  SettingsMenuAction,
  SettingsMenuSectionData,
  SettingsUserSummaryData,
} from '../types/settingsMenu';
import {
  SettingsMenuSection,
} from './SettingsMenuSection';
import {
  SettingsUserSummary,
} from './SettingsUserSummary';

const RUN_GUARD_LOGO = require(
  '../../../assets/images/settings/run-guard-logo.png',
);

type SettingsMenuContentProps = {
  userSummary: SettingsUserSummaryData;
  sections: SettingsMenuSectionData[];
  onPressItem: (
    action: SettingsMenuAction,
  ) => void;
};

export function SettingsMenuContent({
  userSummary,
  sections,
  onPressItem,
}: SettingsMenuContentProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomContentPadding =
    getBottomNavigationContentPadding(
      width,
      insets.bottom,
    );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom:
            bottomContentPadding,
        },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      <SettingsUserSummary
        data={userSummary}
      />

      {sections.map((section) => (
        <SettingsMenuSection
          key={section.id}
          onPressItem={(item) =>
            onPressItem(item.action)
          }
          section={section}
        />
      ))}

      <Image
        resizeMode="contain"
        source={RUN_GUARD_LOGO}
        style={styles.logo}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  logo: {
    alignSelf: 'center',
    width: 120,
    height: 72,
    marginTop: 36,
  },
});
