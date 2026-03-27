import { writeSimpletrackersStore } from '../storage/simpletrackers-store.js';

export function getSleepGoalSettings({ allEntries, sleepSettingsKey }) {
  const settings = allEntries[sleepSettingsKey];
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return { goalHours: 8, goalMinutes: 0 };
  }
  return {
    goalHours: Math.max(0, Number(settings.goalHours) || 0),
    goalMinutes: Math.max(0, Number(settings.goalMinutes) || 0)
  };
}

export function saveSleepGoalSettings({ allEntries, sleepSettingsKey, goalHours, goalMinutes }) {
  allEntries[sleepSettingsKey] = {
    goalHours: Math.max(0, Number(goalHours) || 0),
    goalMinutes: Math.max(0, Number(goalMinutes) || 0)
  };
  writeSimpletrackersStore(allEntries);
}
