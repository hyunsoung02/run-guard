import {
  Image,
  Text,
  View,
} from 'react-native';
import {
  formatDistanceKm,
} from '../../../utils/distanceFormat';

const heroBackground = require(
  '../../../assets/images/home/main_hero_background.png',
);

const speechBubble = require(
  '../../../assets/images/home/speech_bubble.png',
);

const runLogo = require(
  '../../../assets/images/home/run_logo.png',
);

export const HOME_DESIGN_WIDTH = 375;
export const HOME_DESIGN_HEIGHT = 812;

type HomeCanvasProps = {
  scale: number;
  height: number;
  bottomNavigationHeight: number;
  currentKm: number;
  goalKm: number;
  speechMessage: string;
};

/**
 * 피그마 375 × 812 기준 위치 조정값입니다.
 *
 * 음수: 위로 이동
 * 양수: 아래로 이동
 */
const TUNE = {
  // RUN 로고를 기존 위치보다 35px 위로 이동
  runY: -35,

  // 게이지와 남은 거리 문장을 함께 35px 위로 이동
  progressY: -35,

  // 말풍선 전체 위치
  speechY: 14,

  // 말풍선 텍스트 좌우 위치
  speechTextX: -5,

  // 말풍선 텍스트 기울기
  speechTextRotate: '16deg',
} as const;

const clamp = (
  value: number,
  min: number,
  max: number,
) => Math.min(Math.max(value, min), max);

export function HomeCanvas({
  scale,
  height,
  bottomNavigationHeight,
  currentKm,
  goalKm,
  speechMessage,
}: HomeCanvasProps) {
  const s = (value: number) =>
    value * scale;

  // 목표가 0일 때 나눗셈 오류 방지
  const safeGoal =
    goalKm > 0 ? goalKm : 1;

  // 진행률을 0~1 사이로 제한
  const progress = clamp(
    currentKm / safeGoal,
    0,
    1,
  );

  // 남은 거리가 음수가 되지 않게 제한
  const remainingKm = Math.max(
    goalKm - currentKm,
    0,
  );
  const defaultProgressTop = s(
    636 + TUNE.progressY,
  );
  const progressBlockHeight =
    s(41 + 11 + 16);
  const minimumNavigationGap = s(16);
  const navigationTop =
    height -
    bottomNavigationHeight;
  const preferredProgressTop =
    navigationTop -
    progressBlockHeight -
    minimumNavigationGap;
  const progressOffsetY = clamp(
    preferredProgressTop -
      defaultProgressTop,
    -height,
    s(72),
  );
  const compactAmount = Math.max(
    0,
    -progressOffsetY,
  );
  const heroOffsetY = -Math.min(
    compactAmount * 0.18,
    s(24),
  );
  const speechOffsetY = -Math.min(
    compactAmount * 0.1,
    s(12),
  );

  return (
    <View
      style={{
        width: s(HOME_DESIGN_WIDTH),
        height,
        overflow: 'hidden',
        backgroundColor: '#F3F3F3',
      }}
    >
      {/* 캐릭터와 배경 */}
      <Image
        source={heroBackground}
        resizeMode="contain"
        style={{
          position: 'absolute',
          top: heroOffsetY,
          left: 0,
          width: s(
            HOME_DESIGN_WIDTH,
          ),
          height: s(
            HOME_DESIGN_HEIGHT,
          ),
        }}
      />

      {/* 말풍선 */}
      <Image
        source={speechBubble}
        resizeMode="stretch"
        style={{
          position: 'absolute',
          left: s(156),
          top: s(
            80 + TUNE.speechY,
          ) + speechOffsetY,
          width: s(190),
          height: s(150),
        }}
      />

      {/* 말풍선 텍스트 */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: s(198),
          top: s(
            107 + TUNE.speechY,
          ) + speechOffsetY,
          width: s(127),
          height: s(72),

          alignItems: 'center',
          justifyContent: 'center',

          transform: [
            {
              translateX: s(
                TUNE.speechTextX,
              ),
            },
            {
              rotate:
                TUNE.speechTextRotate,
            },
          ],
        }}
      >
        <Text
          allowFontScaling={false}
          numberOfLines={2}
          style={{
            color: '#111111',
            fontSize: s(17),
            lineHeight: s(21.5),
            fontWeight: '800',
            textAlign: 'center',
            letterSpacing: s(-0.45),
          }}
        >
          {speechMessage}
        </Text>
      </View>

      {/* RUN 로고 */}
      <Image
        source={runLogo}
        resizeMode="stretch"
        style={{
          position: 'absolute',
          left: s(126),

          // 574 → 539
          top: s(
            574 + TUNE.runY,
          ) + progressOffsetY,

          width: s(124),
          height: s(70),
        }}
      />

      {/* 게이지와 남은 거리 문장 전체 */}
      <View
        style={{
          position: 'absolute',
          left: s(56),

          // 641 → 601
          top: s(
            636 +
              TUNE.progressY,
          ) + progressOffsetY,

          width: s(260),
          alignItems: 'center',
        }}
      >
        {/* 게이지 외부 바 */}
        <View
          style={{
            width: s(260),
            height: s(41),
            padding: s(4),

            borderRadius: s(20.5),
            backgroundColor: '#FFFEFE',

            shadowColor: '#000000',
            shadowOpacity: 0.22,
            shadowRadius: s(5),
            shadowOffset: {
              width: 0,
              height: s(5),
            },

            elevation: 7,
          }}
        >
          {/* 게이지 내부 */}
          <View
            style={{
              flex: 1,
              overflow: 'hidden',

              borderRadius: s(16.5),
              backgroundColor: '#FFFEFE',

              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* 라임색 진행 영역 */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,

                width: s(
                  252 * progress,
                ),

                backgroundColor:
                  '#B2F300',
              }}
            />

            {/* 현재 거리 / 목표 거리 */}
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={{
                color: '#050505',
                fontSize: s(17.5),
                lineHeight: s(22),
                fontWeight: '900',
                letterSpacing: s(-0.65),
              }}
            >
              {formatDistanceKm(
                currentKm,
                2,
              )}
              {' / '}
              {formatDistanceKm(
                goalKm,
                2,
              )}
              {' '}

              <Text
                allowFontScaling={false}
                style={{
                  fontSize: s(16.5),
                  fontWeight: '900',
                }}
              >
                KM
              </Text>
            </Text>
          </View>
        </View>

        {/* 남은 거리 안내 문장 */}
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          style={{
            marginTop: s(11),

            color: '#837E7E',
            fontSize: s(11.5),
            lineHeight: s(16),
            fontWeight: '700',
            letterSpacing: s(-0.45),
            textAlign: 'center',
          }}
        >
          {formatDistanceKm(
            remainingKm,
            2,
          )}
          KM 남았어요! 조금만 더 파이팅!!
        </Text>
      </View>
    </View>
  );
}
