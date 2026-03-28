import { writeSimpletrackersStore } from '../storage/simpletrackers-store.js';

export function getWaterGoalSettings({ allEntries, waterSettingsKey }) {
  const settings = allEntries?.[waterSettingsKey];
  if (!settings || typeof settings !== "object") {
    return { goalOunces: 64 };
  }
  return {
    goalOunces: Math.max(0, Number(settings.goalOunces) || 0)
  };
}

export function saveWaterGoalSettings({ allEntries, waterSettingsKey, goalOunces }) {
  allEntries[waterSettingsKey] = {
    goalOunces: Math.max(0, Number(goalOunces) || 0)
  };
  writeSimpletrackersStore(allEntries);
}
