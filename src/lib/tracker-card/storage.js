import { readSimpletrackersStore, writeSimpletrackersStore } from '../storage/simpletrackers-store.js';

const STORE_KEY = "simpletrackers.io";
const HISTORY_KEY = "simpletrackers:history";
const HISTORY_LIMIT = 30;
const LAST_ACTIVE_STORAGE_KEY = "simpletrackers:last-active-storage-key";
const LAST_ACTIVE_AT_KEY = "simpletrackers:last-active-at";

function deepClone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function saveHistorySnapshot({ storageKey, beforeStore }) {
  try {
    const snapshot = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: Date.now(),
      storageKey,
      payload: deepClone(beforeStore || {})
    };
    const existingRaw = localStorage.getItem(HISTORY_KEY);
    const parsed = existingRaw ? JSON.parse(existingRaw) : [];
    const existing = Array.isArray(parsed) ? parsed : [];
    const next = [snapshot, ...existing].slice(0, HISTORY_LIMIT);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // If snapshot fails, continue normal save flow.
  }
}

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
  saveHistorySnapshot({ storageKey, beforeStore: allEntries });
  allEntries[storageKey] = normalizedEntries;
  writeSimpletrackersStore(allEntries);
  try {
    localStorage.setItem(LAST_ACTIVE_STORAGE_KEY, String(storageKey || ""));
    localStorage.setItem(LAST_ACTIVE_AT_KEY, String(Date.now()));
  } catch {
    // Ignore localStorage metadata failures.
  }
  try {
    document.dispatchEvent(new CustomEvent("simpletrackers:entries-updated", {
      detail: { storageKey, count: normalizedEntries.length }
    }));
    document.dispatchEvent(new CustomEvent("simpletrackers:history-updated"));
  } catch {
    // Don't block saves if cross-component event dispatch fails.
  }
}
