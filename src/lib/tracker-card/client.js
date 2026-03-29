import { formatDurationLabel, totalMinutesFromParts, getIntValue, getFloatValue, formatMetadataChips } from './common.js';
import { createEntryId, ensureEntryIdentity } from './ids.js';
import { parseSleepDuration, formatSleepDuration, getSleepGrade } from './sleep.js';
import { formatGameHours, normalizeGameKey } from './game.js';
import { getWorkoutDurationParts, formatWorkoutMetricBadges, syncWorkoutMetricsUI as syncWorkoutMetricsUIHelper } from './workout.js';
import { getAudiobookLeftMinutes, formatProgressValue, getReadingCoverUrl, getFallbackMediaUrl } from './reading.js';
import { getMoviePosterUrl, getVideoGameCoverUrl } from './media.js';
import { getTodayDateInputValue, toDateInputValue, buildEntryDateIso, formatSimpleDate } from './dates.js';
import { getAllEntries, getEntries as getEntriesFromStore, saveEntries as saveEntriesToStore } from './storage.js';
import { getSleepGoalSettings as resolveSleepGoalSettings, saveSleepGoalSettings as persistSleepGoalSettings } from './sleep-goals.js';
import { getWaterGoalSettings as resolveWaterGoalSettings, saveWaterGoalSettings as persistWaterGoalSettings } from './water-goals.js';
import { initItemAutocomplete } from './autocomplete.js';
import { renderStaticStars, initRatingInput } from './rating-ui.js';

