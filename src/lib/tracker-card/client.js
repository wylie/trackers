import { formatDurationLabel, totalMinutesFromParts, getIntValue, getFloatValue, formatMetadataChips } from './common.js';
import { createEntryId, ensureEntryIdentity } from './ids.js';
import { parseSleepDuration, formatSleepDuration, getSleepGrade } from './sleep.js';
import { formatGameHours, normalizeGameKey, createGameSession, getGameSessionHistory, getLatestGameSession, sumGameSessionHours } from './game.js';
import { getWorkoutDurationParts, formatWorkoutMetricBadges, formatWorkoutWeatherSummary, getWorkoutWeatherLabel, syncWorkoutMetricsUI as syncWorkoutMetricsUIHelper } from './workout.js';
import { getAudiobookLeftMinutes, formatProgressValue, getReadingCoverUrl, getFallbackMediaUrl, isPlaceholderCoverUrl } from './reading.js';
import { getMoviePosterUrl, getVideoGameCoverUrl } from './media.js';
import { getTodayDateInputValue, toDateInputValue, buildEntryDateIso, formatSimpleDate } from './dates.js';
import { getAllEntries, getEntries as getEntriesFromStore, saveEntries as saveEntriesToStore } from './storage.js';
import { getSleepGoalSettings as resolveSleepGoalSettings, saveSleepGoalSettings as persistSleepGoalSettings } from './sleep-goals.js';
import { getWaterGoalSettings as resolveWaterGoalSettings, saveWaterGoalSettings as persistWaterGoalSettings } from './water-goals.js';
import { getReadingGoalSettings as resolveReadingGoalSettings, saveReadingGoalSettings as persistReadingGoalSettings } from './reading-goals.js';
import { initItemAutocomplete } from './autocomplete.js';
import { renderStaticStars, initRatingInput } from './rating-ui.js';

