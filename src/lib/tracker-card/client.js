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
    isHealthTracker
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
  const sessionHoursInput = document.getElementById("tracker-session-hours");
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
  const taskFilterInput = document.getElementById("tracker-task-filter");
  const taskSortInput = document.getElementById("tracker-task-sort");
  const itemSuggestions = document.getElementById("tracker-item-suggestions");
  const itemSuggestionsList = document.getElementById("tracker-item-suggestions-list");
  const ratingController = initRatingInput({ container: ratingStarsElement, input: ratingInput });

  let editingIdx = -1;
  let goalMessageTimer = null;
  let selectedCoverId = 0;
  let selectedCoverEditionKey = "";
  let selectedCoverUrl = "";
  let isEnrichingReadingCovers = false;
  let selectedPosterUrl = "";
  let selectedImdbId = "";
  let isEnrichingMoviePosters = false;
  let hasNormalizedReadingEntries = false;

  function showSleepGoalMessage(message) {
    if (!goalMessage) return;
    goalMessage.textContent = message;
    goalMessage.classList.remove("hidden");
    clearTimeout(goalMessageTimer);
    goalMessageTimer = window.setTimeout(() => {
      goalMessage.classList.add("hidden");
    }, 2200);
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

  function updateSleepGoalSummary() {
    if (!isSleepTracker || !goalSummary) return;
    const goalHours = Number(goalHoursInput?.value || 0);
    const goalMinutes = Number(goalMinutesInput?.value || 0);
    goalSummary.textContent = `Current target: ${formatDurationLabel(goalHours, goalMinutes)}`;
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
    if (sessionHoursInput) sessionHoursInput.value = "";
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
    if (sessionHoursInput) sessionHoursInput.value = entry.sessionHours != null ? String(entry.sessionHours) : "";
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
    notesInput.value = entry.notes || "";
    ratingController.setRating(Number(entry.rating) || 0);
    setEditingMode(true);
    syncReadingModeUI();
    syncWorkoutMetricsUI();
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

  function renderEntries() {
    normalizeReadingEntries();
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

    let renderedEntries = entries.map((entry, idx) => ({ entry, idx }));
    if (isTaskTracker) {
      const filterValue = String(taskFilterInput?.value || "active");
      if (filterValue === "active") {
        renderedEntries = renderedEntries.filter(({ entry }) => !entry?.completed);
      } else if (filterValue === "completed") {
        renderedEntries = renderedEntries.filter(({ entry }) => Boolean(entry?.completed));
      }
      renderedEntries.sort(compareTaskEntries);
    } else {
      renderedEntries = renderedEntries.reverse();
    }

    renderedEntries.forEach(({ entry, idx }) => {
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
      const showRating = !isSleepTracker && !isTaskTracker && !isFinanceTracker && !isHealthTracker && !(enableReadingProgress && entry.currentlyReading);
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
              <span class=\"${completedItemClass} font-medium leading-tight break-words\">${entry.item}</span>
              ${metadataHtml}
            </div>
          </div>
          <div class=\"text-gray-700 text-sm leading-relaxed\">${entry.notes}</div>
          ${showRating ? `<div class=\"flex items-center gap-1 mt-2\">${renderStaticStars(entry.rating || 0)}</div>` : ""}
          </div>
          </div>
        </div>
      `;
      li.querySelector("[data-action=\"delete\"]").onclick = () => {
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
      li.querySelector("[data-action=\"edit\"]").onclick = () => {
        startEditing(idx);
      };
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
      list.appendChild(li);
    });

    void enrichReadingCovers();
    void enrichMoviePosters();
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
    const item = isSleepTracker
      ? formatSleepDuration(sleepHours, sleepMinutes)
      : (itemInput?.value.trim() || "");
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
    const sessionHours = Math.max(0, Number(sessionHoursInput?.value || 0));
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
      : ((isTaskTracker || isFinanceTracker || isHealthTracker) ? 0 : (currentlyReading ? 0 : (parseFloat(ratingInput?.value) || 0)));
    if (!item || (enableCategoryField && !category) || (isSleepTracker && sleepHours === 0 && sleepMinutes === 0) || (isVideoGameTracker && sessionHours <= 0)) return;
    const entries = getEntries();
    if (editingIdx >= 0 && entries[editingIdx]) {
      const date = buildEntryDateIso(entryDateValue, entries[editingIdx]?.date || "");
      const updatedEntry = {
        ...ensureEntryIdentity(entries[editingIdx]),
        item,
        notes,
        rating,
        date,
        updatedAt: Date.now()
      };
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
      }
      if (isMovieTracker) {
        updatedEntry.imdbID = selectedImdbId;
        updatedEntry.posterUrl = selectedPosterUrl;
      }
      entries[editingIdx] = updatedEntry;
    } else {
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
          const mergedEntry = {
            ...ensureEntryIdentity(existingEntry),
            item,
            notes: notes || existingEntry.notes || "",
            rating: rating || existingEntry.rating || 0,
            date: buildEntryDateIso(entryDateValue, existingEntry.date || ""),
            sessionHours: mergedTotal,
            totalHours: mergedTotal,
            lastSessionHours: sessionHours,
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
      const nextEntry = { id: createEntryId(), item, notes, rating, date, updatedAt: Date.now() };
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
}
