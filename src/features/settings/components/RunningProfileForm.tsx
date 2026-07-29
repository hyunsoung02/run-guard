import {
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  useState,
} from 'react';

import {
  useSettingsPreferences,
} from '../hooks/useSettingsPreferences';
import {
  validateRunningProfile,
} from '../utils/validateSettingsPreferences';
import type {
  ProfileValidationErrors,
} from '../utils/validateSettingsPreferences';
import {
  SettingsNumberField,
} from './SettingsNumberField';
import {
  SettingsSaveButton,
} from './SettingsSaveButton';

type RunningProfileFormProps = {
  onSaved: () => void;
};

export function RunningProfileForm({
  onSaved,
}: RunningProfileFormProps) {
  const {
    preferences,
    updateProfile,
  } = useSettingsPreferences();
  const [age, setAge] = useState(
    String(preferences.profile.age),
  );
  const [heightCm, setHeightCm] =
    useState(
      String(preferences.profile.heightCm),
    );
  const [weightKg, setWeightKg] =
    useState(
      String(preferences.profile.weightKg),
    );
  const [errors, setErrors] =
    useState<ProfileValidationErrors>({});

  function handleSave() {
    const profile = {
      age: Number(age),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
    };
    const nextErrors =
      validateRunningProfile(profile);

    setErrors(nextErrors);
    if (
      Object.keys(nextErrors).length > 0
    ) {
      return;
    }

    updateProfile(profile);
    Alert.alert(
      '저장 완료',
      '러닝 프로필이 저장되었습니다.',
      [
        {
          text: '확인',
          onPress: onSaved,
        },
      ],
    );
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.content
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      <SettingsNumberField
        error={errors.age}
        label="나이"
        onChangeText={setAge}
        unit="세"
        value={age}
      />
      <SettingsNumberField
        error={errors.heightCm}
        label="키"
        onChangeText={setHeightCm}
        unit="cm"
        value={heightCm}
      />
      <SettingsNumberField
        error={errors.weightKg}
        label="몸무게"
        onChangeText={setWeightKg}
        unit="kg"
        value={weightKg}
      />

      <SettingsSaveButton
        onPress={handleSave}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
});
