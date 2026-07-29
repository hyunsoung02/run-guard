export function formatDistanceKm(
  value: unknown,
  maximumFractionDigits = 3,
): string {
  const numericValue =
    typeof value === 'number'
      ? value
      : Number(value);

  if (!Number.isFinite(numericValue)) {
    return '0';
  }

  const fractionDigits = Math.min(
    3,
    Math.max(
      0,
      Math.floor(maximumFractionDigits),
    ),
  );
  const rounded = numericValue.toFixed(
    fractionDigits,
  );

  return rounded
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '');
}
