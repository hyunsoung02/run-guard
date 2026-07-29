import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import type {
  ImageSourcePropType,
} from 'react-native';

import type {
  CoachLevel,
} from '../types/coach.types';

const BEGINNER_BANNER = require(
  '../../../assets/images/coach/coach-advanced-banner.png',
);
const INTERMEDIATE_BANNER = require(
  '../../../assets/images/coach/coach-intermediate-banner.png',
);
const ADVANCED_BANNER = require(
  '../../../assets/images/coach/coach-beginner-banner.png',
);

/*
 * 초급과 상급 원본 파일은 파일명과 이미지 안의 급수 표기가 서로 바뀌어 있다.
 * 파일을 변경하지 않고 실제 이미지 내용에 맞춰 연결한다.
 */
const LEVEL_BANNER_IMAGES:
  Record<CoachLevel, ImageSourcePropType> = {
    beginner: BEGINNER_BANNER,
    intermediate: INTERMEDIATE_BANNER,
    advanced: ADVANCED_BANNER,
  };

/*
 * Figma에서 내보낸 PNG에는 카드 바깥의 컬러 글로우를 위한 투명 캔버스가
 * 포함되어 있다. 버튼은 실제 카드 프레임에만 맞추고, 이미지만 원래 크기로
 * 프레임 밖에 렌더링해 글로우는 유지한다.
 */
const BANNER_FRAME = {
  width: 1104,
  height: 816,
  sourceLeft: 240,
} as const;

const LEVEL_BANNER_SOURCE_LAYOUTS:
  Record<
    CoachLevel,
    {
      width: number;
      height: number;
      frameTop: number;
    }
  > = {
    beginner: {
      width: 1360,
      height: 1264,
      frameTop: 200,
    },
    intermediate: {
      width: 1360,
      height: 1304,
      frameTop: 240,
    },
    advanced: {
      width: 1360,
      height: 1304,
      frameTop: 240,
    },
  };

type CoachLevelBannerProps = {
  level: CoachLevel;
  label: string;
  description: string;
  bannerWidth: number;
  onPress: (level: CoachLevel) => void;
};

export function CoachLevelBanner({
  level,
  label,
  description,
  bannerWidth,
  onPress,
}: CoachLevelBannerProps) {
  const sourceLayout =
    LEVEL_BANNER_SOURCE_LAYOUTS[
      level
    ];
  const sourceScale =
    bannerWidth /
    BANNER_FRAME.width;

  return (
    <Pressable
      accessibilityHint="선택하면 주간 러닝 코치 플랜을 확인합니다."
      accessibilityLabel={`${label}. ${description}`}
      accessibilityRole="button"
      onPress={() => onPress(level)}
      style={({ pressed }) => [
        styles.pressable,
        {
          width: bannerWidth,
          height:
            bannerWidth *
            (BANNER_FRAME.height /
              BANNER_FRAME.width),
        },
        pressed &&
          styles.pressablePressed,
      ]}
    >
      <View
        pointerEvents="none"
        style={styles.imageLayer}
      >
        <Image
          accessible={false}
          resizeMode="contain"
          source={
            LEVEL_BANNER_IMAGES[
              level
            ]
          }
          style={[
            styles.image,
            {
              width:
                sourceLayout.width *
                sourceScale,
              height:
                sourceLayout.height *
                sourceScale,
              left:
                -BANNER_FRAME.sourceLeft *
                sourceScale,
              top:
                -sourceLayout.frameTop *
                sourceScale,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'center',
    overflow: 'visible',
    borderRadius: 24,
  },
  pressablePressed: {
    opacity: 0.88,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },
  image: {
    position: 'absolute',
  },
  imageLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'visible',
  },
});
