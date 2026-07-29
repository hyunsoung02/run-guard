import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  StyleSheet,
  View,
} from 'react-native';

import {
  RunningProfileForm,
} from '../features/settings/components/RunningProfileForm';
import {
  SettingsHeader,
} from '../features/settings/components/SettingsHeader';
import type {
  RootStackParamList,
} from '../navigation/types';

type RunningProfileScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'RunningProfile'
  >;

export function RunningProfileScreen({
  navigation,
}: RunningProfileScreenProps) {
  return (
    <View style={styles.screen}>
      <SettingsHeader
        backAccessibilityLabel="메뉴 화면으로 돌아가기"
        onPressBack={() =>
          navigation.goBack()
        }
        title="러닝 프로필"
      />
      <RunningProfileForm
        onSaved={() =>
          navigation.goBack()
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
});
