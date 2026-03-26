import { formatDurationLabel, formatMinutesAsDuration } from './common.js';

export function parseSleepDuration(entry) {
  const directHours = Number(entry?.sleepHours);
  const directMinutes = Number(entry?.sleepMinutes);
  if (Number.isFinite(directHours) || Number.isFinite(directMinutes)) {
    return {
      hours: Math.max(0, Number.isFinite(directHours) ? directHours : 0),
      minutes: Math.max(0, Number.isFinite(directMinutes) ? directMinutes : 0)
    };
  }

  const rawItem = String(entry?.item || "").toLowerCase();
  const match = rawItem.match(/(?:(\d+)\s*h(?:ours?)?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?/i);
  return {
    hours: Number(match?.[1] || 0),
    minutes: Number(match?.[2] || 0)
  };
}

export function formatSleepDuration(hours, minutes) {
  return formatDurationLabel(hours, minutes);
}

export function getSleepGrade(actualHours, actualMinutes, goalHours, goalMinutes) {
  const actualTotal = Math.max(0, Number(actualHours) || 0) * 60 + Math.max(0, Number(actualMinutes) || 0);
  const goalTotal = Math.max(0, Number(goalHours) || 0) * 60 + Math.max(0, Number(goalMinutes) || 0);
  if (goalTotal <= 0 || actualTotal <= 0) {
    return { score: null, detail: "Set a nightly goal to score entries.", stars: 0 };
  }

  const diff = Math.abs(actualTotal - goalTotal);
  const score = Math.max(0, Math.round(100 - (diff / goalTotal) * 100));
  const stars = Math.max(1, Math.min(5, Math.round(score / 20)));
  const direction = actualTotal >= goalTotal ? "over" : "under";
  return {
    score,
    detail: `${formatMinutesAsDuration(diff)} ${direction} goal`,
    stars
  };
}
