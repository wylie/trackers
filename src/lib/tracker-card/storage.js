import { readSimpletrackersStore, writeSimpletrackersStore } from '../storage/simpletrackers-store.js';

export function getAllEntries() {
  return readSimpletrackersStore();
}

export function getEntries(storageKey) {
  const allEntries = getAllEntries();
  return Array.isArray(allEntries[storageKey]) ? allEntries[storageKey] : [];
}

export function saveEntries({ storageKey, entries, ensureEntryIdentity }) {
  const normalizedEntries = Array.isArray(entries)
    ? entries.map((entry) => ensureEntryIdentity(entry))
    : [];
  const allEntries = getAllEntries();
  allEntries[storageKey] = normalizedEntries;
  writeSimpletrackersStore(allEntries);
  try {
    document.dispatchEvent(new CustomEvent("simpletrackers:entries-updated", {
      detail: { storageKey, count: normalizedEntries.length }
    }));
  } catch {
    // Don't block saves if cross-component event dispatch fails.
  }
}
