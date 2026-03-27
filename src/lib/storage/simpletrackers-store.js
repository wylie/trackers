export const SIMPLETRACKERS_STORAGE_KEY = "simpletrackers.io";

export function readSimpletrackersStore() {
  try {
    return JSON.parse(localStorage.getItem(SIMPLETRACKERS_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function writeSimpletrackersStore(store) {
  localStorage.setItem(SIMPLETRACKERS_STORAGE_KEY, JSON.stringify(store || {}));
}

export function getEntriesForKey(storageKey) {
  const store = readSimpletrackersStore();
  return Array.isArray(store[storageKey]) ? store[storageKey] : [];
}
