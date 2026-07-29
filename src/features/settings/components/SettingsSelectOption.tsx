import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

type SettingsSelectOptionProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function SettingsSelectOption({
  label,
  selected,
  onPress,
}: SettingsSelectOptionProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.option,
        selected && styles.selected,
      ]}
    >
      <Text
        style={[
          styles.label,
          selected &&
            styles.selectedLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#D5D5D5',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  selected: {
    borderColor: '#7EAC00',
    backgroundColor: '#F2FFD0',
  },
  label: {
    color: '#555555',
    fontSize: 15,
    fontWeight: '600',
  },
  selectedLabel: {
    color: '#577800',
  },
});
