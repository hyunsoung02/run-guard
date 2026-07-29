import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

export function GoalAchievedScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>
        목표 달성
      </Text>
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

  title: {
    color: '#111111',
    fontSize: 40,
    fontWeight: '800',
  },
});