export function initTrackerCard(config) {
  const {
    storageKey,
    addLabel,
    enableOmdbAutocomplete,
    omdbApiKey,
    autocompleteEndpoint,
    enableAuthorField,
    autoPopulateAuthor,
    enableDirectorField,
    autoPopulateDirector,
    enablePublisherField,
    autoPopulatePublisher,
    enableCategoryField,
    enableReadingProgress,
    autoPopulateTotalPages,
    isSleepTracker,
    sleepSettingsKey,
    isReadingTracker,
    isMovieTracker,
    isVideoGameTracker,
    isWorkoutTracker,
    isTaskTracker,
    isFinanceTracker,
    isWaterTracker,
    isHealthTracker,
    waterSettingsKey,
    waterDrinkOptions = []
  } = config;
  const form = document.getElementById("tracker-form");
  const itemInput = document.getElementById("tracker-item");
  const sleepHoursInput = document.getElementById("tracker-sleep-hours");
  const sleepMinutesInput = document.getElementById("tracker-sleep-minutes");
  const goalHoursInput = document.getElementById("tracker-goal-hours");
  const goalMinutesInput = document.getElementById("tracker-goal-minutes");
  const goalSaveButton = document.getElementById("tracker-save-goal");
  const goalSummary = document.getElementById("tracker-goal-summary");
  const goalMessage = document.getElementById("tracker-goal-message");
  const waterGoalOuncesLabel = document.getElementById("tracker-goal-ounces-label");
  const waterGoalOuncesInput = document.getElementById("tracker-goal-ounces");
  const waterVolumeUnitInput = document.getElementById("tracker-water-volume-unit");
  const waterGoalSaveButton = document.getElementById("tracker-save-goal-ounces");
  const waterGoalSummary = document.getElementById("tracker-water-goal-summary");
  const waterGoalMessage = document.getElementById("tracker-water-goal-message");
  const authorInput = document.getElementById("tracker-author");
  const directorInput = document.getElementById("tracker-director");
  const publisherInput = document.getElementById("tracker-publisher");
  const categoryInput = document.getElementById("tracker-category");
  const entryDateInput = document.getElementById("tracker-entry-date");
  const workoutMetricsContainer = document.getElementById("tracker-workout-metrics");
  const workoutDurationWrap = document.getElementById("tracker-workout-duration-wrap");
  const workoutDistanceWrap = document.getElementById("tracker-workout-distance-wrap");
  const workoutLapsWrap = document.getElementById("tracker-workout-laps-wrap");
  const workoutSetsWrap = document.getElementById("tracker-workout-sets-wrap");
  const workoutRepsWrap = document.getElementById("tracker-workout-reps-wrap");
  const workoutWeightWrap = document.getElementById("tracker-workout-weight-wrap");
  const workoutDurationHoursInput = document.getElementById("tracker-workout-duration-hours");
  const workoutDurationMinutesInput = document.getElementById("tracker-workout-duration-minutes");
  const workoutDurationSecondsInput = document.getElementById("tracker-workout-duration-seconds");
  const workoutDistanceInput = document.getElementById("tracker-workout-distance");
  const workoutLapsInput = document.getElementById("tracker-workout-laps");
  const workoutSetsInput = document.getElementById("tracker-workout-sets");
  const workoutRepsInput = document.getElementById("tracker-workout-reps");
  const workoutWeightInput = document.getElementById("tracker-workout-weight");
  const sessionDurationHoursInput = document.getElementById("tracker-session-duration-hours");
  const sessionDurationMinutesInput = document.getElementById("tracker-session-duration-minutes");
  const sessionDurationSecondsInput = document.getElementById("tracker-session-duration-seconds");
  const waterOuncesInput = document.getElementById("tracker-water-ounces");
  const waterOuncesLabel = document.getElementById("tracker-water-ounces-label");
  const waterDrinkTypeInput = document.getElementById("tracker-water-drink-type");
  const waterCustomNameWrap = document.getElementById("tracker-water-custom-name-wrap");
  const waterCustomNameInput = document.getElementById("tracker-water-custom-name");
  const waterCustomImpactWrap = document.getElementById("tracker-water-custom-impact-wrap");
  const waterCustomImpactInput = document.getElementById("tracker-water-custom-impact");
  const startedDateInput = document.getElementById("tracker-started-date");
  const finishedDateInput = document.getElementById("tracker-finished-date");
  const currentlyReadingInput = document.getElementById("tracker-currently-reading");
  const audiobookInput = document.getElementById("tracker-is-audiobook");
  const readingProgressFields = document.getElementById("tracker-reading-progress-fields");
  const finishedFields = document.getElementById("tracker-finished-fields");
  const ratingRow = document.getElementById("tracker-rating-row");
  const ratingStarsElement = document.getElementById("tracker-rating-stars");
  const ratingInput = document.getElementById("tracker-rating");
  const currentPageInput = document.getElementById("tracker-current-page");
  const totalPagesInput = document.getElementById("tracker-total-pages");
  const pageProgressField = document.getElementById("tracker-page-progress-field");
  const totalPageField = document.getElementById("tracker-total-page-field");
  const currentAudioField = document.getElementById("tracker-current-audio-field");
  const totalAudioField = document.getElementById("tracker-total-audio-field");
  const currentHoursInput = document.getElementById("tracker-current-hours");
  const currentMinutesInput = document.getElementById("tracker-current-minutes");
  const totalHoursInput = document.getElementById("tracker-total-hours");
  const totalMinutesInput = document.getElementById("tracker-total-minutes");
  const dueDateInput = document.getElementById("tracker-due-date");
  const notesInput = document.getElementById("tracker-notes");
  const submitButton = document.getElementById("tracker-submit");
  const cancelEditButton = document.getElementById("tracker-cancel-edit");
  const list = document.getElementById("tracker-list");
  const listScrollContainer = document.getElementById("tracker-list-scroll");
  const deleteModal = document.getElementById("tracker-delete-modal");
  const deleteConfirmButton = document.getElementById("tracker-delete-confirm");
  const deleteCancelButton = document.getElementById("tracker-delete-cancel");
  const taskFilterInput = document.getElementById("tracker-task-filter");
  const taskSortInput = document.getElementById("tracker-task-sort");
  const readingListFilterRoot = document.getElementById("tracker-reading-list-filter");
  const itemSuggestions = document.getElementById("tracker-item-suggestions");
  const itemSuggestionsList = document.getElementById("tracker-item-suggestions-list");
  if (!form || !list || !notesInput) return;
  const ratingController = initRatingInput({ container: ratingStarsElement, input: ratingInput });

  let editingIdx = -1;
  let goalMessageTimer = null;
  let waterGoalMessageTimer = null;
  let selectedCoverId = 0;
  let selectedCoverEditionKey = "";
  let selectedCoverUrl = "";
  let isEnrichingReadingCovers = false;
  let selectedPosterUrl = "";
  let selectedImdbId = "";
  let isEnrichingMoviePosters = false;
  let hasNormalizedReadingEntries = false;
  let hasNormalizedWaterEntries = false;
  let selectedWaterVolumeUnit = "oz";
  let selectedReadingListFilter = "all";
  let visibleEntriesCount = 0;
  let resolveDeletePrompt = null;
  const notesViewStateByEntryId = new Map();
  const LIST_PAGE_SIZE = 20;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeNoteTimestamp(rawTimestamp, fallbackDate = "") {
    const direct = Number(rawTimestamp);
    if (Number.isFinite(direct) && direct > 0) return direct;
    if (typeof rawTimestamp === "string" && rawTimestamp.trim()) {
      const parsedRaw = new Date(rawTimestamp).getTime();
      if (Number.isFinite(parsedRaw) && parsedRaw > 0) return parsedRaw;
    }
    const parsedFallback = fallbackDate ? new Date(fallbackDate).getTime() : 0;
    if (Number.isFinite(parsedFallback) && parsedFallback > 0) return parsedFallback;
    return Date.now();
  }

  function getEntryNotesHistory(entry) {
    const history = [];
    const rawHistory = Array.isArray(entry?.notesHistory) ? entry.notesHistory : [];
    rawHistory.forEach((item) => {
      const note = String(item?.note || "").trim();
      if (!note) return;
      history.push({
        note,
        createdAt: normalizeNoteTimestamp(item?.createdAt, entry?.date || "")
      });
    });

    const legacyNote = String(entry?.notes || "").trim();
    if (legacyNote && !history.some((item) => item.note === legacyNote)) {
      history.push({
        note: legacyNote,
        createdAt: normalizeNoteTimestamp(entry?.updatedAt, entry?.date || "")
      });
    }

    history.sort((a, b) => a.createdAt - b.createdAt);
    return history;
  }

  function withUpdatedNotes(entry, submittedNotes, { preserveWhenBlank = false, noteTimestamp } = {}) {
    const trimmed = String(submittedNotes || "").trim();
    const history = getEntryNotesHistory(entry);
    const normalizedNoteTimestamp = normalizeNoteTimestamp(noteTimestamp, entry?.date || "");
    if (trimmed) {
      const last = history[history.length - 1];
      if (!last || last.note !== trimmed) {
        history.push({ note: trimmed, createdAt: normalizedNoteTimestamp });
      }
    }

    const nextNotes = trimmed || (preserveWhenBlank ? String(entry?.notes || "").trim() : "");
    return {
      notes: nextNotes,
      notesHistory: history
    };
  }

  function formatNoteTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getNotesViewState(entry) {
    const entryId = String(entry?.id || "");
    if (!entryId) {
      return { sort: "newest", range: "all" };
    }
    const existing = notesViewStateByEntryId.get(entryId);
    if (existing) return existing;
    const initial = { sort: "newest", range: "all" };
    notesViewStateByEntryId.set(entryId, initial);
    return initial;
  }

  function filterNotesByRange(history, range) {
    if (!Array.isArray(history) || !history.length) return [];
    if (range === "all") return history;
    const days = range === "7d" ? 7 : 30;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return history.filter((item) => Number(item?.createdAt) >= cutoff);
  }

  function renderNotesHtml(entry) {
    const history = getEntryNotesHistory(entry);
    if (!history.length) {
      const fallback = String(entry?.notes || "").trim();
      return fallback ? `<div class=\"text-gray-700 text-sm leading-relaxed\">${escapeHtml(fallback).replace(/\n/g, "<br />")}</div>` : "";
    }
    const state = getNotesViewState(entry);
    const filtered = filterNotesByRange(history, state.range);
    const sorted = [...filtered].sort((a, b) => state.sort === "oldest" ? (a.createdAt - b.createdAt) : (b.createdAt - a.createdAt));
    const rows = sorted
      .map((item) => `
        <div class="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
          <div class="text-[11px] text-gray-500">${formatNoteTimestamp(item.createdAt)}</div>
          <div class="text-gray-700 text-sm leading-relaxed">${escapeHtml(item.note).replace(/\n/g, "<br />")}</div>
        </div>
      `)
      .join("");
    const entryId = String(entry?.id || "");
    const NOTES_VISIBLE_COUNT = 3;
    const hasOverflow = sorted.length > NOTES_VISIBLE_COUNT;
    const hasCustomState = state.sort !== "newest" || state.range !== "all";
    const showSortRangeControls = Boolean(entryId) && (hasOverflow || hasCustomState);
    const controls = entryId
      ? `<div class="flex items-center justify-between gap-2 mb-2">
          <div class="text-xs text-gray-500">Notes ${history.length > 0 ? `(${history.length})` : ""}</div>
          ${showSortRangeControls ? `<div class="flex items-center gap-2">
            <label class="text-xs text-gray-500" for="notes-sort-${entryId}">Sort</label>
            <select id="notes-sort-${entryId}" data-action="notes-sort" data-entry-id="${entryId}" class="border border-gray-300 rounded px-2 py-1 text-xs bg-white">
              <option value="newest" ${state.sort === "newest" ? "selected" : ""}>Newest</option>
              <option value="oldest" ${state.sort === "oldest" ? "selected" : ""}>Oldest</option>
            </select>
            <label class="text-xs text-gray-500" for="notes-range-${entryId}">Range</label>
            <select id="notes-range-${entryId}" data-action="notes-range" data-entry-id="${entryId}" class="border border-gray-300 rounded px-2 py-1 text-xs bg-white">
              <option value="all" ${state.range === "all" ? "selected" : ""}>All</option>
              <option value="30d" ${state.range === "30d" ? "selected" : ""}>30d</option>
              <option value="7d" ${state.range === "7d" ? "selected" : ""}>7d</option>
            </select>
          </div>` : ""}
        </div>`
      : "";
    const emptyState = sorted.length
      ? rows
      : `<div class="text-xs text-gray-500 rounded-md border border-gray-200 bg-gray-50 px-2 py-2">No notes in this range.</div>`;
    return `<div class=\"mt-1\">${controls}<div class=\"space-y-2 max-h-48 overflow-y-auto pr-1\">${emptyState}</div></div>`;
  }

  function showSleepGoalMessage(message) {
    if (!goalMessage) return;
    goalMessage.textContent = message;
    goalMessage.classList.remove("hidden");
    clearTimeout(goalMessageTimer);
    goalMessageTimer = window.setTimeout(() => {
      goalMessage.classList.add("hidden");
    }, 2200);
  }

  function showWaterGoalMessage(message) {
    if (!waterGoalMessage) return;
    waterGoalMessage.textContent = message;
    waterGoalMessage.classList.remove("hidden");
    clearTimeout(waterGoalMessageTimer);
    waterGoalMessageTimer = window.setTimeout(() => {
      waterGoalMessage.classList.add("hidden");
    }, 2200);
  }

  function closeDeleteModal(confirmed) {
    if (deleteModal) deleteModal.classList.add("hidden");
    if (typeof resolveDeletePrompt === "function") {
      resolveDeletePrompt(Boolean(confirmed));
      resolveDeletePrompt = null;
    }
  }

  function requestDeleteConfirmation() {
    if (!deleteModal || !deleteConfirmButton || !deleteCancelButton) {
      return Promise.resolve(window.confirm("Delete this item? This action cannot be undone."));
    }
    deleteModal.classList.remove("hidden");
    return new Promise((resolve) => {
      resolveDeletePrompt = resolve;
    });
  }

  function syncWorkoutMetricsUI() {
    syncWorkoutMetricsUIHelper({
      isWorkoutTracker,
      workoutMetricsContainer,
      itemValue: itemInput?.value || "",
      categoryValue: categoryInput?.value || "",
      workoutDurationWrap,
      workoutDurationHoursInput,
      workoutDurationMinutesInput,
      workoutDurationSecondsInput,
      workoutDistanceWrap,
      workoutDistanceInput,
      workoutLapsWrap,
      workoutLapsInput,
      workoutSetsWrap,
      workoutSetsInput,
      workoutRepsWrap,
      workoutRepsInput,
      workoutWeightWrap,
      workoutWeightInput
    });
  }

  function getSleepGoalSettings(allEntries = getAllEntries()) {
    return resolveSleepGoalSettings({ allEntries, sleepSettingsKey });
  }

  function saveSleepGoalSettings(goalHours, goalMinutes) {
    const allEntries = getAllEntries();
    persistSleepGoalSettings({ allEntries, sleepSettingsKey, goalHours, goalMinutes });
  }

  function getWaterGoalSettings(allEntries = getAllEntries()) {
    return resolveWaterGoalSettings({ allEntries, waterSettingsKey });
  }

  function saveWaterGoalSettings(goalOunces, volumeUnit = selectedWaterVolumeUnit) {
    const allEntries = getAllEntries();
    persistWaterGoalSettings({ allEntries, waterSettingsKey, goalOunces, volumeUnit });
  }

  function updateSleepGoalSummary() {
    if (!isSleepTracker || !goalSummary) return;
    const goalHours = Number(goalHoursInput?.value || 0);
    const goalMinutes = Number(goalMinutesInput?.value || 0);
    goalSummary.textContent = `Current target: ${formatDurationLabel(goalHours, goalMinutes)}`;
  }

  function getWaterDayTotal(entries, dateValue) {
    const targetDate = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
    const yyyy = targetDate.getFullYear();
    const mm = targetDate.getMonth();
    const dd = targetDate.getDate();
    return entries.reduce((sum, entry) => {
      const when = entry?.date ? new Date(entry.date) : null;
      if (!when || Number.isNaN(when.getTime())) return sum;
      if (when.getFullYear() !== yyyy || when.getMonth() !== mm || when.getDate() !== dd) return sum;
      const drinkOz = Math.max(0, Number(entry?.waterOunces) || 0);
      const hydrationOz = Math.max(0, Number(entry?.hydrationOunces) || (drinkOz * (Number(entry?.waterHydrationImpact) || 1)));
      return sum + hydrationOz;
    }, 0);
  }

  function updateWaterGoalSummary() {
    if (!isWaterTracker || !waterGoalSummary) return;
    const unit = normalizeWaterVolumeUnit(selectedWaterVolumeUnit);
    const goalValue = Math.max(0, Number(waterGoalOuncesInput?.value || 0));
    const goalOunces = toWaterOunces(goalValue, unit);
    const currentDate = entryDateInput?.value || getTodayDateInputValue();
    const todayTotal = getWaterDayTotal(getEntries(), currentDate);
    const todayDisplay = formatWaterInputValue(fromWaterOunces(todayTotal, unit), unit);
    const goalDisplay = formatWaterInputValue(fromWaterOunces(goalOunces, unit), unit);
    if (goalOunces > 0) {
      const pct = Math.min(999, Math.round((todayTotal / goalOunces) * 100));
      waterGoalSummary.textContent = `Hydration today: ${todayDisplay} / ${goalDisplay} ${unit} (${pct}%)`;
    } else {
      waterGoalSummary.textContent = `Hydration today: ${todayDisplay} ${unit}`;
    }
  }

  function getDefaultWaterDrinkByValue(value) {
    return waterDrinkOptions.find((option) => option.value === value) || null;
  }

  function normalizeDrinkLabel(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeWaterVolumeUnit(value) {
    return String(value || "").trim().toLowerCase() === "ml" ? "ml" : "oz";
  }

  function toWaterOunces(volume, unit = selectedWaterVolumeUnit) {
    const safeVolume = Math.max(0, Number(volume) || 0);
    return normalizeWaterVolumeUnit(unit) === "ml"
      ? (safeVolume / 29.5735295625)
      : safeVolume;
  }

  function fromWaterOunces(ounces, unit = selectedWaterVolumeUnit) {
    const safeOunces = Math.max(0, Number(ounces) || 0);
    return normalizeWaterVolumeUnit(unit) === "ml"
      ? (safeOunces * 29.5735295625)
      : safeOunces;
  }

  function formatWaterInputValue(value, unit = selectedWaterVolumeUnit) {
    const safe = Math.max(0, Number(value) || 0);
    const digits = normalizeWaterVolumeUnit(unit) === "ml" ? 0 : 1;
    return safe.toFixed(digits).replace(/\.0$/, "");
  }

  function formatWaterVolumeFromOunces(ounces, unit = selectedWaterVolumeUnit) {
    return `${formatWaterInputValue(fromWaterOunces(ounces, unit), unit)}${normalizeWaterVolumeUnit(unit)}`;
  }

  function updateWaterUnitLabels() {
    if (!isWaterTracker) return;
    const unit = normalizeWaterVolumeUnit(selectedWaterVolumeUnit);
    if (waterGoalOuncesLabel) waterGoalOuncesLabel.textContent = `Goal (${unit}/day)`;
    if (waterOuncesLabel) waterOuncesLabel.textContent = `Water This Entry (${unit})`;
  }

  function getReadingProgressPercentForEntry(entry) {
    if (!entry || typeof entry !== "object") return 0;
    if (entry?.isAudiobook) {
      const totalAudioMinutes = totalMinutesFromParts(entry?.totalHours, entry?.totalMinutes);
      if (totalAudioMinutes <= 0) return 0;
      let listenedAudioMinutes = totalMinutesFromParts(entry?.currentHours, entry?.currentMinutes);
      if (listenedAudioMinutes <= 0) {
        const leftAudioMinutes = totalMinutesFromParts(entry?.leftHours, entry?.leftMinutes);
        listenedAudioMinutes = Math.max(0, totalAudioMinutes - Math.min(totalAudioMinutes, leftAudioMinutes));
      }
      return Math.min(100, Math.max(0, (listenedAudioMinutes / totalAudioMinutes) * 100));
    }
    const currentPage = Math.max(0, Number(entry?.currentPage) || 0);
    const totalPages = Math.max(0, Number(entry?.totalPages) || 0);
    if (totalPages <= 0) return 0;
    return Math.min(100, Math.max(0, (currentPage / totalPages) * 100));
  }

  function appendReadingActivity(entry, deltaPercent, atValue) {
    const delta = Math.max(0, Number(deltaPercent) || 0);
    if (delta <= 0) return entry;
    const raw = Array.isArray(entry?.readingActivityHistory) ? entry.readingActivityHistory : [];
    const history = raw
      .map((item) => ({
        createdAt: normalizeNoteTimestamp(item?.createdAt, entry?.date || ""),
        deltaPercent: Math.max(0, Number(item?.deltaPercent) || 0)
      }))
      .filter((item) => item.deltaPercent > 0);
    history.push({
      createdAt: normalizeNoteTimestamp(atValue, entry?.date || ""),
      deltaPercent: Math.round(delta * 100) / 100
    });
    return {
      ...entry,
      readingActivityHistory: history.slice(-400)
    };
  }

  function buildWaterDrinkHistoryItem({ type, label, ounces, hydrationOunces: hydration, impact, createdAt }) {
    const safeLabel = String(label || "").trim() || "Water";
    const safeType = String(type || "").trim() || "water";
    const safeOunces = Math.max(0, Number(ounces) || 0);
    const safeImpact = Math.max(0, Math.min(1.2, Number(impact) || 1));
    const safeHydration = Math.max(0, Number(hydration) || (safeOunces * safeImpact));
    return {
      type: safeType,
      label: safeLabel,
      ounces: safeOunces,
      hydrationOunces: safeHydration,
      impact: safeImpact,
      createdAt: normalizeNoteTimestamp(createdAt)
    };
  }

  function getWaterDrinkHistory(entry) {
    const raw = Array.isArray(entry?.waterDrinkHistory) ? entry.waterDrinkHistory : [];
    const normalized = raw
      .map((item) => buildWaterDrinkHistoryItem({
        type: item?.type,
        label: item?.label,
        ounces: item?.ounces,
        hydrationOunces: item?.hydrationOunces,
        impact: item?.impact,
        createdAt: item?.createdAt
      }))
      .filter((item) => item.ounces > 0);
    if (normalized.length) return normalized;

    const fallbackOunces = Math.max(0, Number(entry?.waterOunces) || 0);
    if (fallbackOunces <= 0) return [];
    const fallbackLabel = resolveWaterLabelFromEntry(entry) || "Water";
    return [buildWaterDrinkHistoryItem({
      type: String(entry?.waterDrinkType || "water"),
      label: fallbackLabel,
      ounces: fallbackOunces,
      hydrationOunces: Number(entry?.hydrationOunces) || 0,
      impact: Number(entry?.waterHydrationImpact) || 1,
      createdAt: entry?.updatedAt || entry?.date || Date.now()
    })];
  }

  function summarizeWaterDrinkHistory(history, unit = selectedWaterVolumeUnit) {
    const byLabel = new Map();
    history.forEach((item) => {
      const label = String(item?.label || "Water").trim() || "Water";
      const current = byLabel.get(label) || { ounces: 0 };
      current.ounces += Math.max(0, Number(item?.ounces) || 0);
      byLabel.set(label, current);
    });
    return Array.from(byLabel.entries())
      .map(([label, value]) => `${label} ${formatWaterVolumeFromOunces(value.ounces, unit)}`)
      .join(" + ");
  }

  function getWaterTitleMetaFromHistory(history, fallbackLabel = "Water", fallbackType = "water") {
    const byLabel = new Map();
    history.forEach((item) => {
      const label = String(item?.label || "").trim();
      if (!label) return;
      const key = normalizeDrinkLabel(label);
      if (!key) return;
      const existing = byLabel.get(key) || { label, types: new Set() };
      existing.types.add(String(item?.type || "").trim() || "water");
      byLabel.set(key, existing);
    });

    if (byLabel.size <= 1) {
      const first = byLabel.values().next().value;
      const label = first?.label || fallbackLabel || "Water";
      const type = first?.types?.size === 1
        ? Array.from(first.types)[0]
        : (fallbackType || "water");
      return { label, type };
    }

    return { label: "Mixed Drinks", type: "mixed" };
  }

  function resolveWaterLabelFromEntry(entry) {
    const explicit = String(entry?.waterDrinkLabel || "").trim();
    if (explicit) return explicit;
    const fallback = String(entry?.item || "").trim();
    const match = fallback.match(/^\s*\d+(?:\.\d+)?\s*(?:oz|ml)\s+(.+)$/i);
    return (match?.[1] || "").trim();
  }

  function syncWaterDrinkUI() {
    if (!isWaterTracker) return;
    const isCustom = String(waterDrinkTypeInput?.value || "") === "custom";
    if (waterCustomNameWrap) waterCustomNameWrap.classList.toggle("hidden", !isCustom);
    if (waterCustomImpactWrap) waterCustomImpactWrap.classList.toggle("hidden", !isCustom);
    if (waterCustomNameInput) waterCustomNameInput.required = isCustom;
    if (waterCustomImpactInput) waterCustomImpactInput.required = isCustom;
  }

  function setEditingMode(isEditing) {
    if (submitButton) {
      submitButton.textContent = isEditing ? "Save Changes" : addLabel;
    }
    if (cancelEditButton) {
      cancelEditButton.classList.toggle("hidden", !isEditing);
    }
  }

  function clearForm() {
    if (entryDateInput) entryDateInput.value = getTodayDateInputValue();
    if (itemInput) itemInput.value = "";
    if (sleepHoursInput) sleepHoursInput.value = "0";
    if (sleepMinutesInput) sleepMinutesInput.value = "0";
    if (authorInput) authorInput.value = "";
    if (directorInput) directorInput.value = "";
    if (publisherInput) publisherInput.value = "";
    if (categoryInput) categoryInput.value = "";
    if (workoutDurationHoursInput) workoutDurationHoursInput.value = "";
    if (workoutDurationMinutesInput) workoutDurationMinutesInput.value = "";
    if (workoutDurationSecondsInput) workoutDurationSecondsInput.value = "";
    if (workoutDistanceInput) workoutDistanceInput.value = "";
    if (workoutLapsInput) workoutLapsInput.value = "";
    if (workoutSetsInput) workoutSetsInput.value = "";
    if (workoutRepsInput) workoutRepsInput.value = "";
    if (workoutWeightInput) workoutWeightInput.value = "";
    if (sessionDurationHoursInput) sessionDurationHoursInput.value = "";
    if (sessionDurationMinutesInput) sessionDurationMinutesInput.value = "";
    if (sessionDurationSecondsInput) sessionDurationSecondsInput.value = "";
    if (waterOuncesInput) waterOuncesInput.value = "";
    if (waterDrinkTypeInput) waterDrinkTypeInput.value = "water";
    if (waterCustomNameInput) waterCustomNameInput.value = "";
    if (waterCustomImpactInput) waterCustomImpactInput.value = "";
    if (startedDateInput) startedDateInput.value = "";
    if (finishedDateInput) finishedDateInput.value = "";
    if (currentlyReadingInput) currentlyReadingInput.checked = enableReadingProgress;
    if (audiobookInput) audiobookInput.checked = false;
    if (currentPageInput) currentPageInput.value = "";
    if (totalPagesInput) totalPagesInput.value = "";
    if (currentHoursInput) currentHoursInput.value = "0";
    if (currentMinutesInput) currentMinutesInput.value = "0";
    if (totalHoursInput) totalHoursInput.value = "0";
    if (totalMinutesInput) totalMinutesInput.value = "0";
    if (dueDateInput) dueDateInput.value = "";
    selectedCoverId = 0;
    selectedCoverEditionKey = "";
    selectedCoverUrl = "";
    selectedPosterUrl = "";
    selectedImdbId = "";
    notesInput.value = "";
    ratingController.reset();
    editingIdx = -1;
    setEditingMode(false);
    syncReadingModeUI();
    syncWorkoutMetricsUI();
    syncWaterDrinkUI();
  }

  function startEditing(idx) {
    const entries = getEntries();
    const entry = entries[idx];
    if (!entry) return;
    editingIdx = idx;
    if (itemInput) {
      itemInput.value = entry.item || "";
    }
    if (entryDateInput) entryDateInput.value = toDateInputValue(entry.date);
    if (isSleepTracker) {
      const { hours, minutes } = parseSleepDuration(entry);
      if (sleepHoursInput) sleepHoursInput.value = String(hours);
      if (sleepMinutesInput) sleepMinutesInput.value = String(minutes);
    }
    if (authorInput) authorInput.value = entry.author || "";
    if (directorInput) directorInput.value = entry.director || "";
    if (publisherInput) publisherInput.value = entry.publisher || "";
    if (categoryInput) categoryInput.value = entry.category || "";
    if (workoutDurationHoursInput || workoutDurationMinutesInput || workoutDurationSecondsInput) {
      const duration = getWorkoutDurationParts(entry);
      if (workoutDurationHoursInput) workoutDurationHoursInput.value = duration.hours ? String(duration.hours) : "";
      if (workoutDurationMinutesInput) workoutDurationMinutesInput.value = duration.minutes ? String(duration.minutes) : "";
      if (workoutDurationSecondsInput) workoutDurationSecondsInput.value = duration.seconds ? String(duration.seconds) : "";
    }
    if (workoutDistanceInput) workoutDistanceInput.value = entry.workoutDistanceMiles != null ? String(entry.workoutDistanceMiles) : "";
    if (workoutLapsInput) workoutLapsInput.value = entry.workoutLaps != null ? String(entry.workoutLaps) : "";
    if (workoutSetsInput) workoutSetsInput.value = entry.workoutSets != null ? String(entry.workoutSets) : "";
    if (workoutRepsInput) workoutRepsInput.value = entry.workoutReps != null ? String(entry.workoutReps) : "";
    if (workoutWeightInput) workoutWeightInput.value = entry.workoutWeightLbs != null ? String(entry.workoutWeightLbs) : "";
    const sessionHoursForEdit = Math.max(0, Number(entry.lastSessionHours) || Number(entry.sessionHours) || 0);
    const sessionTotalSeconds = Math.round(sessionHoursForEdit * 3600);
    const sessionEditHours = Math.floor(sessionTotalSeconds / 3600);
    const sessionEditMinutes = Math.floor((sessionTotalSeconds % 3600) / 60);
    const sessionEditSeconds = sessionTotalSeconds % 60;
    if (sessionDurationHoursInput) sessionDurationHoursInput.value = sessionEditHours ? String(sessionEditHours) : "";
    if (sessionDurationMinutesInput) sessionDurationMinutesInput.value = sessionEditMinutes ? String(sessionEditMinutes) : "";
    if (sessionDurationSecondsInput) sessionDurationSecondsInput.value = sessionEditSeconds ? String(sessionEditSeconds) : "";
    if (waterOuncesInput) {
      waterOuncesInput.value = entry.waterOunces != null
        ? formatWaterInputValue(fromWaterOunces(entry.waterOunces, selectedWaterVolumeUnit), selectedWaterVolumeUnit)
        : "";
    }
    const savedDrinkType = String(entry.waterDrinkType || "water");
    const defaultDrink = getDefaultWaterDrinkByValue(savedDrinkType);
    if (waterDrinkTypeInput) waterDrinkTypeInput.value = defaultDrink ? savedDrinkType : "custom";
    if (waterCustomNameInput) waterCustomNameInput.value = entry.waterDrinkLabel || "";
    if (waterCustomImpactInput) waterCustomImpactInput.value = entry.waterHydrationImpact != null ? String(entry.waterHydrationImpact) : "";
    if (startedDateInput) startedDateInput.value = entry.startedDate || "";
    if (finishedDateInput) finishedDateInput.value = entry.finishedDate || "";
    if (currentlyReadingInput) currentlyReadingInput.checked = Boolean(entry.currentlyReading);
    if (audiobookInput) audiobookInput.checked = Boolean(entry.isAudiobook);
    if (currentPageInput) currentPageInput.value = entry.currentPage ?? "";
    if (totalPagesInput) totalPagesInput.value = entry.totalPages ?? "";
    if (currentHoursInput || currentMinutesInput) {
      const leftMinutes = getAudiobookLeftMinutes(entry);
      if (currentHoursInput) currentHoursInput.value = String(Math.floor(leftMinutes / 60));
      if (currentMinutesInput) currentMinutesInput.value = String(leftMinutes % 60);
    }
    if (totalHoursInput) totalHoursInput.value = String(entry.totalHours ?? 0);
    if (totalMinutesInput) totalMinutesInput.value = String(entry.totalMinutes ?? 0);
    if (dueDateInput) dueDateInput.value = entry.dueDate || "";
    selectedCoverId = Number(entry.coverId) || 0;
    selectedCoverEditionKey = entry.coverEditionKey || "";
    selectedCoverUrl = entry.coverUrl || "";
    selectedPosterUrl = entry.posterUrl || "";
    selectedImdbId = entry.imdbID || "";
    const notesHistory = getEntryNotesHistory(entry);
    notesInput.value = entry.notes || notesHistory[notesHistory.length - 1]?.note || "";
    ratingController.setRating(Number(entry.rating) || 0);
    setEditingMode(true);
    syncReadingModeUI();
    syncWorkoutMetricsUI();
    syncWaterDrinkUI();
    if (itemInput) {
      itemInput.focus();
    } else if (sleepHoursInput) {
      sleepHoursInput.focus();
    }
  }

  function syncReadingModeUI() {
    if (!enableReadingProgress || !currentlyReadingInput) return;
    const isCurrentlyReading = currentlyReadingInput.checked;
    const isAudiobook = isReadingTracker && Boolean(audiobookInput?.checked);
    if (readingProgressFields) {
      readingProgressFields.classList.toggle("hidden", !isCurrentlyReading);
    }
    if (pageProgressField) {
      pageProgressField.classList.toggle("hidden", isAudiobook);
    }
    if (totalPageField) {
      totalPageField.classList.toggle("hidden", isAudiobook);
    }
    if (currentAudioField) {
      currentAudioField.classList.toggle("hidden", !isAudiobook);
    }
    if (totalAudioField) {
      totalAudioField.classList.toggle("hidden", !isAudiobook);
    }
    if (finishedFields) {
      finishedFields.classList.toggle("hidden", isCurrentlyReading);
    }
    if (ratingRow) {
      ratingRow.classList.toggle("hidden", isCurrentlyReading);
    }

    // Disable hidden/irrelevant controls so native form validation
    // doesn't block submit on fields not in the active mode.
    if (currentPageInput) currentPageInput.disabled = !isCurrentlyReading || isAudiobook;
    if (totalPagesInput) totalPagesInput.disabled = !isCurrentlyReading || isAudiobook;
    if (currentHoursInput) currentHoursInput.disabled = !isCurrentlyReading || !isAudiobook;
    if (currentMinutesInput) currentMinutesInput.disabled = !isCurrentlyReading || !isAudiobook;
    if (totalHoursInput) totalHoursInput.disabled = !isCurrentlyReading || !isAudiobook;
    if (totalMinutesInput) totalMinutesInput.disabled = !isCurrentlyReading || !isAudiobook;
    if (finishedDateInput) finishedDateInput.disabled = isCurrentlyReading;

    if (isCurrentlyReading) {
      if (finishedDateInput) finishedDateInput.value = "";
      ratingController.reset();
    }
  }

  if (currentlyReadingInput) {
    currentlyReadingInput.addEventListener("change", syncReadingModeUI);
    syncReadingModeUI();
  }
  if (audiobookInput) {
    audiobookInput.addEventListener("change", syncReadingModeUI);
  }
  if (isWorkoutTracker) {
    itemInput?.addEventListener("input", syncWorkoutMetricsUI);
    categoryInput?.addEventListener("change", syncWorkoutMetricsUI);
    syncWorkoutMetricsUI();
  }

  function getEntries() {
    return getEntriesFromStore(storageKey);
  }

  function saveEntries(entries) {
    saveEntriesToStore({ storageKey, entries, ensureEntryIdentity });
  }

  function normalizeReadingEntries() {
    if (!isReadingTracker || hasNormalizedReadingEntries) return;
    const entries = getEntries();
    let changed = false;
    const normalizedEntries = entries.map((entry) => {
      if (!entry || typeof entry !== "object") return entry;
      if ("coverUrl" in entry) {
        changed = true;
        return {
          ...entry,
          coverUrl: ""
        };
      }
      if (entry.coverEditionKey && typeof entry.coverEditionKey !== "string") {
        changed = true;
        return {
          ...entry,
          coverEditionKey: ""
        };
      }
      return entry;
    });

    if (changed) {
      saveEntries(normalizedEntries);
    }
    hasNormalizedReadingEntries = true;
  }

  function normalizeWaterEntries() {
    if (!isWaterTracker || hasNormalizedWaterEntries) return;
    const entries = getEntries();
    let changed = false;
    const normalizedEntries = entries.map((entry) => {
      if (!entry || typeof entry !== "object") return entry;
      const type = String(entry?.waterDrinkType || "").trim().toLowerCase();
      const label = String(entry?.waterDrinkLabel || "").trim();
      const itemLabel = String(entry?.item || "").trim();
      const normalizedLabel = normalizeDrinkLabel(label);
      const isMixedPlaceholder = type === "mixed"
        || normalizedLabel === "mixed drinks"
        || /mixed drinks$/i.test(itemLabel);
      if (!isMixedPlaceholder) return entry;

      const drinkOz = Math.max(0, Number(entry?.waterOunces) || 0);
      const impact = Math.max(0, Number(entry?.waterHydrationImpact) || 1);
      const hydrationOz = Math.max(
        0,
        Number(entry?.hydrationOunces) || (drinkOz * impact)
      );
      const looksLikePlainWater = Math.abs(impact - 1) < 0.0001 && Math.abs(hydrationOz - drinkOz) < 0.0001;
      const normalizedHistory = getWaterDrinkHistory(entry);
      const hasHistory = Array.isArray(entry.waterDrinkHistory) && entry.waterDrinkHistory.length > 0;
      let nextEntry = entry;
      if (!hasHistory && normalizedHistory.length) {
        nextEntry = { ...nextEntry, waterDrinkHistory: normalizedHistory };
        changed = true;
      }
      if (normalizedHistory.length) {
        const titleMeta = getWaterTitleMetaFromHistory(normalizedHistory, label || "Water", type || "water");
        const normalizedItem = `${formatWaterVolumeFromOunces(drinkOz, "oz")} ${titleMeta.label}`;
        if (
          String(nextEntry?.waterDrinkLabel || "").trim() !== titleMeta.label
          || String(nextEntry?.waterDrinkType || "").trim() !== titleMeta.type
          || String(nextEntry?.item || "").trim() !== normalizedItem
        ) {
          nextEntry = {
            ...nextEntry,
            item: normalizedItem,
            waterDrinkType: titleMeta.type,
            waterDrinkLabel: titleMeta.label
          };
          changed = true;
        }
      }
      if (looksLikePlainWater && isMixedPlaceholder) {
        nextEntry = {
          ...nextEntry,
          item: `${formatWaterVolumeFromOunces(drinkOz, "oz")} Water`,
          waterDrinkType: "water",
          waterDrinkLabel: "Water"
        };
        changed = true;
      }
      return nextEntry;
    });
    if (changed) saveEntries(normalizedEntries);
    hasNormalizedWaterEntries = true;
  }

  async function enrichReadingCovers() {
    if (!isReadingTracker || isEnrichingReadingCovers) return;
    const entries = getEntries();
    const targets = entries
      .map((entry, idx) => ({ entry, idx }))
      .filter(({ entry }) => entry?.item && !getReadingCoverUrl(entry, isReadingTracker));

    if (!targets.length) return;
    isEnrichingReadingCovers = true;

    try {
      let changed = false;
      for (const { entry, idx } of targets) {
        const query = [entry.item, entry.author].filter(Boolean).join(" ");
        if (!query) continue;

        try {
          const res = await fetch(`/api/openlibrary/suggest?q=${encodeURIComponent(query)}`);
          if (!res.ok) continue;
          const data = await res.json();
          const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
          const normalizedTitle = String(entry.item || "").trim().toLowerCase();
          const normalizedAuthor = String(entry.author || "").trim().toLowerCase();
          const match = suggestions.find((suggestion) => {
            const sameTitle = String(suggestion?.value || "").trim().toLowerCase() === normalizedTitle;
            const sameAuthor = !normalizedAuthor || String(suggestion?.author || "").trim().toLowerCase() === normalizedAuthor;
            return sameTitle && sameAuthor;
          }) || suggestions[0];

          const coverId = Number(match?.coverId) || 0;
          const coverEditionKey = String(match?.coverEditionKey || "").trim();
          if (!coverId && !coverEditionKey) continue;

          entries[idx] = {
            ...entries[idx],
            coverId,
            coverEditionKey
          };
          changed = true;
        } catch {
          // Ignore individual lookup failures and continue backfilling others.
        }
      }

      if (changed) {
        saveEntries(entries);
        renderEntries();
      }
    } finally {
      isEnrichingReadingCovers = false;
    }
  }

  if (isSleepTracker) {
    const { goalHours, goalMinutes } = getSleepGoalSettings();
    if (goalHoursInput) goalHoursInput.value = String(goalHours);
    if (goalMinutesInput) goalMinutesInput.value = String(goalMinutes);
    updateSleepGoalSummary();

    goalHoursInput?.addEventListener("change", updateSleepGoalSummary);
    goalMinutesInput?.addEventListener("change", updateSleepGoalSummary);
    goalSaveButton?.addEventListener("click", function() {
      const nextGoalHours = Number(goalHoursInput?.value || 0);
      const nextGoalMinutes = Number(goalMinutesInput?.value || 0);
      saveSleepGoalSettings(nextGoalHours, nextGoalMinutes);
      updateSleepGoalSummary();
      showSleepGoalMessage(`Saved goal: ${formatDurationLabel(nextGoalHours, nextGoalMinutes)}`);
      renderEntries();
    });
  }

  if (isWaterTracker) {
    const { goalOunces, volumeUnit } = getWaterGoalSettings();
    selectedWaterVolumeUnit = normalizeWaterVolumeUnit(volumeUnit);
    if (waterVolumeUnitInput) waterVolumeUnitInput.value = selectedWaterVolumeUnit;
    updateWaterUnitLabels();
    if (waterGoalOuncesInput) {
      waterGoalOuncesInput.value = formatWaterInputValue(
        fromWaterOunces(goalOunces, selectedWaterVolumeUnit),
        selectedWaterVolumeUnit
      );
    }
    updateWaterGoalSummary();

    waterGoalOuncesInput?.addEventListener("change", updateWaterGoalSummary);
    waterVolumeUnitInput?.addEventListener("change", function() {
      const previousUnit = selectedWaterVolumeUnit;
      const nextUnit = normalizeWaterVolumeUnit(waterVolumeUnitInput?.value || "oz");
      if (nextUnit === previousUnit) return;

      const goalInputValue = Math.max(0, Number(waterGoalOuncesInput?.value || 0));
      const goalOunces = toWaterOunces(goalInputValue, previousUnit);
      const entryInputValue = Math.max(0, Number(waterOuncesInput?.value || 0));
      const entryOunces = toWaterOunces(entryInputValue, previousUnit);

      selectedWaterVolumeUnit = nextUnit;
      updateWaterUnitLabels();
      if (waterGoalOuncesInput) {
        waterGoalOuncesInput.value = formatWaterInputValue(
          fromWaterOunces(goalOunces, selectedWaterVolumeUnit),
          selectedWaterVolumeUnit
        );
      }
      if (waterOuncesInput && waterOuncesInput.value !== "") {
        waterOuncesInput.value = formatWaterInputValue(
          fromWaterOunces(entryOunces, selectedWaterVolumeUnit),
          selectedWaterVolumeUnit
        );
      }
      saveWaterGoalSettings(goalOunces, selectedWaterVolumeUnit);
      updateWaterGoalSummary();
      renderEntries(false);
    });
    waterDrinkTypeInput?.addEventListener("change", syncWaterDrinkUI);
    waterGoalSaveButton?.addEventListener("click", function() {
      const unit = normalizeWaterVolumeUnit(selectedWaterVolumeUnit);
      const nextGoalValue = Math.max(0, Number(waterGoalOuncesInput?.value || 0));
      const nextGoalOunces = toWaterOunces(nextGoalValue, unit);
      saveWaterGoalSettings(nextGoalOunces, unit);
      updateWaterGoalSummary();
      showWaterGoalMessage(`Saved goal: ${formatWaterVolumeFromOunces(nextGoalOunces, unit)}/day`);
      renderEntries();
    });
    entryDateInput?.addEventListener("change", updateWaterGoalSummary);
    syncWaterDrinkUI();
  }

  initItemAutocomplete({
    enableOmdbAutocomplete,
    omdbApiKey,
    autocompleteEndpoint,
    itemInput,
    itemSuggestions,
    itemSuggestionsList,
    enableAuthorField,
    autoPopulateAuthor,
    authorInput,
    enableDirectorField,
    autoPopulateDirector,
    directorInput,
    enablePublisherField,
    autoPopulatePublisher,
    publisherInput,
    enableCategoryField,
    categoryInput,
    enableReadingProgress,
    autoPopulateTotalPages,
    totalPagesInput,
    audiobookInput,
    onSelectionChange(selection) {
      selectedCoverId = Number(selection?.coverId) || 0;
      selectedCoverEditionKey = selection?.coverEditionKey || "";
      selectedCoverUrl = selection?.coverUrl || "";
      selectedPosterUrl = selection?.posterUrl || "";
      selectedImdbId = selection?.imdbID || "";
    },
    onSuggestionApplied() {
      syncWorkoutMetricsUI();
    }
  });

  function renderEntries(resetVisibleCount = true) {
    normalizeReadingEntries();
    normalizeWaterEntries();
    list.innerHTML = "";
    const entries = getEntries();
    const totalGameHours = {};
    if (isVideoGameTracker) {
      entries.forEach((entry) => {
        const key = normalizeGameKey(entry?.item);
        if (!key) return;
        totalGameHours[key] = (totalGameHours[key] || 0) + Math.max(0, Number(entry?.sessionHours) || 0);
      });
    }
    function getDueDateTimestamp(entry) {
      const dueDate = String(entry?.dueDate || "").trim();
      if (!dueDate) return Number.POSITIVE_INFINITY;
      const due = new Date(`${dueDate}T00:00:00`);
      return Number.isNaN(due.getTime()) ? Number.POSITIVE_INFINITY : due.getTime();
    }

    function compareTaskEntries(a, b) {
      const sortValue = String(taskSortInput?.value || "due-soonest");
      if (sortValue === "alpha") {
        return String(a.entry?.item || "").localeCompare(String(b.entry?.item || ""), undefined, { sensitivity: "base" });
      }
      if (sortValue === "newest") {
        const aTime = a.entry?.date ? new Date(a.entry.date).getTime() : 0;
        const bTime = b.entry?.date ? new Date(b.entry.date).getTime() : 0;
        return bTime - aTime;
      }
      if (sortValue === "oldest") {
        const aTime = a.entry?.date ? new Date(a.entry.date).getTime() : 0;
        const bTime = b.entry?.date ? new Date(b.entry.date).getTime() : 0;
        return aTime - bTime;
      }
      if (sortValue === "due-latest") {
        return getDueDateTimestamp(b.entry) - getDueDateTimestamp(a.entry);
      }
      return getDueDateTimestamp(a.entry) - getDueDateTimestamp(b.entry);
    }

    function getEntryActivityTimestamp(entry) {
      const updatedAt = Number(entry?.updatedAt) || 0;
      const dateTs = entry?.date ? new Date(entry.date).getTime() : 0;
      return Math.max(updatedAt, Number.isFinite(dateTs) ? dateTs : 0);
    }

    function isReadingEntryVisible(entry) {
      if (!enableReadingProgress) return true;
      if (selectedReadingListFilter === "reading") return Boolean(entry?.currentlyReading);
      if (selectedReadingListFilter === "finished") return !Boolean(entry?.currentlyReading);
      return true;
    }

    let renderedEntries = entries.map((entry, idx) => ({ entry, idx }));
    if (isTaskTracker) {
      const filterValue = String(taskFilterInput?.value || "active");
      if (filterValue === "active") {
        renderedEntries = renderedEntries.filter(({ entry }) => !entry?.completed);
      } else if (filterValue === "completed") {
        renderedEntries = renderedEntries.filter(({ entry }) => Boolean(entry?.completed));
      }
      renderedEntries.sort(compareTaskEntries);
    } else if (enableReadingProgress) {
      renderedEntries = renderedEntries.filter(({ entry }) => isReadingEntryVisible(entry));
      renderedEntries.sort((a, b) => getEntryActivityTimestamp(b.entry) - getEntryActivityTimestamp(a.entry));
    } else {
      renderedEntries = renderedEntries.reverse();
    }

    if (resetVisibleCount || visibleEntriesCount <= 0) {
      visibleEntriesCount = LIST_PAGE_SIZE;
    }
    const visibleLimit = Math.min(Math.max(LIST_PAGE_SIZE, visibleEntriesCount), renderedEntries.length);
    visibleEntriesCount = visibleLimit;
    list.dataset.totalCount = String(renderedEntries.length);
    list.dataset.visibleCount = String(visibleLimit);

    renderedEntries.slice(0, visibleLimit).forEach(({ entry, idx }) => {
      if (!entry || typeof entry !== "object") return;
      const li = document.createElement("li");
      li.className = "mb-3";
      const entryDate = entry.date ? new Date(entry.date) : null;
      const dateDesktop = entryDate
        ? entryDate.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        : "";
      const dateMobile = entryDate
        ? entryDate.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "2-digit",
            hour: "numeric",
            minute: "2-digit"
          })
        : "";
      const metadataChips = [];
      let workoutMetricBadges = "";
      if (entry.author) metadataChips.push(`By ${entry.author}`);
      if (entry.director) metadataChips.push(`Director ${entry.director}`);
      if (entry.publisher) metadataChips.push(`Publisher ${entry.publisher}`);
      if (entry.category) metadataChips.push(`Category ${entry.category}`);
      if (isTaskTracker) {
        const dueDate = formatSimpleDate(entry?.dueDate);
        if (dueDate) metadataChips.push(`Due ${dueDate}`);
        metadataChips.push(entry?.completed ? "Completed" : "Active");
      }
      if (isWorkoutTracker) {
        workoutMetricBadges = formatWorkoutMetricBadges(entry, isWorkoutTracker);
      }
      if (isVideoGameTracker) {
        const sessionHours = Math.max(0, Number(entry?.lastSessionHours) || Number(entry?.sessionHours) || 0);
        const explicitTotalHours = Math.max(0, Number(entry?.totalHours) || 0);
        const aggregatedTotalHours = totalGameHours[normalizeGameKey(entry?.item)] || 0;
        const totalHours = explicitTotalHours > 0 ? explicitTotalHours : aggregatedTotalHours;
        if (sessionHours > 0 || totalHours > 0) {
          metadataChips.push(`Session ${formatGameHours(sessionHours)}`);
          metadataChips.push(`Total ${formatGameHours(totalHours)}`);
        }
      }
      if (isSleepTracker) {
        const { hours, minutes } = parseSleepDuration(entry);
        const { goalHours, goalMinutes } = getSleepGoalSettings();
        const grade = getSleepGrade(hours, minutes, goalHours, goalMinutes);
        metadataChips.push(`Target ${formatDurationLabel(goalHours, goalMinutes)}`);
        metadataChips.push(`Score ${grade.score ?? "N/A"}/100`);
        if (grade.score !== null && grade.detail) metadataChips.push(grade.detail);
      }
      if (isWaterTracker) {
        const { goalOunces, volumeUnit } = getWaterGoalSettings();
        const displayUnit = normalizeWaterVolumeUnit(volumeUnit || selectedWaterVolumeUnit);
        const entryOunces = Math.max(0, Number(entry?.waterOunces) || 0);
        const hydrationOunces = Math.max(0, Number(entry?.hydrationOunces) || (entryOunces * (Number(entry?.waterHydrationImpact) || 1)));
        const impact = Math.max(0, Number(entry?.waterHydrationImpact) || 1);
        const drinkHistory = getWaterDrinkHistory(entry);
        if (drinkHistory.length) {
          metadataChips.push(`Drinks: ${summarizeWaterDrinkHistory(drinkHistory, displayUnit)}`);
        } else {
          const drinkLabel = String(entry?.waterDrinkLabel || "Water").trim();
          if (drinkLabel) metadataChips.push(drinkLabel);
        }
        if (hydrationOunces > 0) metadataChips.push(`Hydration ${formatWaterVolumeFromOunces(hydrationOunces, displayUnit)}`);
        metadataChips.push(`Impact ${impact.toFixed(2)}`);
        if (goalOunces > 0 && hydrationOunces > 0) {
          const pct = Math.round((hydrationOunces / goalOunces) * 100);
          metadataChips.push(`${pct}% of daily goal`);
        } else if (goalOunces > 0) {
          metadataChips.push(`Goal ${formatWaterVolumeFromOunces(goalOunces, displayUnit)}/day`);
        }
      }
      if (enableReadingProgress && (entry.startedDate || entry.finishedDate)) {
        const started = entry.startedDate ? `Started ${formatSimpleDate(entry.startedDate)}` : "";
        const finished = entry.currentlyReading
          ? "Currently reading"
          : (entry.finishedDate ? `Finished ${formatSimpleDate(entry.finishedDate)}` : "");
        if (started) metadataChips.push(started);
        if (finished) metadataChips.push(finished);
      }
      if (enableReadingProgress && (entry.currentPage || entry.totalPages || entry.currentHours || entry.currentMinutes || entry.totalHours || entry.totalMinutes)) {
        const progress = formatProgressValue(entry);
        metadataChips.push(`Progress ${progress.current}${progress.total ? ` / ${progress.total}` : ""} ${progress.unit}`);
        if (progress.total) metadataChips.push(`${progress.percent}%`);
      }
      const metadataChipsHtml = formatMetadataChips(metadataChips);
      const metricsHtml = workoutMetricBadges
        ? `<div class="text-gray-600 text-sm mt-1">Metrics:${workoutMetricBadges}</div>`
        : "";
      const metadataHtml = (metadataChipsHtml || metricsHtml)
        ? `<div class="mt-1 space-y-1">${metadataChipsHtml}${metricsHtml}</div>`
        : "";
      const showRating = !isSleepTracker && !isTaskTracker && !isFinanceTracker && !isHealthTracker && !isWaterTracker && !(enableReadingProgress && entry.currentlyReading);
      const mediaImageUrl = isReadingTracker
        ? getReadingCoverUrl(entry, isReadingTracker)
        : (isMovieTracker ? getMoviePosterUrl(entry, isMovieTracker) : (isVideoGameTracker ? getVideoGameCoverUrl(entry, isVideoGameTracker) : ""));
      const fallbackMediaUrl = getFallbackMediaUrl(isReadingTracker);
      const finalMediaUrl = mediaImageUrl || fallbackMediaUrl;
      const hasMediaImage = Boolean(finalMediaUrl);
      const completedClass = isTaskTracker && entry?.completed ? "opacity-80" : "";
      const completedItemClass = isTaskTracker && entry?.completed ? "line-through text-gray-500" : "text-gray-800";
      const imageOnError = fallbackMediaUrl && mediaImageUrl
        ? `this.onerror=null;this.src='${fallbackMediaUrl}';`
        : "";
      const coverHtml = hasMediaImage
        ? `<div class=\"reading-cover-shell\"><img src=\"${finalMediaUrl}\" alt=\"Cover of ${entry.item}\" class=\"reading-cover-image\" loading=\"lazy\" referrerpolicy=\"no-referrer\" ${imageOnError ? `onerror=\"${imageOnError}\"` : ""} /></div>`
        : "";
      const notesHtml = renderNotesHtml(entry);
      let displayItemTitle = entry.item;
      if (isWaterTracker) {
        const { volumeUnit } = getWaterGoalSettings();
        const displayUnit = normalizeWaterVolumeUnit(volumeUnit || selectedWaterVolumeUnit);
        const drinkHistory = getWaterDrinkHistory(entry);
        const fallbackLabel = resolveWaterLabelFromEntry(entry) || String(entry?.waterDrinkLabel || "Water").trim() || "Water";
        const fallbackType = String(entry?.waterDrinkType || "water").trim() || "water";
        const titleMeta = getWaterTitleMetaFromHistory(drinkHistory, fallbackLabel, fallbackType);
        const waterAmount = Math.max(0, Number(entry?.waterOunces) || 0);
        displayItemTitle = `${formatWaterVolumeFromOunces(waterAmount, displayUnit)} ${titleMeta.label}`;
      }
      li.innerHTML = `
        <div class=\"relative bg-white rounded-lg shadow border border-gray-200 px-4 py-3 flex ${hasMediaImage ? "flex-col gap-3 sm:flex-row sm:gap-4 sm:items-start" : "flex-col"} ${completedClass}\">
          ${coverHtml}
          <div class=\"${hasMediaImage ? "w-full sm:flex-1 sm:min-w-0" : ""}\">
          <div class=\"${hasMediaImage ? "flex-1 min-w-0" : ""}\">
          <div class=\"absolute top-3 right-3 flex items-center gap-1\">
            ${isTaskTracker ? `<button class=\"p-1.5 bg-gray-200 rounded hover:bg-green-100 text-green-700 inline-flex items-center justify-center\" aria-label=\"Toggle completion\" data-action=\"toggle-complete\" data-idx=\"${idx}\"><span class=\"material-symbols-outlined leading-none\" style=\"font-size:20px;font-variation-settings:'opsz' 20;\" aria-hidden=\"true\">${entry?.completed ? "task_alt" : "check_circle"}</span></button>` : ""}
            <button class=\"p-1.5 bg-gray-200 rounded hover:bg-gray-300 text-gray-700 inline-flex items-center justify-center\" aria-label=\"Edit\" data-action=\"edit\" data-idx=\"${idx}\"><span class=\"material-symbols-outlined leading-none\" style=\"font-size:20px;font-variation-settings:'opsz' 20;\" aria-hidden=\"true\">edit</span></button>
            <button class=\"p-1.5 bg-gray-200 rounded hover:bg-red-100 text-red-600 inline-flex items-center justify-center\" aria-label=\"Delete\" data-action=\"delete\" data-idx=\"${idx}\"><span class=\"material-symbols-outlined leading-none\" style=\"font-size:20px;font-variation-settings:'opsz' 20;\" aria-hidden=\"true\">delete</span></button>
          </div>
          <div class=\"mb-2 pr-12\">
            <span class=\"text-[11px] sm:text-xs text-gray-500 leading-tight\" title=\"${dateDesktop}\">${dateMobile}</span>
          </div>
          <div class=\"mb-2 pr-12\">
            <div class=\"min-w-0\">
              <span class=\"${completedItemClass} font-medium leading-tight break-words\">${displayItemTitle}</span>
              ${metadataHtml}
            </div>
          </div>
          ${notesHtml}
          ${showRating ? `<div class=\"flex items-center gap-1 mt-2\">${renderStaticStars(entry.rating || 0)}</div>` : ""}
          </div>
          </div>
        </div>
      `;
      const deleteButton = li.querySelector("[data-action=\"delete\"]");
      if (deleteButton) {
        deleteButton.onclick = async () => {
          const confirmed = await requestDeleteConfirmation();
          if (!confirmed) return;
          const entries = getEntries();
          entries.splice(idx, 1);
          saveEntries(entries);
          if (editingIdx === idx) {
            clearForm();
          } else if (editingIdx > idx) {
            editingIdx -= 1;
          }
          renderEntries();
        };
      }
      const editButton = li.querySelector("[data-action=\"edit\"]");
      if (editButton) {
        editButton.onclick = () => {
          startEditing(idx);
        };
      }
      const toggleCompleteButton = li.querySelector("[data-action=\"toggle-complete\"]");
      if (toggleCompleteButton) {
        toggleCompleteButton.onclick = () => {
          const entries = getEntries();
          const currentEntry = ensureEntryIdentity(entries[idx]);
          if (!currentEntry) return;
          currentEntry.completed = !Boolean(currentEntry.completed);
          currentEntry.completedAt = currentEntry.completed ? new Date().toISOString() : "";
          currentEntry.updatedAt = Date.now();
          entries[idx] = currentEntry;
          saveEntries(entries);
          renderEntries();
        };
      }
      const notesSortSelect = li.querySelector("[data-action=\"notes-sort\"]");
      if (notesSortSelect) {
        notesSortSelect.addEventListener("change", (event) => {
          const target = event.currentTarget;
          const entryId = String(target?.getAttribute("data-entry-id") || "");
          if (!entryId) return;
          const existing = notesViewStateByEntryId.get(entryId) || { sort: "newest", range: "all" };
          notesViewStateByEntryId.set(entryId, { ...existing, sort: String(target.value || "newest") });
          renderEntries();
        });
      }
      const notesRangeSelect = li.querySelector("[data-action=\"notes-range\"]");
      if (notesRangeSelect) {
        notesRangeSelect.addEventListener("change", (event) => {
          const target = event.currentTarget;
          const entryId = String(target?.getAttribute("data-entry-id") || "");
          if (!entryId) return;
          const existing = notesViewStateByEntryId.get(entryId) || { sort: "newest", range: "all" };
          notesViewStateByEntryId.set(entryId, { ...existing, range: String(target.value || "all") });
          renderEntries();
        });
      }
      list.appendChild(li);
    });

    void enrichReadingCovers();
    void enrichMoviePosters();
    if (isWaterTracker) {
      updateWaterGoalSummary();
    }
  }

  async function enrichMoviePosters() {
    if (!isMovieTracker || isEnrichingMoviePosters || !omdbApiKey) return;
    const entries = getEntries();
    const targets = entries
      .map((entry, idx) => ({ entry, idx }))
      .filter(({ entry }) => entry?.item && !getMoviePosterUrl(entry, isMovieTracker));

    if (!targets.length) return;
    isEnrichingMoviePosters = true;

    try {
      let changed = false;
      for (const { entry, idx } of targets) {
        const title = String(entry.item || "").trim();
        if (!title) continue;

        try {
          const searchUrl = `https://www.omdbapi.com/?apikey=${encodeURIComponent(omdbApiKey)}&type=movie&s=${encodeURIComponent(title)}`;
          const searchRes = await fetch(searchUrl);
          if (!searchRes.ok) continue;
          const searchData = await searchRes.json();
          const results = Array.isArray(searchData?.Search) ? searchData.Search : [];
          const normalizedTitle = title.toLowerCase();
          const match = results.find((movie) => String(movie?.Title || "").trim().toLowerCase() === normalizedTitle) || results[0];
          const posterUrl = match?.Poster && match.Poster !== "N/A" ? match.Poster : "";
          const imdbID = match?.imdbID || "";
          if (!posterUrl) continue;

          entries[idx] = {
            ...entries[idx],
            imdbID,
            posterUrl
          };
          changed = true;
        } catch {
          // Ignore individual lookup failures and continue backfilling others.
        }
      }

      if (changed) {
        saveEntries(entries);
        renderEntries();
      }
    } finally {
      isEnrichingMoviePosters = false;
    }
  }
  if (cancelEditButton) {
    cancelEditButton.addEventListener("click", function() {
      clearForm();
    });
  }

  form.onsubmit = e => {
    e.preventDefault();
    const sleepHours = Number(sleepHoursInput?.value || 0);
    const sleepMinutes = Number(sleepMinutesInput?.value || 0);
    const author = authorInput?.value.trim() || "";
    const director = directorInput?.value.trim() || "";
    const publisher = publisherInput?.value.trim() || "";
    const category = categoryInput?.value || "";
    const entryDateValue = entryDateInput?.value || "";
    const workoutDurationHours = Math.max(0, getIntValue(workoutDurationHoursInput, 0));
    const workoutDurationMinutes = Math.max(0, Math.min(59, getIntValue(workoutDurationMinutesInput, 0)));
    const workoutDurationSeconds = Math.max(0, Math.min(59, getIntValue(workoutDurationSecondsInput, 0)));
    const workoutDurationTotalMinutes = Math.floor((workoutDurationHours * 3600 + workoutDurationMinutes * 60 + workoutDurationSeconds) / 60);
    const workoutDistanceMiles = Math.max(0, getFloatValue(workoutDistanceInput, 0));
    const workoutLaps = Math.max(0, getIntValue(workoutLapsInput, 0));
    const workoutSets = Math.max(0, getIntValue(workoutSetsInput, 0));
    const workoutReps = Math.max(0, getIntValue(workoutRepsInput, 0));
    const workoutWeightLbs = Math.max(0, getIntValue(workoutWeightInput, 0));
    const sessionDurationHours = Math.max(0, getIntValue(sessionDurationHoursInput, 0));
    const sessionDurationMinutes = Math.max(0, Math.min(59, getIntValue(sessionDurationMinutesInput, 0)));
    const sessionDurationSeconds = Math.max(0, Math.min(59, getIntValue(sessionDurationSecondsInput, 0)));
    const sessionHours = (sessionDurationHours * 3600 + sessionDurationMinutes * 60 + sessionDurationSeconds) / 3600;
    const waterVolumeValue = Math.max(0, getFloatValue(waterOuncesInput, 0));
    const waterUnit = normalizeWaterVolumeUnit(selectedWaterVolumeUnit);
    const waterOunces = toWaterOunces(waterVolumeValue, waterUnit);
    const selectedWaterDrinkType = String(waterDrinkTypeInput?.value || "water");
    const selectedDefaultWaterDrink = getDefaultWaterDrinkByValue(selectedWaterDrinkType);
    const waterDrinkLabel = selectedWaterDrinkType === "custom"
      ? (waterCustomNameInput?.value.trim() || "")
      : (selectedDefaultWaterDrink?.label || "Water");
    const waterHydrationImpactRaw = selectedWaterDrinkType === "custom"
      ? getFloatValue(waterCustomImpactInput, 1)
      : Number(selectedDefaultWaterDrink?.impact ?? 1);
    const waterHydrationImpact = Math.max(0, Math.min(1.2, waterHydrationImpactRaw || 1));
    const hydrationOunces = waterOunces * waterHydrationImpact;
    const item = isSleepTracker
      ? formatSleepDuration(sleepHours, sleepMinutes)
      : (isWaterTracker ? `${formatWaterVolumeFromOunces(waterOunces, waterUnit)} ${waterDrinkLabel}` : (itemInput?.value.trim() || ""));
    const startedDate = startedDateInput?.value || "";
    const currentlyReading = enableReadingProgress && Boolean(currentlyReadingInput?.checked);
    const isAudiobook = isReadingTracker && Boolean(audiobookInput?.checked);
    const finishedDate = currentlyReading ? "" : (finishedDateInput?.value || "");
    const currentPage = Number(currentPageInput?.value || 0);
    const totalPages = Number(totalPagesInput?.value || 0);
    const leftHours = getIntValue(currentHoursInput, 0);
    const leftMinutes = getIntValue(currentMinutesInput, 0);
    const totalHours = getIntValue(totalHoursInput, 0);
    const totalMinutes = getIntValue(totalMinutesInput, 0);
    const dueDate = dueDateInput?.value || "";
    const notes = notesInput.value.trim();
    const { goalHours, goalMinutes } = isSleepTracker ? getSleepGoalSettings() : { goalHours: 0, goalMinutes: 0 };
    const sleepGrade = isSleepTracker ? getSleepGrade(sleepHours, sleepMinutes, goalHours, goalMinutes) : null;
    const rating = isSleepTracker
      ? (sleepGrade?.stars || 0)
      : ((isTaskTracker || isFinanceTracker || isHealthTracker || isWaterTracker) ? 0 : (currentlyReading ? 0 : (parseFloat(ratingInput?.value) || 0)));
    if (
      !item ||
      (enableCategoryField && !category) ||
      (isSleepTracker && sleepHours === 0 && sleepMinutes === 0) ||
      (isVideoGameTracker && sessionHours <= 0) ||
      (isWaterTracker && (waterOunces <= 0 || !waterDrinkLabel))
    ) return;
    const entries = getEntries();
    if (editingIdx >= 0 && entries[editingIdx]) {
      const date = buildEntryDateIso(entryDateValue, entries[editingIdx]?.date || "");
      const previousReadingPercent = enableReadingProgress
        ? getReadingProgressPercentForEntry(entries[editingIdx])
        : 0;
      const updatedEntry = {
        ...ensureEntryIdentity(entries[editingIdx]),
        item,
        rating,
        date,
        updatedAt: Date.now()
      };
      Object.assign(updatedEntry, withUpdatedNotes(entries[editingIdx], notes, { noteTimestamp: date }));
      if (isSleepTracker) {
        updatedEntry.sleepHours = sleepHours;
        updatedEntry.sleepMinutes = sleepMinutes;
        updatedEntry.sleepScore = sleepGrade?.score ?? null;
      }
      if (enableAuthorField) updatedEntry.author = author;
      if (enableDirectorField) updatedEntry.director = director;
      if (enablePublisherField) updatedEntry.publisher = publisher;
      if (enableCategoryField) updatedEntry.category = category;
      if (isTaskTracker) {
        updatedEntry.dueDate = dueDate;
      }
      if (isWorkoutTracker) {
        updatedEntry.workoutDurationHours = workoutDurationHours;
        updatedEntry.workoutDurationMinutes = workoutDurationMinutes;
        updatedEntry.workoutDurationSeconds = workoutDurationSeconds;
        updatedEntry.workoutDurationTotalMinutes = workoutDurationTotalMinutes;
        updatedEntry.workoutDistanceMiles = workoutDistanceMiles;
        updatedEntry.workoutLaps = workoutLaps;
        updatedEntry.workoutSets = workoutSets;
        updatedEntry.workoutReps = workoutReps;
        updatedEntry.workoutWeightLbs = workoutWeightLbs;
      }
      if (isVideoGameTracker) {
        updatedEntry.sessionHours = sessionHours;
        updatedEntry.lastSessionHours = sessionHours;
        updatedEntry.totalHours = sessionHours;
        updatedEntry.coverUrl = selectedCoverUrl || updatedEntry.coverUrl || "";
      }
      if (isWaterTracker) {
        updatedEntry.item = `${formatWaterVolumeFromOunces(waterOunces, waterUnit)} ${waterDrinkLabel}`;
        updatedEntry.waterOunces = waterOunces;
        updatedEntry.waterDrinkType = selectedWaterDrinkType;
        updatedEntry.waterDrinkLabel = waterDrinkLabel;
        updatedEntry.waterHydrationImpact = waterHydrationImpact;
        updatedEntry.hydrationOunces = hydrationOunces;
        updatedEntry.waterVolumeUnit = waterUnit;
        updatedEntry.waterDrinkHistory = [buildWaterDrinkHistoryItem({
          type: selectedWaterDrinkType,
          label: waterDrinkLabel,
          ounces: waterOunces,
          hydrationOunces,
          impact: waterHydrationImpact,
          createdAt: date
        })];
      }
      if (enableReadingProgress) {
        const totalAudioMinutes = totalMinutesFromParts(totalHours, totalMinutes);
        const leftAudioMinutesRaw = totalMinutesFromParts(leftHours, leftMinutes);
        const inferredLeftAudioMinutes = (isAudiobook && currentlyReading && editingIdx < 0 && totalAudioMinutes > 0 && leftAudioMinutesRaw === 0)
          ? totalAudioMinutes
          : leftAudioMinutesRaw;
        const leftAudioMinutes = totalAudioMinutes > 0 ? Math.min(totalAudioMinutes, inferredLeftAudioMinutes) : inferredLeftAudioMinutes;
        const listenedAudioMinutes = totalAudioMinutes > 0 ? Math.max(0, totalAudioMinutes - leftAudioMinutes) : 0;
        updatedEntry.startedDate = startedDate;
        updatedEntry.finishedDate = finishedDate;
        updatedEntry.currentlyReading = currentlyReading;
        updatedEntry.isAudiobook = isAudiobook;
        updatedEntry.coverId = selectedCoverId;
        updatedEntry.coverEditionKey = selectedCoverEditionKey;
        updatedEntry.currentPage = isAudiobook ? 0 : currentPage;
        updatedEntry.totalPages = isAudiobook ? 0 : totalPages;
        updatedEntry.currentHours = isAudiobook ? Math.floor(listenedAudioMinutes / 60) : 0;
        updatedEntry.currentMinutes = isAudiobook ? listenedAudioMinutes % 60 : 0;
        updatedEntry.leftHours = isAudiobook ? Math.floor(leftAudioMinutes / 60) : 0;
        updatedEntry.leftMinutes = isAudiobook ? leftAudioMinutes % 60 : 0;
        updatedEntry.totalHours = isAudiobook ? totalHours : 0;
        updatedEntry.totalMinutes = isAudiobook ? totalMinutes : 0;
        const nextReadingPercent = getReadingProgressPercentForEntry(updatedEntry);
        const readingDeltaPercent = Math.max(0, nextReadingPercent - previousReadingPercent);
        Object.assign(updatedEntry, appendReadingActivity(updatedEntry, readingDeltaPercent, Date.now()));
      }
      if (isMovieTracker) {
        updatedEntry.imdbID = selectedImdbId;
        updatedEntry.posterUrl = selectedPosterUrl;
      }
      entries[editingIdx] = updatedEntry;
    } else {
      if (isWaterTracker) {
        const targetDateIso = buildEntryDateIso(entryDateValue);
        const targetDate = new Date(targetDateIso);
        const existingIdx = entries.findIndex((entry) => {
          const when = entry?.date ? new Date(entry.date) : null;
          if (!when || Number.isNaN(when.getTime()) || Number.isNaN(targetDate.getTime())) return false;
          return (
            when.getFullYear() === targetDate.getFullYear() &&
            when.getMonth() === targetDate.getMonth() &&
            when.getDate() === targetDate.getDate()
          );
        });

        if (existingIdx >= 0) {
          const existingEntry = entries[existingIdx] || {};
          const priorDrinkOz = Math.max(0, Number(existingEntry.waterOunces) || 0);
          const priorHydrationOz = Math.max(
            0,
            Number(existingEntry.hydrationOunces) ||
              (priorDrinkOz * (Number(existingEntry.waterHydrationImpact) || 1))
          );
          const mergedDrinkOz = priorDrinkOz + waterOunces;
          const mergedHydrationOz = priorHydrationOz + hydrationOunces;
          const mergedImpact = mergedDrinkOz > 0 ? (mergedHydrationOz / mergedDrinkOz) : 1;
          const existingLabel = resolveWaterLabelFromEntry(existingEntry);
          const existingType = String(existingEntry.waterDrinkType || "").trim();
          const sameDrinkByType = Boolean(existingType) && existingType === selectedWaterDrinkType;
          const normalizedExistingLabel = normalizeDrinkLabel(existingLabel);
          const normalizedCurrentLabel = normalizeDrinkLabel(waterDrinkLabel);
          const sameDrinkByLabel = Boolean(normalizedExistingLabel) && normalizedExistingLabel === normalizedCurrentLabel;
          const existingImpact = Math.max(0, Number(existingEntry?.waterHydrationImpact) || 1);
          const legacyMixedPlaceholder = (existingType === "mixed" || normalizedExistingLabel === "mixed drinks")
            && Math.abs(existingImpact - waterHydrationImpact) < 0.001;
          const keepSingleDrink = sameDrinkByType || sameDrinkByLabel || legacyMixedPlaceholder;
          const mergedLabel = keepSingleDrink ? (waterDrinkLabel || existingLabel || "Water") : "Mixed Drinks";
          const mergedType = keepSingleDrink ? (selectedWaterDrinkType || existingType || "water") : "mixed";
          const mergedDate = buildEntryDateIso(entryDateValue, existingEntry.date || "");
          const mergedHistory = [
            ...getWaterDrinkHistory(existingEntry),
            buildWaterDrinkHistoryItem({
              type: selectedWaterDrinkType,
              label: waterDrinkLabel,
              ounces: waterOunces,
              hydrationOunces,
              impact: waterHydrationImpact,
              createdAt: mergedDate
            })
          ];
          const mergedTitleMeta = getWaterTitleMetaFromHistory(
            mergedHistory,
            mergedLabel,
            mergedType
          );
          const mergedEntry = {
            ...ensureEntryIdentity(existingEntry),
            item: `${formatWaterVolumeFromOunces(mergedDrinkOz, waterUnit)} ${mergedTitleMeta.label}`,
            rating: 0,
            date: mergedDate,
            waterOunces: mergedDrinkOz,
            hydrationOunces: mergedHydrationOz,
            waterDrinkType: mergedTitleMeta.type,
            waterDrinkLabel: mergedTitleMeta.label,
            waterDrinkHistory: mergedHistory,
            waterVolumeUnit: waterUnit,
            waterHydrationImpact: Math.max(0, Math.min(1.2, mergedImpact)),
            updatedAt: Date.now()
          };
          Object.assign(mergedEntry, withUpdatedNotes(existingEntry, notes, {
            preserveWhenBlank: true,
            noteTimestamp: mergedDate
          }));
          entries[existingIdx] = mergedEntry;
          saveEntries(entries);
          clearForm();
          renderEntries();
          return;
        }
      }

      if (isVideoGameTracker) {
        const gameKey = normalizeGameKey(item);
        const existingIdx = entries.findIndex((entry) => normalizeGameKey(entry?.item) === gameKey);
        if (existingIdx >= 0) {
          const existingEntry = entries[existingIdx] || {};
          const priorTotal = Math.max(
            0,
            Number(existingEntry.totalHours) || Number(existingEntry.sessionHours) || 0
          );
          const mergedTotal = priorTotal + sessionHours;
          const mergedDate = buildEntryDateIso(entryDateValue, existingEntry.date || "");
          const mergedEntry = {
            ...ensureEntryIdentity(existingEntry),
            item,
            rating: rating || existingEntry.rating || 0,
            date: mergedDate,
            sessionHours: mergedTotal,
            totalHours: mergedTotal,
            lastSessionHours: sessionHours,
            updatedAt: Date.now()
          };
          Object.assign(mergedEntry, withUpdatedNotes(existingEntry, notes, {
            preserveWhenBlank: true,
            noteTimestamp: mergedDate
          }));
          if (enablePublisherField && publisher) {
            mergedEntry.publisher = publisher;
          }
          if (enableCategoryField && category) {
            mergedEntry.category = category;
          }
          mergedEntry.coverUrl = selectedCoverUrl || existingEntry.coverUrl || "";
          if (isMovieTracker) {
            mergedEntry.imdbID = selectedImdbId || existingEntry.imdbID || "";
            mergedEntry.posterUrl = selectedPosterUrl || existingEntry.posterUrl || "";
          }
          entries[existingIdx] = mergedEntry;
          saveEntries(entries);
          clearForm();
          renderEntries();
          return;
        }
      }

      const date = buildEntryDateIso(entryDateValue);
      const nextEntry = { id: createEntryId(), item, rating, date, updatedAt: Date.now() };
      Object.assign(nextEntry, withUpdatedNotes({}, notes, { noteTimestamp: date }));
      if (isSleepTracker) {
        nextEntry.sleepHours = sleepHours;
        nextEntry.sleepMinutes = sleepMinutes;
        nextEntry.sleepScore = sleepGrade?.score ?? null;
      }
      if (enableAuthorField) nextEntry.author = author;
      if (enableDirectorField) nextEntry.director = director;
      if (enablePublisherField) nextEntry.publisher = publisher;
      if (enableCategoryField) nextEntry.category = category;
      if (isTaskTracker) {
        nextEntry.dueDate = dueDate;
        nextEntry.completed = false;
        nextEntry.completedAt = "";
      }
      if (isWorkoutTracker) {
        nextEntry.workoutDurationHours = workoutDurationHours;
        nextEntry.workoutDurationMinutes = workoutDurationMinutes;
        nextEntry.workoutDurationSeconds = workoutDurationSeconds;
        nextEntry.workoutDurationTotalMinutes = workoutDurationTotalMinutes;
        nextEntry.workoutDistanceMiles = workoutDistanceMiles;
        nextEntry.workoutLaps = workoutLaps;
        nextEntry.workoutSets = workoutSets;
        nextEntry.workoutReps = workoutReps;
        nextEntry.workoutWeightLbs = workoutWeightLbs;
      }
      if (isVideoGameTracker) {
        nextEntry.sessionHours = sessionHours;
        nextEntry.totalHours = sessionHours;
        nextEntry.lastSessionHours = sessionHours;
        nextEntry.coverUrl = selectedCoverUrl || "";
      }
      if (isWaterTracker) {
        nextEntry.item = `${formatWaterVolumeFromOunces(waterOunces, waterUnit)} ${waterDrinkLabel}`;
        nextEntry.waterOunces = waterOunces;
        nextEntry.waterDrinkType = selectedWaterDrinkType;
        nextEntry.waterDrinkLabel = waterDrinkLabel;
        nextEntry.waterHydrationImpact = waterHydrationImpact;
        nextEntry.hydrationOunces = hydrationOunces;
        nextEntry.waterVolumeUnit = waterUnit;
        nextEntry.waterDrinkHistory = [buildWaterDrinkHistoryItem({
          type: selectedWaterDrinkType,
          label: waterDrinkLabel,
          ounces: waterOunces,
          hydrationOunces,
          impact: waterHydrationImpact,
          createdAt: date
        })];
      }
      if (enableReadingProgress) {
        const totalAudioMinutes = totalMinutesFromParts(totalHours, totalMinutes);
        const leftAudioMinutesRaw = totalMinutesFromParts(leftHours, leftMinutes);
        const inferredLeftAudioMinutes = (isAudiobook && currentlyReading && editingIdx < 0 && totalAudioMinutes > 0 && leftAudioMinutesRaw === 0)
          ? totalAudioMinutes
          : leftAudioMinutesRaw;
        const leftAudioMinutes = totalAudioMinutes > 0 ? Math.min(totalAudioMinutes, inferredLeftAudioMinutes) : inferredLeftAudioMinutes;
        const listenedAudioMinutes = totalAudioMinutes > 0 ? Math.max(0, totalAudioMinutes - leftAudioMinutes) : 0;
        nextEntry.startedDate = startedDate;
        nextEntry.finishedDate = finishedDate;
        nextEntry.currentlyReading = currentlyReading;
        nextEntry.isAudiobook = isAudiobook;
        nextEntry.coverId = selectedCoverId;
        nextEntry.coverEditionKey = selectedCoverEditionKey;
        nextEntry.currentPage = isAudiobook ? 0 : currentPage;
        nextEntry.totalPages = isAudiobook ? 0 : totalPages;
        nextEntry.currentHours = isAudiobook ? Math.floor(listenedAudioMinutes / 60) : 0;
        nextEntry.currentMinutes = isAudiobook ? listenedAudioMinutes % 60 : 0;
        nextEntry.leftHours = isAudiobook ? Math.floor(leftAudioMinutes / 60) : 0;
        nextEntry.leftMinutes = isAudiobook ? leftAudioMinutes % 60 : 0;
        nextEntry.totalHours = isAudiobook ? totalHours : 0;
        nextEntry.totalMinutes = isAudiobook ? totalMinutes : 0;
        const initialReadingPercent = getReadingProgressPercentForEntry(nextEntry);
        Object.assign(nextEntry, appendReadingActivity(nextEntry, initialReadingPercent, Date.now()));
      }
      if (isMovieTracker) {
        nextEntry.imdbID = selectedImdbId;
        nextEntry.posterUrl = selectedPosterUrl;
      }
      entries.push(nextEntry);
    }
    saveEntries(entries);
    clearForm();
    renderEntries();
  };

  if (entryDateInput && !entryDateInput.value) {
    entryDateInput.value = getTodayDateInputValue();
  }

  renderEntries();
  document.addEventListener("simpletrackers:sync-data-updated", () => {
    if (editingIdx >= 0) return;
    renderEntries();
  });
  taskFilterInput?.addEventListener("change", renderEntries);
  taskSortInput?.addEventListener("change", renderEntries);
  if (deleteCancelButton && !deleteCancelButton.dataset.bound) {
    deleteCancelButton.dataset.bound = "1";
    deleteCancelButton.addEventListener("click", () => closeDeleteModal(false));
  }
  if (deleteConfirmButton && !deleteConfirmButton.dataset.bound) {
    deleteConfirmButton.dataset.bound = "1";
    deleteConfirmButton.addEventListener("click", () => closeDeleteModal(true));
  }
  if (deleteModal && !deleteModal.dataset.bound) {
    deleteModal.dataset.bound = "1";
    deleteModal.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("[data-action=\"close-delete-modal\"]")) {
        closeDeleteModal(false);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !deleteModal.classList.contains("hidden")) {
        closeDeleteModal(false);
      }
    });
  }
  if (listScrollContainer && !listScrollContainer.dataset.boundInfinite) {
    listScrollContainer.dataset.boundInfinite = "1";
    listScrollContainer.addEventListener("scroll", () => {
      const total = Number(list.dataset.totalCount || 0);
      const visible = Number(list.dataset.visibleCount || 0);
      if (!Number.isFinite(total) || !Number.isFinite(visible) || visible >= total) return;
      const remaining = listScrollContainer.scrollHeight - (listScrollContainer.scrollTop + listScrollContainer.clientHeight);
      if (remaining > 140) return;
      visibleEntriesCount = visible + LIST_PAGE_SIZE;
      renderEntries(false);
    });
  }
  if (readingListFilterRoot && !readingListFilterRoot.dataset.bound) {
    readingListFilterRoot.dataset.bound = "1";
    const syncReadingListFilterButtons = () => {
      const buttons = readingListFilterRoot.querySelectorAll("[data-filter]");
      buttons.forEach((candidate) => {
        const isActive = candidate.getAttribute("data-filter") === selectedReadingListFilter;
        candidate.classList.toggle("is-active", isActive);
        candidate.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    };
    syncReadingListFilterButtons();
    readingListFilterRoot.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      const nextFilter = String(button.getAttribute("data-filter") || "all");
      if (nextFilter === selectedReadingListFilter) return;
      selectedReadingListFilter = nextFilter;
      syncReadingListFilterButtons();
      renderEntries();
    });
  }
}
