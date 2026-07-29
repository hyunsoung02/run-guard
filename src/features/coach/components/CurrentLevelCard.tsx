import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

const COACH_CHARACTER = require(
  '../../../assets/images/records/record-coach-character.png',
);

type CurrentLevelCardProps = {
  levelTitle: string;
  description: string;
  accentColor: string;
  softColor: string;
};

export function CurrentLevelCard({
  levelTitle,
  description,
  accentColor,
  softColor,
}: CurrentLevelCardProps) {
  const { width } =
    useWindowDimensions();
  const isCompact = width < 380;

  return (
    <View
      accessibilityLabel={`${levelTitle}. ${description}`}
      accessible
      style={[
        styles.card,
        isCompact &&
          styles.cardCompact,
        {
          backgroundColor: softColor,
          borderColor: accentColor,
        },
      ]}
    >
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>
          나의 러닝 레벨
        </Text>

        <Text style={styles.description}>
          {description}
        </Text>
      </View>

      <Image
        accessible={false}
        resizeMode="contain"
        source={COACH_CHARACTER}
        style={[
          styles.character,
          isCompact &&
            styles.characterCompact,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 158,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingLeft: 20,
    borderWidth: 1.5,
    borderRadius: 24,
    shadowColor: '#111111',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardCompact: {
    paddingLeft: 16,
  },
  copy: {
    zIndex: 1,
    flex: 1,
    paddingVertical: 20,
  },
  eyebrow: {
    color: '#555555',
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    marginTop: 10,
    color: '#111111',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
  },
  character: {
    width: 108,
    height: 144,
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  characterCompact: {
    width: 88,
    height: 118,
    marginRight: 0,
  },
});
