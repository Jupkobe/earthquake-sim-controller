export function normalizeTo255(value) {
  const oldRange = [4.0, 9.0];
  const newRange = [40, 255];

  return Math.floor(newRange[0] + (value - oldRange[0]) * (newRange[1] - newRange[0]) / (oldRange[1] - oldRange[0]));
}

export function normalizeTo0to9(value) {
  const oldMin = 0;
  const oldMax = 1023;
  const newMin = 0.0;
  const newMax = 9.0;

  const normalizedValue = newMin + (value - oldMin) * (newMax - newMin) / (oldMax - oldMin);

  return normalizedValue.toFixed(1);
}

export function timeLeftMinutes(value) {
  const minutes = Math.floor(value / 60);
  const seconds = (value % 60);

  return `${minutes}:${seconds.toString().padStart(2, 0)}`
}