import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type {
  PanResponderInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const playButton = require('../../../assets/images/home/play_button.png');
const coachIcon = require('../../../assets/images/home/coach_icon.png');
const menuIcon = require('../../../assets/images/home/menu_icon.png');

const DESIGN_WIDTH = 375;
const DESIGN_NAV_HEIGHT = 133;
const DESIGN_SAFE_BOTTOM = 34;
const DESIGN_CONTENT_HEIGHT =
  DESIGN_NAV_HEIGHT -
  DESIGN_SAFE_BOTTOM;
const DESIGN_PLAY_BUTTON_SIZE = 82;
const DESIGN_PLAY_BUTTON_RING = 7;
const DESIGN_PLAY_BUTTON_LIFT = 10;
const DESIGN_SIDE_BUTTON_CONTENT_OFFSET = 6;
const CONTENT_VISUAL_GAP = 16;

const NAVIGATION_BACKGROUND_COLOR = '#FFFFFF';
const PLAY_BUTTON_X_OFFSET = -2;
const MAX_LAYOUT_WIDTH = 430;

type BottomNavigationProps = {
  isExpanded?: boolean;
  placement?: 'top' | 'bottom';
  panHandlers?: PanResponderInstance['panHandlers'];
  sideNavigationOpacity:
    Animated.AnimatedInterpolation<number>;
  onPressStart: () => void;
  onPressCoach: () => void;
  onPressMenu: () => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function getBottomNavigationHeight(
  screenWidth: number,
  safeBottom: number,
): number {
  const layoutWidth = Math.min(
    screenWidth,
    MAX_LAYOUT_WIDTH,
  );
  const scale = clamp(
    layoutWidth / DESIGN_WIDTH,
    0.9,
    1.15,
  );
  return (
    DESIGN_CONTENT_HEIGHT * scale +
    Math.max(0, safeBottom)
  );
}

export function getBottomNavigationContentPadding(
  screenWidth: number,
  safeBottom: number,
): number {
  const layoutWidth = Math.min(
    screenWidth,
    MAX_LAYOUT_WIDTH,
  );
  const scale = clamp(
    layoutWidth / DESIGN_WIDTH,
    0.9,
    1.15,
  );

  return (
    getBottomNavigationHeight(
      screenWidth,
      safeBottom,
    ) +
    (DESIGN_PLAY_BUTTON_SIZE / 2 +
      CONTENT_VISUAL_GAP) *
      scale
  );
}

export function BottomNavigation({
  isExpanded = false,
  placement = 'bottom',
  panHandlers,
  sideNavigationOpacity,
  onPressStart,
  onPressCoach,
  onPressMenu,
}: BottomNavigationProps) {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const layoutWidth = Math.min(screenWidth, MAX_LAYOUT_WIDTH);
  const layoutLeft = (screenWidth - layoutWidth) / 2;

  const scale = clamp(layoutWidth / DESIGN_WIDTH, 0.9, 1.15);

  const safeBottom = Math.max(
    0,
    insets.bottom,
  );
  const totalHeight =
    getBottomNavigationHeight(
      screenWidth,
      safeBottom,
    );

  const playSize =
    DESIGN_PLAY_BUTTON_SIZE * scale;
  const playButtonRing =
    DESIGN_PLAY_BUTTON_RING * scale;
  const playButtonLift =
    DESIGN_PLAY_BUTTON_LIFT * scale;
  const playButtonPlateSize =
    playSize + playButtonRing * 2;
  const coachIconSize = 35 * scale;
  const menuIconSize = 31 * scale; // 메뉴를 더 작게
  const controlsBottom =
    totalHeight - safeBottom;
  const sideButtonTop = Math.max(
    4 * scale,
    controlsBottom - 72 * scale,
  );
  const playButtonTop = Math.max(
    0,
    controlsBottom - playSize,
  );
  const navigationContentHeight =
    controlsBottom - sideButtonTop;
  const navigationRootHeight =
    navigationContentHeight + safeBottom;
  const playButtonPlateTop =
    playButtonTop -
    sideButtonTop -
    playButtonLift -
    playButtonRing;

  return (
    <View
      {...panHandlers}
      accessibilityLabel={
        panHandlers
          ? '이전 기록 패널 손잡이'
          : undefined
      }
      style={[
        styles.root,
        placement === 'top'
          ? styles.rootTop
          : styles.rootBottom,
        {
          height: totalHeight,
        },
      ]}
    >
      <View
        pointerEvents="box-none"
        style={[
          styles.navigationRoot,
          {
            height: navigationRootHeight,
            borderTopLeftRadius:
              28 * scale,
            borderTopRightRadius:
              28 * scale,
          },
        ]}
      >
        <View
          pointerEvents="box-none"
          style={[
            styles.navigationContentRow,
            {
              height:
                navigationContentHeight,
            },
          ]}
        >
          {/* 러닝 코치 */}
          <Animated.View
            pointerEvents={
              isExpanded
                ? 'none'
                : 'auto'
            }
            style={[
              {
                position: 'absolute',
                left:
                  layoutLeft +
                  40 * scale,
                top: 0,
                width: 72 * scale,
                height: 72 * scale,
              },
              {
                opacity:
                  sideNavigationOpacity,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="러닝 코치"
              onPress={onPressCoach}
              hitSlop={8}
              style={({ pressed }) => [
                styles.sideButton,
                {
                  paddingTop:
                    DESIGN_SIDE_BUTTON_CONTENT_OFFSET *
                    scale,
                },
                pressed &&
                  styles.sideButtonPressed,
              ]}
            >
              <Image
                source={coachIcon}
                resizeMode="contain"
                style={{
                  width: coachIconSize,
                  height: coachIconSize,
                }}
              />
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={{
                  marginTop: 5 * scale,
                  color: '#8E908B',
                  fontSize: 14 * scale,
                  lineHeight: 18 * scale,
                  fontWeight: '800',
                  letterSpacing:
                    -0.35 * scale,
                }}
              >
                러닝 코치
              </Text>
            </Pressable>
          </Animated.View>

          {/* 메뉴 */}
          <Animated.View
            pointerEvents={
              isExpanded
                ? 'none'
                : 'auto'
            }
            style={[
              {
                position: 'absolute',
                right:
                  layoutLeft +
                  40 * scale,
                top: 0,
                width: 72 * scale,
                height: 72 * scale,
              },
              {
                opacity:
                  sideNavigationOpacity,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="메뉴"
              onPress={onPressMenu}
              hitSlop={8}
              style={({ pressed }) => [
                styles.sideButton,
                {
                  paddingTop:
                    DESIGN_SIDE_BUTTON_CONTENT_OFFSET *
                    scale,
                },
                pressed &&
                  styles.sideButtonPressed,
              ]}
            >
              <Image
                source={menuIcon}
                resizeMode="contain"
                style={{
                  width: menuIconSize,
                  height: menuIconSize,
                }}
              />
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={{
                  marginTop: 5 * scale,
                  color: '#8E908B',
                  fontSize: 14 * scale,
                  lineHeight: 18 * scale,
                  fontWeight: '800',
                  letterSpacing:
                    -0.35 * scale,
                }}
              >
                메뉴
              </Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* 재생 버튼과 흰색 원형 받침 */}
        <View
          pointerEvents="box-none"
          style={[
            styles.playButtonPlate,
            {
              left:
                (screenWidth -
                  playButtonPlateSize) /
                  2 +
                PLAY_BUTTON_X_OFFSET *
                  scale,
              top: playButtonPlateTop,
              width:
                playButtonPlateSize,
              height:
                playButtonPlateSize,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="러닝 시작"
            onPress={onPressStart}
            hitSlop={8}
            style={({ pressed }) => ({
              width: playSize,
              height: playSize,
              borderRadius:
                playSize / 2,
              overflow: 'hidden',
              opacity:
                pressed ? 0.85 : 1,
              transform: [
                {
                  scale: pressed
                    ? 0.97
                    : 1,
                },
              ],
            })}
          >
            <Image
              source={playButton}
              resizeMode="stretch"
              style={styles.fill}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'visible',
    backgroundColor: 'transparent',
    zIndex: 100,
    elevation: 100,
  },
  rootTop: {
    top: 0,
  },
  rootBottom: {
    bottom: 0,
  },
  navigationRoot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'visible',
    backgroundColor:
      NAVIGATION_BACKGROUND_COLOR,
  },
  playButtonPlate: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 9999,
    backgroundColor:
      NAVIGATION_BACKGROUND_COLOR,
    zIndex: 2,
  },
  navigationContentRow: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    width: '100%',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  sideButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  sideButtonPressed: {
    opacity: 0.7,
  },
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});
