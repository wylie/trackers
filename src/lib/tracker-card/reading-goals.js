import { writeSimpletrackersStore } from '../storage/simpletrackers-store.js';

function normalizeReadingGoalMode(value) {
  return String(value || "").trim().toLowerCase() === "pages" ? "pages" : "minutes";
}

export function getReadingGoalSettings({ allEntries, readingSettingsKey }) {
  const settings = allEntries?.[readingSettingsKey];
  if (!settings || typeof settings !== "object") {
    return { goalMode: "minutes", dailyGoalMinutes: 30, dailyGoalPages: 20 };
  }
  return {
    goalMode: normalizeReadingGoalMode(settings.goalMode),
    dailyGoalMinutes: Math.max(0, Number(settings.dailyGoalMinutes) || 0),
    dailyGoalPages: Math.max(0, Number(settings.dailyGoalPages) || 0)
  };
}

export function saveReadingGoalSettings({
  allEntries,
  readingSettingsKey,
  goalMode = "minutes",
  dailyGoalMinutes,
  dailyGoalPages
}) {
  const existing = allEntries?.[readingSettingsKey];
  const existingObject = existing && typeof existing === "object" ? existing : {};
  allEntries[readingSettingsKey] = {
    ...existingObject,
    goalMode: normalizeReadingGoalMode(goalMode),
    dailyGoalMinutes: Math.max(0, Number(dailyGoalMinutes) || 0),
    dailyGoalPages: Math.max(0, Number(dailyGoalPages) || 0)
  };
  writeSimpletrackersStore(allEntries);
}
