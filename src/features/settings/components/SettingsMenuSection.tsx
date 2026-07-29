import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  SettingsMenuItemData,
  SettingsMenuSectionData,
} from '../types/settingsMenu';
import {
  SettingsMenuRow,
} from './SettingsMenuRow';

type SettingsMenuSectionProps = {
  section: SettingsMenuSectionData;
  onPressItem: (
    item: SettingsMenuItemData,
  ) => void;
};

export function SettingsMenuSection({
  section,
  onPressItem,
}: SettingsMenuSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>
        {section.title}
      </Text>

      {section.items.map((item) => (
        <SettingsMenuRow
          item={item}
          key={item.id}
          onPress={onPressItem}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
  },
  title: {
    marginBottom: 7,
    color: '#111111',
    fontSize: 18,
    fontWeight: '700',
  },
});
