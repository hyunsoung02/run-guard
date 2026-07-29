import {
  Ionicons,
} from '@expo/vector-icons';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

type SettingsHeaderProps = {
  title: string;
  backAccessibilityLabel: string;
  onPressBack: () => void;
};

export function SettingsHeader({
  title,
  backAccessibilityLabel,
  onPressBack,
}: SettingsHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar
        backgroundColor="#F3F3F3"
        barStyle="dark-content"
      />

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <Pressable
          accessibilityLabel={
            backAccessibilityLabel
          }
          accessibilityRole="button"
          hitSlop={8}
          onPress={onPressBack}
          style={styles.backButton}
        >
          <Ionicons
            color="#111111"
            name="arrow-back"
            size={30}
          />
        </Pressable>

        <Text style={styles.title}>
          {title}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  backButton: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
  },
  title: {
    marginLeft: 7,
    color: '#111111',
    fontSize: 27,
    fontWeight: '700',
  },
});
