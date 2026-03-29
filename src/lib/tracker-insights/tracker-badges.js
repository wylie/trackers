import { getEntriesForKey } from "../storage/simpletrackers-store.js";

const TRACKER_BADGE_META = {
  "habit-tracker-entries": { icon: "check_circle", tone: "ach-badge--habit" },
  "reading-tracker-entries": { icon: "menu_book", tone: "ach-badge--reading" },
  "movie-watch-tracker-entries": { icon: "movie", tone: "ach-badge--movie" },
  "finance-tracker-entries": { icon: "attach_money", tone: "ach-badge--finance" },
  "health-tracker-entries": { icon: "favorite", tone: "ach-badge--health" },
  "video-game-tracker-entries": { icon: "sports_esports", tone: "ach-badge--game" },
  "workout-tracker-entries": { icon: "fitness_center", tone: "ach-badge--workout" },
  "meal-tracker-entries": { icon: "restaurant", tone: "ach-badge--meal" },
  "water-tracker-entries": { icon: "water_drop", tone: "ach-badge--hydration" },
  "sleep-tracker-entries": { icon: "bed", tone: "ach-badge--sleep" },
  "task-tracker-entries": { icon: "assignment", tone: "ach-badge--task" },
  "custom-tracker-entries": { icon: "tune", tone: "ach-badge--custom" },
  "garden-harvest-tracker-entries": { icon: "grass", tone: "ach-badge--progress" }
};

const LOG_BADGES = [
  { min: 1, label: "First Log" },
  { min: 10, label: "10 Logs" },
  { min: 25, label: "25 Logs" },
  { min: 50, label: "50 Logs" },
  { min: 100, label: "100 Logs" },
  { min: 250, label: "250 Logs" }
];

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getHydrationTotal(entries) {
  return entries.reduce((sum, entry) => {
    const drinkOz = Math.max(0, Number(entry?.waterOunces) || 0);
    const hydrationOz = Math.max(0, Number(entry?.hydrationOunces) || (drinkOz * (Number(entry?.waterHydrationImpact) || 1)));
    return sum + hydrationOz;
  }, 0);
}

function getUnlockedTrackerBadges(storageKey, entries) {
  const unlocked = LOG_BADGES
    .filter((badge) => entries.length >= badge.min)
    .map((badge) => badge.label);

  if (storageKey === "water-tracker-entries") {
    const hydrationTotal = getHydrationTotal(entries);
    if (hydrationTotal >= 500) unlocked.push("Hydration Hero: 500 oz");
    if (hydrationTotal >= 2000) unlocked.push("Hydration Legend: 2000 oz");
  }
  return unlocked;
}

function renderTrackerBadges(root, storageKey) {
  const mount = root.querySelector("[data-tracker-badges-list]");
  if (!mount) return;
  const entries = getEntriesForKey(storageKey);
  const badges = getUnlockedTrackerBadges(storageKey, entries);
  if (!badges.length) {
    mount.innerHTML = `<p class="ti-empty">No badges yet. Log entries to unlock milestones.</p>`;
    return;
  }
  const meta = TRACKER_BADGE_META[storageKey] || { icon: "military_tech", tone: "ach-badge--progress" };
  mount.innerHTML = badges.map((badge) => `
    <span class="ach-badge ${meta.tone}">
      <span class="material-symbols-outlined ach-badge-icon" aria-hidden="true">${meta.icon}</span>
      <span>${escapeHtml(badge)}</span>
    </span>
  `).join("");
}

function bindTrackerBadgesCard(root) {
  if (!root || root.dataset.badgesBound === "1") return;
  const storageKey = String(root.getAttribute("data-storage-key") || "").trim();
  if (!storageKey) return;

  const render = () => renderTrackerBadges(root, storageKey);
  root.dataset.badgesBound = "1";
  render();

  document.addEventListener("simpletrackers:entries-updated", (event) => {
    if (event?.detail?.storageKey === storageKey) render();
  });
  document.addEventListener("simpletrackers:sync-data-updated", render);
  window.addEventListener("storage", (event) => {
    if (!event.key || event.key === "simpletrackers.io") render();
  });
}

export function initTrackerBadgesCards() {
  const cards = document.querySelectorAll("[data-tracker-badges-card]");
  cards.forEach((card) => bindTrackerBadgesCard(card));
}
