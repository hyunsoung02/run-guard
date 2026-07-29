import {
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

type SettingsToggleRowProps = {
  label: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
};

export function SettingsToggleRow({
  label,
  value,
  disabled = false,
  onValueChange,
}: SettingsToggleRowProps) {
  return (
    <View
      style={[
        styles.row,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.label}>
        {label}
      </Text>
      <Switch
        accessibilityLabel={label}
        disabled={disabled}
        onValueChange={onValueChange}
        thumbColor="#FFFFFF"
        trackColor={{
          false: '#C8C8C8',
          true: '#9FD800',
        }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: '#222222',
    fontSize: 16,
    fontWeight: '600',
  },
});
