export function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function aggregateTopItems(entries) {
  return aggregateTopItemsByTracker(entries, { storageKey: "" });
}

function resolveWaterDrinkLabel(entry) {
  const explicit = String(entry?.waterDrinkLabel || "").trim();
  if (explicit) return explicit;
  const fallback = String(entry?.item || "").trim();
  const match = fallback.match(/^\s*\d+(?:\.\d+)?\s*(?:oz|ml)\s+(.+)$/i);
  return (match?.[1] || fallback || "Water").trim() || "Water";
}

function getWaterDrinkHistoryLabels(entry) {
  const rawHistory = Array.isArray(entry?.waterDrinkHistory) ? entry.waterDrinkHistory : [];
  const labels = rawHistory
    .map((item) => String(item?.label || "").trim())
    .filter(Boolean);
  if (labels.length) return labels;
  return [resolveWaterDrinkLabel(entry)];
}

export function aggregateTopItemsByTracker(entries, { storageKey = "" } = {}) {
  const counts = new Map();
  if (storageKey === "water-tracker-entries") {
    for (const entry of entries) {
      const labels = getWaterDrinkHistoryLabels(entry);
      labels.forEach((label) => {
        counts.set(label, (counts.get(label) || 0) + 1);
      });
    }
  } else if (storageKey === "finance-tracker-entries") {
    for (const entry of entries) {
      const category = String(entry?.category || "").trim() || "Uncategorized";
      counts.set(category, (counts.get(category) || 0) + 1);
    }
  } else {
    for (const entry of entries) {
      const item = String(entry?.item || "").trim() || "Untitled";
      counts.set(item, (counts.get(item) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export function aggregateLast14Days(entries) {
  return aggregateLast14DaysByTracker(entries, { storageKey: "" });
}

function getSleepDurationHours(entry) {
  const hours = Math.max(0, Number(entry?.sleepHours) || 0);
  const minutes = Math.max(0, Number(entry?.sleepMinutes) || 0);
  const total = hours + (minutes / 60);
  return Math.round(total * 100) / 100;
}

function getWaterHydrationOunces(entry) {
  const drinkOz = Math.max(0, Number(entry?.waterOunces) || 0);
  const hydrationImpact = Math.max(0, Number(entry?.waterHydrationImpact) || 1);
  const hydrationOz = Math.max(0, Number(entry?.hydrationOunces) || (drinkOz * hydrationImpact));
  return Math.round(hydrationOz * 100) / 100;
}

function getVideoGameSessionHours(entry) {
  const sessionHours = Math.max(0, Number(entry?.lastSessionHours) || Number(entry?.sessionHours) || 0);
  return Math.round(sessionHours * 100) / 100;
}

function getLast14ValueForEntry(entry, storageKey) {
  if (storageKey === "workout-tracker-entries") {
    const seconds = getWorkoutDurationSeconds(entry);
    return Math.round((seconds / 3600) * 100) / 100;
  }
  if (storageKey === "water-tracker-entries") {
    return getWaterHydrationOunces(entry);
  }
  if (storageKey === "sleep-tracker-entries") {
    return getSleepDurationHours(entry);
  }
  if (storageKey === "video-game-tracker-entries") {
    return getVideoGameSessionHours(entry);
  }
  // Trackers without a meaningful numeric quantity are binary activity logs.
  return 1;
}

export function aggregateLast14DaysByTracker(entries, { storageKey = "" } = {}) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - 13);
  const msPerDay = 24 * 60 * 60 * 1000;
  const series = Array.from({ length: 14 }, (_, idx) => ({
    day: new Date(start.getTime() + idx * msPerDay),
    value: 0
  }));

  for (const entry of entries) {
    const when = entry?.date ? new Date(entry.date) : null;
    if (!when || Number.isNaN(when.getTime())) continue;
    const day = new Date(when.getFullYear(), when.getMonth(), when.getDate());
    const idx = Math.floor((day.getTime() - start.getTime()) / msPerDay);
    if (idx >= 0 && idx < series.length) {
      const value = Math.max(0, Number(getLast14ValueForEntry(entry, storageKey)) || 0);
      if (storageKey === "habit-tracker-entries"
        || storageKey === "reading-tracker-entries"
        || storageKey === "movie-watch-tracker-entries"
        || storageKey === "finance-tracker-entries"
        || storageKey === "health-tracker-entries"
        || storageKey === "meal-tracker-entries"
        || storageKey === "task-tracker-entries"
        || storageKey === "custom-tracker-entries") {
        series[idx].value = Math.max(series[idx].value, value > 0 ? 1 : 0);
      } else {
        series[idx].value += value;
      }
    }
  }

  return series;
}

function formatNumericValue(value, digits = 1) {
  const safe = Math.max(0, Number(value) || 0);
  return safe.toFixed(digits).replace(/\.0$/, "");
}

export function formatLast14Value(value, { storageKey = "" } = {}) {
  const safe = Math.max(0, Number(value) || 0);
  if (storageKey === "workout-tracker-entries" || storageKey === "video-game-tracker-entries") {
    return `${formatNumericValue(safe, 2)}h`;
  }
  if (storageKey === "water-tracker-entries") {
    return `${formatNumericValue(safe, 1)}oz hydration`;
  }
  if (storageKey === "sleep-tracker-entries") {
    return `${formatNumericValue(safe, 2)}h sleep`;
  }
  return safe > 0 ? "Logged" : "No log";
}

export function getWorkoutDurationSeconds(entry) {
  const hours = Math.max(0, Number(entry?.workoutDurationHours) || 0);
  const minutes = Math.max(0, Number(entry?.workoutDurationMinutes) || 0);
  const seconds = Math.max(0, Number(entry?.workoutDurationSeconds) || 0);
  const fullSeconds = (hours * 3600) + (minutes * 60) + seconds;
  if (fullSeconds > 0) return fullSeconds;
  const legacyMinutes = Math.max(0, Number(entry?.workoutDurationTotalMinutes) || 0);
  return Math.round(legacyMinutes * 60);
}

export function isDateInRange(dateValue, range) {
  const when = new Date(dateValue);
  if (Number.isNaN(when.getTime())) return false;
  const now = new Date();
  if (range === "day") {
    return when.getFullYear() === now.getFullYear()
      && when.getMonth() === now.getMonth()
      && when.getDate() === now.getDate();
  }
  if (range === "week") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    const day = new Date(when.getFullYear(), when.getMonth(), when.getDate());
    return day >= start && day <= today;
  }
  if (range === "month") {
    return when.getFullYear() === now.getFullYear() && when.getMonth() === now.getMonth();
  }
  if (range === "year") {
    return when.getFullYear() === now.getFullYear();
  }
  return false;
}

export function formatDurationLabel(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
