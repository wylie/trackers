export function formatGameHours(hours) {
  const value = Number(hours) || 0;
  if (value <= 0) return "0h";
  const rounded = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
  return `${rounded}h`;
}

export function normalizeGameKey(value) {
  return String(value || "").trim().toLowerCase();
}
