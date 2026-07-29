import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const CLIPBOARD_CHECK_ICON = require(
  '../../../assets/icons/clipboard-check.png',
);

type CoachBadgeLevelHeaderProps = {
  levelName: string;
};

export function CoachBadgeLevelHeader({
  levelName,
}: CoachBadgeLevelHeaderProps) {
  return (
    <View style={styles.header}>
      <Image
        resizeMode="contain"
        source={CLIPBOARD_CHECK_ICON}
        style={styles.icon}
      />
      <Text style={styles.title}>
        {levelName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  icon: {
    width: 27,
    height: 33,
  },
  title: {
    marginLeft: 10,
    color: '#7EAC00',
    fontSize: 22,
    fontWeight: '700',
  },
});
