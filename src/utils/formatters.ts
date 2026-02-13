export function fmtWeight(lbs: number): string {
  return `${lbs.toFixed(1)} lbs`;
}

export function fmtPercent(pct: number): string {
  return `${pct.toFixed(1)}%`;
}

export function fmtDelta(value: number, suffix = ''): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}${suffix}`;
}

export function fmtMacro(grams: number): string {
  return `${Math.round(grams)}g`;
}

export function fmtCalories(cal: number): string {
  return `${Math.round(cal)} cal`;
}
