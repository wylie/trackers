export function formatDurationLabel(hours, minutes) {
  const normalizedHours = Math.max(0, Number(hours) || 0);
  const normalizedMinutes = Math.max(0, Number(minutes) || 0);
  const parts = [];
  if (normalizedHours > 0) {
    parts.push(`${normalizedHours} ${normalizedHours === 1 ? "hour" : "hours"}`);
  }
  if (normalizedMinutes > 0 || !parts.length) {
    parts.push(`${normalizedMinutes} ${normalizedMinutes === 1 ? "minute" : "minutes"}`);
  }
  return parts.join(" ");
}

export function totalMinutesFromParts(hours, minutes) {
  return Math.max(0, Number(hours) || 0) * 60 + Math.max(0, Number(minutes) || 0);
}

export function getIntValue(input, defaultValue = 0) {
  const parsed = Number.parseInt(String(input?.value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export function getFloatValue(input, defaultValue = 0) {
  const parsed = Number.parseFloat(String(input?.value ?? ""));
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export function formatMetadataChips(chips) {
  const values = Array.isArray(chips) ? chips.filter(Boolean) : [];
  if (!values.length) return "";
  return `<div class="tracker-meta-chips">${values.map((chip) => `<span class="tracker-meta-chip">${chip}</span>`).join("")}</div>`;
}

export function formatMinutesAsDuration(totalMinutes) {
  const normalizedMinutes = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  return formatDurationLabel(hours, minutes);
}
