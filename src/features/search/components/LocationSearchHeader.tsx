import {
  Ionicons,
} from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type LocationSearchHeaderProps = {
  title: string;
  onBack: () => void;
};

export function LocationSearchHeader({
  title,
  onBack,
}: LocationSearchHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="뒤로가기"
        hitSlop={10}
        onPress={onBack}
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
  );
}

const styles = StyleSheet.create({
  header: {
    height: 100,
    paddingTop: 55,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  backButton: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor:
      'rgba(255,255,255,0.88)',
  },
  title: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '800',
  },
});
