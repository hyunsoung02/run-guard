import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

export function CoachHydrationPlaceholder() {
  return (
    <View
      accessibilityLabel="러닝 코치 정보를 불러오는 중"
      accessible
      style={styles.screen}
    >
      <StatusBar
        backgroundColor="#F3F3F3"
        barStyle="dark-content"
      />
      <ActivityIndicator
        color="#7EAC00"
        size="large"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F3F3',
  },
});
