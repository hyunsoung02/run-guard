import {
  Animated,
} from 'react-native';
import {
  useRef,
} from 'react';

import {
  BottomNavigation,
} from '../../home/components/BottomNavigation';

type SettingsBottomNavigationProps = {
  onPressCoach: () => void;
  onPressStart: () => void;
  onPressMenu: () => void;
};

export function SettingsBottomNavigation({
  onPressCoach,
  onPressStart,
  onPressMenu,
}: SettingsBottomNavigationProps) {
  const sideNavigationOpacity = useRef(
    new Animated.Value(1),
  ).current.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1],
  });

  return (
    <BottomNavigation
      sideNavigationOpacity={
        sideNavigationOpacity
      }
      onPressCoach={onPressCoach}
      onPressMenu={onPressMenu}
      onPressStart={onPressStart}
    />
  );
}
