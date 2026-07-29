import {
  Ionicons,
} from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import type {
  SettingsMenuItemData,
} from '../types/settingsMenu';

type SettingsMenuRowProps = {
  item: SettingsMenuItemData;
  onPress: (
    item: SettingsMenuItemData,
  ) => void;
};

export function SettingsMenuRow({
  item,
  onPress,
}: SettingsMenuRowProps) {
  return (
    <Pressable
      accessibilityLabel={item.label}
      accessibilityRole="button"
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
      ]}
    >
      <Text style={styles.label}>
        {item.label}
      </Text>

      <Ionicons
        color="#777777"
        name="chevron-forward"
        size={22}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },
  rowPressed: {
    opacity: 0.55,
  },
  label: {
    color: '#222222',
    fontSize: 16,
    fontWeight: '500',
  },
});
