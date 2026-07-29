import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  StyleSheet,
  View,
} from 'react-native';

import {
  SettingsHeader,
} from '../features/settings/components/SettingsHeader';
import {
  VoiceGuideForm,
} from '../features/settings/components/VoiceGuideForm';
import type {
  RootStackParamList,
} from '../navigation/types';

type VoiceGuideScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'VoiceGuide'
  >;

export function VoiceGuideScreen({
  navigation,
}: VoiceGuideScreenProps) {
  return (
    <View style={styles.screen}>
      <SettingsHeader
        backAccessibilityLabel="메뉴 화면으로 돌아가기"
        onPressBack={() =>
          navigation.goBack()
        }
        title="음성 안내"
      />
      <VoiceGuideForm
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
