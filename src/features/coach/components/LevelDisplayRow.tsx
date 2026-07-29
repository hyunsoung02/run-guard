import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  COACH_LEVEL_DETAILS,
  COACH_LEVELS,
} from '../data/coachPlans';
import type {
  CoachLevel,
} from '../types/coach.types';

type LevelDisplayRowProps = {
  selectedLevel: CoachLevel;
};

export function LevelDisplayRow({
  selectedLevel,
}: LevelDisplayRowProps) {
  const selectedDetails =
    COACH_LEVEL_DETAILS[
      selectedLevel
    ];
  const selectedTextColor =
    selectedLevel === 'beginner'
      ? '#4E6A01'
      : selectedDetails.accentColor;

  return (
    <View
      accessibilityLabel={`현재 급수 ${selectedDetails.label}`}
      accessible
      style={styles.row}
    >
      {COACH_LEVELS.map((level) => {
        const isSelected =
          level === selectedLevel;

        return (
          <View
            key={level}
            style={[
              styles.level,
              isSelected
                ? {
                    backgroundColor:
                      selectedDetails.softColor,
                    borderColor:
                      selectedDetails.accentColor,
                  }
                : styles.levelInactive,
            ]}
          >
            <Text
              style={[
                styles.levelText,
                {
                  color: isSelected
                    ? selectedTextColor
                    : '#9A9A9A',
                },
                isSelected &&
                  styles.levelTextSelected,
              ]}
            >
              {
                COACH_LEVEL_DETAILS[
                  level
                ].label
              }
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  level: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 16,
  },
  levelInactive: {
    borderColor: '#DDDDDD',
    backgroundColor: '#E9E9E9',
  },
  levelText: {
    fontSize: 15,
    fontWeight: '700',
  },
  levelTextSelected: {
    fontWeight: '900',
  },
});
