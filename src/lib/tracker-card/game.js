export function formatGameHours(hours) {
  const value = Number(hours) || 0;
  if (value <= 0) return "0h";
  const rounded = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
  return `${rounded}h`;
}

export function normalizeGameKey(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeSessionHours(value) {
  return Math.max(0, Number(value) || 0);
}

function normalizeSessionDate(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const trimmed = value.trim();
  const parsed = new Date(trimmed).getTime();
  if (!Number.isFinite(parsed)) return "";
  return new Date(parsed).toISOString();
}

export function createGameSession(hours, playedAt = "", note = "") {
  return {
    hours: normalizeSessionHours(hours),
    playedAt: normalizeSessionDate(playedAt),
    note: String(note || "").trim()
  };
}

export function getGameSessionHistory(entry) {
  const history = Array.isArray(entry?.gameSessionHistory) ? entry.gameSessionHistory : [];
  const normalizedHistory = history
    .map((session) => createGameSession(session?.hours, session?.playedAt || session?.date || session?.createdAt || "", session?.note || ""))
    .filter((session) => session.hours > 0);
  if (normalizedHistory.length) return normalizedHistory;

  const fallbackDate = normalizeSessionDate(String(entry?.date || ""));
  const latestSessionHours = normalizeSessionHours(entry?.lastSessionHours) || normalizeSessionHours(entry?.sessionHours);
  const totalHours = normalizeSessionHours(entry?.totalHours);
  const sessions = [];
  if (totalHours > latestSessionHours && latestSessionHours > 0) {
    sessions.push(createGameSession(totalHours - latestSessionHours, ""));
  }
  const fallbackLatestHours = latestSessionHours > 0 ? latestSessionHours : totalHours;
  if (fallbackLatestHours > 0) {
    sessions.push(createGameSession(fallbackLatestHours, fallbackDate));
  }
  return sessions;
}

function toSessionTimestamp(session) {
  const parsed = new Date(String(session?.playedAt || "")).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getLatestGameSession(history) {
  const sessions = Array.isArray(history) ? history : [];
  if (!sessions.length) return null;
  let latest = sessions[0];
  let latestTs = toSessionTimestamp(latest);
  for (let idx = 1; idx < sessions.length; idx += 1) {
    const current = sessions[idx];
    const currentTs = toSessionTimestamp(current);
    if (currentTs >= latestTs) {
      latest = current;
      latestTs = currentTs;
    }
  }
  return createGameSession(latest?.hours, latest?.playedAt || "", latest?.note || "");
}

export function sumGameSessionHours(history) {
  return (Array.isArray(history) ? history : []).reduce((sum, session) => {
    return sum + normalizeSessionHours(session?.hours);
  }, 0);
}
