import { writeSimpletrackersStore } from '../storage/simpletrackers-store.js';

export function getReadingGoalSettings({ allEntries, readingSettingsKey }) {
  const settings = allEntries?.[readingSettingsKey];
  if (!settings || typeof settings !== "object") {
    return { dailyGoalMinutes: 30 };
  }
  return {
    dailyGoalMinutes: Math.max(0, Number(settings.dailyGoalMinutes) || 0)
  };
}

export function saveReadingGoalSettings({ allEntries, readingSettingsKey, dailyGoalMinutes }) {
  const existing = allEntries?.[readingSettingsKey];
  const existingObject = existing && typeof existing === "object" ? existing : {};
  allEntries[readingSettingsKey] = {
    ...existingObject,
    dailyGoalMinutes: Math.max(0, Number(dailyGoalMinutes) || 0)
  };
  writeSimpletrackersStore(allEntries);
}
