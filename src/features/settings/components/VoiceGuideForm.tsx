import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  useState,
} from 'react';

import {
  VOICE_INTERVAL_OPTIONS,
} from '../data/settingsOptions';
import {
  useSettingsPreferences,
} from '../hooks/useSettingsPreferences';
import {
  SettingsFormSection,
} from './SettingsFormSection';
import {
  SettingsSaveButton,
} from './SettingsSaveButton';
import {
  SettingsSelectOption,
} from './SettingsSelectOption';
import {
  SettingsToggleRow,
} from './SettingsToggleRow';
import {
  stopVoiceGuide,
} from '../../running/services/runningVoiceGuide';

type VoiceGuideFormProps = {
  onSaved: () => void;
};

export function VoiceGuideForm({
  onSaved,
}: VoiceGuideFormProps) {
  const {
    preferences,
    updateVoiceGuide,
  } = useSettingsPreferences();
  const [voiceGuide, setVoiceGuide] =
    useState(preferences.voiceGuide);

  function handleSave() {
    updateVoiceGuide(voiceGuide);
    Alert.alert(
      '저장 완료',
      '음성 안내 설정이 저장되었습니다.',
      [
        {
          text: '확인',
          onPress: onSaved,
        },
      ],
    );
  }

  const childDisabled =
    !voiceGuide.enabled;

  return (
    <ScrollView
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      <SettingsFormSection title="음성 안내">
        <SettingsToggleRow
          label="음성 안내 사용"
          onValueChange={(enabled) => {
            if (!enabled) {
              void stopVoiceGuide();
            }

            setVoiceGuide((current) => ({
              ...current,
              enabled,
            }));
          }}
          value={voiceGuide.enabled}
        />
        <SettingsToggleRow
          disabled={childDisabled}
          label="방향 전환 안내"
          onValueChange={(
            turnGuidanceEnabled,
          ) =>
            setVoiceGuide((current) => ({
              ...current,
              turnGuidanceEnabled,
            }))
          }
          value={
            voiceGuide.turnGuidanceEnabled
          }
        />
        <SettingsToggleRow
          disabled={childDisabled}
          label="남은 거리 안내"
          onValueChange={(
            remainingDistanceEnabled,
          ) =>
            setVoiceGuide((current) => ({
              ...current,
              remainingDistanceEnabled,
            }))
          }
          value={
            voiceGuide
              .remainingDistanceEnabled
          }
        />
        <SettingsToggleRow
          disabled={childDisabled}
          label="현재 페이스 안내"
          onValueChange={(
            paceGuidanceEnabled,
          ) =>
            setVoiceGuide((current) => ({
              ...current,
              paceGuidanceEnabled,
            }))
          }
          value={
            voiceGuide.paceGuidanceEnabled
          }
        />
      </SettingsFormSection>

      <View
        pointerEvents={
          childDisabled ? 'none' : 'auto'
        }
        style={
          childDisabled
            ? styles.disabled
            : undefined
        }
      >
        <SettingsFormSection title="안내 간격">
          <View style={styles.options}>
            {VOICE_INTERVAL_OPTIONS.map(
              (option) => (
                <SettingsSelectOption
                  key={option.value}
                  label={option.label}
                  onPress={() =>
                    setVoiceGuide(
                      (current) => ({
                        ...current,
                        intervalKm:
                          option.value,
                      }),
                    )
                  }
                  selected={
                    voiceGuide.intervalKm ===
                    option.value
                  }
                />
              ),
            )}
          </View>
        </SettingsFormSection>
      </View>

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
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  disabled: {
    opacity: 0.4,
  },
});
