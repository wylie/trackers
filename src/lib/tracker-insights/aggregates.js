export function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function aggregateTopItems(entries) {
  const counts = new Map();
  for (const entry of entries) {
    const item = String(entry?.item || "").trim() || "Untitled";
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export function aggregateLast14Days(entries) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - 13);
  const msPerDay = 24 * 60 * 60 * 1000;
  const series = Array.from({ length: 14 }, (_, idx) => ({
    day: new Date(start.getTime() + idx * msPerDay),
    count: 0
  }));

  for (const entry of entries) {
    const when = entry?.date ? new Date(entry.date) : null;
    if (!when || Number.isNaN(when.getTime())) continue;
    const day = new Date(when.getFullYear(), when.getMonth(), when.getDate());
    const idx = Math.floor((day.getTime() - start.getTime()) / msPerDay);
    if (idx >= 0 && idx < series.length) {
      series[idx].count += 1;
    }
  }

  return series;
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
