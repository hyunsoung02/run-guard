import type {
  VoiceGuideIntervalKm,
} from '../types/settingsPreferences';

export const VOICE_INTERVAL_OPTIONS: {
  value: VoiceGuideIntervalKm;
  label: string;
}[] = [
  { value: 0.5, label: '0.5km' },
  { value: 1, label: '1km' },
  { value: 2, label: '2km' },
];
