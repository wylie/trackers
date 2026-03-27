export const SIMPLETRACKERS_STORAGE_KEY = "simpletrackers.io";

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function entrySignature(entry) {
  if (!entry || typeof entry !== "object") return "";
  const clone = { ...entry };
  delete clone.id;
  delete clone.updatedAt;
  return stableStringify(clone);
}

function entryUpdatedAt(entry) {
  const explicit = Number(entry?.updatedAt);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const fromDate = entry?.date ? new Date(entry.date).getTime() : 0;
  return Number.isFinite(fromDate) && fromDate > 0 ? fromDate : 0;
}

function dedupeEntries(entries) {
  if (!Array.isArray(entries)) return [];
  const bySignature = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const signature = entrySignature(entry);
    if (!signature) continue;
    const existing = bySignature.get(signature);
    if (!existing) {
      bySignature.set(signature, entry);
      continue;
    }
    const incomingUpdatedAt = entryUpdatedAt(entry);
    const existingUpdatedAt = entryUpdatedAt(existing);
    bySignature.set(signature, incomingUpdatedAt >= existingUpdatedAt ? entry : existing);
  }
  return Array.from(bySignature.values());
}

export function normalizeSimpletrackersStore(store) {
  const source = (store && typeof store === "object" && !Array.isArray(store)) ? store : {};
  const normalized = {};
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      normalized[key] = dedupeEntries(value);
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

export function readSimpletrackersStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SIMPLETRACKERS_STORAGE_KEY)) || {};
    const normalized = normalizeSimpletrackersStore(parsed);
    if (stableStringify(normalized) !== stableStringify(parsed)) {
      localStorage.setItem(SIMPLETRACKERS_STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return {};
  }
}

export function writeSimpletrackersStore(store) {
  const normalized = normalizeSimpletrackersStore(store || {});
  localStorage.setItem(SIMPLETRACKERS_STORAGE_KEY, JSON.stringify(normalized));
}

export function getEntriesForKey(storageKey) {
  const store = readSimpletrackersStore();
  return Array.isArray(store[storageKey]) ? store[storageKey] : [];
}
