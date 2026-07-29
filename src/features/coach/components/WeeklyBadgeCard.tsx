import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

const WEEKLY_BADGE_IMAGE = require(
  '../../../assets/images/badges/coach-badge-earned.png',
);

const MAX_BADGE_SIZE = 72;
const MIN_BADGE_SIZE = 64;
const BADGE_WIDTH_RATIO = 0.2;

type WeeklyBadgeCardProps = {
  badgeRewardCount: 5;
  goalAchieved: boolean;
};

export function WeeklyBadgeCard({
  badgeRewardCount,
  goalAchieved,
}: WeeklyBadgeCardProps) {
  const { width } =
    useWindowDimensions();
  const badgeSize = Math.min(
    MAX_BADGE_SIZE,
    Math.max(
      MIN_BADGE_SIZE,
      width * BADGE_WIDTH_RATIO,
    ),
  );
  const rewardText = goalAchieved
    ? `획득 완료 ×${badgeRewardCount}개`
    : `목표 달성 시 ×${badgeRewardCount}개`;

  return (
    <View
      accessibilityLabel={`주간 목표 달성 배지, ${rewardText}`}
      accessible
      style={styles.card}
    >
      <Image
        accessible={false}
        resizeMode="contain"
        source={WEEKLY_BADGE_IMAGE}
        style={{
          width: badgeSize,
          height: badgeSize,
        }}
      />

      <View style={styles.copy}>
        <Text style={styles.title}>
          주간 목표 달성 배지
        </Text>
        <Text
          style={[
            styles.reward,
            goalAchieved &&
              styles.rewardAchieved,
          ]}
        >
          {rewardText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 122,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#111111',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 3,
  },
  copy: {
    minWidth: 0,
    flex: 1,
    marginLeft: 16,
  },
  title: {
    color: '#111111',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },
  reward: {
    marginTop: 8,
    color: '#777777',
    fontSize: 15,
    fontWeight: '800',
  },
  rewardAchieved: {
    color: '#7EAC00',
  },
});
