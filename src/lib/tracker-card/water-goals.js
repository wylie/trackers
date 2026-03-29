import { writeSimpletrackersStore } from '../storage/simpletrackers-store.js';

function normalizeVolumeUnit(value) {
  return String(value || "").trim().toLowerCase() === "ml" ? "ml" : "oz";
}

export function getWaterGoalSettings({ allEntries, waterSettingsKey }) {
  const settings = allEntries?.[waterSettingsKey];
  if (!settings || typeof settings !== "object") {
    return { goalOunces: 64, volumeUnit: "oz" };
  }
  return {
    goalOunces: Math.max(0, Number(settings.goalOunces) || 0),
    volumeUnit: normalizeVolumeUnit(settings.volumeUnit)
  };
}

export function saveWaterGoalSettings({ allEntries, waterSettingsKey, goalOunces, volumeUnit = "oz" }) {
  allEntries[waterSettingsKey] = {
    goalOunces: Math.max(0, Number(goalOunces) || 0),
    volumeUnit: normalizeVolumeUnit(volumeUnit)
  };
  writeSimpletrackersStore(allEntries);
}
