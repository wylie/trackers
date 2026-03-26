export function getTodayDateInputValue() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function toDateInputValue(rawDate) {
  if (!rawDate) return getTodayDateInputValue();
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return getTodayDateInputValue();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function buildEntryDateIso(dateInputValue, existingIso = "") {
  const fallback = existingIso ? new Date(existingIso) : new Date();
  const baseTime = Number.isNaN(fallback.getTime()) ? new Date() : fallback;
  if (!dateInputValue) return baseTime.toISOString();
  const [yyyy, mm, dd] = String(dateInputValue).split("-").map((value) => Number(value));
  if (!yyyy || !mm || !dd) return baseTime.toISOString();
  const combined = new Date(
    yyyy,
    mm - 1,
    dd,
    baseTime.getHours(),
    baseTime.getMinutes(),
    baseTime.getSeconds(),
    0
  );
  if (Number.isNaN(combined.getTime())) return baseTime.toISOString();
  return combined.toISOString();
}

export function formatSimpleDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
