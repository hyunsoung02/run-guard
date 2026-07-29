import type {
  TargetDistanceKm,
} from '../../../navigation/types';

export type TargetDistanceOption = {
  distance: TargetDistanceKm;
  time: string;
};

export const TARGET_DISTANCE_OPTIONS: TargetDistanceOption[] = [
  {
    distance: 5,
    time: '약 25:00~30:00',
  },
  {
    distance: 7,
    time: '약 35:00~41:00',
  },
  {
    distance: 10,
    time: '약 50:00~60:00',
  },
];
