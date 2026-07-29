export type GuidanceTheme = {
  backgroundColor: string;
  foregroundColor: string;
};

export function getGuidanceTheme(
  distanceM: number | null,
): GuidanceTheme {
  if (distanceM === null) {
    return {
      backgroundColor: '#B2F300',
      foregroundColor: '#111111',
    };
  }
  if (distanceM <= 10) {
    return {
      backgroundColor: '#FF2B06',
      foregroundColor: '#FFFFFF',
    };
  }

  if (distanceM <= 100) {
    return {
      backgroundColor: '#FF6E32',
      foregroundColor: '#111111',
    };
  }

  return {
    backgroundColor: '#B2F300',
    foregroundColor: '#111111',
  };
}
