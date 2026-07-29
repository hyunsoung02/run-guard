import type {
  RunningProfileSettings,
} from '../types/settingsPreferences';

export type ProfileValidationErrors = {
  age?: string;
  heightCm?: string;
  weightKg?: string;
};

export function validateRunningProfile(
  profile: RunningProfileSettings,
): ProfileValidationErrors {
  const errors: ProfileValidationErrors = {};

  if (
    !Number.isInteger(profile.age) ||
    profile.age < 10 ||
    profile.age > 100
  ) {
    errors.age =
      '나이는 10세에서 100세 사이로 입력해 주세요.';
  }
  if (
    !Number.isFinite(profile.heightCm) ||
    profile.heightCm < 100 ||
    profile.heightCm > 230
  ) {
    errors.heightCm =
      '키는 100cm에서 230cm 사이로 입력해 주세요.';
  }
  if (
    !Number.isFinite(profile.weightKg) ||
    profile.weightKg < 30 ||
    profile.weightKg > 250
  ) {
    errors.weightKg =
      '몸무게는 30kg에서 250kg 사이로 입력해 주세요.';
  }

  return errors;
}