export function initTrackerCard(config) {
  const {
    storageKey,
    addLabel,
    enableOmdbAutocomplete,
    omdbApiKey,
    googleBooksApiKey,
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
    isCustomTracker,
    isFinanceTracker,
    isMealTracker,
    isWaterTracker,
    isHealthTracker,
    readingSettingsKey,
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
  const sleepGoalCompact = document.getElementById("tracker-sleep-goal-compact");
  const sleepGoalCompactText = document.getElementById("tracker-sleep-goal-compact-text");
  const sleepGoalEditButton = document.getElementById("tracker-sleep-goal-edit");
  const sleepGoalEditor = document.getElementById("tracker-sleep-goal-editor");
  const waterGoalOuncesLabel = document.getElementById("tracker-goal-ounces-label");
  const waterGoalOuncesInput = document.getElementById("tracker-goal-ounces");
  const waterVolumeUnitInput = document.getElementById("tracker-water-volume-unit");
  const waterGoalSaveButton = document.getElementById("tracker-save-goal-ounces");
  const waterGoalSummary = document.getElementById("tracker-water-goal-summary");
  const waterGoalMessage = document.getElementById("tracker-water-goal-message");
  const waterGoalCompact = document.getElementById("tracker-water-goal-compact");
  const waterGoalCompactText = document.getElementById("tracker-water-goal-compact-text");
  const waterGoalEditButton = document.getElementById("tracker-water-goal-edit");
  const waterGoalEditor = document.getElementById("tracker-water-goal-editor");
  const readingGoalMinutesInput = document.getElementById("tracker-reading-goal-minutes");
  const readingGoalPagesInput = document.getElementById("tracker-reading-goal-pages");
  const readingGoalMinutesField = document.getElementById("tracker-reading-goal-minutes-field");
  const readingGoalPagesField = document.getElementById("tracker-reading-goal-pages-field");
  const readingGoalSaveButton = document.getElementById("tracker-save-reading-goal");
  const readingGoalSummary = document.getElementById("tracker-reading-goal-summary");
  const readingGoalMessage = document.getElementById("tracker-reading-goal-message");
  const readingGoalCompact = document.getElementById("tracker-reading-goal-compact");
  const readingGoalCompactText = document.getElementById("tracker-reading-goal-compact-text");
  const readingGoalEditButton = document.getElementById("tracker-reading-goal-edit");
  const readingGoalEditor = document.getElementById("tracker-reading-goal-editor");
  const authorInput = document.getElementById("tracker-author");
  const directorInput = document.getElementById("tracker-director");
  const publisherInput = document.getElementById("tracker-publisher");
  const categoryInput = document.getElementById("tracker-category");
  const entryDateInput = document.getElementById("tracker-entry-date");
  const financeAmountInput = document.getElementById("tracker-finance-amount");
  const healthMetricTypeInput = document.getElementById("tracker-health-metric-type");
  const healthMetricValueInput = document.getElementById("tracker-health-metric-value");
  const healthUnitInput = document.getElementById("tracker-health-unit");
  const healthTimeInput = document.getElementById("tracker-health-time");
  const healthSeverityInput = document.getElementById("tracker-health-severity");
  const healthStatusInput = document.getElementById("tracker-health-status");
  const healthMedicationInput = document.getElementById("tracker-health-medication");
  const healthProviderInput = document.getElementById("tracker-health-provider");
  const healthTagsInput = document.getElementById("tracker-health-tags");
  const mealTypeInput = document.getElementById("tracker-meal-type");
  const mealTimeInput = document.getElementById("tracker-meal-time");
  const mealCaloriesInput = document.getElementById("tracker-meal-calories");
  const mealProteinInput = document.getElementById("tracker-meal-protein");
  const mealCarbsInput = document.getElementById("tracker-meal-carbs");
  const mealFatInput = document.getElementById("tracker-meal-fat");
  const mealServingsInput = document.getElementById("tracker-meal-servings");
  const mealLocationInput = document.getElementById("tracker-meal-location");
  const mealTagsInput = document.getElementById("tracker-meal-tags");
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
  const workoutWeatherEnabledInput = document.getElementById("tracker-workout-weather-enabled");
  const workoutWeatherStatus = document.getElementById("tracker-workout-weather-status");
  const sessionDurationHoursInput = document.getElementById("tracker-session-duration-hours");
  const sessionDurationMinutesInput = document.getElementById("tracker-session-duration-minutes");
  const sessionDurationSecondsInput = document.getElementById("tracker-session-duration-seconds");
  const waterOuncesInput = document.getElementById("tracker-water-ounces");
  const waterOuncesLabel = document.getElementById("tracker-water-ounces-label");
  const waterDrinkTypeInput = document.getElementById("tracker-water-drink-type");
  const waterQuickAddContainer = document.getElementById("tracker-water-quick-add");
  const waterCustomNameWrap = document.getElementById("tracker-water-custom-name-wrap");
  const waterCustomNameInput = document.getElementById("tracker-water-custom-name");
  const waterCustomImpactWrap = document.getElementById("tracker-water-custom-impact-wrap");
  const waterCustomImpactInput = document.getElementById("tracker-water-custom-impact");
  const startedDateInput = document.getElementById("tracker-started-date");
  const finishedDateInput = document.getElementById("tracker-finished-date");
  const readingSessionMinutesInput = document.getElementById("tracker-reading-session-minutes");
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
  const readingIsbnInput = document.getElementById("tracker-isbn");
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
  const customTypeInput = document.getElementById("tracker-custom-type");
  const customStatusInput = document.getElementById("tracker-custom-status");
  const customValueInput = document.getElementById("tracker-custom-value");
  const customUnitInput = document.getElementById("tracker-custom-unit");
  const customDueDateInput = document.getElementById("tracker-custom-due-date");
  const customTagsInput = document.getElementById("tracker-custom-tags");
  const readingListFilterRoot = document.getElementById("tracker-reading-list-filter");
  const itemSuggestions = document.getElementById("tracker-item-suggestions");
  const itemSuggestionsList = document.getElementById("tracker-item-suggestions-list");
  if (!form || !list || !notesInput) return;
  const ratingController = initRatingInput({ container: ratingStarsElement, input: ratingInput });

  let editingIdx = -1;
  let goalMessageTimer = null;
  let waterGoalMessageTimer = null;
  let readingGoalMessageTimer = null;
  let selectedCoverId = 0;
  let selectedCoverEditionKey = "";
  let selectedCoverUrl = "";
  let selectedReadingIsbn13 = "";
  let selectedReadingIsbn = "";
  let isEnrichingReadingCovers = false;
  const readingCoverLookupAttemptedAt = new Map();
  const readingBrokenCoverAttemptedAt = new Map();
  const READING_COVER_RETRY_MS = 10 * 60 * 1000;
  let selectedPosterUrl = "";
  let selectedImdbId = "";
  let isEnrichingMoviePosters = false;
  let hasNormalizedReadingEntries = false;
  let hasNormalizedWaterEntries = false;
  let selectedWaterVolumeUnit = "oz";
  let selectedReadingListFilter = "all";
  let visibleEntriesCount = 0;
  let workoutWeatherRequestId = 0;
  let resolveDeletePrompt = null;
  let resolveSessionEditPrompt = null;
  let resolveNoteEditPrompt = null;
  let resolveReadingSessionEditPrompt = null;
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

  function getGameSessionTimestamp(rawValue) {
    const parsed = new Date(String(rawValue || "")).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function sortGameSessionsNewest(history) {
    return [...(Array.isArray(history) ? history : [])].sort((a, b) => {
      return getGameSessionTimestamp(b?.playedAt) - getGameSessionTimestamp(a?.playedAt);
    });
  }

  function updateLatestGameSession(history, nextSession) {
    const sessions = [...(Array.isArray(history) ? history : [])];
    if (!sessions.length) return [nextSession];
    let latestIdx = 0;
    let latestTs = getGameSessionTimestamp(sessions[0]?.playedAt);
    for (let idx = 1; idx < sessions.length; idx += 1) {
      const sessionTs = getGameSessionTimestamp(sessions[idx]?.playedAt);
      if (sessionTs >= latestTs) {
        latestIdx = idx;
        latestTs = sessionTs;
      }
    }
    sessions[latestIdx] = nextSession;
    return sessions;
  }

  function hydrateVideoGameSessionNotes(entry, history) {
    const sortedSessions = sortGameSessionsNewest(history).map((session) => ({
      ...session,
      note: String(session?.note || "").trim()
    }));
    if (!sortedSessions.length) return sortedSessions;
    const legacyNotes = [...getEntryNotesHistory(entry)]
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((item) => String(item?.note || "").trim());
    if (!legacyNotes.length) return sortedSessions;

    const dayKeyForTimestamp = (timestamp) => {
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) return "";
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    };
    const sessionTimestamp = (session) => {
      const parsed = new Date(String(session?.playedAt || "")).getTime();
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const notesAlreadyPresent = new Set(
      sortedSessions
        .map((session) => String(session?.note || "").trim())
        .filter(Boolean)
    );
    const nextSessions = [...sortedSessions];
    const availableSessionIdx = nextSessions
      .map((session, idx) => ({ session, idx }))
      .filter(({ session }) => !String(session?.note || "").trim())
      .map(({ idx }) => idx);

    legacyNotes.forEach((legacy) => {
      const legacyNote = String(legacy?.note || "").trim();
      if (!legacyNote || notesAlreadyPresent.has(legacyNote) || !availableSessionIdx.length) return;
      const targetDay = dayKeyForTimestamp(Number(legacy?.createdAt) || 0);
      const sameDayCandidates = availableSessionIdx.filter((idx) => {
        const ts = sessionTimestamp(nextSessions[idx]);
        return targetDay && dayKeyForTimestamp(ts) === targetDay;
      });
      const candidatePool = sameDayCandidates.length ? sameDayCandidates : [...availableSessionIdx];
      let bestIdx = candidatePool[0];
      let bestDistance = Number.POSITIVE_INFINITY;
      candidatePool.forEach((idx) => {
        const ts = sessionTimestamp(nextSessions[idx]);
        const distance = Math.abs(ts - (Number(legacy?.createdAt) || 0));
        if (distance < bestDistance) {
          bestIdx = idx;
          bestDistance = distance;
        }
      });
      nextSessions[bestIdx] = {
        ...nextSessions[bestIdx],
        note: legacyNote
      };
      notesAlreadyPresent.add(legacyNote);
      const usedIdx = availableSessionIdx.indexOf(bestIdx);
      if (usedIdx >= 0) availableSessionIdx.splice(usedIdx, 1);
    });

    return nextSessions;
  }

  function normalizeVideoGameEntryFromHistory(entry, history) {
    const nextHistory = Array.isArray(history) ? history : [];
    const latestSession = getLatestGameSession(nextHistory);
    return {
      ...entry,
      gameSessionHistory: nextHistory,
      sessionHours: Math.max(0, Number(latestSession?.hours) || 0),
      lastSessionHours: Math.max(0, Number(latestSession?.hours) || 0),
      totalHours: Math.max(0, sumGameSessionHours(nextHistory)),
      date: latestSession?.playedAt || entry?.date || new Date().toISOString(),
      notes: "",
      notesHistory: [],
      updatedAt: Date.now()
    };
  }

  function formatGameSessionDateLabel(rawDate) {
    const parsed = new Date(String(rawDate || ""));
    if (Number.isNaN(parsed.getTime())) return "Unknown date";
    return parsed.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function getVideoGameSessionRows(entry) {
    const hydratedSessions = hydrateVideoGameSessionNotes(entry, getGameSessionHistory(entry));
    const withSourceIndex = hydratedSessions.map((session, sourceIdx) => ({ ...session, sourceIdx }));
    const sorted = sortGameSessionsNewest(withSourceIndex);
    const datedSessions = sorted.filter((session) => Boolean(String(session?.playedAt || "").trim()));
    const visibleSessions = (datedSessions.length ? datedSessions : sorted).slice(0, 5);
    return {
      hydratedSessions,
      visibleSessions
    };
  }

  function renderVideoGameSessionHistoryHtml(entry, entryIdx) {
    const { visibleSessions } = getVideoGameSessionRows(entry);
    const sessions = visibleSessions;
    const headerActions = `
      <button class="inline-flex items-center gap-1 text-[12px] font-medium text-green-700 hover:text-green-800" aria-label="Add video game session" data-action="add-session" data-idx="${entryIdx}">
        <span>add session</span>
        <span class="material-symbols-outlined leading-none" style="font-size:16px;font-variation-settings:'opsz' 20;" aria-hidden="true">add_circle</span>
      </button>
    `;
    if (!sessions.length) {
      return `<div class="mt-2"><div class="flex items-center justify-between gap-2 mb-1"><div class="text-sm text-gray-700">Sessions (0)</div>${headerActions}</div></div>`;
    }
    const rows = sessions.map((session) => {
      const dateLabel = formatGameSessionDateLabel(session?.playedAt);
      const hoursLabel = formatGameHours(session?.hours);
      const noteText = String(session?.note || "").trim();
      const sessionActions = `
        <div class="flex items-center gap-1">
          <button class="p-1 rounded text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center" aria-label="Edit session" data-action="edit-session" data-idx="${entryIdx}" data-session-idx="${session.sourceIdx}"><span class="material-symbols-outlined leading-none" style="font-size:15px;font-variation-settings:'opsz' 20;" aria-hidden="true">edit</span></button>
          <button class="p-1 rounded text-red-600 hover:bg-red-100 inline-flex items-center justify-center" aria-label="Delete session" data-action="delete-session" data-idx="${entryIdx}" data-session-idx="${session.sourceIdx}"><span class="material-symbols-outlined leading-none" style="font-size:15px;font-variation-settings:'opsz' 20;" aria-hidden="true">delete</span></button>
        </div>
      `;
      const noteHtml = noteText
        ? `<div class="mt-1.5"><div class="text-xs font-medium text-gray-500">Note</div><div class="text-sm text-gray-700 leading-relaxed">${escapeHtml(noteText).replace(/\n/g, "<br />")}</div></div>`
        : "";
      return `<div class="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5"><div class="flex items-start justify-between gap-2"><div class="text-sm text-gray-500">${escapeHtml(dateLabel)}</div>${sessionActions}</div><div class="text-sm text-gray-700">Hours played: ${escapeHtml(hoursLabel)}</div>${noteHtml}</div>`;
    }).join("");
    return `
      <div class="mt-2">
        <div class="flex items-center justify-between gap-2 mb-1"><div class="text-sm text-gray-700">Sessions (${sessions.length})</div>${headerActions}</div>
        <div class="space-y-2 max-h-56 overflow-y-auto pr-1">${rows}</div>
      </div>
    `;
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

  function normalizeDateInputValue(rawValue) {
    const value = String(rawValue || "").trim();
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return "";
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!year || !month || !day) return "";
    const parsed = new Date(year, month - 1, day);
    if (Number.isNaN(parsed.getTime())) return "";
    if (parsed.getFullYear() !== year || (parsed.getMonth() + 1) !== month || parsed.getDate() !== day) return "";
    return value;
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

  function withNotesHistory(entry, nextHistory) {
    const history = [...(Array.isArray(nextHistory) ? nextHistory : [])]
      .map((item) => ({
        note: String(item?.note || "").trim(),
        createdAt: normalizeNoteTimestamp(item?.createdAt, entry?.date || "")
      }))
      .filter((item) => item.note)
      .sort((a, b) => a.createdAt - b.createdAt);
    return {
      ...entry,
      notesHistory: history,
      notes: history[history.length - 1]?.note || "",
      updatedAt: Date.now()
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

  function renderNotesHtml(entry, entryIdx) {
    const history = getEntryNotesHistory(entry);
    if (!history.length) {
      const fallback = String(entry?.notes || "").trim();
      return fallback ? `<div class=\"text-gray-700 text-sm leading-relaxed\">${escapeHtml(fallback).replace(/\n/g, "<br />")}</div>` : "";
    }
    const indexedHistory = history.map((item, sourceIdx) => ({ ...item, sourceIdx }));
    const state = getNotesViewState(entry);
    const filtered = filterNotesByRange(indexedHistory, state.range);
    const sorted = [...filtered].sort((a, b) => state.sort === "oldest" ? (a.createdAt - b.createdAt) : (b.createdAt - a.createdAt));
    const rows = sorted
      .map((item) => `
        <div class="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
          <div class="flex items-start justify-between gap-2">
            <div class="text-[11px] text-gray-500">${formatNoteTimestamp(item.createdAt)}</div>
            <div class="flex items-center gap-1">
              <button class="p-1 bg-gray-200 rounded hover:bg-gray-300 text-gray-700 inline-flex items-center justify-center" aria-label="Edit note" data-action="edit-note" data-idx="${entryIdx}" data-note-idx="${item.sourceIdx}"><span class="material-symbols-outlined leading-none" style="font-size:16px;font-variation-settings:'opsz' 20;" aria-hidden="true">edit</span></button>
              <button class="p-1 bg-gray-200 rounded hover:bg-red-100 text-red-600 inline-flex items-center justify-center" aria-label="Delete note" data-action="delete-note" data-idx="${entryIdx}" data-note-idx="${item.sourceIdx}"><span class="material-symbols-outlined leading-none" style="font-size:16px;font-variation-settings:'opsz' 20;" aria-hidden="true">delete</span></button>
            </div>
          </div>
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

  function showReadingGoalMessage(message) {
    if (!readingGoalMessage) return;
    readingGoalMessage.textContent = message;
    readingGoalMessage.classList.remove("hidden");
    clearTimeout(readingGoalMessageTimer);
    readingGoalMessageTimer = window.setTimeout(() => {
      readingGoalMessage.classList.add("hidden");
    }, 2200);
  }

  function hasPersistedSleepGoalSettings() {
    const allEntries = getAllEntries();
    const settings = allEntries?.[sleepSettingsKey];
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) return false;
    const goalHours = Math.max(0, Number(settings.goalHours) || 0);
    const goalMinutes = Math.max(0, Number(settings.goalMinutes) || 0);
    return (goalHours * 60) + goalMinutes > 0;
  }

  function hasPersistedWaterGoalSettings() {
    const allEntries = getAllEntries();
    const settings = allEntries?.[waterSettingsKey];
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) return false;
    const goalOunces = Math.max(0, Number(settings.goalOunces) || 0);
    return goalOunces > 0;
  }

  function hasPersistedReadingGoalSettings() {
    const allEntries = getAllEntries();
    const settings = allEntries?.[readingSettingsKey];
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) return false;
    const dailyGoalMinutes = Math.max(0, Number(settings.dailyGoalMinutes) || 0);
    const dailyGoalPages = Math.max(0, Number(settings.dailyGoalPages) || 0);
    return dailyGoalMinutes > 0 || dailyGoalPages > 0;
  }

  function setSleepGoalCollapsed(collapsed) {
    if (!sleepGoalCompact || !sleepGoalEditor) return;
    sleepGoalCompact.classList.toggle("hidden", !collapsed);
    sleepGoalEditor.classList.toggle("hidden", collapsed);
  }

  function setWaterGoalCollapsed(collapsed) {
    if (!waterGoalCompact || !waterGoalEditor) return;
    waterGoalCompact.classList.toggle("hidden", !collapsed);
    waterGoalEditor.classList.toggle("hidden", collapsed);
  }

  function setReadingGoalCollapsed(collapsed) {
    if (!readingGoalCompact || !readingGoalEditor) return;
    readingGoalCompact.classList.toggle("hidden", !collapsed);
    readingGoalEditor.classList.toggle("hidden", collapsed);
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

  function setSessionEditModalOpen(modal, open) {
    if (!modal) return;
    modal.classList.toggle("hidden", !open);
    modal.classList.toggle("flex", open);
  }

  function ensureSessionEditModal() {
    let modal = document.getElementById("tracker-session-edit-modal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "tracker-session-edit-modal";
    modal.className = "fixed inset-0 z-[80] hidden items-center justify-center bg-black/35 px-4";
    modal.innerHTML = `
      <div class="w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-200 p-4">
        <h3 class="text-base font-semibold text-gray-800 mb-3">Edit Session</h3>
        <label class="block text-sm text-gray-600 mb-1" for="tracker-session-edit-date">Date</label>
        <input id="tracker-session-edit-date" type="date" class="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3" />
        <label class="block text-sm text-gray-600 mb-1">Duration (h:m:s)</label>
        <div class="grid grid-cols-3 gap-2 mb-3">
          <input id="tracker-session-edit-hours" type="number" min="0" step="1" placeholder="h" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
          <input id="tracker-session-edit-minutes" type="number" min="0" max="59" step="1" placeholder="m" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
          <input id="tracker-session-edit-seconds" type="number" min="0" max="59" step="1" placeholder="s" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <label class="block text-sm text-gray-600 mb-1" for="tracker-session-edit-note">Note (optional)</label>
        <textarea id="tracker-session-edit-note" rows="3" class="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4"></textarea>
        <div class="flex items-center justify-end gap-2">
          <button type="button" id="tracker-session-edit-cancel" class="px-3 py-1.5 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
          <button type="button" id="tracker-session-edit-save" class="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const cancelButton = modal.querySelector("#tracker-session-edit-cancel");
    const saveButton = modal.querySelector("#tracker-session-edit-save");
    cancelButton?.addEventListener("click", () => {
      setSessionEditModalOpen(modal, false);
      if (typeof resolveSessionEditPrompt === "function") {
        resolveSessionEditPrompt(null);
        resolveSessionEditPrompt = null;
      }
    });
    saveButton?.addEventListener("click", () => {
      const dateInput = modal?.querySelector("#tracker-session-edit-date");
      const hoursInput = modal?.querySelector("#tracker-session-edit-hours");
      const minutesInput = modal?.querySelector("#tracker-session-edit-minutes");
      const secondsInput = modal?.querySelector("#tracker-session-edit-seconds");
      const noteInput = modal?.querySelector("#tracker-session-edit-note");
      const dateValue = String(dateInput?.value || "").trim();
      const hoursPart = Math.max(0, Number(hoursInput?.value) || 0);
      const minutesPart = Math.max(0, Math.min(59, Number(minutesInput?.value) || 0));
      const secondsPart = Math.max(0, Math.min(59, Number(secondsInput?.value) || 0));
      const totalSeconds = Math.round(hoursPart * 3600) + Math.round(minutesPart * 60) + Math.round(secondsPart);
      const hoursValue = totalSeconds / 3600;
      const noteValue = String(noteInput?.value || "").trim();
      if (!dateValue) {
        window.alert("Please enter a valid date.");
        return;
      }
      if (!(hoursValue > 0)) {
        window.alert("Hours played must be greater than 0.");
        return;
      }
      setSessionEditModalOpen(modal, false);
      if (typeof resolveSessionEditPrompt === "function") {
        resolveSessionEditPrompt({
          dateInput: dateValue,
          hours: hoursValue,
          note: noteValue
        });
        resolveSessionEditPrompt = null;
      }
    });
    modal.addEventListener("click", (event) => {
      if (event.target !== modal) return;
      setSessionEditModalOpen(modal, false);
      if (typeof resolveSessionEditPrompt === "function") {
        resolveSessionEditPrompt(null);
        resolveSessionEditPrompt = null;
      }
    });
    return modal;
  }

  function requestVideoGameSessionEdit(initial) {
    const modal = ensureSessionEditModal();
    const dateInput = modal.querySelector("#tracker-session-edit-date");
    const hoursInput = modal.querySelector("#tracker-session-edit-hours");
    const minutesInput = modal.querySelector("#tracker-session-edit-minutes");
    const secondsInput = modal.querySelector("#tracker-session-edit-seconds");
    const noteInput = modal.querySelector("#tracker-session-edit-note");
    const initialTotalSeconds = Math.max(0, Math.round((Number(initial?.hours) || 0) * 3600));
    const initialHours = Math.floor(initialTotalSeconds / 3600);
    const initialMinutes = Math.floor((initialTotalSeconds % 3600) / 60);
    const initialSeconds = initialTotalSeconds % 60;
    if (dateInput) dateInput.value = String(initial?.dateInput || getTodayDateInputValue());
    if (hoursInput) hoursInput.value = initialHours ? String(initialHours) : "";
    if (minutesInput) minutesInput.value = initialMinutes ? String(initialMinutes) : "";
    if (secondsInput) secondsInput.value = initialSeconds ? String(initialSeconds) : "";
    if (noteInput) noteInput.value = String(initial?.note || "");
    setSessionEditModalOpen(modal, true);
    window.setTimeout(() => {
      dateInput?.focus();
    }, 0);
    return new Promise((resolve) => {
      resolveSessionEditPrompt = resolve;
    });
  }

  function ensureNoteEditModal() {
    let modal = document.getElementById("tracker-note-edit-modal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "tracker-note-edit-modal";
    modal.className = "fixed inset-0 z-[80] hidden items-center justify-center bg-black/35 px-4";
    modal.innerHTML = `
      <div class="w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-200 p-4">
        <h3 class="text-base font-semibold text-gray-800 mb-3">Edit Note</h3>
        <label class="block text-sm text-gray-600 mb-1" for="tracker-note-edit-value">Note</label>
        <textarea id="tracker-note-edit-value" rows="4" class="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4"></textarea>
        <div class="flex items-center justify-end gap-2">
          <button type="button" id="tracker-note-edit-cancel" class="px-3 py-1.5 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
          <button type="button" id="tracker-note-edit-save" class="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const cancelButton = modal.querySelector("#tracker-note-edit-cancel");
    const saveButton = modal.querySelector("#tracker-note-edit-save");
    cancelButton?.addEventListener("click", () => {
      setSessionEditModalOpen(modal, false);
      if (typeof resolveNoteEditPrompt === "function") {
        resolveNoteEditPrompt(null);
        resolveNoteEditPrompt = null;
      }
    });
    saveButton?.addEventListener("click", () => {
      const noteInput = modal?.querySelector("#tracker-note-edit-value");
      const noteValue = String(noteInput?.value || "").trim();
      if (!noteValue) {
        window.alert("Note cannot be empty.");
        return;
      }
      setSessionEditModalOpen(modal, false);
      if (typeof resolveNoteEditPrompt === "function") {
        resolveNoteEditPrompt(noteValue);
        resolveNoteEditPrompt = null;
      }
    });
    modal.addEventListener("click", (event) => {
      if (event.target !== modal) return;
      setSessionEditModalOpen(modal, false);
      if (typeof resolveNoteEditPrompt === "function") {
        resolveNoteEditPrompt(null);
        resolveNoteEditPrompt = null;
      }
    });
    return modal;
  }

  function requestNoteEdit(initialValue = "") {
    const modal = ensureNoteEditModal();
    const input = modal.querySelector("#tracker-note-edit-value");
    if (input) input.value = String(initialValue || "");
    setSessionEditModalOpen(modal, true);
    window.setTimeout(() => {
      input?.focus();
    }, 0);
    return new Promise((resolve) => {
      resolveNoteEditPrompt = resolve;
    });
  }

  function ensureReadingSessionEditModal() {
    let modal = document.getElementById("tracker-reading-session-edit-modal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "tracker-reading-session-edit-modal";
    modal.className = "fixed inset-0 z-[80] hidden items-center justify-center bg-black/35 px-4";
    modal.innerHTML = `
      <div class="w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-200 p-4">
        <h3 class="text-base font-semibold text-gray-800 mb-3">Edit Reading Session</h3>
        <label class="block text-sm text-gray-600 mb-1" for="tracker-reading-session-edit-date">Date</label>
        <input id="tracker-reading-session-edit-date" type="date" class="w-full border border-gray-300 rounded px-3 py-2 text-base sm:text-sm mb-3" />
        <div id="tracker-reading-session-edit-page-wrap">
          <label id="tracker-reading-session-edit-metric-label" class="block text-sm text-gray-600 mb-1" for="tracker-reading-session-edit-metric">Current Page</label>
          <input id="tracker-reading-session-edit-metric" type="number" min="0" step="1" class="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3" />
        </div>
        <div id="tracker-reading-session-edit-left-wrap" class="hidden">
          <label class="block text-sm text-gray-600 mb-1">Time Left (h:m)</label>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <input id="tracker-reading-session-edit-left-hours" type="number" min="0" step="1" placeholder="hours" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            <input id="tracker-reading-session-edit-left-minutes" type="number" min="0" max="59" step="1" placeholder="minutes" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
          </div>
        </div>
        <p id="tracker-reading-session-edit-help" class="text-xs text-gray-500 mb-3"></p>
        <label class="block text-sm text-gray-600 mb-1" for="tracker-reading-session-edit-note">Note (optional)</label>
        <textarea id="tracker-reading-session-edit-note" rows="3" class="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4"></textarea>
        <div class="flex items-center justify-end gap-2">
          <button type="button" id="tracker-reading-session-edit-cancel" class="px-3 py-1.5 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
          <button type="button" id="tracker-reading-session-edit-save" class="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const cancelButton = modal.querySelector("#tracker-reading-session-edit-cancel");
    const saveButton = modal.querySelector("#tracker-reading-session-edit-save");
    cancelButton?.addEventListener("click", () => {
      setSessionEditModalOpen(modal, false);
      if (typeof resolveReadingSessionEditPrompt === "function") {
        resolveReadingSessionEditPrompt(null);
        resolveReadingSessionEditPrompt = null;
      }
    });
    saveButton?.addEventListener("click", () => {
      const dateInput = modal?.querySelector("#tracker-reading-session-edit-date");
      const metricInput = modal?.querySelector("#tracker-reading-session-edit-metric");
      const leftHoursInput = modal?.querySelector("#tracker-reading-session-edit-left-hours");
      const leftMinutesInput = modal?.querySelector("#tracker-reading-session-edit-left-minutes");
      const noteInput = modal?.querySelector("#tracker-reading-session-edit-note");
      const mode = String(metricInput?.getAttribute("data-mode") || "pages");
      const dateValueRaw = String(dateInput?.value || "").trim();
      const dateValue = normalizeDateInputValue(dateValueRaw);
      const metricValue = Math.max(0, Number(metricInput?.value) || 0);
      const leftHours = Math.max(0, Number(leftHoursInput?.value) || 0);
      const leftMinutes = Math.max(0, Math.min(59, Number(leftMinutesInput?.value) || 0));
      const noteValue = String(noteInput?.value || "").trim();
      if (!dateValue) {
        window.alert("Please enter a valid date in YYYY-MM-DD format.");
        return;
      }
      setSessionEditModalOpen(modal, false);
      if (typeof resolveReadingSessionEditPrompt === "function") {
        resolveReadingSessionEditPrompt({
          dateInput: dateValue,
          currentPage: mode === "pages" ? metricValue : null,
          leftMinutes: mode === "left" ? ((Math.round(leftHours) * 60) + Math.round(leftMinutes)) : null,
          note: noteValue
        });
        resolveReadingSessionEditPrompt = null;
      }
    });
    modal.addEventListener("click", (event) => {
      if (event.target !== modal) return;
      setSessionEditModalOpen(modal, false);
      if (typeof resolveReadingSessionEditPrompt === "function") {
        resolveReadingSessionEditPrompt(null);
        resolveReadingSessionEditPrompt = null;
      }
    });
    return modal;
  }

  function requestReadingSessionEdit(initial) {
    const modal = ensureReadingSessionEditModal();
    const dateInput = modal.querySelector("#tracker-reading-session-edit-date");
    const pageWrap = modal.querySelector("#tracker-reading-session-edit-page-wrap");
    const leftWrap = modal.querySelector("#tracker-reading-session-edit-left-wrap");
    const metricLabel = modal.querySelector("#tracker-reading-session-edit-metric-label");
    const metricInput = modal.querySelector("#tracker-reading-session-edit-metric");
    const leftHoursInput = modal.querySelector("#tracker-reading-session-edit-left-hours");
    const leftMinutesInput = modal.querySelector("#tracker-reading-session-edit-left-minutes");
    const helpText = modal.querySelector("#tracker-reading-session-edit-help");
    const noteInput = modal.querySelector("#tracker-reading-session-edit-note");
    const isAudiobookSession = Boolean(initial?.isAudiobook);
    if (dateInput) {
      const usePlainDateInput = window.matchMedia("(max-width: 640px)").matches;
      dateInput.type = usePlainDateInput ? "text" : "date";
      dateInput.inputMode = usePlainDateInput ? "numeric" : "";
      dateInput.placeholder = usePlainDateInput ? "YYYY-MM-DD" : "";
      dateInput.value = String(initial?.dateInput || getTodayDateInputValue());
    }
    if (metricInput) {
      metricInput.value = String(initial?.currentPage ?? "");
      metricInput.setAttribute("data-mode", isAudiobookSession ? "left" : "pages");
      metricInput.step = "1";
      metricInput.placeholder = "current page";
    }
    if (metricLabel) {
      metricLabel.textContent = "Current Page";
    }
    if (pageWrap) pageWrap.classList.toggle("hidden", isAudiobookSession);
    if (leftWrap) leftWrap.classList.toggle("hidden", !isAudiobookSession);
    const initialLeftMinutes = Math.max(0, Number(initial?.leftMinutes) || 0);
    const initialLeftHours = Math.floor(initialLeftMinutes / 60);
    const initialLeftRemain = initialLeftMinutes % 60;
    if (leftHoursInput) leftHoursInput.value = initialLeftHours ? String(initialLeftHours) : "";
    if (leftMinutesInput) leftMinutesInput.value = initialLeftRemain ? String(initialLeftRemain) : "";
    if (helpText) {
      helpText.textContent = isAudiobookSession
        ? "Enter remaining time in the audiobook."
        : "Enter current page in the book.";
    }
    if (noteInput) noteInput.value = String(initial?.note || "");
    setSessionEditModalOpen(modal, true);
    window.setTimeout(() => {
      dateInput?.focus();
    }, 0);
    return new Promise((resolve) => {
      resolveReadingSessionEditPrompt = resolve;
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

  function getReadingGoalSettings(allEntries = getAllEntries()) {
    return resolveReadingGoalSettings({ allEntries, readingSettingsKey });
  }

  function saveReadingGoalSettings({ dailyGoalMinutes, dailyGoalPages }) {
    const allEntries = getAllEntries();
    persistReadingGoalSettings({
      allEntries,
      readingSettingsKey,
      dailyGoalMinutes,
      dailyGoalPages
    });
  }

  function updateSleepGoalSummary() {
    if (!isSleepTracker || !goalSummary) return;
    const goalHours = Number(goalHoursInput?.value || 0);
    const goalMinutes = Number(goalMinutesInput?.value || 0);
    const summary = `Current target: ${formatDurationLabel(goalHours, goalMinutes)}`;
    goalSummary.textContent = summary;
    if (sleepGoalCompactText) sleepGoalCompactText.textContent = summary;
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

  function getReadingSessionHistory(entry) {
    const normalizeOptionalNonNegative = (value) => {
      if (value === null || value === undefined || value === "") return null;
      const num = Number(value);
      if (!Number.isFinite(num) || num < 0) return null;
      return num;
    };
    const raw = Array.isArray(entry?.readingSessionHistory) ? entry.readingSessionHistory : [];
    const normalized = raw
      .map((item) => ({
        createdAt: normalizeNoteTimestamp(item?.createdAt, entry?.date || ""),
        minutes: Math.max(0, Number(item?.minutes) || 0),
        pagesRead: Math.max(0, Number(item?.pagesRead) || 0),
        currentPage: normalizeOptionalNonNegative(item?.currentPage),
        leftMinutes: normalizeOptionalNonNegative(item?.leftMinutes),
        note: String(item?.note || "").trim()
      }))
      .filter((item) => item.minutes > 0 || item.pagesRead > 0 || item.currentPage !== null || item.leftMinutes !== null || item.note);
    if (normalized.length) return normalized;
    const fallback = Math.max(0, Number(entry?.readingSessionMinutes) || 0);
    if (fallback > 0) {
      return [{
        createdAt: normalizeNoteTimestamp(entry?.updatedAt, entry?.date || ""),
        minutes: fallback,
        pagesRead: 0,
        currentPage: null,
        leftMinutes: null,
        note: ""
      }];
    }
    return [];
  }

  function appendReadingSession(entry, { minutes = 0, pagesRead = 0, currentPage = null, leftMinutes = null, note = "", createdAt } = {}) {
    const safeMinutes = Math.max(0, Number(minutes) || 0);
    const safePagesRead = Math.max(0, Number(pagesRead) || 0);
    const safeCurrentPage = currentPage === null || currentPage === undefined || currentPage === ""
      ? null
      : Math.max(0, Number(currentPage) || 0);
    const safeLeftMinutes = leftMinutes === null || leftMinutes === undefined || leftMinutes === ""
      ? null
      : Math.max(0, Number(leftMinutes) || 0);
    const safeNote = String(note || "").trim();
    if (safeMinutes <= 0 && safePagesRead <= 0 && safeCurrentPage === null && safeLeftMinutes === null && !safeNote) return entry;
    const history = getReadingSessionHistory(entry);
    history.push({
      createdAt: normalizeNoteTimestamp(createdAt, entry?.date || ""),
      minutes: safeMinutes,
      pagesRead: safePagesRead,
      currentPage: safeCurrentPage,
      leftMinutes: safeLeftMinutes,
      note: safeNote
    });
    return {
      ...entry,
      readingSessionMinutes: safeMinutes,
      readingSessionHistory: history.slice(-400)
    };
  }

  function getReadingDayTotalMinutes(entries, dateValue) {
    const targetDate = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
    const yyyy = targetDate.getFullYear();
    const mm = targetDate.getMonth();
    const dd = targetDate.getDate();
    return entries.reduce((sum, entry) => {
      const history = getReadingSessionHistory(entry);
      if (!history.length) return sum;
      return sum + history.reduce((entrySum, item) => {
        const when = new Date(item.createdAt);
        if (!Number.isFinite(when.getTime())) return entrySum;
        if (when.getFullYear() !== yyyy || when.getMonth() !== mm || when.getDate() !== dd) return entrySum;
        return entrySum + Math.max(0, Number(item?.minutes) || 0);
      }, 0);
    }, 0);
  }

  function getReadingActivityMetricHistory(entry) {
    const totalPages = Math.max(0, Number(entry?.totalPages) || 0);
    const rawHistory = Array.isArray(entry?.readingActivityHistory) ? entry.readingActivityHistory : [];
    return rawHistory
      .map((item) => {
        const createdAt = normalizeNoteTimestamp(item?.createdAt, entry?.date || "");
        const deltaPercent = Math.max(0, Number(item?.deltaPercent) || 0);
        if (!(deltaPercent > 0)) return null;
        if (entry?.isAudiobook) {
          const totalAudioMinutes = totalMinutesFromParts(entry?.totalHours, entry?.totalMinutes);
          const minutes = totalAudioMinutes > 0 ? Math.round((deltaPercent / 100) * totalAudioMinutes) : 0;
          return { createdAt, minutes: Math.max(0, minutes), pagesRead: 0 };
        }
        const pagesRead = totalPages > 0 ? ((deltaPercent / 100) * totalPages) : 0;
        return { createdAt, minutes: 0, pagesRead: Math.max(0, pagesRead) };
      })
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  function getReadingSessionRows(entry) {
    const sessions = hydrateReadingSessions(entry).map((session, sourceIdx) => ({
      ...session,
      sourceIdx,
      minutes: Math.max(0, Number(session?.minutes) || 0),
      pagesRead: Math.max(0, Number(session?.pagesRead) || 0),
      currentPage: session?.currentPage === null || session?.currentPage === undefined
        ? null
        : Math.max(0, Number(session?.currentPage) || 0),
      leftMinutes: session?.leftMinutes === null || session?.leftMinutes === undefined
        ? null
        : Math.max(0, Number(session?.leftMinutes) || 0),
      note: String(session?.note || "").trim(),
      createdAt: normalizeNoteTimestamp(session?.createdAt, entry?.date || "")
    }));
    const openMetricIndexes = sessions
      .map((session, idx) => ({ session, idx }))
      .filter(({ session }) => (session.minutes <= 0 && session.pagesRead <= 0 && session.currentPage === null && session.leftMinutes === null))
      .map(({ idx }) => idx);
    const activityMetrics = getReadingActivityMetricHistory(entry);
    activityMetrics.forEach((metric) => {
      if (!openMetricIndexes.length) return;
      let bestIdx = openMetricIndexes[0];
      let bestDistance = Number.POSITIVE_INFINITY;
      openMetricIndexes.forEach((idx) => {
        const distance = Math.abs((sessions[idx]?.createdAt || 0) - metric.createdAt);
        if (distance < bestDistance) {
          bestIdx = idx;
          bestDistance = distance;
        }
      });
      sessions[bestIdx] = {
        ...sessions[bestIdx],
        minutes: Math.max(0, Number(metric?.minutes) || 0),
        pagesRead: Math.max(0, Number(metric?.pagesRead) || 0)
      };
      const usedIdx = openMetricIndexes.indexOf(bestIdx);
      if (usedIdx >= 0) openMetricIndexes.splice(usedIdx, 1);
    });
    const sorted = [...sessions].sort((a, b) => b.createdAt - a.createdAt);
    return {
      hydratedSessions: sessions,
      visibleSessions: sorted.slice(0, 5)
    };
  }

  function applyReadingEntryProgressFromSessions(entry) {
    const sessionRows = getReadingSessionRows(entry);
    const sortedSessions = [...sessionRows.hydratedSessions].sort((a, b) => {
      return normalizeNoteTimestamp(b?.createdAt, entry?.date || "") - normalizeNoteTimestamp(a?.createdAt, entry?.date || "");
    });
    if (entry?.isAudiobook) {
      const latestWithLeft = sortedSessions.find((session) => session?.leftMinutes !== null && session?.leftMinutes !== undefined);
      if (!latestWithLeft) return entry;
      const totalAudioMinutes = totalMinutesFromParts(entry?.totalHours, entry?.totalMinutes);
      const requestedLeftMinutes = Math.max(0, Number(latestWithLeft?.leftMinutes) || 0);
      const normalizedLeftMinutes = totalAudioMinutes > 0
        ? Math.min(totalAudioMinutes, requestedLeftMinutes)
        : requestedLeftMinutes;
      const listenedAudioMinutes = totalAudioMinutes > 0
        ? Math.max(0, totalAudioMinutes - normalizedLeftMinutes)
        : totalMinutesFromParts(entry?.currentHours, entry?.currentMinutes);
      return {
        ...entry,
        leftHours: Math.floor(normalizedLeftMinutes / 60),
        leftMinutes: normalizedLeftMinutes % 60,
        currentHours: Math.floor(listenedAudioMinutes / 60),
        currentMinutes: listenedAudioMinutes % 60
      };
    }
    const latestWithPage = sortedSessions.find((session) => session?.currentPage !== null && session?.currentPage !== undefined);
    if (!latestWithPage) return entry;
    const totalPages = Math.max(0, Number(entry?.totalPages) || 0);
    const requestedPage = Math.max(0, Number(latestWithPage?.currentPage) || 0);
    const normalizedPage = totalPages > 0 ? Math.min(totalPages, requestedPage) : requestedPage;
    return {
      ...entry,
      currentPage: normalizedPage
    };
  }

  function normalizeReadingEntryFromSessions(entry, sessions) {
    const nextSessions = [...(Array.isArray(sessions) ? sessions : [])]
      .map((session) => ({
        createdAt: normalizeNoteTimestamp(session?.createdAt, entry?.date || ""),
        minutes: Math.max(0, Number(session?.minutes) || 0),
        pagesRead: Math.max(0, Number(session?.pagesRead) || 0),
        currentPage: session?.currentPage === null || session?.currentPage === undefined || session?.currentPage === ""
          ? null
          : Math.max(0, Number(session?.currentPage) || 0),
        leftMinutes: session?.leftMinutes === null || session?.leftMinutes === undefined || session?.leftMinutes === ""
          ? null
          : Math.max(0, Number(session?.leftMinutes) || 0),
        note: String(session?.note || "").trim()
      }))
      .filter((session) => session.minutes > 0 || session.pagesRead > 0 || session.currentPage !== null || session.leftMinutes !== null || session.note)
      .sort((a, b) => a.createdAt - b.createdAt);
    const notesHistory = nextSessions
      .filter((session) => session.note)
      .map((session) => ({
        note: session.note,
        createdAt: session.createdAt
      }));
    return {
      ...entry,
      readingSessionHistory: nextSessions,
      readingSessionMinutes: Math.max(0, Number(nextSessions[nextSessions.length - 1]?.minutes) || 0),
      notes: notesHistory[notesHistory.length - 1]?.note || "",
      notesHistory,
      updatedAt: Date.now()
    };
  }

  function hydrateReadingSessions(entry) {
    const sessions = [...getReadingSessionHistory(entry)]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((session) => ({ ...session, note: String(session?.note || "").trim() }));
    const legacyNotes = [...getEntryNotesHistory(entry)]
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((item) => String(item?.note || "").trim());
    if (!sessions.length) {
      if (!legacyNotes.length) return [];
      return legacyNotes.map((item) => ({
        createdAt: normalizeNoteTimestamp(item?.createdAt, entry?.date || ""),
        minutes: 0,
        pagesRead: 0,
        currentPage: null,
        leftMinutes: null,
        note: String(item?.note || "").trim()
      }));
    }
    if (!legacyNotes.length) return sessions;
    const noteDatesUsed = new Set(
      sessions
        .filter((session) => session.note)
        .map((session) => `${session.createdAt}:${session.note}`)
    );
    const openSessionIndexes = sessions
      .map((session, idx) => ({ session, idx }))
      .filter(({ session }) => !session.note)
      .map(({ idx }) => idx);
    legacyNotes.forEach((legacy) => {
      const noteText = String(legacy?.note || "").trim();
      if (!noteText || !openSessionIndexes.length) return;
      const syntheticKey = `${Number(legacy?.createdAt) || 0}:${noteText}`;
      if (noteDatesUsed.has(syntheticKey)) return;
      let bestIdx = openSessionIndexes[0];
      let bestDistance = Number.POSITIVE_INFINITY;
      openSessionIndexes.forEach((idx) => {
        const distance = Math.abs((sessions[idx]?.createdAt || 0) - (Number(legacy?.createdAt) || 0));
        if (distance < bestDistance) {
          bestIdx = idx;
          bestDistance = distance;
        }
      });
      sessions[bestIdx] = { ...sessions[bestIdx], note: noteText };
      noteDatesUsed.add(syntheticKey);
      const usedAt = openSessionIndexes.indexOf(bestIdx);
      if (usedAt >= 0) openSessionIndexes.splice(usedAt, 1);
    });
    return sessions;
  }

  function formatReadingSessionMetric(session) {
    const leftMinutes = session?.leftMinutes === null || session?.leftMinutes === undefined
      ? null
      : Math.max(0, Number(session?.leftMinutes) || 0);
    const currentPage = session?.currentPage === null || session?.currentPage === undefined
      ? null
      : Math.max(0, Number(session?.currentPage) || 0);
    if (leftMinutes !== null) {
      return `Time left: ${formatDurationLabel(Math.floor(leftMinutes / 60), leftMinutes % 60)}`;
    }
    if (currentPage !== null) {
      const pageLabel = currentPage.toFixed(1).replace(/\.0$/, "");
      return `Current page: ${pageLabel}`;
    }
    const minutes = Math.max(0, Number(session?.minutes) || 0);
    const pagesRead = Math.max(0, Number(session?.pagesRead) || 0);
    if (minutes > 0) {
      return `Minutes listened: ${Math.round(minutes)} min`;
    }
    if (pagesRead > 0) {
      const pagesLabel = pagesRead.toFixed(1).replace(/\.0$/, "");
      return `Pages read: ${pagesLabel} pages`;
    }
    return "Session logged";
  }

  function renderReadingSessionsHtml(entry, entryIdx) {
    const { visibleSessions } = getReadingSessionRows(entry);
    const sessions = visibleSessions;
    const headerActions = `
      <button class="inline-flex items-center gap-1 text-[12px] font-medium text-green-700 hover:text-green-800" aria-label="Add reading session" data-action="add-reading-session" data-idx="${entryIdx}">
        <span>add session</span>
        <span class="material-symbols-outlined leading-none" style="font-size:16px;font-variation-settings:'opsz' 20;" aria-hidden="true">add_circle</span>
      </button>
    `;
    if (!sessions.length) {
      return `<div class="mt-2"><div class="flex items-center justify-between gap-2 mb-1"><div class="text-sm text-gray-700">Sessions (0)</div>${headerActions}</div></div>`;
    }
    const rows = sessions.map((session) => {
      const noteText = String(session?.note || "").trim();
      const metricLabel = formatReadingSessionMetric(session);
      const actionButtons = `
        <div class="flex items-center gap-1">
          <button class="p-1 rounded text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center" aria-label="Edit reading session" data-action="edit-reading-session" data-idx="${entryIdx}" data-session-idx="${session.sourceIdx}"><span class="material-symbols-outlined leading-none" style="font-size:15px;font-variation-settings:'opsz' 20;" aria-hidden="true">edit</span></button>
          <button class="p-1 rounded text-red-600 hover:bg-red-100 inline-flex items-center justify-center" aria-label="Delete reading session" data-action="delete-reading-session" data-idx="${entryIdx}" data-session-idx="${session.sourceIdx}"><span class="material-symbols-outlined leading-none" style="font-size:15px;font-variation-settings:'opsz' 20;" aria-hidden="true">delete</span></button>
        </div>
      `;
      const noteHtml = noteText
        ? `<div class="mt-1.5"><div class="text-xs font-medium text-gray-500">Note</div><div class="text-sm text-gray-700 leading-relaxed">${escapeHtml(noteText).replace(/\n/g, "<br />")}</div></div>`
        : "";
      return `<div class="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5"><div class="flex items-start justify-between gap-2"><div class="text-sm text-gray-500">${formatNoteTimestamp(session.createdAt)}</div>${actionButtons}</div><div class="text-sm text-gray-700">${escapeHtml(metricLabel)}</div>${noteHtml}</div>`;
    }).join("");
    return `<div class="mt-2"><div class="flex items-center justify-between gap-2 mb-1"><div class="text-sm text-gray-700">Sessions (${sessions.length})</div>${headerActions}</div><div class="space-y-2 max-h-56 overflow-y-auto pr-1">${rows}</div></div>`;
  }

  function getReadingDayTotalPages(entries, dateValue) {
    const targetDate = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
    const yyyy = targetDate.getFullYear();
    const mm = targetDate.getMonth();
    const dd = targetDate.getDate();
    return entries.reduce((sum, entry) => {
      if (entry?.isAudiobook) return sum;
      const totalPages = Math.max(0, Number(entry?.totalPages) || 0);
      const rawHistory = Array.isArray(entry?.readingActivityHistory) ? entry.readingActivityHistory : [];
      if (!rawHistory.length) return sum;
      const entryPages = rawHistory.reduce((entrySum, item) => {
        const when = new Date(normalizeNoteTimestamp(item?.createdAt, entry?.date || ""));
        if (!Number.isFinite(when.getTime())) return entrySum;
        if (when.getFullYear() !== yyyy || when.getMonth() !== mm || when.getDate() !== dd) return entrySum;
        const deltaPercent = Math.max(0, Number(item?.deltaPercent) || 0);
        if (deltaPercent <= 0) return entrySum;
        const deltaPages = totalPages > 0 ? ((deltaPercent / 100) * totalPages) : deltaPercent;
        return entrySum + Math.max(0, deltaPages);
      }, 0);
      return sum + entryPages;
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
    let summaryText = "";
    if (goalOunces > 0) {
      const pct = Math.min(999, Math.round((todayTotal / goalOunces) * 100));
      summaryText = `Hydration today: ${todayDisplay} / ${goalDisplay} ${unit} (${pct}%)`;
    } else {
      summaryText = `Hydration today: ${todayDisplay} ${unit}`;
    }
    waterGoalSummary.textContent = summaryText;
    if (waterGoalCompactText) waterGoalCompactText.textContent = summaryText;
  }

  function updateReadingGoalSummary() {
    if (!isReadingTracker || !readingGoalSummary) return;
    const currentDate = entryDateInput?.value || getTodayDateInputValue();
    const goalMinutes = Math.max(0, Number(readingGoalMinutesInput?.value || 0));
    const goalPages = Math.max(0, Number(readingGoalPagesInput?.value || 0));
    const todayTotalMinutes = getReadingDayTotalMinutes(getEntries(), currentDate);
    const todayPages = Math.round(getReadingDayTotalPages(getEntries(), currentDate) * 10) / 10;
    const todayPagesLabel = todayPages.toFixed(1).replace(/\.0$/, "");
    const minuteSegment = goalMinutes > 0
      ? `${todayTotalMinutes}/${goalMinutes} min (${Math.min(999, Math.round((todayTotalMinutes / goalMinutes) * 100))}%)`
      : `${todayTotalMinutes} min`;
    const pageSegment = goalPages > 0
      ? `${todayPagesLabel}/${goalPages} pages (${Math.min(999, Math.round((todayPages / goalPages) * 100))}%)`
      : `${todayPagesLabel} pages`;
    const summaryText = `Reading today: ${minuteSegment} • ${pageSegment}`;
    readingGoalSummary.textContent = summaryText;
    if (readingGoalCompactText) readingGoalCompactText.textContent = summaryText;
  }

  function getDefaultWaterDrinkByValue(value) {
    return waterDrinkOptions.find((option) => option.value === value) || null;
  }

  function normalizeDrinkLabel(value) {
    return String(value || "").trim().toLowerCase();
  }

  function parseHealthTags(tagsValue) {
    return String(tagsValue || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 24);
  }

  function parseMealTags(tagsValue) {
    return String(tagsValue || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  function parseCustomTags(tagsValue) {
    return String(tagsValue || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  function setWorkoutWeatherStatus(message, tone = "muted") {
    if (!workoutWeatherStatus) return;
    const text = String(message || "").trim();
    if (!text) {
      workoutWeatherStatus.textContent = "";
      workoutWeatherStatus.classList.add("hidden");
      workoutWeatherStatus.classList.remove("text-gray-500", "text-red-600", "text-green-700");
      return;
    }
    workoutWeatherStatus.textContent = text;
    workoutWeatherStatus.classList.remove("hidden");
    workoutWeatherStatus.classList.remove("text-gray-500", "text-red-600", "text-green-700");
    if (tone === "error") {
      workoutWeatherStatus.classList.add("text-red-600");
    } else if (tone === "success") {
      workoutWeatherStatus.classList.add("text-green-700");
    } else {
      workoutWeatherStatus.classList.add("text-gray-500");
    }
  }

  function roundNumber(value, digits = 1) {
    const safe = Number(value);
    if (!Number.isFinite(safe)) return null;
    const factor = 10 ** digits;
    return Math.round(safe * factor) / factor;
  }

  function getWorkoutWeatherHourIndex({ hourlyTimes = [], entryDateValue = "", targetHour = 12 }) {
    if (!Array.isArray(hourlyTimes) || !hourlyTimes.length) return -1;
    const normalizedDateValue = String(entryDateValue || "").trim();
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let idx = 0; idx < hourlyTimes.length; idx += 1) {
      const timeValue = String(hourlyTimes[idx] || "");
      if (!timeValue) continue;
      const dayValue = timeValue.slice(0, 10);
      if (normalizedDateValue && dayValue !== normalizedDateValue) continue;
      const hourRaw = Number(timeValue.slice(11, 13));
      if (!Number.isFinite(hourRaw)) continue;
      const distance = Math.abs(hourRaw - targetHour);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = idx;
      }
    }
    if (bestIndex >= 0) return bestIndex;
    return 0;
  }

  async function fetchOpenMeteoWorkoutWeather({ latitude, longitude, entryDateIso }) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const targetDate = new Date(entryDateIso);
    const targetHour = Number.isFinite(targetDate.getTime()) ? targetDate.getHours() : 12;
    const entryDateValue = toDateInputValue(entryDateIso);
    const todayValue = getTodayDateInputValue();
    const isFutureDate = entryDateValue > todayValue;
    const baseUrl = isFutureDate
      ? "https://api.open-meteo.com/v1/forecast"
      : "https://archive-api.open-meteo.com/v1/archive";
    const endpoint = new URL(baseUrl);
    endpoint.searchParams.set("latitude", String(lat));
    endpoint.searchParams.set("longitude", String(lon));
    endpoint.searchParams.set("start_date", entryDateValue);
    endpoint.searchParams.set("end_date", entryDateValue);
    endpoint.searchParams.set("hourly", "temperature_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code");
    endpoint.searchParams.set("temperature_unit", "fahrenheit");
    endpoint.searchParams.set("wind_speed_unit", "mph");
    endpoint.searchParams.set("precipitation_unit", "inch");
    endpoint.searchParams.set("timezone", "auto");

    const weatherRes = await fetch(endpoint.toString());
    if (!weatherRes.ok) return null;
    const weatherData = await weatherRes.json();
    const hourly = weatherData?.hourly;
    const hourlyTimes = Array.isArray(hourly?.time) ? hourly.time : [];
    if (!hourlyTimes.length) return null;
    const idx = getWorkoutWeatherHourIndex({ hourlyTimes, entryDateValue, targetHour });
    if (idx < 0) return null;

    const temperatures = Array.isArray(hourly?.temperature_2m) ? hourly.temperature_2m : [];
    const apparentTemperatures = Array.isArray(hourly?.apparent_temperature) ? hourly.apparent_temperature : [];
    const windSpeeds = Array.isArray(hourly?.wind_speed_10m) ? hourly.wind_speed_10m : [];
    const precipitations = Array.isArray(hourly?.precipitation) ? hourly.precipitation : [];
    const weatherCodes = Array.isArray(hourly?.weather_code) ? hourly.weather_code : [];
    const weatherCode = Number(weatherCodes[idx]);

    return {
      provider: "open-meteo",
      latitude: roundNumber(lat, 4),
      longitude: roundNumber(lon, 4),
      observedAtLocal: String(hourlyTimes[idx] || ""),
      temperatureF: roundNumber(temperatures[idx], 1),
      apparentTemperatureF: roundNumber(apparentTemperatures[idx], 1),
      windMph: roundNumber(windSpeeds[idx], 1),
      precipitationInches: roundNumber(precipitations[idx], 2),
      weatherCode: Number.isFinite(weatherCode) ? weatherCode : null,
      weatherLabel: getWorkoutWeatherLabel(weatherCode),
      fetchedAt: new Date().toISOString()
    };
  }

  function getCurrentPositionPromise({ timeoutMs = 12000 } = {}) {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator) || !navigator.geolocation) {
        reject(new Error("geolocation_not_supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: timeoutMs,
        maximumAge: 10 * 60 * 1000
      });
    });
  }

  async function attachWeatherToWorkoutEntry({ entryId, entryDateIso }) {
    if (!isWorkoutTracker || !entryId) return;
    const requestId = ++workoutWeatherRequestId;
    try {
      setWorkoutWeatherStatus("Saved workout. Getting your location...");
      const position = await getCurrentPositionPromise();
      if (requestId !== workoutWeatherRequestId) return;
      const latitude = Number(position?.coords?.latitude);
      const longitude = Number(position?.coords?.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setWorkoutWeatherStatus("Workout saved, but location was unavailable.", "error");
        return;
      }

      setWorkoutWeatherStatus("Location captured. Fetching weather...");
      const weatherSnapshot = await fetchOpenMeteoWorkoutWeather({
        latitude,
        longitude,
        entryDateIso
      });
      if (requestId !== workoutWeatherRequestId) return;
      if (!weatherSnapshot) {
        setWorkoutWeatherStatus("Workout saved, but weather data was unavailable.", "error");
        return;
      }

      const entries = getEntries();
      const targetIdx = entries.findIndex((entry) => String(entry?.id || "") === String(entryId));
      if (targetIdx < 0) return;
      const updatedEntry = {
        ...ensureEntryIdentity(entries[targetIdx]),
        workoutWeather: weatherSnapshot,
        updatedAt: Date.now()
      };
      entries[targetIdx] = updatedEntry;
      saveEntries(entries);
      renderEntries(false, true);
      setWorkoutWeatherStatus("Weather added to this workout.", "success");
    } catch (error) {
      if (requestId !== workoutWeatherRequestId) return;
      const code = Number(error?.code);
      if (code === 1) {
        setWorkoutWeatherStatus("Workout saved. Location permission was denied, so weather was skipped.", "error");
      } else if (code === 2) {
        setWorkoutWeatherStatus("Workout saved. Could not determine location, so weather was skipped.", "error");
      } else if (code === 3) {
        setWorkoutWeatherStatus("Workout saved. Location request timed out, so weather was skipped.", "error");
      } else {
        setWorkoutWeatherStatus("Workout saved. Weather lookup failed.", "error");
      }
    }
  }

  function normalizeReadingIsbn(value) {
    return String(value || "").replace(/[^0-9Xx]/g, "").toUpperCase();
  }

  function normalizeReadingText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[\W_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function toHttps(value) {
    const input = String(value || "").trim();
    if (!input) return "";
    if (input.startsWith("http://")) return `https://${input.slice(7)}`;
    return input;
  }

  function resolveReadingIsbnPair(rawValue = "") {
    const normalized = normalizeReadingIsbn(rawValue);
    if (!normalized) return { isbn13: "", isbn: "" };
    if (normalized.length === 13) return { isbn13: normalized, isbn: normalized };
    if (normalized.length === 10) return { isbn13: "", isbn: normalized };
    return { isbn13: "", isbn: normalized };
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

  function parseGoogleBookMatch(item) {
    const info = item && typeof item.volumeInfo === "object" ? item.volumeInfo : {};
    const identifiers = Array.isArray(info?.industryIdentifiers) ? info.industryIdentifiers : [];
    const isbn13 = normalizeReadingIsbn(
      identifiers.find((row) => String(row?.type || "").toUpperCase() === "ISBN_13")?.identifier || ""
    );
    const isbn10 = normalizeReadingIsbn(
      identifiers.find((row) => String(row?.type || "").toUpperCase() === "ISBN_10")?.identifier || ""
    );
    const imageLinks = info && typeof info?.imageLinks === "object" ? info.imageLinks : {};
    const coverUrl = toHttps(
      imageLinks?.extraLarge
      || imageLinks?.large
      || imageLinks?.medium
      || imageLinks?.small
      || imageLinks?.thumbnail
      || imageLinks?.smallThumbnail
      || ""
    );
    return {
      title: String(info?.title || "").trim(),
      author: Array.isArray(info?.authors) ? String(info.authors[0] || "").trim() : "",
      coverUrl,
      isbn13,
      isbn: isbn13 || isbn10
    };
  }

  function scoreGoogleBookMatch(item, target) {
    const itemTitle = normalizeReadingText(item?.title || "");
    const itemAuthor = normalizeReadingText(item?.author || "");
    let score = 0;
    if (target?.isbn) {
      if (item?.isbn13 === target.isbn || item?.isbn === target.isbn) score += 4000;
    }
    if (target?.title && itemTitle) {
      if (itemTitle === target.title) score += 1000;
      else if (itemTitle.startsWith(target.title) || target.title.startsWith(itemTitle)) score += 650;
      else if (itemTitle.includes(target.title) || target.title.includes(itemTitle)) score += 300;
    }
    if (target?.author && itemAuthor) {
      if (itemAuthor === target.author) score += 650;
      else if (itemAuthor.includes(target.author) || target.author.includes(itemAuthor)) score += 250;
    }
    if (item?.coverUrl) score += 150;
    return score;
  }

  async function fetchGoogleSuggestionsDirect(query) {
    const apiKey = String(googleBooksApiKey || "").trim();
    if (!apiKey) return [];
    const q = String(query || "").trim();
    if (q.length < 2) return [];
    try {
      const endpoint = new URL("https://www.googleapis.com/books/v1/volumes");
      endpoint.searchParams.set("q", q);
      endpoint.searchParams.set("maxResults", "8");
      endpoint.searchParams.set("printType", "books");
      endpoint.searchParams.set("langRestrict", "en");
      endpoint.searchParams.set("key", apiKey);
      const res = await fetch(endpoint.toString());
      if (!res.ok) return [];
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      return items
        .map((item) => {
          const parsed = parseGoogleBookMatch(item);
          if (!parsed?.title) return null;
          return {
            value: parsed.title,
            author: parsed.author || "",
            coverId: 0,
            coverEditionKey: "",
            coverUrl: parsed.coverUrl || "",
            isbn13: parsed.isbn13 || "",
            isbn: parsed.isbn || parsed.isbn13 || ""
          };
        })
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  async function fetchGoogleCoverMatchDirect({ rawIsbn = "", title = "", author = "" } = {}) {
    const apiKey = String(googleBooksApiKey || "").trim();
    if (!apiKey) return null;
    const isbn = normalizeReadingIsbn(rawIsbn);
    const titleText = String(title || "").trim();
    const authorText = String(author || "").trim();
    if (!isbn && !titleText) return null;

    const target = {
      isbn,
      title: normalizeReadingText(titleText),
      author: normalizeReadingText(authorText)
    };

    async function runQuery(query) {
      const endpoint = new URL("https://www.googleapis.com/books/v1/volumes");
      endpoint.searchParams.set("q", query);
      endpoint.searchParams.set("maxResults", "8");
      endpoint.searchParams.set("printType", "books");
      endpoint.searchParams.set("langRestrict", "en");
      endpoint.searchParams.set("key", apiKey);
      const res = await fetch(endpoint.toString());
      if (!res.ok) return [];
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      return items.map(parseGoogleBookMatch);
    }

    try {
      let candidates = [];
      if (isbn) candidates = await runQuery(`isbn:${isbn}`);
      if (!candidates.length && titleText) {
        candidates = await runQuery(authorText ? `intitle:${titleText} inauthor:${authorText}` : `intitle:${titleText}`);
      }
      if (!candidates.length) return null;
      const best = candidates
        .map((item) => ({ item, score: scoreGoogleBookMatch(item, target) }))
        .sort((a, b) => b.score - a.score)[0];
      if (!best?.item?.coverUrl) return null;
      return {
        coverUrl: String(best.item.coverUrl || "").trim(),
        isbn13: normalizeReadingIsbn(best.item.isbn13 || ""),
        isbn: normalizeReadingIsbn(best.item.isbn || "") || normalizeReadingIsbn(best.item.isbn13 || "") || isbn
      };
    } catch {
      return null;
    }
  }

  async function fetchReadingCoverMatch({ rawIsbn = "", title = "", author = "" } = {}) {
    const isbn = normalizeReadingIsbn(rawIsbn);
    const titleText = String(title || "").trim();
    const authorText = String(author || "").trim();
    if (!isbn && !titleText) return null;
    const params = new URLSearchParams();
    if (isbn) params.set("isbn", isbn);
    if (titleText) params.set("title", titleText);
    if (authorText) params.set("author", authorText);
    try {
      const res = await fetch(`/api/books/cover?${params.toString()}`);
      if (!res.ok) {
        const directFallback = await fetchGoogleCoverMatchDirect({ rawIsbn: isbn, title: titleText, author: authorText });
        return directFallback || null;
      }
      const data = await res.json();
      const match = data?.match;
      if (!match || typeof match !== "object") {
        const directFallback = await fetchGoogleCoverMatchDirect({ rawIsbn: isbn, title: titleText, author: authorText });
        return directFallback || null;
      }
      const coverUrl = String(match?.coverUrl || "").trim();
      const isbn13 = normalizeReadingIsbn(match?.isbn13 || "");
      const isbnFallback = normalizeReadingIsbn(match?.isbn || "");
      const normalizedIsbn = isbn13 || isbnFallback || isbn;
      return {
        coverUrl: coverUrl || "",
        isbn13,
        isbn: normalizedIsbn || ""
      };
    } catch {
      const directFallback = await fetchGoogleCoverMatchDirect({ rawIsbn: isbn, title: titleText, author: authorText });
      return directFallback || null;
    }
  }

  function getReadingCoverLookupKey(entry, idx) {
    const explicitId = String(entry?.id || entry?.entryId || "").trim();
    if (explicitId) return explicitId;
    const title = String(entry?.item || "").trim().toLowerCase();
    const author = String(entry?.author || "").trim().toLowerCase();
    const isbn = normalizeReadingIsbn(entry?.isbn13 || entry?.isbn || "");
    return `${idx}:${title}:${author}:${isbn}`;
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
    if (financeAmountInput) financeAmountInput.value = "";
    if (healthMetricTypeInput) healthMetricTypeInput.value = "";
    if (healthMetricValueInput) healthMetricValueInput.value = "";
    if (healthUnitInput) healthUnitInput.value = "";
    if (healthTimeInput) healthTimeInput.value = "";
    if (healthSeverityInput) healthSeverityInput.value = "";
    if (healthStatusInput) healthStatusInput.value = "";
    if (healthMedicationInput) healthMedicationInput.value = "";
    if (healthProviderInput) healthProviderInput.value = "";
    if (healthTagsInput) healthTagsInput.value = "";
    if (mealTypeInput) mealTypeInput.value = "";
    if (mealTimeInput) mealTimeInput.value = "";
    if (mealCaloriesInput) mealCaloriesInput.value = "";
    if (mealProteinInput) mealProteinInput.value = "";
    if (mealCarbsInput) mealCarbsInput.value = "";
    if (mealFatInput) mealFatInput.value = "";
    if (mealServingsInput) mealServingsInput.value = "";
    if (mealLocationInput) mealLocationInput.value = "";
    if (mealTagsInput) mealTagsInput.value = "";
    if (customTypeInput) customTypeInput.value = "";
    if (customStatusInput) customStatusInput.value = "";
    if (customValueInput) customValueInput.value = "";
    if (customUnitInput) customUnitInput.value = "";
    if (customDueDateInput) customDueDateInput.value = "";
    if (customTagsInput) customTagsInput.value = "";
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
    if (workoutWeatherEnabledInput) workoutWeatherEnabledInput.checked = false;
    setWorkoutWeatherStatus("");
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
    if (readingSessionMinutesInput) readingSessionMinutesInput.value = "";
    if (dueDateInput) dueDateInput.value = "";
    selectedCoverId = 0;
    selectedCoverEditionKey = "";
    selectedCoverUrl = "";
    selectedReadingIsbn13 = "";
    selectedReadingIsbn = "";
    selectedPosterUrl = "";
    selectedImdbId = "";
    if (readingIsbnInput) readingIsbnInput.value = "";
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
    if (financeAmountInput) {
      const financeAmount = Math.max(0, Number(entry?.financeAmount) || 0);
      financeAmountInput.value = financeAmount > 0 ? financeAmount.toFixed(2).replace(/\.00$/, "") : "";
    }
    if (healthMetricTypeInput) healthMetricTypeInput.value = String(entry?.healthMetricType || "").trim();
    if (healthMetricValueInput) healthMetricValueInput.value = String(entry?.healthMetricValue || "").trim();
    if (healthUnitInput) healthUnitInput.value = String(entry?.healthUnit || "").trim();
    if (healthTimeInput) healthTimeInput.value = String(entry?.healthTime || "").trim();
    if (healthSeverityInput) healthSeverityInput.value = entry?.healthSeverity != null && entry?.healthSeverity !== "" ? String(entry.healthSeverity) : "";
    if (healthStatusInput) healthStatusInput.value = String(entry?.healthStatus || "").trim();
    if (healthMedicationInput) healthMedicationInput.value = String(entry?.healthMedication || "").trim();
    if (healthProviderInput) healthProviderInput.value = String(entry?.healthProvider || "").trim();
    if (healthTagsInput) {
      const tags = Array.isArray(entry?.healthTags) ? entry.healthTags : [];
      healthTagsInput.value = tags.join(", ");
    }
    if (mealTypeInput) mealTypeInput.value = String(entry?.mealType || "").trim();
    if (mealTimeInput) mealTimeInput.value = String(entry?.mealTime || "").trim();
    if (mealCaloriesInput) {
      const mealCalories = Math.max(0, Number(entry?.mealCalories) || 0);
      mealCaloriesInput.value = mealCalories > 0 ? String(Math.round(mealCalories)) : "";
    }
    if (mealProteinInput) {
      const mealProtein = Math.max(0, Number(entry?.mealProteinGrams) || 0);
      mealProteinInput.value = mealProtein > 0 ? String(mealProtein) : "";
    }
    if (mealCarbsInput) {
      const mealCarbs = Math.max(0, Number(entry?.mealCarbsGrams) || 0);
      mealCarbsInput.value = mealCarbs > 0 ? String(mealCarbs) : "";
    }
    if (mealFatInput) {
      const mealFat = Math.max(0, Number(entry?.mealFatGrams) || 0);
      mealFatInput.value = mealFat > 0 ? String(mealFat) : "";
    }
    if (mealServingsInput) mealServingsInput.value = String(entry?.mealServings || "").trim();
    if (mealLocationInput) mealLocationInput.value = String(entry?.mealLocation || "").trim();
    if (mealTagsInput) {
      const mealTags = Array.isArray(entry?.mealTags) ? entry.mealTags : [];
      mealTagsInput.value = mealTags.join(", ");
    }
    if (customTypeInput) customTypeInput.value = String(entry?.customType || "").trim();
    if (customStatusInput) customStatusInput.value = String(entry?.customStatus || "").trim();
    if (customValueInput) customValueInput.value = String(entry?.customValue || "").trim();
    if (customUnitInput) customUnitInput.value = String(entry?.customUnit || "").trim();
    if (customDueDateInput) customDueDateInput.value = String(entry?.customDueDate || "").trim();
    if (customTagsInput) {
      const customTags = Array.isArray(entry?.customTags) ? entry.customTags : [];
      customTagsInput.value = customTags.join(", ");
    }
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
    if (workoutWeatherEnabledInput) workoutWeatherEnabledInput.checked = false;
    setWorkoutWeatherStatus("");
    const latestGameSession = getLatestGameSession(getGameSessionHistory(entry));
    const sessionHoursForEdit = Math.max(0, Number(latestGameSession?.hours) || Number(entry.lastSessionHours) || Number(entry.sessionHours) || 0);
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
    if (readingSessionMinutesInput) readingSessionMinutesInput.value = "";
    if (dueDateInput) dueDateInput.value = entry.dueDate || "";
    selectedCoverId = Number(entry.coverId) || 0;
    selectedCoverEditionKey = entry.coverEditionKey || "";
    selectedCoverUrl = entry.coverUrl || "";
    selectedReadingIsbn13 = normalizeReadingIsbn(entry?.isbn13 || "");
    selectedReadingIsbn = normalizeReadingIsbn(entry?.isbn || "") || selectedReadingIsbn13;
    if (readingIsbnInput) readingIsbnInput.value = selectedReadingIsbn13 || selectedReadingIsbn || "";
    selectedPosterUrl = entry.posterUrl || "";
    selectedImdbId = entry.imdbID || "";
    const notesHistory = getEntryNotesHistory(entry);
    if (isVideoGameTracker) {
      const hydratedSessions = hydrateVideoGameSessionNotes(entry, getGameSessionHistory(entry));
      const latestSession = getLatestGameSession(hydratedSessions);
      notesInput.value = String(latestSession?.note || entry.notes || notesHistory[notesHistory.length - 1]?.note || "");
    } else {
      notesInput.value = entry.notes || notesHistory[notesHistory.length - 1]?.note || "";
    }
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
      if ("coverUrl" in entry && entry.coverUrl && typeof entry.coverUrl !== "string") {
        changed = true;
        return {
          ...entry,
          coverUrl: ""
        };
      }
      if (typeof entry.coverUrl === "string" && entry.coverUrl && isPlaceholderCoverUrl(entry.coverUrl)) {
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

  async function enrichReadingCovers(visibleIndices = null) {
    if (!isReadingTracker || isEnrichingReadingCovers) return;
    const now = Date.now();
    const visibleSet = visibleIndices instanceof Set ? visibleIndices : null;
    const entries = getEntries();
    const targets = entries
      .map((entry, idx) => ({ entry, idx }))
      .filter(({ entry, idx }) => {
        if (!entry?.item || getReadingCoverUrl(entry, isReadingTracker)) return false;
        if (visibleSet && !visibleSet.has(idx)) return false;
        const key = getReadingCoverLookupKey(entry, idx);
        const lastTriedAt = Number(readingCoverLookupAttemptedAt.get(key)) || 0;
        return !lastTriedAt || (now - lastTriedAt) >= READING_COVER_RETRY_MS;
      });

    if (!targets.length) return;
    isEnrichingReadingCovers = true;

    try {
      let changed = false;
      for (const { entry, idx } of targets) {
        const lookupKey = getReadingCoverLookupKey(entry, idx);
        readingCoverLookupAttemptedAt.set(lookupKey, Date.now());
        const title = String(entry?.item || "").trim();
        const author = String(entry?.author || "").trim();
        const entryIsbn = normalizeReadingIsbn(entry?.isbn13 || entry?.isbn || "");

        if (entryIsbn) {
          const isbnLookup = await fetchReadingCoverMatch({ rawIsbn: entryIsbn, title, author });
          if (isbnLookup) {
            const prevEntry = entries[idx] || {};
            const nextEntry = {
              ...prevEntry,
              coverUrl: String(isbnLookup.coverUrl || prevEntry?.coverUrl || "").trim(),
              isbn13: normalizeReadingIsbn(isbnLookup.isbn13 || prevEntry?.isbn13 || ""),
              isbn: normalizeReadingIsbn(isbnLookup.isbn || prevEntry?.isbn || isbnLookup.isbn13 || prevEntry?.isbn13 || "")
            };
            const changedByIsbnLookup = String(nextEntry.coverUrl || "") !== String(prevEntry?.coverUrl || "")
              || String(nextEntry.isbn13 || "") !== String(prevEntry?.isbn13 || "")
              || String(nextEntry.isbn || "") !== String(prevEntry?.isbn || "");
            if (changedByIsbnLookup) {
              entries[idx] = nextEntry;
              readingCoverLookupAttemptedAt.delete(lookupKey);
              changed = true;
              continue;
            }
          }
        }

        if (!title && !author) continue;
        const compactTitle = title
          .replace(/\s*\([^)]*\)\s*/g, " ")
          .replace(/\s*\[[^\]]*\]\s*/g, " ")
          .replace(/\s*[:\-].*$/g, "")
          .replace(/\s+/g, " ")
          .trim();
        const queryCandidates = [
          [title, author].filter(Boolean).join(" "),
          title,
          [compactTitle, author].filter(Boolean).join(" "),
          compactTitle,
          author ? `${title.split(":")[0] || title} ${author}` : ""
        ].map((value) => String(value || "").trim()).filter(Boolean);

        try {
          let match = null;
          const normalizedTitle = String(title || "").trim().toLowerCase();
          const normalizedCompactTitle = String(compactTitle || "").trim().toLowerCase();
          const normalizedAuthor = String(author || "").trim().toLowerCase();
          for (const query of queryCandidates) {
            const res = await fetch(`/api/books/suggest?q=${encodeURIComponent(query)}`);
            if (!res.ok) continue;
            const data = await res.json();
            let suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
            if (!suggestions.length) {
              suggestions = await fetchGoogleSuggestionsDirect(query);
            }
            if (!suggestions.length) continue;
            const strictMatch = suggestions.find((suggestion) => {
              const suggestionTitle = String(suggestion?.value || "").trim().toLowerCase();
              const suggestionAuthor = String(suggestion?.author || "").trim().toLowerCase();
              const titleLooksClose = suggestionTitle === normalizedTitle
                || (normalizedCompactTitle && suggestionTitle === normalizedCompactTitle)
                || suggestionTitle.startsWith(normalizedCompactTitle || normalizedTitle)
                || (normalizedCompactTitle && normalizedCompactTitle.startsWith(suggestionTitle));
              const authorLooksClose = !normalizedAuthor
                || (!suggestionAuthor && normalizedAuthor.length <= 2)
                || suggestionAuthor === normalizedAuthor
                || suggestionAuthor.includes(normalizedAuthor)
                || normalizedAuthor.includes(suggestionAuthor);
              return titleLooksClose && authorLooksClose;
            });
            if (strictMatch) {
              match = strictMatch;
            } else if (!normalizedAuthor) {
              // Only use a loose fallback when the entry has no author signal.
              match = suggestions[0];
            } else {
              match = null;
            }
            const coverId = Number(match?.coverId) || 0;
            const coverEditionKey = String(match?.coverEditionKey || "").trim();
            const coverUrl = String(match?.coverUrl || "").trim();
            const matchIsbn13 = normalizeReadingIsbn(match?.isbn13 || "");
            const matchIsbn = normalizeReadingIsbn(match?.isbn || "");
            if (coverId || coverEditionKey || coverUrl || matchIsbn13 || matchIsbn) break;
            match = null;
          }

          const coverId = Number(match?.coverId) || 0;
          const coverEditionKey = String(match?.coverEditionKey || "").trim();
          const coverUrl = String(match?.coverUrl || "").trim();
          const matchedIsbn13 = normalizeReadingIsbn(match?.isbn13 || "");
          const matchedIsbn = normalizeReadingIsbn(match?.isbn || "") || matchedIsbn13;
          if (!coverId && !coverEditionKey && !coverUrl && !matchedIsbn) continue;

          const prevEntry = entries[idx] || {};
          const nextEntry = {
            ...prevEntry,
            coverId: coverId || Number(prevEntry?.coverId) || 0,
            coverEditionKey: coverEditionKey || String(prevEntry?.coverEditionKey || "").trim(),
            coverUrl: coverUrl || String(prevEntry?.coverUrl || "").trim(),
            isbn13: matchedIsbn13 || normalizeReadingIsbn(prevEntry?.isbn13 || ""),
            isbn: matchedIsbn || normalizeReadingIsbn(prevEntry?.isbn || "") || matchedIsbn13 || normalizeReadingIsbn(prevEntry?.isbn13 || "")
          };
          const hasCoverChanged = nextEntry.coverId !== Number(prevEntry?.coverId || 0)
            || String(nextEntry.coverEditionKey || "") !== String(prevEntry?.coverEditionKey || "")
            || String(nextEntry.coverUrl || "") !== String(prevEntry?.coverUrl || "");
          const hasIsbnChanged = String(nextEntry.isbn13 || "") !== String(prevEntry?.isbn13 || "")
            || String(nextEntry.isbn || "") !== String(prevEntry?.isbn || "");
          if (!hasCoverChanged && !hasIsbnChanged) continue;
          entries[idx] = nextEntry;
          readingCoverLookupAttemptedAt.delete(lookupKey);
          changed = true;
        } catch {
          // Ignore individual lookup failures and continue backfilling others.
        }
      }

      if (changed) {
        saveEntries(entries);
        renderEntries(false, true);
      }
    } finally {
      isEnrichingReadingCovers = false;
    }
  }

  async function recoverBrokenReadingCover(idx, failedSrc = "") {
    if (!isReadingTracker) return;
    const entries = getEntries();
    const entry = ensureEntryIdentity(entries[idx]);
    if (!entry || !entry.item) return;
    const lookupKey = `${getReadingCoverLookupKey(entry, idx)}::${String(failedSrc || "").trim()}`;
    const now = Date.now();
    const lastAttempt = Number(readingBrokenCoverAttemptedAt.get(lookupKey)) || 0;
    if (lastAttempt && (now - lastAttempt) < READING_COVER_RETRY_MS) return;
    readingBrokenCoverAttemptedAt.set(lookupKey, now);

    let changed = false;
    const nextEntry = { ...entry };
    if (String(nextEntry.coverUrl || "").trim()) {
      nextEntry.coverUrl = "";
      changed = true;
    }
    const normalizedFailedSrc = String(failedSrc || "").toLowerCase();
    if (
      normalizedFailedSrc.includes("covers.openlibrary.org")
      || normalizedFailedSrc.includes("openlibrary.org")
    ) {
      if (Number(nextEntry.coverId) > 0 || String(nextEntry.coverEditionKey || "").trim()) {
        nextEntry.coverId = 0;
        nextEntry.coverEditionKey = "";
        changed = true;
      }
    }

    if (!changed) return;
    entries[idx] = {
      ...nextEntry,
      updatedAt: Date.now()
    };
    saveEntries(entries);
    await enrichReadingCovers(new Set([idx]));
    renderEntries(false, true);
  }

  if (isSleepTracker) {
    const { goalHours, goalMinutes } = getSleepGoalSettings();
    if (goalHoursInput) goalHoursInput.value = String(goalHours);
    if (goalMinutesInput) goalMinutesInput.value = String(goalMinutes);
    updateSleepGoalSummary();
    setSleepGoalCollapsed(hasPersistedSleepGoalSettings());

    goalHoursInput?.addEventListener("change", updateSleepGoalSummary);
    goalMinutesInput?.addEventListener("change", updateSleepGoalSummary);
    sleepGoalEditButton?.addEventListener("click", function() {
      setSleepGoalCollapsed(false);
      goalHoursInput?.focus();
    });
    goalSaveButton?.addEventListener("click", function() {
      const nextGoalHours = Number(goalHoursInput?.value || 0);
      const nextGoalMinutes = Number(goalMinutesInput?.value || 0);
      saveSleepGoalSettings(nextGoalHours, nextGoalMinutes);
      updateSleepGoalSummary();
      showSleepGoalMessage(`Saved goal: ${formatDurationLabel(nextGoalHours, nextGoalMinutes)}`);
      setSleepGoalCollapsed((nextGoalHours * 60) + nextGoalMinutes > 0);
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
    setWaterGoalCollapsed(hasPersistedWaterGoalSettings());

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
    waterGoalEditButton?.addEventListener("click", function() {
      setWaterGoalCollapsed(false);
      waterGoalOuncesInput?.focus();
    });
    waterDrinkTypeInput?.addEventListener("change", syncWaterDrinkUI);
    waterQuickAddContainer?.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest("[data-quick-water-oz][data-quick-water-type]");
      if (!(button instanceof HTMLElement)) return;
      const quickOz = Math.max(0, Number(button.getAttribute("data-quick-water-oz") || 0));
      const quickType = String(button.getAttribute("data-quick-water-type") || "water").trim() || "water";
      if (quickOz <= 0) return;
      if (editingIdx >= 0) {
        clearForm();
      }
      const quickUnit = normalizeWaterVolumeUnit(selectedWaterVolumeUnit || "oz");
      if (waterDrinkTypeInput) waterDrinkTypeInput.value = quickType;
      syncWaterDrinkUI();
      if (waterOuncesInput) {
        const valueInSelectedUnit = fromWaterOunces(quickOz, quickUnit);
        waterOuncesInput.value = formatWaterInputValue(valueInSelectedUnit, quickUnit);
      }
      form.requestSubmit();
    });
    waterGoalSaveButton?.addEventListener("click", function() {
      const unit = normalizeWaterVolumeUnit(selectedWaterVolumeUnit);
      const nextGoalValue = Math.max(0, Number(waterGoalOuncesInput?.value || 0));
      const nextGoalOunces = toWaterOunces(nextGoalValue, unit);
      saveWaterGoalSettings(nextGoalOunces, unit);
      updateWaterGoalSummary();
      showWaterGoalMessage(`Saved goal: ${formatWaterVolumeFromOunces(nextGoalOunces, unit)}/day`);
      setWaterGoalCollapsed(nextGoalOunces > 0);
      renderEntries();
    });
    entryDateInput?.addEventListener("change", updateWaterGoalSummary);
    syncWaterDrinkUI();
  }

  if (isReadingTracker) {
    const { dailyGoalMinutes, dailyGoalPages } = getReadingGoalSettings();
    if (readingGoalMinutesInput) readingGoalMinutesInput.value = String(dailyGoalMinutes);
    if (readingGoalPagesInput) readingGoalPagesInput.value = String(dailyGoalPages);
    updateReadingGoalSummary();
    setReadingGoalCollapsed(hasPersistedReadingGoalSettings());
    readingGoalMinutesInput?.addEventListener("change", updateReadingGoalSummary);
    readingGoalPagesInput?.addEventListener("change", updateReadingGoalSummary);
    readingGoalEditButton?.addEventListener("click", function() {
      setReadingGoalCollapsed(false);
      readingGoalMinutesInput?.focus();
    });
    readingGoalSaveButton?.addEventListener("click", function() {
      const nextGoalMinutes = Math.max(0, getIntValue(readingGoalMinutesInput, 0));
      const nextGoalPages = Math.max(0, getIntValue(readingGoalPagesInput, 0));
      saveReadingGoalSettings({
        dailyGoalMinutes: nextGoalMinutes,
        dailyGoalPages: nextGoalPages
      });
      updateReadingGoalSummary();
      showReadingGoalMessage(`Saved goals: ${nextGoalMinutes} min/day, ${nextGoalPages} pages/day`);
      setReadingGoalCollapsed(nextGoalMinutes > 0 || nextGoalPages > 0);
      renderEntries(false);
    });
    entryDateInput?.addEventListener("change", updateReadingGoalSummary);
  }

  initItemAutocomplete({
    enableOmdbAutocomplete,
    omdbApiKey,
    googleBooksApiKey,
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
      selectedReadingIsbn13 = normalizeReadingIsbn(selection?.isbn13 || "");
      selectedReadingIsbn = normalizeReadingIsbn(selection?.isbn || "") || selectedReadingIsbn13;
      if (readingIsbnInput) {
        readingIsbnInput.value = selectedReadingIsbn13 || selectedReadingIsbn || "";
      }
      selectedPosterUrl = selection?.posterUrl || "";
      selectedImdbId = selection?.imdbID || "";
    },
    onSuggestionApplied() {
      syncWorkoutMetricsUI();
    }
  });

  function renderEntries(resetVisibleCount = true, preserveScrollPosition = false) {
    normalizeReadingEntries();
    normalizeWaterEntries();
    const shouldRestoreScroll = Boolean(preserveScrollPosition && listScrollContainer);
    const previousScrollTop = shouldRestoreScroll ? listScrollContainer.scrollTop : 0;
    list.innerHTML = "";
    const entries = getEntries();
    const totalGameHours = {};
    if (isVideoGameTracker) {
      entries.forEach((entry) => {
        const key = normalizeGameKey(entry?.item);
        if (!key) return;
        const hasStoredSessionHistory = Array.isArray(entry?.gameSessionHistory) && entry.gameSessionHistory.length > 0;
        const history = getGameSessionHistory(entry);
        const historyHours = Math.max(0, sumGameSessionHours(history));
        const fallbackHours = Math.max(0, Number(entry?.lastSessionHours) || Number(entry?.sessionHours) || 0);
        const totalHours = hasStoredSessionHistory ? historyHours : (historyHours > 0 ? historyHours : fallbackHours);
        totalGameHours[key] = (totalGameHours[key] || 0) + totalHours;
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
    } else if (enableReadingProgress) {
      renderedEntries = renderedEntries.filter(({ entry }) => isReadingEntryVisible(entry));
    }

    renderedEntries.sort((a, b) => {
      const timeDiff = getEntryActivityTimestamp(b.entry) - getEntryActivityTimestamp(a.entry);
      if (timeDiff !== 0) return timeDiff;
      return b.idx - a.idx;
    });

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
      if (isHealthTracker) {
        const metricType = String(entry?.healthMetricType || "").trim();
        const metricValue = String(entry?.healthMetricValue || "").trim();
        const metricUnit = String(entry?.healthUnit || "").trim();
        const healthTime = String(entry?.healthTime || "").trim();
        const severity = Math.max(0, Number(entry?.healthSeverity) || 0);
        const status = String(entry?.healthStatus || "").trim();
        const medication = String(entry?.healthMedication || "").trim();
        const provider = String(entry?.healthProvider || "").trim();
        const tags = Array.isArray(entry?.healthTags) ? entry.healthTags : [];
        if (metricType) metadataChips.push(metricType);
        if (metricValue) metadataChips.push(`${metricValue}${metricUnit ? ` ${metricUnit}` : ""}`);
        if (healthTime) metadataChips.push(`Time ${healthTime}`);
        if (severity > 0) metadataChips.push(`Severity ${severity}/10`);
        if (status) metadataChips.push(status);
        if (medication) metadataChips.push(`Medication ${medication}`);
        if (provider) metadataChips.push(`Provider ${provider}`);
        if (tags.length) metadataChips.push(`Tags ${tags.join(", ")}`);
      }
      if (isMealTracker) {
        const mealType = String(entry?.mealType || "").trim();
        const mealTime = String(entry?.mealTime || "").trim();
        const mealCalories = Math.max(0, Number(entry?.mealCalories) || 0);
        const mealProtein = Math.max(0, Number(entry?.mealProteinGrams) || 0);
        const mealCarbs = Math.max(0, Number(entry?.mealCarbsGrams) || 0);
        const mealFat = Math.max(0, Number(entry?.mealFatGrams) || 0);
        const mealServings = String(entry?.mealServings || "").trim();
        const mealLocation = String(entry?.mealLocation || "").trim();
        const mealTags = Array.isArray(entry?.mealTags) ? entry.mealTags : [];
        if (mealType) metadataChips.push(mealType);
        if (mealTime) metadataChips.push(`Time ${mealTime}`);
        if (mealCalories > 0) metadataChips.push(`${Math.round(mealCalories)} kcal`);
        if (mealProtein > 0 || mealCarbs > 0 || mealFat > 0) {
          metadataChips.push(`P${mealProtein.toFixed(1).replace(/\.0$/, "")} C${mealCarbs.toFixed(1).replace(/\.0$/, "")} F${mealFat.toFixed(1).replace(/\.0$/, "")}g`);
        }
        if (mealServings) metadataChips.push(mealServings);
        if (mealLocation) metadataChips.push(mealLocation);
        if (mealTags.length) metadataChips.push(`Tags ${mealTags.join(", ")}`);
      }
      if (isCustomTracker) {
        const customType = String(entry?.customType || "").trim();
        const customStatus = String(entry?.customStatus || "").trim();
        const customValue = String(entry?.customValue || "").trim();
        const customUnit = String(entry?.customUnit || "").trim();
        const customDueDate = formatSimpleDate(entry?.customDueDate);
        const customTags = Array.isArray(entry?.customTags) ? entry.customTags : [];
        if (customType) metadataChips.push(customType);
        if (customStatus) metadataChips.push(customStatus);
        if (customValue) metadataChips.push(`${customValue}${customUnit ? ` ${customUnit}` : ""}`);
        if (customDueDate) metadataChips.push(`Due ${customDueDate}`);
        if (customTags.length) metadataChips.push(`Tags ${customTags.join(", ")}`);
      }
      if (isTaskTracker) {
        const dueDate = formatSimpleDate(entry?.dueDate);
        if (dueDate) metadataChips.push(`Due ${dueDate}`);
        metadataChips.push(entry?.completed ? "Completed" : "Active");
      }
      if (isWorkoutTracker) {
        workoutMetricBadges = formatWorkoutMetricBadges(entry, isWorkoutTracker);
        const workoutWeatherSummary = formatWorkoutWeatherSummary(entry, isWorkoutTracker);
        if (workoutWeatherSummary) metadataChips.push(workoutWeatherSummary);
      }
      if (isVideoGameTracker) {
        const gameSessionHistory = getGameSessionHistory(entry);
        const latestSession = getLatestGameSession(gameSessionHistory);
        const sessionHours = Math.max(0, Number(latestSession?.hours) || Number(entry?.lastSessionHours) || Number(entry?.sessionHours) || 0);
        const explicitTotalHours = Math.max(0, Number(entry?.totalHours) || 0);
        const historyTotalHours = Math.max(0, sumGameSessionHours(gameSessionHistory));
        const aggregatedTotalHours = totalGameHours[normalizeGameKey(entry?.item)] || 0;
        const totalHours = historyTotalHours > 0 ? historyTotalHours : (explicitTotalHours > 0 ? explicitTotalHours : aggregatedTotalHours);
        if (sessionHours > 0 || totalHours > 0) {
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
      let displayItemTitle = entry.item;
      if (isFinanceTracker) {
        const financeAmount = Math.max(0, Number(entry?.financeAmount) || 0);
        if (financeAmount > 0) {
          displayItemTitle = `${entry.item} • $${financeAmount.toFixed(2)}`;
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
      const showRating = !isSleepTracker && !isTaskTracker && !isFinanceTracker && !isMealTracker && !isHealthTracker && !isWaterTracker && !(enableReadingProgress && entry.currentlyReading);
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
        ? `<div class=\"tracker-media-shell reading-cover-shell\"><img src=\"${finalMediaUrl}\" alt=\"Cover of ${entry.item}\" class=\"tracker-media-image reading-cover-image\" loading=\"lazy\" referrerpolicy=\"no-referrer\" ${imageOnError ? `onerror=\"${imageOnError}\"` : ""} data-fallback-src=\"${fallbackMediaUrl || ""}\" /></div>`
        : "";
      const readingSessionsHtml = isReadingTracker ? renderReadingSessionsHtml(entry, idx) : "";
      const notesHtml = (isVideoGameTracker || isReadingTracker) ? "" : renderNotesHtml(entry, idx);
      const gameSessionsHtml = isVideoGameTracker ? renderVideoGameSessionHistoryHtml(entry, idx) : "";
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
          <div class=\"absolute top-4 right-5 sm:top-3 sm:right-3 flex items-center gap-1\">
            ${isTaskTracker ? `<button class=\"p-1.5 bg-gray-200 rounded hover:bg-green-100 text-green-700 inline-flex items-center justify-center\" aria-label=\"Toggle completion\" data-action=\"toggle-complete\" data-idx=\"${idx}\"><span class=\"material-symbols-outlined leading-none\" style=\"font-size:20px;font-variation-settings:'opsz' 20;\" aria-hidden=\"true\">${entry?.completed ? "task_alt" : "check_circle"}</span></button>` : ""}
            <div class=\"relative\">
              <button class=\"tracker-entry-menu-toggle inline-flex items-center justify-center\" aria-label=\"More actions\" data-action=\"entry-menu-toggle\" data-idx=\"${idx}\"><span class=\"material-symbols-outlined leading-none\" style=\"font-size:20px;font-variation-settings:'opsz' 20;\" aria-hidden=\"true\">more_vert</span></button>
              <div class=\"hidden absolute right-0 mt-1 min-w-[120px] rounded-md border border-gray-200 bg-white shadow-lg z-20\" data-role=\"entry-menu\">
                <button class=\"w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 inline-flex items-center gap-2\" data-action=\"edit\" data-idx=\"${idx}\"><span class=\"material-symbols-outlined leading-none\" style=\"font-size:18px;font-variation-settings:'opsz' 20;\" aria-hidden=\"true\">edit</span><span>Edit</span></button>
                <button class=\"w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 inline-flex items-center gap-2\" data-action=\"delete\" data-idx=\"${idx}\"><span class=\"material-symbols-outlined leading-none\" style=\"font-size:18px;font-variation-settings:'opsz' 20;\" aria-hidden=\"true\">delete</span><span>Delete</span></button>
              </div>
            </div>
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
          ${readingSessionsHtml}
          ${gameSessionsHtml}
          ${notesHtml}
          ${showRating ? `<div class=\"flex items-center gap-1 mt-2\">${renderStaticStars(entry.rating || 0)}</div>` : ""}
          </div>
          </div>
        </div>
      `;
      const deleteButton = li.querySelector("[data-action=\"delete\"]");
      const entryMenuToggleButton = li.querySelector("[data-action=\"entry-menu-toggle\"]");
      const entryMenu = li.querySelector("[data-role=\"entry-menu\"]");
      const coverImageEl = li.querySelector(".reading-cover-image");
      if (coverImageEl instanceof HTMLImageElement) {
        const fallbackSrc = String(coverImageEl.getAttribute("data-fallback-src") || "").trim();
        if (fallbackSrc) {
          const applyFallback = () => {
            if (coverImageEl.dataset.usedFallback === "1") return;
            const failedSrc = String(coverImageEl.currentSrc || coverImageEl.src || "").trim();
            coverImageEl.dataset.usedFallback = "1";
            coverImageEl.src = fallbackSrc;
            void recoverBrokenReadingCover(idx, failedSrc);
          };
          coverImageEl.addEventListener("error", applyFallback, { once: true });
          if (coverImageEl.complete && coverImageEl.naturalWidth === 0) {
            applyFallback();
          }
        }
      }
      if (deleteButton) {
        deleteButton.onclick = async () => {
          if (entryMenu) entryMenu.classList.add("hidden");
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
          if (entryMenu) entryMenu.classList.add("hidden");
          startEditing(idx);
        };
      }
      if (entryMenuToggleButton && entryMenu) {
        entryMenuToggleButton.addEventListener("click", (event) => {
          event.stopPropagation();
          const shouldOpen = entryMenu.classList.contains("hidden");
          document.querySelectorAll("[data-role=\"entry-menu\"]").forEach((menuEl) => {
            menuEl.classList.add("hidden");
          });
          if (shouldOpen) {
            entryMenu.classList.remove("hidden");
          }
        });
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
      const noteEditButtons = li.querySelectorAll("[data-action=\"edit-note\"]");
      noteEditButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const entryIndex = Number(button.getAttribute("data-idx"));
          const noteIndex = Number(button.getAttribute("data-note-idx"));
          const entries = getEntries();
          const currentEntry = ensureEntryIdentity(entries[entryIndex]);
          if (!currentEntry) return;
          const history = getEntryNotesHistory(currentEntry);
          const targetNote = history[noteIndex];
          if (!targetNote) return;
          const nextValue = await requestNoteEdit(targetNote.note);
          if (!nextValue) return;
          history[noteIndex] = { ...targetNote, note: nextValue };
          entries[entryIndex] = withNotesHistory(currentEntry, history);
          saveEntries(entries);
          if (editingIdx === entryIndex) {
            const refreshedHistory = getEntryNotesHistory(entries[entryIndex]);
            notesInput.value = entries[entryIndex].notes || refreshedHistory[refreshedHistory.length - 1]?.note || "";
          }
          renderEntries();
        });
      });
      const noteDeleteButtons = li.querySelectorAll("[data-action=\"delete-note\"]");
      noteDeleteButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const entryIndex = Number(button.getAttribute("data-idx"));
          const noteIndex = Number(button.getAttribute("data-note-idx"));
          const entries = getEntries();
          const currentEntry = ensureEntryIdentity(entries[entryIndex]);
          if (!currentEntry) return;
          const history = getEntryNotesHistory(currentEntry);
          if (!history[noteIndex]) return;
          const confirmed = await requestDeleteConfirmation();
          if (!confirmed) return;
          history.splice(noteIndex, 1);
          entries[entryIndex] = withNotesHistory(currentEntry, history);
          saveEntries(entries);
          if (editingIdx === entryIndex) {
            const refreshedHistory = getEntryNotesHistory(entries[entryIndex]);
            notesInput.value = entries[entryIndex].notes || refreshedHistory[refreshedHistory.length - 1]?.note || "";
          }
          renderEntries();
        });
      });
      const sessionEditButtons = li.querySelectorAll("[data-action=\"edit-session\"]");
      sessionEditButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const entryIndex = Number(button.getAttribute("data-idx"));
          const sessionIndex = Number(button.getAttribute("data-session-idx"));
          const entries = getEntries();
          const entryForEdit = ensureEntryIdentity(entries[entryIndex]);
          if (!entryForEdit) return;
          const sessionRows = getVideoGameSessionRows(entryForEdit);
          const existingHistory = sessionRows.hydratedSessions;
          const currentSession = existingHistory[sessionIndex];
          if (!currentSession) return;
          const editResult = await requestVideoGameSessionEdit({
            dateInput: toDateInputValue(currentSession?.playedAt || entryForEdit?.date || ""),
            hours: Number(currentSession?.hours) || 0,
            note: String(currentSession?.note || "")
          });
          if (!editResult) return;
          const nextPlayedAt = buildEntryDateIso(editResult.dateInput, currentSession?.playedAt || entryForEdit?.date || "");
          existingHistory[sessionIndex] = createGameSession(editResult.hours, nextPlayedAt, editResult.note);
          entries[entryIndex] = normalizeVideoGameEntryFromHistory(entryForEdit, existingHistory);
          saveEntries(entries);
          if (editingIdx === entryIndex) clearForm();
          renderEntries();
        });
      });
      const addGameSessionButtons = li.querySelectorAll("[data-action=\"add-session\"]");
      addGameSessionButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const entryIndex = Number(button.getAttribute("data-idx"));
          const entries = getEntries();
          const entryForEdit = ensureEntryIdentity(entries[entryIndex]);
          if (!entryForEdit) return;
          const editResult = await requestVideoGameSessionEdit({
            dateInput: getTodayDateInputValue(),
            hours: 0,
            note: ""
          });
          if (!editResult) return;
          const sessionRows = getVideoGameSessionRows(entryForEdit);
          const existingHistory = sessionRows.hydratedSessions;
          const nextPlayedAt = buildEntryDateIso(editResult.dateInput, entryForEdit?.date || "");
          existingHistory.push(createGameSession(editResult.hours, nextPlayedAt, editResult.note));
          entries[entryIndex] = normalizeVideoGameEntryFromHistory(entryForEdit, existingHistory);
          saveEntries(entries);
          if (editingIdx === entryIndex) clearForm();
          renderEntries();
        });
      });
      const readingSessionEditButtons = li.querySelectorAll("[data-action=\"edit-reading-session\"]");
      readingSessionEditButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const entryIndex = Number(button.getAttribute("data-idx"));
          const sessionIndex = Number(button.getAttribute("data-session-idx"));
          const entries = getEntries();
          const currentEntry = ensureEntryIdentity(entries[entryIndex]);
          if (!currentEntry) return;
          const sessionRows = getReadingSessionRows(currentEntry);
          const existingHistory = sessionRows.hydratedSessions;
          const targetSession = existingHistory[sessionIndex];
          if (!targetSession) return;
          const isAudio = Boolean(currentEntry?.isAudiobook);
          const editResult = await requestReadingSessionEdit({
            isAudiobook: isAudio,
            dateInput: toDateInputValue(targetSession?.createdAt || currentEntry?.date || ""),
            currentPage: isAudio
              ? null
              : (targetSession?.currentPage ?? Math.max(0, Number(currentEntry?.currentPage) || 0)),
            leftMinutes: isAudio
              ? (targetSession?.leftMinutes ?? totalMinutesFromParts(currentEntry?.leftHours, currentEntry?.leftMinutes))
              : null,
            note: String(targetSession?.note || "")
          });
          if (!editResult) return;
          existingHistory[sessionIndex] = {
            ...targetSession,
            createdAt: normalizeNoteTimestamp(
              buildEntryDateIso(editResult.dateInput, currentEntry?.date || ""),
              currentEntry?.date || ""
            ),
            currentPage: isAudio ? null : (editResult?.currentPage ?? null),
            leftMinutes: isAudio ? (editResult?.leftMinutes ?? null) : null,
            note: String(editResult?.note || "").trim()
          };
          let nextEntry = normalizeReadingEntryFromSessions(currentEntry, existingHistory);
          nextEntry = applyReadingEntryProgressFromSessions(nextEntry);
          entries[entryIndex] = nextEntry;
          saveEntries(entries);
          if (editingIdx === entryIndex) {
            notesInput.value = entries[entryIndex].notes || "";
          }
          renderEntries();
        });
      });
      const addReadingSessionButtons = li.querySelectorAll("[data-action=\"add-reading-session\"]");
      addReadingSessionButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const entryIndex = Number(button.getAttribute("data-idx"));
          const entries = getEntries();
          const currentEntry = ensureEntryIdentity(entries[entryIndex]);
          if (!currentEntry) return;
          const isAudio = Boolean(currentEntry?.isAudiobook);
          const editResult = await requestReadingSessionEdit({
            isAudiobook: isAudio,
            dateInput: getTodayDateInputValue(),
            currentPage: isAudio ? null : Math.max(0, Number(currentEntry?.currentPage) || 0),
            leftMinutes: isAudio ? totalMinutesFromParts(currentEntry?.leftHours, currentEntry?.leftMinutes) : null,
            note: ""
          });
          if (!editResult) return;
          const sessionRows = getReadingSessionRows(currentEntry);
          const existingHistory = sessionRows.hydratedSessions;
          existingHistory.push({
            createdAt: normalizeNoteTimestamp(
              buildEntryDateIso(editResult.dateInput, currentEntry?.date || ""),
              currentEntry?.date || ""
            ),
            minutes: 0,
            pagesRead: 0,
            currentPage: isAudio ? null : (editResult?.currentPage ?? null),
            leftMinutes: isAudio ? (editResult?.leftMinutes ?? null) : null,
            note: String(editResult?.note || "").trim()
          });
          let nextEntry = normalizeReadingEntryFromSessions(currentEntry, existingHistory);
          nextEntry = applyReadingEntryProgressFromSessions(nextEntry);
          entries[entryIndex] = nextEntry;
          saveEntries(entries);
          if (editingIdx === entryIndex) {
            notesInput.value = entries[entryIndex].notes || "";
          }
          renderEntries();
        });
      });
      const sessionDeleteButtons = li.querySelectorAll("[data-action=\"delete-session\"]");
      sessionDeleteButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const entryIndex = Number(button.getAttribute("data-idx"));
          const sessionIndex = Number(button.getAttribute("data-session-idx"));
          const entries = getEntries();
          const entryForDelete = ensureEntryIdentity(entries[entryIndex]);
          if (!entryForDelete) return;
          const sessionRows = getVideoGameSessionRows(entryForDelete);
          const existingHistory = sessionRows.hydratedSessions;
          const targetSession = existingHistory[sessionIndex];
          if (!targetSession) return;
          const confirmed = window.confirm("Delete this session?");
          if (!confirmed) return;
          existingHistory.splice(sessionIndex, 1);
          if (!existingHistory.length) {
            entries.splice(entryIndex, 1);
            if (editingIdx === entryIndex) {
              clearForm();
            } else if (editingIdx > entryIndex) {
              editingIdx -= 1;
            }
          } else {
            entries[entryIndex] = normalizeVideoGameEntryFromHistory(entryForDelete, existingHistory);
            if (editingIdx === entryIndex) clearForm();
          }
          saveEntries(entries);
          renderEntries();
        });
      });
      const readingSessionDeleteButtons = li.querySelectorAll("[data-action=\"delete-reading-session\"]");
      readingSessionDeleteButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const entryIndex = Number(button.getAttribute("data-idx"));
          const sessionIndex = Number(button.getAttribute("data-session-idx"));
          const entries = getEntries();
          const currentEntry = ensureEntryIdentity(entries[entryIndex]);
          if (!currentEntry) return;
          const sessionRows = getReadingSessionRows(currentEntry);
          const existingHistory = sessionRows.hydratedSessions;
          if (!existingHistory[sessionIndex]) return;
          const confirmed = await requestDeleteConfirmation();
          if (!confirmed) return;
          existingHistory.splice(sessionIndex, 1);
          let nextEntry = normalizeReadingEntryFromSessions(currentEntry, existingHistory);
          nextEntry = applyReadingEntryProgressFromSessions(nextEntry);
          entries[entryIndex] = nextEntry;
          saveEntries(entries);
          if (editingIdx === entryIndex) {
            notesInput.value = entries[entryIndex].notes || "";
          }
          renderEntries();
        });
      });
      list.appendChild(li);
    });
    if (!list.dataset.entryMenuBound) {
      list.dataset.entryMenuBound = "1";
      document.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.closest("[data-action=\"entry-menu-toggle\"]") || target.closest("[data-role=\"entry-menu\"]")) return;
        document.querySelectorAll("[data-role=\"entry-menu\"]").forEach((menuEl) => {
          menuEl.classList.add("hidden");
        });
      });
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        document.querySelectorAll("[data-role=\"entry-menu\"]").forEach((menuEl) => {
          menuEl.classList.add("hidden");
        });
      });
    }

    const LOOKAHEAD_BUFFER = 5;
    const readingVisibleIndices = isReadingTracker
      ? new Set(renderedEntries.slice(0, Math.min(renderedEntries.length, visibleLimit + LOOKAHEAD_BUFFER)).map(({ idx }) => idx))
      : null;
    void enrichReadingCovers(readingVisibleIndices);
    void enrichMoviePosters();
    if (isWaterTracker) {
      updateWaterGoalSummary();
    }
    if (shouldRestoreScroll) {
      listScrollContainer.scrollTop = previousScrollTop;
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
        renderEntries(false, true);
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
    const financeAmount = Math.max(0, getFloatValue(financeAmountInput, 0));
    const healthMetricType = String(healthMetricTypeInput?.value || "").trim();
    const healthMetricValue = String(healthMetricValueInput?.value || "").trim();
    const healthUnit = String(healthUnitInput?.value || "").trim();
    const healthTime = String(healthTimeInput?.value || "").trim();
    const healthSeverity = Math.max(0, Math.min(10, getIntValue(healthSeverityInput, 0)));
    const healthStatus = String(healthStatusInput?.value || "").trim();
    const healthMedication = String(healthMedicationInput?.value || "").trim();
    const healthProvider = String(healthProviderInput?.value || "").trim();
    const healthTags = parseHealthTags(healthTagsInput?.value || "");
    const mealType = String(mealTypeInput?.value || "").trim();
    const mealTime = String(mealTimeInput?.value || "").trim();
    const mealCalories = Math.max(0, getIntValue(mealCaloriesInput, 0));
    const mealProteinGrams = Math.max(0, getFloatValue(mealProteinInput, 0));
    const mealCarbsGrams = Math.max(0, getFloatValue(mealCarbsInput, 0));
    const mealFatGrams = Math.max(0, getFloatValue(mealFatInput, 0));
    const mealServings = String(mealServingsInput?.value || "").trim();
    const mealLocation = String(mealLocationInput?.value || "").trim();
    const mealTags = parseMealTags(mealTagsInput?.value || "");
    const customType = String(customTypeInput?.value || "").trim();
    const customStatus = String(customStatusInput?.value || "").trim();
    const customValue = String(customValueInput?.value || "").trim();
    const customUnit = String(customUnitInput?.value || "").trim();
    const customDueDate = String(customDueDateInput?.value || "").trim();
    const customTags = parseCustomTags(customTagsInput?.value || "");
    const workoutDurationHours = Math.max(0, getIntValue(workoutDurationHoursInput, 0));
    const workoutDurationMinutes = Math.max(0, Math.min(59, getIntValue(workoutDurationMinutesInput, 0)));
    const workoutDurationSeconds = Math.max(0, Math.min(59, getIntValue(workoutDurationSecondsInput, 0)));
    const workoutDurationTotalMinutes = Math.floor((workoutDurationHours * 3600 + workoutDurationMinutes * 60 + workoutDurationSeconds) / 60);
    const workoutDistanceMiles = Math.max(0, getFloatValue(workoutDistanceInput, 0));
    const workoutLaps = Math.max(0, getIntValue(workoutLapsInput, 0));
    const workoutSets = Math.max(0, getIntValue(workoutSetsInput, 0));
    const workoutReps = Math.max(0, getIntValue(workoutRepsInput, 0));
    const workoutWeightLbs = Math.max(0, getIntValue(workoutWeightInput, 0));
    const shouldAttachWorkoutWeather = isWorkoutTracker && Boolean(workoutWeatherEnabledInput?.checked);
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
    const fallbackHealthTitle = `${healthMetricType || "Health Metric"}${healthMetricValue ? `: ${healthMetricValue}${healthUnit ? ` ${healthUnit}` : ""}` : ""}`;
    const item = isSleepTracker
      ? formatSleepDuration(sleepHours, sleepMinutes)
      : (isWaterTracker
        ? `${formatWaterVolumeFromOunces(waterOunces, waterUnit)} ${waterDrinkLabel}`
        : ((isHealthTracker ? (itemInput?.value.trim() || fallbackHealthTitle) : (itemInput?.value.trim() || ""))));
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
    const readingSessionMinutes = Math.max(0, getIntValue(readingSessionMinutesInput, 0));
    const readingIsbnRaw = String(readingIsbnInput?.value || "").trim();
    const { isbn13: readingIsbn13, isbn: readingIsbn } = resolveReadingIsbnPair(readingIsbnRaw);
    const dueDate = dueDateInput?.value || "";
    const notes = notesInput.value.trim();
    const { goalHours, goalMinutes } = isSleepTracker ? getSleepGoalSettings() : { goalHours: 0, goalMinutes: 0 };
    const sleepGrade = isSleepTracker ? getSleepGrade(sleepHours, sleepMinutes, goalHours, goalMinutes) : null;
    const rating = isSleepTracker
      ? (sleepGrade?.stars || 0)
      : ((isTaskTracker || isFinanceTracker || isMealTracker || isHealthTracker || isWaterTracker) ? 0 : (currentlyReading ? 0 : (parseFloat(ratingInput?.value) || 0)));
    if (
      !item ||
      (enableCategoryField && !category) ||
      (isFinanceTracker && financeAmount <= 0) ||
      (isHealthTracker && (!healthMetricType || !healthMetricValue)) ||
      (isSleepTracker && sleepHours === 0 && sleepMinutes === 0) ||
      (isVideoGameTracker && sessionHours <= 0) ||
      (isWaterTracker && (waterOunces <= 0 || !waterDrinkLabel))
    ) return;
    const entries = getEntries();
    let pendingWorkoutWeather = null;
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
      if (isVideoGameTracker) {
        updatedEntry.notes = "";
        updatedEntry.notesHistory = [];
      } else {
        Object.assign(updatedEntry, withUpdatedNotes(entries[editingIdx], notes, { noteTimestamp: date }));
      }
      if (isSleepTracker) {
        updatedEntry.sleepHours = sleepHours;
        updatedEntry.sleepMinutes = sleepMinutes;
        updatedEntry.sleepScore = sleepGrade?.score ?? null;
      }
      if (enableAuthorField) updatedEntry.author = author;
      if (enableDirectorField) updatedEntry.director = director;
      if (enablePublisherField) updatedEntry.publisher = publisher;
      if (enableCategoryField) updatedEntry.category = category;
      if (isFinanceTracker) updatedEntry.financeAmount = financeAmount;
      if (isHealthTracker) {
        updatedEntry.healthMetricType = healthMetricType;
        updatedEntry.healthMetricValue = healthMetricValue;
        updatedEntry.healthUnit = healthUnit;
        updatedEntry.healthTime = healthTime;
        updatedEntry.healthSeverity = healthSeverity > 0 ? healthSeverity : 0;
        updatedEntry.healthStatus = healthStatus;
        updatedEntry.healthMedication = healthMedication;
        updatedEntry.healthProvider = healthProvider;
        updatedEntry.healthTags = healthTags;
      }
      if (isMealTracker) {
        updatedEntry.mealType = mealType;
        updatedEntry.mealTime = mealTime;
        updatedEntry.mealCalories = mealCalories;
        updatedEntry.mealProteinGrams = mealProteinGrams;
        updatedEntry.mealCarbsGrams = mealCarbsGrams;
        updatedEntry.mealFatGrams = mealFatGrams;
        updatedEntry.mealServings = mealServings;
        updatedEntry.mealLocation = mealLocation;
        updatedEntry.mealTags = mealTags;
      }
      if (isCustomTracker) {
        updatedEntry.customType = customType;
        updatedEntry.customStatus = customStatus;
        updatedEntry.customValue = customValue;
        updatedEntry.customUnit = customUnit;
        updatedEntry.customDueDate = customDueDate;
        updatedEntry.customTags = customTags;
      }
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
        if (shouldAttachWorkoutWeather) {
          pendingWorkoutWeather = {
            entryId: updatedEntry.id,
            entryDateIso: date
          };
        }
      }
      if (isVideoGameTracker) {
        const updatedSessionDate = buildEntryDateIso(entryDateValue, updatedEntry.date || "");
        const existingHistory = hydrateVideoGameSessionNotes(entries[editingIdx], getGameSessionHistory(entries[editingIdx]));
        const editedLatestSession = createGameSession(sessionHours, updatedSessionDate, notes);
        const nextHistory = updateLatestGameSession(existingHistory, editedLatestSession);
        const latestSession = getLatestGameSession(nextHistory) || editedLatestSession;
        updatedEntry.gameSessionHistory = nextHistory;
        updatedEntry.sessionHours = Math.max(0, Number(latestSession?.hours) || 0);
        updatedEntry.lastSessionHours = updatedEntry.sessionHours;
        updatedEntry.totalHours = Math.max(0, sumGameSessionHours(nextHistory));
        updatedEntry.date = latestSession?.playedAt || updatedSessionDate;
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
        updatedEntry.isbn13 = readingIsbn13 || selectedReadingIsbn13 || "";
        updatedEntry.isbn = readingIsbn || selectedReadingIsbn || updatedEntry.isbn13 || "";
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
        const sessionPagesRead = (!isAudiobook && totalPages > 0 && readingDeltaPercent > 0)
          ? ((readingDeltaPercent / 100) * totalPages)
          : 0;
        const inferredSessionMinutes = (isAudiobook && totalAudioMinutes > 0 && readingDeltaPercent > 0)
          ? Math.round((readingDeltaPercent / 100) * totalAudioMinutes)
          : 0;
        const sessionMinutes = isAudiobook
          ? Math.max(0, readingSessionMinutes || inferredSessionMinutes)
          : 0;
        Object.assign(updatedEntry, appendReadingActivity(updatedEntry, readingDeltaPercent, Date.now()));
        Object.assign(updatedEntry, appendReadingSession(updatedEntry, {
          minutes: sessionMinutes,
          pagesRead: sessionPagesRead,
          currentPage: isAudiobook ? null : currentPage,
          leftMinutes: isAudiobook ? leftAudioMinutes : null,
          note: notes,
          createdAt: Date.now()
        }));
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
          const mergedDate = buildEntryDateIso(entryDateValue, existingEntry.date || "");
          const seededHistory = hydrateVideoGameSessionNotes(existingEntry, getGameSessionHistory(existingEntry));
          const mergedHistory = [
            ...seededHistory,
            createGameSession(sessionHours, mergedDate, notes)
          ];
          const latestSession = getLatestGameSession(mergedHistory);
          const mergedTotal = Math.max(0, sumGameSessionHours(mergedHistory));
          const mergedEntry = {
            ...ensureEntryIdentity(existingEntry),
            item,
            rating: rating || existingEntry.rating || 0,
            date: latestSession?.playedAt || mergedDate,
            sessionHours: Math.max(0, Number(latestSession?.hours) || sessionHours),
            totalHours: mergedTotal,
            lastSessionHours: Math.max(0, Number(latestSession?.hours) || sessionHours),
            gameSessionHistory: mergedHistory,
            notes: "",
            notesHistory: [],
            updatedAt: Date.now()
          };
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
      if (isVideoGameTracker) {
        nextEntry.notes = "";
        nextEntry.notesHistory = [];
      } else {
        Object.assign(nextEntry, withUpdatedNotes({}, notes, { noteTimestamp: date }));
      }
      if (isSleepTracker) {
        nextEntry.sleepHours = sleepHours;
        nextEntry.sleepMinutes = sleepMinutes;
        nextEntry.sleepScore = sleepGrade?.score ?? null;
      }
      if (enableAuthorField) nextEntry.author = author;
      if (enableDirectorField) nextEntry.director = director;
      if (enablePublisherField) nextEntry.publisher = publisher;
      if (enableCategoryField) nextEntry.category = category;
      if (isFinanceTracker) nextEntry.financeAmount = financeAmount;
      if (isHealthTracker) {
        nextEntry.healthMetricType = healthMetricType;
        nextEntry.healthMetricValue = healthMetricValue;
        nextEntry.healthUnit = healthUnit;
        nextEntry.healthTime = healthTime;
        nextEntry.healthSeverity = healthSeverity > 0 ? healthSeverity : 0;
        nextEntry.healthStatus = healthStatus;
        nextEntry.healthMedication = healthMedication;
        nextEntry.healthProvider = healthProvider;
        nextEntry.healthTags = healthTags;
      }
      if (isMealTracker) {
        nextEntry.mealType = mealType;
        nextEntry.mealTime = mealTime;
        nextEntry.mealCalories = mealCalories;
        nextEntry.mealProteinGrams = mealProteinGrams;
        nextEntry.mealCarbsGrams = mealCarbsGrams;
        nextEntry.mealFatGrams = mealFatGrams;
        nextEntry.mealServings = mealServings;
        nextEntry.mealLocation = mealLocation;
        nextEntry.mealTags = mealTags;
      }
      if (isCustomTracker) {
        nextEntry.customType = customType;
        nextEntry.customStatus = customStatus;
        nextEntry.customValue = customValue;
        nextEntry.customUnit = customUnit;
        nextEntry.customDueDate = customDueDate;
        nextEntry.customTags = customTags;
      }
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
        if (shouldAttachWorkoutWeather) {
          pendingWorkoutWeather = {
            entryId: nextEntry.id,
            entryDateIso: date
          };
        }
      }
      if (isVideoGameTracker) {
        const initialSession = createGameSession(sessionHours, date, notes);
        nextEntry.gameSessionHistory = [initialSession];
        nextEntry.sessionHours = Math.max(0, Number(initialSession?.hours) || 0);
        nextEntry.totalHours = Math.max(0, sumGameSessionHours(nextEntry.gameSessionHistory));
        nextEntry.lastSessionHours = nextEntry.sessionHours;
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
        nextEntry.isbn13 = readingIsbn13 || selectedReadingIsbn13 || "";
        nextEntry.isbn = readingIsbn || selectedReadingIsbn || nextEntry.isbn13 || "";
        nextEntry.currentPage = isAudiobook ? 0 : currentPage;
        nextEntry.totalPages = isAudiobook ? 0 : totalPages;
        nextEntry.currentHours = isAudiobook ? Math.floor(listenedAudioMinutes / 60) : 0;
        nextEntry.currentMinutes = isAudiobook ? listenedAudioMinutes % 60 : 0;
        nextEntry.leftHours = isAudiobook ? Math.floor(leftAudioMinutes / 60) : 0;
        nextEntry.leftMinutes = isAudiobook ? leftAudioMinutes % 60 : 0;
        nextEntry.totalHours = isAudiobook ? totalHours : 0;
        nextEntry.totalMinutes = isAudiobook ? totalMinutes : 0;
        const initialReadingPercent = getReadingProgressPercentForEntry(nextEntry);
        const sessionPagesRead = (!isAudiobook && totalPages > 0 && initialReadingPercent > 0)
          ? ((initialReadingPercent / 100) * totalPages)
          : 0;
        const inferredSessionMinutes = (isAudiobook && totalAudioMinutes > 0 && initialReadingPercent > 0)
          ? Math.round((initialReadingPercent / 100) * totalAudioMinutes)
          : 0;
        const sessionMinutes = isAudiobook
          ? Math.max(0, readingSessionMinutes || inferredSessionMinutes)
          : 0;
        Object.assign(nextEntry, appendReadingActivity(nextEntry, initialReadingPercent, Date.now()));
        Object.assign(nextEntry, appendReadingSession(nextEntry, {
          minutes: sessionMinutes,
          pagesRead: sessionPagesRead,
          currentPage: isAudiobook ? null : currentPage,
          leftMinutes: isAudiobook ? leftAudioMinutes : null,
          note: notes,
          createdAt: Date.now()
        }));
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
    updateReadingGoalSummary();
    if (pendingWorkoutWeather) {
      void attachWeatherToWorkoutEntry(pendingWorkoutWeather);
    }
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
