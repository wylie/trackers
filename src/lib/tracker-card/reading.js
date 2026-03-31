import { formatDurationLabel, totalMinutesFromParts } from './common.js';

export const BOOK_FALLBACK_DATA_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 360'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23eff6ff'/%3E%3Cstop offset='100%25' stop-color='%23dbeafe'/%3E%3C/linearGradient%3E%3ClinearGradient id='spine' x1='0' x2='0' y1='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%231d4ed8'/%3E%3Cstop offset='100%25' stop-color='%231e40af'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='240' height='360' rx='20' fill='url(%23bg)'/%3E%3Crect x='24' y='20' width='34' height='320' rx='10' fill='url(%23spine)'/%3E%3Crect x='70' y='44' width='138' height='12' rx='6' fill='%2393c5fd'/%3E%3Crect x='70' y='70' width='116' height='12' rx='6' fill='%23bfdbfe'/%3E%3Crect x='70' y='106' width='124' height='124' rx='18' fill='%23ffffff' opacity='0.85'/%3E%3Cpath d='M112 140h40c10 0 18 8 18 18v38c0 10-8 18-18 18h-40c-10 0-18-8-18-18v-38c0-10 8-18 18-18Zm0 10c-4 0-8 4-8 8v38c0 4 4 8 8 8h40c4 0 8-4 8-8v-38c0-4-4-8-8-8Zm20 4c3 0 5 2 5 5v36c0 3-2 5-5 5s-5-2-5-5v-36c0-3 2-5 5-5Z' fill='%232563eb'/%3E%3Crect x='70' y='256' width='124' height='10' rx='5' fill='%2393c5fd'/%3E%3Crect x='70' y='276' width='108' height='10' rx='5' fill='%23bfdbfe'/%3E%3Crect x='70' y='296' width='88' height='10' rx='5' fill='%23bfdbfe'/%3E%3C/svg%3E";

export function getAudiobookLeftMinutes(entry) {
  const totalMinutes = totalMinutesFromParts(entry?.totalHours, entry?.totalMinutes);
  const explicitLeft = totalMinutesFromParts(entry?.leftHours, entry?.leftMinutes);
  if (explicitLeft > 0 || (Number(entry?.leftHours) === 0 && Number(entry?.leftMinutes) === 0)) {
    return Math.min(totalMinutes || explicitLeft, explicitLeft);
  }
  const legacyListened = totalMinutesFromParts(entry?.currentHours, entry?.currentMinutes);
  if (totalMinutes > 0) {
    return Math.max(0, totalMinutes - Math.min(totalMinutes, legacyListened));
  }
  return 0;
}

export function formatProgressValue(entry) {
  if (entry?.isAudiobook) {
    const totalDurationMinutes = totalMinutesFromParts(entry.totalHours, entry.totalMinutes);
    const leftTotalMinutes = getAudiobookLeftMinutes(entry);
    const listenedMinutes = Math.max(0, totalDurationMinutes - leftTotalMinutes);
    const percent = totalDurationMinutes > 0 ? Math.min(100, Math.round((listenedMinutes / totalDurationMinutes) * 100)) : 0;
    return {
      current: formatDurationLabel(Math.floor(listenedMinutes / 60), listenedMinutes % 60),
      total: totalDurationMinutes > 0 ? formatDurationLabel(entry.totalHours || 0, entry.totalMinutes || 0) : "",
      unit: "listened",
      percent
    };
  }

  const current = Number(entry?.currentPage) || 0;
  const total = Number(entry?.totalPages) || 0;
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return {
    current: String(current),
    total: total > 0 ? String(total) : "",
    unit: "pages",
    percent
  };
}

export function getReadingCoverUrl(entry, isReadingTracker) {
  if (!isReadingTracker || !entry) return "";
  const explicitCoverUrl = String(entry.coverUrl || "").trim();
  if (explicitCoverUrl && !isPlaceholderCoverUrl(explicitCoverUrl)) {
    return explicitCoverUrl;
  }
  const coverEditionKey = String(entry.coverEditionKey || "").trim();
  if (coverEditionKey) {
    return `https://covers.openlibrary.org/b/olid/${coverEditionKey}-M.jpg?default=false`;
  }
  const coverId = Number(entry.coverId) || 0;
  if (coverId > 0) {
    return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg?default=false`;
  }
  return "";
}

export function getFallbackMediaUrl(isReadingTracker) {
  if (isReadingTracker) return BOOK_FALLBACK_DATA_URL;
  return "";
}

export function isPlaceholderCoverUrl(url) {
  const explicitCoverUrl = String(url || "").trim();
  const normalizedCoverUrl = explicitCoverUrl.toLowerCase();
  let coverHost = "";
  let coverPath = "";
  try {
    if (explicitCoverUrl) {
      const parsed = new URL(explicitCoverUrl);
      coverHost = String(parsed.hostname || "").toLowerCase();
      coverPath = String(parsed.pathname || "").toLowerCase();
    }
  } catch {
    coverHost = "";
    coverPath = "";
  }
  const isGoodreadsNoPhoto = (
    (coverHost.includes("gr-assets.com") || coverHost.includes("goodreads.com"))
    && (coverPath.includes("nophoto") || normalizedCoverUrl.includes("nophoto"))
  );
  return (
    normalizedCoverUrl.includes("no+image") ||
    normalizedCoverUrl.includes("no%20image") ||
    normalizedCoverUrl.includes("no-image") ||
    normalizedCoverUrl.includes("no_image") ||
    normalizedCoverUrl.includes("noimage") ||
    normalizedCoverUrl.includes("nophoto") ||
    normalizedCoverUrl.includes("no-img") ||
    normalizedCoverUrl.includes("image_not_available") ||
    normalizedCoverUrl.includes("notavailable") ||
    normalizedCoverUrl.includes("placeholder") ||
    isGoodreadsNoPhoto ||
    (normalizedCoverUrl.includes("amazon") && normalizedCoverUrl.includes("no")) ||
    coverHost.includes("amazonaws.com") ||
    coverHost.includes("ssl-images-amazon.com") ||
    coverHost.includes("images-amazon.com") ||
    coverHost.includes("media-amazon.com")
  );
}
