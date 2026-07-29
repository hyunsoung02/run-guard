export type LocationPoint = {
  latitude: number;
  longitude: number;
  timestampMs: number;
  accuracyM: number | null;
  altitudeM: number | null;
  speedMps: number | null;
  headingDeg: number | null;
  sessionElapsedSeconds?: number;
};
