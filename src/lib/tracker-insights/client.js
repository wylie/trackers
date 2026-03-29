import { escapeHtml, aggregateTopItemsByTracker, aggregateLast14DaysByTracker, formatLast14Value, getWorkoutDurationSeconds, isDateInRange, formatDurationLabel } from './aggregates.js';
import { getEntriesForKey, readSimpletrackersStore } from '../storage/simpletrackers-store.js';

export function initTrackerInsightsRail(config) {
  const {
    storageKey,
    idPrefix,
    isWorkoutTracker
  } = config;
  let selectedWorkoutRange = "day";

  function getEntries() {
    return getEntriesForKey(storageKey);
  }

  function renderOverview(entries) {
    const root = document.getElementById(`${idPrefix}-overview`);
    if (!root) return;

    if (!entries.length) {
      root.innerHTML = `<p class="ti-empty">No data yet.</p>`;
      return;
    }

    const latestTs = Math.max(...entries.map((entry) => {
      const ts = entry?.date ? new Date(entry.date).getTime() : 0;
      return Number.isFinite(ts) ? ts : 0;
    }));
    const latest = latestTs > 0
      ? new Date(latestTs).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "-";
    const uniqueItems = new Set(entries.map((entry) => String(entry?.item || "").trim()).filter(Boolean)).size;

    root.innerHTML = `
      <div class="ti-overview-grid">
        <div class="ti-pill"><span>Total</span><strong>${entries.length}</strong></div>
        <div class="ti-pill"><span>Unique</span><strong>${uniqueItems}</strong></div>
        <div class="ti-pill"><span>Latest</span><strong>${escapeHtml(latest)}</strong></div>
      </div>
    `;
  }

  function renderTopItems(entries) {
    const root = document.getElementById(`${idPrefix}-top-items`);
    if (!root) return;
    const rows = aggregateTopItemsByTracker(entries, { storageKey });
    if (!rows.length) {
      root.innerHTML = `<p class="ti-empty">No items yet.</p>`;
      return;
    }

    const max = Math.max(...rows.map((row) => row.count), 1);
    root.innerHTML = rows.map((row) => {
      const width = Math.max(4, Math.round((row.count / max) * 100));
      return `
        <div class="ti-row">
          <span class="ti-name" title="${escapeHtml(row.label)}">${escapeHtml(row.label)}</span>
          <span class="ti-track"><span class="ti-fill" style="width:${width}%"></span></span>
          <span class="ti-metric">${row.count}</span>
        </div>
      `;
    }).join("");
  }

  function renderLast14(entries) {
    const root = document.getElementById(`${idPrefix}-last-14`);
    const goalLine = document.getElementById(`${idPrefix}-last-14-goal-line`);
    const goalLabel = document.getElementById(`${idPrefix}-last-14-goal-label`);
    if (!root) return;
    if (!entries.length) {
      root.innerHTML = `<p class="ti-empty">No activity yet.</p>`;
      if (goalLine) goalLine.classList.add("hidden");
      return;
    }

    const series = aggregateLast14DaysByTracker(entries, { storageKey });
    const goalSpec = getGoalLineSpec();
    const max = Math.max(
      ...series.map((day) => day.value),
      goalSpec ? goalSpec.value : 0,
      1
    );
    root.innerHTML = series.map((day) => {
      const height = day.value > 0
        ? Math.max(8, Math.round((day.value / max) * 68))
        : 0;
      const fullLabel = day.day.toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
      const valueLabel = formatLast14Value(day.value, { storageKey });
      return `
        <div class="ti-day-col">
          <span class="ti-day-bar" style="height:${height}px" title="${fullLabel}: ${valueLabel}"></span>
          <span class="ti-day-label">${fullLabel.split("/")[1] || fullLabel}</span>
        </div>
      `;
    }).join("");

    if (goalLine && goalSpec) {
      const barHeight = 68;
      const baselineOffset = 12;
      const lineBottom = baselineOffset + Math.round((goalSpec.value / max) * barHeight);
      goalLine.style.bottom = `${Math.max(baselineOffset, Math.min(90, lineBottom))}px`;
      goalLine.classList.remove("hidden");
      if (goalLabel) goalLabel.textContent = goalSpec.label;
    } else if (goalLine) {
      goalLine.classList.add("hidden");
    }
  }

  function getGoalLineSpec() {
    const store = readSimpletrackersStore();
    if (storageKey === "water-tracker-entries") {
      const goal = Math.max(0, Number(store?.["water-tracker-settings"]?.goalOunces) || 0);
      if (goal > 0) {
        return { value: goal, label: `Goal ${goal.toFixed(1).replace(/\.0$/, "")}oz` };
      }
    }
    if (storageKey === "sleep-tracker-entries") {
      const goalHours = Math.max(0, Number(store?.["sleep-tracker-settings"]?.goalHours) || 0);
      const goalMinutes = Math.max(0, Number(store?.["sleep-tracker-settings"]?.goalMinutes) || 0);
      const goal = goalHours + (goalMinutes / 60);
      if (goal > 0) {
        return { value: goal, label: `Goal ${goal.toFixed(1).replace(/\.0$/, "")}h` };
      }
    }
    return null;
  }

  function renderWorkoutTotal(entries) {
    if (!isWorkoutTracker) return;
    const root = document.getElementById(`${idPrefix}-workout-total`);
    if (!root) return;

    const scopedEntries = entries.filter((entry) => isDateInRange(entry?.date, selectedWorkoutRange));
    const totals = scopedEntries.reduce((acc, entry) => {
      const seconds = getWorkoutDurationSeconds(entry);
      if (seconds > 0) {
        acc.totalSeconds += seconds;
      }
      acc.sessions += 1;
      return acc;
    }, { totalSeconds: 0, sessions: 0 });

    root.innerHTML = `
      <div class="ti-overview-grid ti-overview-grid--2">
        <div class="ti-pill"><span>Total Time</span><strong>${formatDurationLabel(totals.totalSeconds)}</strong></div>
        <div class="ti-pill"><span>Sessions</span><strong>${totals.sessions}</strong></div>
      </div>
    `;
  }

  function syncWorkoutRangeButtons() {
    if (!isWorkoutTracker) return;
    const toggleRoot = document.getElementById(`${idPrefix}-range-toggle`);
    if (!toggleRoot) return;
    const buttons = toggleRoot.querySelectorAll("[data-range]");
    buttons.forEach((button) => {
      const isActive = button.getAttribute("data-range") === selectedWorkoutRange;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function renderInsights() {
    const entries = getEntries();
    renderOverview(entries);
    renderWorkoutTotal(entries);
    renderTopItems(entries);
    renderLast14(entries);
  }

  function initInsights() {
    if (isWorkoutTracker) {
      const toggleRoot = document.getElementById(`${idPrefix}-range-toggle`);
      if (toggleRoot && !toggleRoot.dataset.bound) {
        toggleRoot.dataset.bound = "1";
        toggleRoot.addEventListener("click", (event) => {
          const button = event.target.closest("[data-range]");
          if (!button) return;
          const range = button.getAttribute("data-range");
          if (!range || range === selectedWorkoutRange) return;
          selectedWorkoutRange = range;
          syncWorkoutRangeButtons();
          renderInsights();
        });
      }
      syncWorkoutRangeButtons();
    }
    renderInsights();
  }

  initInsights();
  document.addEventListener("astro:page-load", initInsights);
  document.addEventListener("simpletrackers:entries-updated", (event) => {
    if (event?.detail?.storageKey === storageKey) {
      renderInsights();
    }
  });
  document.addEventListener("simpletrackers:sync-data-updated", () => {
    renderInsights();
  });
  window.addEventListener("storage", (event) => {
    if (!event.key || event.key === "simpletrackers.io") {
      renderInsights();
    }
  });
}
