import {
  Image,
  StyleSheet,
  View,
} from 'react-native';

import type {
  CoachBadgeSlotData,
} from '../types/coachBadge';

const EARNED_BADGE_IMAGE = require(
  '../../../assets/images/badges/coach-badge-earned.png',
);
const EMPTY_BADGE_IMAGE = require(
  '../../../assets/images/badges/coach-badge-empty.png',
);

type CoachBadgeSlotProps = {
  badge: CoachBadgeSlotData;
  size: number;
};

export function CoachBadgeSlot({
  badge,
  size,
}: CoachBadgeSlotProps) {
  return (
    <View
      accessibilityLabel={
        badge.earned
          ? `${badge.index}번째 획득 배지`
          : `${badge.index}번째 미획득 배지`
      }
      accessible
      style={[
        styles.slot,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Image
        resizeMode="contain"
        source={
          badge.earned
            ? EARNED_BADGE_IMAGE
            : EMPTY_BADGE_IMAGE
        }
        style={{
          width: size,
          height: size,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});
