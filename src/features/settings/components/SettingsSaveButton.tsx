import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

type SettingsSaveButtonProps = {
  onPress: () => void;
};

export function SettingsSaveButton({
  onPress,
}: SettingsSaveButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.label}>
        저장
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#B2F300',
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '800',
  },
});
