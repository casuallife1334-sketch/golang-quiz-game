export const HOST_SIGNAL = "host_signal";

export function isHostSignalDuration(value) {
  return value === HOST_SIGNAL;
}

export function getTrainingDurationMs(value, fallbackSeconds) {
  if (isHostSignalDuration(value)) {
    return null;
  }

  const numericValue = Number(value);
  const seconds = Number.isFinite(numericValue) && numericValue > 0
    ? numericValue
    : fallbackSeconds;

  return seconds * 1000;
}
